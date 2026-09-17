create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  event_name text not null,
  path text,
  session_id text,
  target_type text,
  target_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists analytics_events_created_at_idx
  on public.analytics_events (created_at desc);

create index if not exists analytics_events_event_name_created_at_idx
  on public.analytics_events (event_name, created_at desc);

create index if not exists analytics_events_session_created_at_idx
  on public.analytics_events (session_id, created_at desc);

alter table public.analytics_events enable row level security;

drop policy if exists "analytics_events_no_public_read" on public.analytics_events;
create policy "analytics_events_no_public_read"
  on public.analytics_events
  for select
  using (false);

drop policy if exists "analytics_events_no_public_write" on public.analytics_events;
create policy "analytics_events_no_public_write"
  on public.analytics_events
  for insert
  with check (false);

create or replace view public.analytics_daily_flow
with (security_invoker = true) as
select
  created_at::date as day,
  event_name,
  count(*) as clicks,
  count(distinct nullif(session_id, '')) as unique_sessions
from public.analytics_events
group by created_at::date, event_name
order by day desc, event_name asc;

create or replace view public.analytics_daily_funnel
with (security_invoker = true) as
select
  created_at::date as day,
  count(*) filter (where event_name = 'calendar_search') as calendar_searches,
  count(distinct session_id) filter (where event_name = 'calendar_search') as calendar_search_users,
  count(*) filter (where event_name = 'text_search') as text_searches,
  count(*) filter (where event_name = 'event_card_open') as event_opens,
  count(*) filter (where event_name = 'event_detail_whatsapp') as whatsapp_clicks,
  count(*) filter (where event_name = 'event_detail_ticket') as ticket_clicks,
  count(*) filter (where event_name in ('event_detail_favorite_date', 'event_detail_favorite_plan', 'favorite_button_toggle')) as favorite_clicks
from public.analytics_events
group by created_at::date
order by day desc;

revoke all on public.analytics_daily_flow from anon, authenticated;
revoke all on public.analytics_daily_funnel from anon, authenticated;

grant select on public.analytics_daily_flow to service_role;
grant select on public.analytics_daily_funnel to service_role;
