grant select, insert, update
on public.promoter_event_profiles
to authenticated;

drop policy if exists "Admins can create promoter event profiles"
on public.promoter_event_profiles;

create policy "Admins can create promoter event profiles"
on public.promoter_event_profiles
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
    and profiles.role = 'admin'
  )
);

drop policy if exists "Admins can update promoter event profiles"
on public.promoter_event_profiles;

create policy "Admins can update promoter event profiles"
on public.promoter_event_profiles
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
    and profiles.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
    and profiles.role = 'admin'
  )
);
