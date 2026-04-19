-- Add Trakt.tv rating columns to ratings_external
alter table public.ratings_external add column if not exists trakt_rating numeric;
alter table public.ratings_external add column if not exists trakt_votes integer;
alter table public.ratings_external add column if not exists trakt_fetched_at timestamptz;
