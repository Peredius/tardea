alter table public.promoter_event_profiles
add column if not exists area text;

alter table public.promoter_event_profiles
add column if not exists maps_url text;

alter table public.promoter_event_profiles
add column if not exists price_from numeric default 0;
