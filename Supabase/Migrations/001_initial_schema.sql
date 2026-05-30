-- Extensions
create extension if not exists "uuid-ossp";

-- Users (perfil público, referencia auth.users de Supabase)
create table public.user (
  id uuid primary key references auth.users(id) on delete cascade,
  username varchar(50) not null unique,
  email varchar(255) not null unique,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Groups
create table public.expense_group (
  id uuid primary key default uuid_generate_v4(),
  created_by uuid not null references public.user(id) on delete restrict,
  name varchar(100) not null,
  description varchar(255),
  created_at timestamp with time zone default now()
);

-- Group members
create table public.group_member (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.user(id) on delete restrict,
  group_id uuid not null references public.expense_group(id) on delete cascade,
  role varchar(20) not null default 'member' check (role in ('admin', 'member')),
  is_active boolean not null default true,
  joined_at timestamp with time zone default now(),
  unique(user_id, group_id)
);

-- Categories
create table public.category (
  id uuid primary key default uuid_generate_v4(),
  name varchar(50) not null unique,
  created_at timestamp with time zone default now()
);

-- Expenses
create table public.expense (
  id uuid primary key default uuid_generate_v4(),
  created_by uuid not null references public.user(id) on delete restrict,
  paid_by uuid not null references public.user(id) on delete restrict,
  group_id uuid not null references public.expense_group(id) on delete cascade,
  category_id uuid references public.category(id) on delete set null,
  name varchar(100) not null,
  amount decimal(12,2) not null check (amount > 0),
  created_at timestamp with time zone default now()
);

-- Expense splits
create table public.expense_split (
  id uuid primary key default uuid_generate_v4(),
  expense_id uuid not null references public.expense(id) on delete cascade,
  user_id uuid not null references public.user(id) on delete restrict,
  amount decimal(12,2) not null check (amount > 0),
  unique(expense_id, user_id)
);

-- Payments
create table public.payment (
  id uuid primary key default uuid_generate_v4(),
  group_id uuid not null references public.expense_group(id) on delete cascade,
  from_user_id uuid not null references public.user(id) on delete restrict,
  to_user_id uuid not null references public.user(id) on delete restrict,
  amount decimal(12,2) not null check (amount > 0),
  created_at timestamp with time zone default now(),
  check (from_user_id != to_user_id)
);

-- Categorias por defecto
insert into public.category (name) values
  ('Comida'),
  ('Transporte'),
  ('Servicios'),
  ('Arriendo'),
  ('Entretenimiento'),
  ('Salud'),
  ('Educación'),
  ('Otro');