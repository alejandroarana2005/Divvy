-- ═══════════════════════════════════════════════════════════════
-- 003_settlements.sql
-- Tabla para registrar pagos directos entre miembros del grupo
-- Aplicado: 2026-06-03
-- ═══════════════════════════════════════════════════════════════

create table public.settlements (
  id         uuid default gen_random_uuid() primary key,
  group_id   uuid references public.expense_groups(id) on delete cascade not null,
  paid_by_id uuid references public.profiles(id) on delete cascade not null,
  paid_to_id uuid references public.profiles(id) on delete cascade not null,
  amount     numeric(12, 2) not null,
  note       text,
  settled_at timestamptz default now() not null
);

alter table public.settlements enable row level security;

create policy "Ver pagos"
  on public.settlements for select to authenticated
  using (exists (
    select 1 from public.group_members
    where group_members.group_id = settlements.group_id
      and group_members.user_id = auth.uid()
  ));

create policy "Registrar pagos"
  on public.settlements for insert to authenticated
  with check (true);

grant all on public.settlements to anon, authenticated, service_role;
