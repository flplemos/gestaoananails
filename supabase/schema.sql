-- =============================================================
-- Ana Nails App · esquema do banco (Supabase / PostgreSQL)
-- Rode inteiro no Supabase: SQL Editor > New query > Run.
-- Pode ser executado de novo sem erro (idempotente).
-- =============================================================

-- ---------- Tabelas ----------
create table if not exists public.services (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users on delete cascade,
  name       text not null,
  price      numeric(10,2) not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.clients (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users on delete cascade,
  name       text not null,
  phone      text not null default '',
  notes      text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.appointments (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users on delete cascade,
  client_id   uuid references public.clients on delete set null,
  client_name text not null,
  date        date not null,
  time        time not null,
  items       jsonb not null default '[]',   -- [{serviceId, name, price}] (cópia do catálogo no momento)
  total       numeric(10,2) not null default 0,
  done        boolean not null default false,
  notified_at timestamptz,                   -- lembrete push já enviado
  created_at  timestamptz not null default now()
);

create table if not exists public.expenses (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users on delete cascade,
  date        date not null,
  description text not null,
  amount      numeric(10,2) not null,
  created_at  timestamptz not null default now()
);

create table if not exists public.push_subscriptions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users on delete cascade,
  endpoint   text not null unique,
  p256dh     text not null,
  auth       text not null,
  created_at timestamptz not null default now()
);

create index if not exists appointments_user_date_idx on public.appointments (user_id, date);
create index if not exists appointments_pending_idx on public.appointments (date) where notified_at is null and not done;
create index if not exists expenses_user_date_idx on public.expenses (user_id, date);
create index if not exists clients_user_idx on public.clients (user_id);

-- ---------- Segurança (RLS): cada usuária só vê os próprios dados ----------
do $$
declare t text;
begin
  foreach t in array array['services','clients','appointments','expenses','push_subscriptions'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "owner_all" on public.%I', t);
    execute format(
      'create policy "owner_all" on public.%I for all to authenticated
         using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()))', t);
  end loop;
end $$;

-- ---------- Lembretes ----------
-- Se a data/hora do atendimento mudar, o lembrete volta a ficar pendente.
create or replace function public.reset_reminder()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.date is distinct from old.date or new.time is distinct from old.time then
    new.notified_at := null;
  end if;
  return new;
end $$;

drop trigger if exists appointments_reset_reminder on public.appointments;
create trigger appointments_reset_reminder
  before update on public.appointments
  for each row execute function public.reset_reminder();

-- Marca como avisados e devolve os atendimentos que começam nos próximos
-- `minutes_ahead` minutos (horário de Natal/RN). Usado pela Edge Function.
create or replace function public.claim_due_reminders(minutes_ahead int default 60)
returns table (appointment_id uuid, user_id uuid, client_name text, starts_at text, services text)
language sql security definer set search_path = '' as $$
  update public.appointments a
     set notified_at = now()
   where a.notified_at is null
     and not a.done
     and (a.date + a.time) at time zone 'America/Fortaleza'
         between now() and now() + make_interval(mins => minutes_ahead)
  returning a.id,
            a.user_id,
            a.client_name,
            to_char(a.time, 'HH24:MI'),
            (select string_agg(i->>'name', ' + ') from jsonb_array_elements(a.items) i);
$$;

revoke execute on function public.claim_due_reminders(int) from public, anon, authenticated;
grant execute on function public.claim_due_reminders(int) to service_role;
