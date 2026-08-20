-- Estado editorial de las fichas internas de eventos.
-- Permite separar fichas por revisar de fichas ya creadas/revisadas.

alter table public.events
  add column if not exists profile_reviewed boolean not null default false;

alter table public.event_research_items
  add column if not exists profile_reviewed boolean not null default false;

create index if not exists events_profile_reviewed_idx
on public.events(profile_reviewed);

create index if not exists event_research_items_profile_reviewed_idx
on public.event_research_items(profile_reviewed);
