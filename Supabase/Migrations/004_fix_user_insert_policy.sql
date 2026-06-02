create policy "Users can insert own profile"
  on public.user for insert
  with check (auth.uid() = id);