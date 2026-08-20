-- Ajuste para que el listado pueda actualizar filas existentes por source_url.
-- PostgreSQL permite varios NULL en un indice unique, asi que las filas sin enlace no se bloquean entre si.

drop index if exists public.event_research_items_source_url_idx;

create unique index if not exists event_research_items_source_url_idx
on public.event_research_items(source_url);
