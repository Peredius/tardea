create table if not exists public.event_deletion_logs (
  id uuid primary key default gen_random_uuid(),
  event_id uuid,
  user_id uuid not null references auth.users(id) on delete cascade,
  event_title text,
  event_date date,
  reason text not null,
  reason_detail text,
  created_at timestamptz not null default now()
);

alter table public.event_deletion_logs enable row level security;

grant insert, select
on public.event_deletion_logs
to authenticated;

grant select, insert, update, delete
on public.event_deletion_logs
to service_role;

drop policy if exists "Users can create own event deletion logs" on public.event_deletion_logs;

create policy "Users can create own event deletion logs"
on public.event_deletion_logs
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can read own event deletion logs" on public.event_deletion_logs;

create policy "Users can read own event deletion logs"
on public.event_deletion_logs
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Admins can read event deletion logs" on public.event_deletion_logs;

create policy "Admins can read event deletion logs"
on public.event_deletion_logs
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
