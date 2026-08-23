create table if not exists public.event_profile_favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  event_profile_id uuid not null references public.promoter_event_profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, event_profile_id)
);

alter table public.event_profile_favorites enable row level security;

drop policy if exists "Users can read own event profile favorites"
on public.event_profile_favorites;

drop policy if exists "Users can create own event profile favorites"
on public.event_profile_favorites;

drop policy if exists "Users can delete own event profile favorites"
on public.event_profile_favorites;

create policy "Users can read own event profile favorites"
on public.event_profile_favorites
for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can create own event profile favorites"
on public.event_profile_favorites
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can delete own event profile favorites"
on public.event_profile_favorites
for delete
to authenticated
using (auth.uid() = user_id);

grant select, insert, delete
on public.event_profile_favorites
to authenticated;

grant select, insert, update, delete
on public.event_profile_favorites
to service_role;

insert into public.event_profile_favorites (user_id, event_profile_id)
select distinct favorites.user_id, events.event_profile_id
from public.favorites
join public.events on events.id = favorites.event_id
where events.event_profile_id is not null
on conflict do nothing;
