drop policy "Users can create groups" on public.expense_group;

create policy "Users can create groups"
  on public.expense_group for insert
  with check (auth.uid() = created_by);