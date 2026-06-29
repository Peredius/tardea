-- Campos para eventos encontrados por TARDEA Scout.
-- Estos eventos entran siempre como pendientes y con imagen provisional hasta revision editorial.

alter table public.events
  add column if not exists source_name text,
  add column if not exists source_url text,
  add column if not exists external_id text,
  add column if not exists imported_by_agent boolean not null default false,
  add column if not exists image_status text not null default 'original',
  add column if not exists needs_review boolean not null default false;

create index if not exists events_scout_review_idx
  on public.events (imported_by_agent, needs_review);

create index if not exists events_source_url_idx
  on public.events (source_url);
