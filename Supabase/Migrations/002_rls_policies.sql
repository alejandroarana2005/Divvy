-- ========================
-- RLS: user
-- ========================
-- Cualquier usuario autenticado puede ver perfiles
create policy "Users can view all profiles"
  on public.user for select
  using (auth.role() = 'authenticated');

-- Solo puedes editar tu propio perfil
create policy "Users can update own profile"
  on public.user for update
  using (auth.uid() = id);

-- ========================
-- RLS: expense_group
-- ========================
-- Solo puedes ver grupos donde eres miembro
create policy "Users can view their groups"
  on public.expense_group for select
  using (
    exists (
      select 1 from public.group_member
      where group_member.group_id = expense_group.id
      and group_member.user_id = auth.uid()
      and group_member.is_active = true
    )
  );

-- Cualquier usuario autenticado puede crear grupos
create policy "Users can create groups"
  on public.expense_group for insert
  with check (auth.role() = 'authenticated');

-- Solo el admin del grupo puede editarlo
create policy "Admins can update their groups"
  on public.expense_group for update
  using (
    exists (
      select 1 from public.group_member
      where group_member.group_id = expense_group.id
      and group_member.user_id = auth.uid()
      and group_member.role = 'admin'
      and group_member.is_active = true
    )
  );

-- ========================
-- RLS: group_member
-- ========================
-- Solo puedes ver miembros de grupos donde participas
create policy "Users can view members of their groups"
  on public.group_member for select
  using (
    exists (
      select 1 from public.group_member gm
      where gm.group_id = group_member.group_id
      and gm.user_id = auth.uid()
      and gm.is_active = true
    )
  );

-- Solo admins pueden agregar miembros
create policy "Admins can insert group members"
  on public.group_member for insert
  with check (
    exists (
      select 1 from public.group_member
      where group_member.group_id = group_id
      and group_member.user_id = auth.uid()
      and group_member.role = 'admin'
    )
  );

-- ========================
-- RLS: expense
-- ========================
-- Solo puedes ver gastos de tus grupos
create policy "Users can view expenses of their groups"
  on public.expense for select
  using (
    exists (
      select 1 from public.group_member
      where group_member.group_id = expense.group_id
      and group_member.user_id = auth.uid()
      and group_member.is_active = true
    )
  );

-- Solo miembros activos del grupo pueden crear gastos
create policy "Members can create expenses"
  on public.expense for insert
  with check (
    exists (
      select 1 from public.group_member
      where group_member.group_id = group_id
      and group_member.user_id = auth.uid()
      and group_member.is_active = true
    )
  );

-- Solo quien creó el gasto puede editarlo
create policy "Creators can update their expenses"
  on public.expense for update
  using (auth.uid() = created_by);

-- ========================
-- RLS: expense_split
-- ========================
create policy "Users can view splits of their group expenses"
  on public.expense_split for select
  using (
    exists (
      select 1 from public.expense
      join public.group_member on group_member.group_id = expense.group_id
      where expense.id = expense_split.expense_id
      and group_member.user_id = auth.uid()
      and group_member.is_active = true
    )
  );

-- ========================
-- RLS: payment
-- ========================
create policy "Users can view payments of their groups"
  on public.payment for select
  using (
    exists (
      select 1 from public.group_member
      where group_member.group_id = payment.group_id
      and group_member.user_id = auth.uid()
      and group_member.is_active = true
    )
  );

-- Solo miembros activos pueden registrar pagos
create policy "Members can create payments"
  on public.payment for insert
  with check (
    exists (
      select 1 from public.group_member
      where group_member.group_id = group_id
      and group_member.user_id = auth.uid()
      and group_member.is_active = true
    )
  );

-- ========================
-- RLS: category
-- ========================
-- Las categorías son públicas para usuarios autenticados
create policy "Authenticated users can view categories"
  on public.category for select
  using (auth.role() = 'authenticated');