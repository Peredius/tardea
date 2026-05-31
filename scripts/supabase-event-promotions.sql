alter table public.events
add column if not exists promotion_package text;

alter table public.events
add column if not exists promotion_package_name text;

alter table public.events
add column if not exists promotion_price numeric;

alter table public.events
add column if not exists promotion_status text not null default 'none';

alter table public.events
add column if not exists promotion_requested_at timestamptz;

alter table public.events
add column if not exists promotion_paid_at timestamptz;

alter table public.events
add column if not exists promotion_activated_at timestamptz;

create index if not exists events_promotion_status_idx
on public.events(promotion_status);
