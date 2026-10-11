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
  reminders_sent int[] not null default '{}', -- lembretes já enviados (minutos antes)
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
create index if not exists appointments_pending_idx on public.appointments (date) where not done;
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

-- ---------- Lembretes (5h e 3h antes) ----------
-- Se a data/hora mudar, os lembretes voltam a ficar pendentes.
create or replace function public.reset_reminder()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.date is distinct from old.date or new.time is distinct from old.time then
    new.reminders_sent := '{}';
  end if;
  return new;
end $$;

drop trigger if exists appointments_reset_reminder on public.appointments;
create trigger appointments_reset_reminder
  before update on public.appointments
  for each row execute function public.reset_reminder();

drop function if exists public.claim_due_reminders(int);
drop function if exists public.claim_due_reminders(int[], int, int);

-- Marca e devolve os lembretes que venceram (horário de Natal/RN).
-- • offsets: minutos antes do atendimento (padrão 5h e 3h).
-- • Se mais de um venceu ao mesmo tempo (atendimento agendado em cima
--   da hora), sai uma única notificação.
create or replace function public.claim_due_reminders(offsets int[] default '{300,180}')
returns table (appointment_id uuid, user_id uuid, client_name text, starts_at text, services text, minutes_left int)
language sql security definer set search_path = '' as $$
  with now_local as (
    select now() at time zone 'America/Fortaleza' as ts
  ),
  due as (
    select a.id,
           array(
             select o from unnest(offsets) o
              where (a.date + a.time) at time zone 'America/Fortaleza' - make_interval(mins => o) <= now()
                and not (o = any(a.reminders_sent))
           ) as new_offsets
      from public.appointments a, now_local n
     where not a.done
       and a.date between n.ts::date and n.ts::date + 1
       and (a.date + a.time) at time zone 'America/Fortaleza' > now()
  )
  update public.appointments a
     set reminders_sent = a.reminders_sent || d.new_offsets
    from due d
   where a.id = d.id
     and cardinality(d.new_offsets) > 0
  returning a.id,
            a.user_id,
            a.client_name,
            to_char(a.time, 'HH24:MI'),
            (select string_agg(i->>'name', ' + ') from jsonb_array_elements(a.items) i),
            ceil(extract(epoch from ((a.date + a.time) at time zone 'America/Fortaleza') - now()) / 60)::int;
$$;

revoke execute on function public.claim_due_reminders(int[]) from public, anon, authenticated;
grant execute on function public.claim_due_reminders(int[]) to service_role;
