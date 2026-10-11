-- =============================================================
-- Duração dos serviços (em minutos). A Ana ajusta em Ajustes > Catálogo.
-- Rode uma vez no SQL Editor (já incluído no schema.sql para instalações novas).
-- =============================================================

alter table public.services
  add column if not exists duration int not null default 60
  check (duration between 5 and 720);
