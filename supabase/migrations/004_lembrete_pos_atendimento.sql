-- =============================================================
-- Lembrete pós-atendimento: "o atendimento foi concluído?"
-- Enviado `after_minutes` (padrão 2h) depois do FIM do atendimento
-- (início + soma das durações dos serviços), se ainda não foi concluído.
-- Rode uma vez no SQL Editor (já incluído no schema.sql para instalações novas).
-- =============================================================

-- Usa a mesma coluna reminders_sent dos lembretes 5h/3h, com valor negativo
-- (-120 = "2h depois do fim"). Assim o trigger que zera os lembretes quando a
-- data/hora muda também vale para este aviso.
create or replace function public.claim_due_followups(after_minutes int default 120)
returns table (appointment_id uuid, user_id uuid, client_name text, starts_at text, ends_at text, services text)
language sql security definer set search_path = '' as $$
  with now_local as (
    select (now() at time zone 'America/Fortaleza')::date as today
  ),
  base as (
    select a.id,
           (a.date + a.time) at time zone 'America/Fortaleza' as start_ts,
           coalesce((
             select sum(coalesce((i->>'duration')::int, s.duration, 60))
               from jsonb_array_elements(a.items) i
               left join public.services s on s.id::text = i->>'serviceId'
           ), 60)::int as dur
      from public.appointments a, now_local n
     where not a.done
       and not (-after_minutes = any(a.reminders_sent))
       and a.date between n.today - 1 and n.today
  ),
  due as (
    select b.id, b.dur
      from base b
     where b.start_ts + make_interval(mins => b.dur + after_minutes) <= now()
       -- Janela de 6h: não dispara avisos de atendimentos antigos de uma vez.
       and b.start_ts + make_interval(mins => b.dur + after_minutes) > now() - interval '6 hours'
  )
  update public.appointments a
     set reminders_sent = a.reminders_sent || array[-after_minutes]
    from due d
   where a.id = d.id
  returning a.id,
            a.user_id,
            a.client_name,
            to_char(a.time, 'HH24:MI'),
            to_char(a.time + make_interval(mins => d.dur), 'HH24:MI'),
            (select string_agg(i->>'name', ' + ') from jsonb_array_elements(a.items) i);
$$;

revoke execute on function public.claim_due_followups(int) from public, anon, authenticated;
grant execute on function public.claim_due_followups(int) to service_role;
