grant select, insert, update, delete
on public.events
to authenticated;

drop policy if exists "Users can delete own events" on public.events;

create policy "Users can delete own events"
on public.events
for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Admins can delete events" on public.events;

create policy "Admins can delete events"
on public.events
for delete
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
    and profiles.role = 'admin'
  )
);
