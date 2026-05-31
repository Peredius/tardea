alter table public.events
add column if not exists reel_url text;

alter table public.events
add column if not exists media_type text not null default 'image';
