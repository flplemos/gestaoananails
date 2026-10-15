-- =============================================================
-- Configurações da usuária (por enquanto: meta de faturamento mensal).
-- Uma linha por usuária. Rode uma vez no SQL Editor
-- (já incluído no schema.sql para instalações novas).
-- =============================================================

create table if not exists public.settings (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null unique default auth.uid() references auth.users on delete cascade,
  monthly_goal numeric(10,2) check (monthly_goal is null or monthly_goal >= 0),
  created_at   timestamptz not null default now()
);

alter table public.settings enable row level security;
drop policy if exists "owner_all" on public.settings;
create policy "owner_all" on public.settings for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
