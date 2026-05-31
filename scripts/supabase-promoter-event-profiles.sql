create table if not exists public.promoter_event_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  slug text not null,
  logo_url text,
  banner_url text,
  description text,
  type text,
  venue_name text,
  address text,
  municipality text,
  postal_code text,
  province text,
  music text[] default '{}',
  audience text,
  instagram_url text,
  tiktok_url text,
  website_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, slug)
);

alter table public.events
add column if not exists event_profile_id uuid references public.promoter_event_profiles(id) on delete set null;

create index if not exists promoter_event_profiles_user_id_idx
on public.promoter_event_profiles(user_id);

create index if not exists promoter_event_profiles_slug_idx
on public.promoter_event_profiles(slug);

create index if not exists events_event_profile_id_idx
on public.events(event_profile_id);

grant select
on public.promoter_event_profiles
to anon;

grant select, insert, update, delete
on public.promoter_event_profiles
to authenticated;

grant select, insert, update, delete
on public.promoter_event_profiles
to service_role;

grant select
on public.events
to anon;

grant select, insert, update, delete
on public.events
to authenticated;

grant select, insert, update, delete
on public.events
to service_role;

alter table public.promoter_event_profiles enable row level security;

drop policy if exists "Anyone can read active promoter event profiles"
on public.promoter_event_profiles;

drop policy if exists "Promoters can read own event profiles"
on public.promoter_event_profiles;

drop policy if exists "Promoters can create own event profiles"
on public.promoter_event_profiles;

drop policy if exists "Promoters can update own event profiles"
on public.promoter_event_profiles;

drop policy if exists "Promoters can delete own event profiles"
on public.promoter_event_profiles;

drop policy if exists "Admins can read all promoter event profiles"
on public.promoter_event_profiles;

create policy "Anyone can read active promoter event profiles"
on public.promoter_event_profiles
for select
to anon, authenticated
using (is_active = true);

create policy "Promoters can read own event profiles"
on public.promoter_event_profiles
for select
to authenticated
using (auth.uid() = user_id);

create policy "Promoters can create own event profiles"
on public.promoter_event_profiles
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Promoters can update own event profiles"
on public.promoter_event_profiles
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Promoters can delete own event profiles"
on public.promoter_event_profiles
for delete
to authenticated
using (auth.uid() = user_id);

create policy "Admins can read all promoter event profiles"
on public.promoter_event_profiles
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
    and profiles.role = 'admin'
  )
);

drop policy if exists "Users can create own pending events" on public.events;
drop policy if exists "Users can update own pending events" on public.events;

create policy "Users can create own pending events"
on public.events
for insert
to authenticated
with check (
  auth.uid() = user_id
  and status = 'pending'
  and published = false
  and (
    event_profile_id is null
    or exists (
      select 1
      from public.promoter_event_profiles
      where promoter_event_profiles.id = event_profile_id
      and promoter_event_profiles.user_id = auth.uid()
    )
  )
);

create policy "Users can update own pending events"
on public.events
for update
to authenticated
using (
  auth.uid() = user_id
  and status = 'pending'
)
with check (
  auth.uid() = user_id
  and status = 'pending'
  and published = false
  and (
    event_profile_id is null
    or exists (
      select 1
      from public.promoter_event_profiles
      where promoter_event_profiles.id = event_profile_id
      and promoter_event_profiles.user_id = auth.uid()
    )
  )
);
