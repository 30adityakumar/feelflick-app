-- Add popularity-ranked top3 aggregate and refresh tracking for cast metadata

alter table public.movies add column if not exists top3_popularity_rank_cast_avg numeric;
alter table public.movies add column if not exists cast_metadata_recomputed_at timestamptz;
alter table public.movies drop column if exists min_cast_popularity;
