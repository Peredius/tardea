update public.events
set music = array(
  select distinct case
    when lower(item) = 'electronica' then 'Electrónica'
    else item
  end
  from unnest(music) as item
)
where exists (
  select 1
  from unnest(music) as item
  where lower(item) = 'electronica'
);

update public.profiles
set music_preferences = array(
  select distinct case
    when lower(item) = 'electronica' then 'Electrónica'
    else item
  end
  from unnest(music_preferences) as item
)
where exists (
  select 1
  from unnest(music_preferences) as item
  where lower(item) = 'electronica'
);

update public.event_research_items
set music = array(
  select distinct case
    when lower(item) = 'electronica' then 'Electrónica'
    else item
  end
  from unnest(music) as item
)
where exists (
  select 1
  from unnest(music) as item
  where lower(item) = 'electronica'
);

update public.event_profiles
set music = array(
  select distinct case
    when lower(item) = 'electronica' then 'Electrónica'
    else item
  end
  from unnest(music) as item
)
where exists (
  select 1
  from unnest(music) as item
  where lower(item) = 'electronica'
);
