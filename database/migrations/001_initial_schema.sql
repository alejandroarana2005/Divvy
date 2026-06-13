-- ═══════════════════════════════════════════════════════════════
-- 001_initial_schema.sql
-- Schema inicial de Divvy para Supabase (PostgreSQL)
-- Aplicado: 2026-06-02
-- ═══════════════════════════════════════════════════════════════

-- ── PASO 1: Crear todas las tablas ──────────────────────────────

create table public.profiles (
  id         uuid references auth.users(id) on delete cascade primary key,
  username   text unique not null,
  email      text not null,
  created_at timestamptz default now() not null
);

create table public.expense_groups (
  id          uuid default gen_random_uuid() primary key,
  name        text not null,
  description text,
  created_by  uuid references public.profiles(id) on delete set null,
  created_at  timestamptz default now() not null
);

create table public.group_members (
  id        uuid default gen_random_uuid() primary key,
  group_id  uuid references public.expense_groups(id) on delete cascade not null,
  user_id   uuid references public.profiles(id) on delete cascade not null,
  role      text default 'member' check (role in ('admin', 'member')) not null,
  joined_at timestamptz default now() not null,
  unique(group_id, user_id)
);

create table public.expenses (
  id           uuid default gen_random_uuid() primary key,
  group_id     uuid references public.expense_groups(id) on delete cascade not null,
  name         text not null,
  category     text not null,
  amount       numeric(12, 2) not null,
  paid_by      uuid references public.profiles(id) on delete set null,
  expense_date date default current_date not null,
  created_at   timestamptz default now() not null
);

create table public.expense_participants (
  id         uuid default gen_random_uuid() primary key,
  expense_id uuid references public.expenses(id) on delete cascade not null,
  user_id    uuid references public.profiles(id) on delete cascade not null,
  share      numeric(12, 2) not null,
  unique(expense_id, user_id)
);

-- ── PASO 2: Activar RLS en todas las tablas ─────────────────────

alter table public.profiles             enable row level security;
alter table public.expense_groups       enable row level security;
alter table public.group_members        enable row level security;
alter table public.expenses             enable row level security;
alter table public.expense_participants enable row level security;

-- ── PASO 3: Políticas de acceso (RLS) ───────────────────────────

-- profiles
create policy "Ver perfiles"
  on public.profiles for select to authenticated using (true);
create policy "Insertar propio perfil"
  on public.profiles for insert to authenticated with check (auth.uid() = id);

-- expense_groups
create policy "Ver grupos"
  on public.expense_groups for select to authenticated
  using (exists (
    select 1 from public.group_members
    where group_members.group_id = expense_groups.id
      and group_members.user_id = auth.uid()
  ));
create policy "Crear grupos"
  on public.expense_groups for insert to authenticated with check (true);

-- group_members
create policy "Ver miembros"
  on public.group_members for select to authenticated
  using (exists (
    select 1 from public.group_members gm
    where gm.group_id = group_members.group_id
      and gm.user_id = auth.uid()
  ));
create policy "Unirse a grupos"
  on public.group_members for insert to authenticated with check (true);

-- expenses
create policy "Ver gastos"
  on public.expenses for select to authenticated
  using (exists (
    select 1 from public.group_members
    where group_members.group_id = expenses.group_id
      and group_members.user_id = auth.uid()
  ));
create policy "Agregar gastos"
  on public.expenses for insert to authenticated with check (true);

-- expense_participants
create policy "Ver participantes"
  on public.expense_participants for select to authenticated
  using (exists (
    select 1 from public.expenses e
    join public.group_members gm on gm.group_id = e.group_id
    where e.id = expense_participants.expense_id
      and gm.user_id = auth.uid()
  ));
create policy "Agregar participantes"
  on public.expense_participants for insert to authenticated with check (true);
