-- Replace a legacy unrestricted profile policy with owner-scoped writes.
drop policy if exists "Promoters can update own event profiles"
on public.promoter_event_profiles;

create policy "Promoters can update own event profiles"
on public.promoter_event_profiles
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Promoters can delete own event profiles"
on public.promoter_event_profiles;

create policy "Promoters can delete own event profiles"
on public.promoter_event_profiles
for delete
to authenticated
using (auth.uid() = user_id);

-- Public buckets serve known public URLs without a broad object-listing policy.
drop policy if exists "Anyone can read event files" on storage.objects;
drop policy if exists "Allow uploads 1doady1_0" on storage.objects;

-- Admin checks can run with the caller's RLS rights; no definer bypass is needed.
alter function public.is_tardea_admin() security invoker;
revoke execute on function public.is_tardea_admin() from public, anon;
grant execute on function public.is_tardea_admin() to authenticated;

-- This event-trigger helper is internal and must never be callable through the API.
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
