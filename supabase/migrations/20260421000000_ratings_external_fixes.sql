-- Ensure unique constraint on movie_id so upsert works
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'ratings_external_movie_id_unique'
  ) then
    alter table ratings_external add constraint ratings_external_movie_id_unique unique (movie_id);
  end if;
end $$;

-- Add error columns
alter table ratings_external add column if not exists fetch_error text;
alter table ratings_external add column if not exists fetch_error_type text
  check (fetch_error_type is null or fetch_error_type in ('not_found', 'quota_exhausted', 'network', 'unknown'));
