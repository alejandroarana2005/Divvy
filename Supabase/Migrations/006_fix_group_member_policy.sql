drop policy "Users can view members of their groups" on public.group_member;
drop policy "Admins can insert group members" on public.group_member;

create policy "Users can view members of their groups"
  on public.group_member for select
  using (user_id = auth.uid());

create policy "Users can insert own membership"
  on public.group_member for insert
  with check (user_id = auth.uid());