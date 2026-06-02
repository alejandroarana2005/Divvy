drop policy "Users can view their groups" on public.expense_group;
drop policy "Users can create groups" on public.expense_group;
drop policy "Admins can update their groups" on public.expense_group;

create policy "Users can view their groups"
  on public.expense_group for select
  using (
    exists (
      select 1 from public.group_member
      where group_member.group_id = expense_group.id
      and group_member.user_id = (select auth.uid())
      and group_member.is_active = true
    )
  );

create policy "Users can create groups"
  on public.expense_group for insert
  with check ((select auth.uid()) is not null);

create policy "Admins can update their groups"
  on public.expense_group for update
  using (created_by = (select auth.uid()));