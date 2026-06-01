alter table public.events
add column if not exists claimed_at timestamptz;

create table if not exists public.event_claims (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  promoter_user_id uuid not null references auth.users(id) on delete cascade,
  contact_name text not null,
  company text not null,
  email text not null,
  phone text,
  website text,
  message text,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create unique index if not exists event_claims_pending_once_idx
on public.event_claims(event_id, promoter_user_id)
where status = 'pending';

alter table public.event_claims enable row level security;

grant select, insert, update
on public.event_claims
to authenticated;

grant select, insert, update, delete
on public.event_claims
to service_role;

drop policy if exists "Promoters can create own event claims" on public.event_claims;

create policy "Promoters can create own event claims"
on public.event_claims
for insert
to authenticated
with check (
  auth.uid() = promoter_user_id
  and status = 'pending'
);

drop policy if exists "Promoters can read own event claims" on public.event_claims;

create policy "Promoters can read own event claims"
on public.event_claims
for select
to authenticated
using (auth.uid() = promoter_user_id);

drop policy if exists "Admins can read all event claims" on public.event_claims;

create policy "Admins can read all event claims"
on public.event_claims
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

drop policy if exists "Admins can update event claims" on public.event_claims;

create policy "Admins can update event claims"
on public.event_claims
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
