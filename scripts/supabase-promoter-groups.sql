-- Grupos de promotor para unir varias fichas/eventos bajo un mismo panel.
-- Ejemplo: promoter_group = 'Rita''s' para Rita's Autocine, Rita's Mirador, Sunset Tardeo, etc.

alter table public.events
  add column if not exists promoter_group text;

alter table public.event_research_items
  add column if not exists promoter_group text;

alter table public.promoter_event_profiles
  add column if not exists promoter_group text;

create index if not exists events_promoter_group_idx
on public.events(promoter_group);

create index if not exists event_research_items_promoter_group_idx
on public.event_research_items(promoter_group);

create index if not exists promoter_event_profiles_promoter_group_idx
on public.promoter_event_profiles(promoter_group);

grant select
on public.events
to anon;

grant select, insert, update, delete
on public.events
to authenticated;

grant select, insert, update, delete
on public.events
to service_role;

grant select, insert, update, delete
on public.event_research_items
to authenticated;

grant select, insert, update, delete
on public.event_research_items
to service_role;

grant select
on public.promoter_event_profiles
to anon;

grant select, insert, update, delete
on public.promoter_event_profiles
to authenticated;

grant select, insert, update, delete
on public.promoter_event_profiles
to service_role;
