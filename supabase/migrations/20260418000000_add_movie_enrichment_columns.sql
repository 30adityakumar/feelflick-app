-- Add enrichment columns for trailer, languages, production info, collection, certification

do $$
begin
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'movies' and column_name = 'trailer_youtube_key') then
    alter table public.movies add column trailer_youtube_key text;
  end if;

  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'movies' and column_name = 'spoken_languages') then
    alter table public.movies add column spoken_languages text[];
  end if;

  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'movies' and column_name = 'production_countries') then
    alter table public.movies add column production_countries text[];
  end if;

  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'movies' and column_name = 'production_companies') then
    alter table public.movies add column production_companies text[];
  end if;

  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'movies' and column_name = 'collection_id') then
    alter table public.movies add column collection_id integer;
  end if;

  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'movies' and column_name = 'collection_name') then
    alter table public.movies add column collection_name text;
  end if;

  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'movies' and column_name = 'certification') then
    alter table public.movies add column certification text;
  end if;
end $$;

-- Index collection_id for "more from this franchise" queries
create index if not exists idx_movies_collection_id on public.movies (collection_id) where collection_id is not null;
