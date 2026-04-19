-- Transient column for credits data passed from step 02 to step 04
-- Nulled after step 04 processes it to reclaim storage

alter table public.movies add column if not exists credits_raw jsonb;
alter table public.movies add column if not exists writer_name text;
alter table public.movies add column if not exists writer_popularity numeric;
alter table public.movies add column if not exists cinematographer_name text;
