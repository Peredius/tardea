-- Keep analytics aggregates behind the server-side admin API.
alter view public.analytics_daily_flow set (security_invoker = true);
alter view public.analytics_daily_funnel set (security_invoker = true);

revoke all on public.analytics_daily_flow from anon, authenticated;
revoke all on public.analytics_daily_funnel from anon, authenticated;

grant select on public.analytics_daily_flow to service_role;
grant select on public.analytics_daily_funnel to service_role;
