-- Tabla interna para recopilar eventos antes de pasarlos a Admin.
-- Sirve como listado tipo Excel de enlaces de tiqueteras, webs e Instagram.

create table if not exists public.event_research_items (
  id uuid primary key default gen_random_uuid(),
  source_url text,
  title text,
  type text not null default 'Tardeo',
  music text[] not null default '{}',
  audience text not null default 'Mixto',
  venue text,
  area text not null default 'Madrid',
  date date,
  start_time time,
  end_time time,
  price_from numeric not null default 0,
  maps_url text,
  status text not null default 'nuevo',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists event_research_items_source_url_idx
on public.event_research_items(source_url)
where source_url is not null;

create index if not exists event_research_items_type_status_idx
on public.event_research_items(type, status);

create index if not exists event_research_items_date_idx
on public.event_research_items(date);

grant select, insert, update, delete
on public.event_research_items
to authenticated;

grant select, insert, update, delete
on public.event_research_items
to service_role;

alter table public.event_research_items enable row level security;

drop policy if exists "Admins can manage event research items"
on public.event_research_items;

create policy "Admins can manage event research items"
on public.event_research_items
for all
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
    and profiles.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
    and profiles.role = 'admin'
  )
);
