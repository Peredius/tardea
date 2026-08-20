-- Enlaces base para las fichas internas de eventos.
-- Ejecutar en Supabase SQL Editor si al guardar una ficha aparece que falta alguna columna.

alter table public.events
  add column if not exists website_url text,
  add column if not exists instagram_url text,
  add column if not exists tiktok_url text;

grant select
on public.events
to anon;

grant select, insert, update, delete
on public.events
to authenticated;

grant select, insert, update, delete
on public.events
to service_role;
