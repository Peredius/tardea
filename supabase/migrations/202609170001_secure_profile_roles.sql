-- Prevent authenticated users from granting themselves the admin role.
-- Service-role operations continue to bypass RLS for legitimate admin work.
alter table public.profiles enable row level security;

drop policy if exists "Users can create own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;

create policy "Users can create own profile"
on public.profiles
for insert
to authenticated
with check (
  auth.uid() = id
  and role in ('user', 'venue')
);

create policy "Users can update own profile"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (
  auth.uid() = id
  and role in ('user', 'venue')
);
