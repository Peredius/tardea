alter table public.profiles enable row level security;

alter table public.profiles
add column if not exists address text;

alter table public.profiles
add column if not exists postal_code text;

alter table public.profiles
add column if not exists city text;

alter table public.profiles
add column if not exists municipality text;

alter table public.profiles
add column if not exists province text;

alter table public.profiles
add column if not exists promoter_contact_name text;

alter table public.profiles
add column if not exists promoter_event_name text;

alter table public.profiles
add column if not exists promoter_company text;

alter table public.profiles
add column if not exists promoter_tax_id text;

alter table public.profiles
add column if not exists promoter_address text;

alter table public.profiles
add column if not exists promoter_municipality text;

alter table public.profiles
add column if not exists promoter_postal_code text;

alter table public.profiles
add column if not exists promoter_province text;

alter table public.profiles
add column if not exists promoter_phone text;

alter table public.profiles
add column if not exists promoter_website text;

alter table public.profiles
add column if not exists promoter_description text;

alter table public.profiles
add column if not exists promoter_logo_url text;

alter table public.profiles
add column if not exists billing_name text;

alter table public.profiles
add column if not exists billing_different boolean default false;

alter table public.profiles
add column if not exists billing_tax_id text;

alter table public.profiles
add column if not exists billing_address text;

alter table public.profiles
add column if not exists billing_municipality text;

alter table public.profiles
add column if not exists billing_postal_code text;

alter table public.profiles
add column if not exists billing_province text;

alter table public.profiles
add column if not exists billing_email text;

drop policy if exists "Users can read own profile" on public.profiles;
drop policy if exists "Users can create own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;

create policy "Users can read own profile"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

create policy "Users can create own profile"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

create policy "Users can update own profile"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

alter table public.events enable row level security;

drop policy if exists "Anyone can read published approved events" on public.events;

create policy "Anyone can read published approved events"
on public.events
for select
to anon, authenticated
using (
  published = true
  and status = 'approved'
);

insert into storage.buckets (id, name, public)
values ('events', 'events', true)
on conflict (id) do update set public = true;

drop policy if exists "Anyone can read event files" on storage.objects;
drop policy if exists "Authenticated users can upload event files" on storage.objects;
drop policy if exists "Authenticated users can update event files" on storage.objects;

create policy "Anyone can read event files"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'events');

create policy "Authenticated users can upload event files"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'events');

create policy "Authenticated users can update event files"
on storage.objects
for update
to authenticated
using (bucket_id = 'events')
with check (bucket_id = 'events');
