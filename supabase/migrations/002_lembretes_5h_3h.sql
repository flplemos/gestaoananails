-- =============================================================
-- Lembretes em dois momentos: 5 horas e 3 horas antes.
-- Rode uma vez no SQL Editor (já incluído no schema.sql para instalações novas).
-- =============================================================

-- Guarda quais lembretes (em minutos antes) já foram enviados, ex.: {300,180}.
alter table public.appointments
  add column if not exists reminders_sent int[] not null default '{}';

drop index if exists public.appointments_pending_idx;
alter table public.appointments drop column if exists notified_at;
create index if not exists appointments_pending_idx on public.appointments (date) where not done;

-- Se a data/hora mudar, os lembretes voltam a ficar pendentes.
create or replace function public.reset_reminder()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.date is distinct from old.date or new.time is distinct from old.time then
    new.reminders_sent := '{}';
  end if;
  return new;
end $$;

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
