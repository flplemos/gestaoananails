-- =============================================================
-- Agenda a verificação de lembretes a cada 5 minutos.
-- Rode DEPOIS de publicar a Edge Function "notify-upcoming".
-- Substitua COLE_O_CRON_SECRET pelo valor de CRON_SECRET
-- (arquivo supabase/secrets.local.txt — não commitado).
-- =============================================================

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Guarda o segredo no Vault (criptografado), não no texto do job.
select vault.create_secret('COLE_O_CRON_SECRET', 'reminders_cron_secret')
where not exists (select 1 from vault.secrets where name = 'reminders_cron_secret');

select cron.schedule(
  'ananails-lembretes',
  '*/5 * * * *',
  $$
  select net.http_post(
    url     := 'https://zxxauicgxjzkltrlzcnb.supabase.co/functions/v1/notify-upcoming',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'reminders_cron_secret')
    ),
    body    := '{}'::jsonb
  );
  $$
);

-- Para conferir:   select * from cron.job_run_details order by start_time desc limit 10;
-- Para remover:    select cron.unschedule('ananails-lembretes');
