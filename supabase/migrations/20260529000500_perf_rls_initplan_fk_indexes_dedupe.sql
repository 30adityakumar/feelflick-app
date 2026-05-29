-- Migration: performance pass (RLS initplan + FK indexes + duplicate index cleanup)
-- Source: Supabase performance advisor. No access-control semantics change.
--
-- PART A — wrap auth.uid()/role()/jwt() in (select ...) across all RLS policies.
--   Today these are re-evaluated PER ROW (auth_rls_initplan, 85 policies / 23 tables);
--   wrapping makes Postgres evaluate them ONCE per statement (initplan). Done via an
--   idempotent DO block (normalize-then-wrap) using expression-only ALTER POLICY, so
--   each policy's command/roles/permissive flags are preserved exactly.
-- PART B — add covering indexes for 12 unindexed foreign keys (faster joins/cascades).
-- PART C — drop 10 duplicate indexes (8 plain dupes; 2 redundant unique/PK-backed
--   constraints dropped via ALTER TABLE so we keep the canonical one).
--
-- Forward-only. Atomic (begin/commit) — a failure rolls back cleanly.

begin;

-- ---------------------------------------------------------------------------
-- PART A: pin auth.* in RLS policy expressions (idempotent)
-- ---------------------------------------------------------------------------
do $$
declare r record; q text; c text;
begin
  for r in
    select tablename, policyname, qual, with_check
    from pg_policies
    where schemaname = 'public'
      and (qual ~ 'auth\.(uid|role|jwt)\(\)' or with_check ~ 'auth\.(uid|role|jwt)\(\)')
  loop
    q := r.qual;
    c := r.with_check;
    if q is not null then
      q := replace(replace(replace(q, '(select auth.uid())','auth.uid()'), '(select auth.role())','auth.role()'), '(select auth.jwt())','auth.jwt()');
      q := replace(replace(replace(q, 'auth.uid()','(select auth.uid())'), 'auth.role()','(select auth.role())'), 'auth.jwt()','(select auth.jwt())');
    end if;
    if c is not null then
      c := replace(replace(replace(c, '(select auth.uid())','auth.uid()'), '(select auth.role())','auth.role()'), '(select auth.jwt())','auth.jwt()');
      c := replace(replace(replace(c, 'auth.uid()','(select auth.uid())'), 'auth.role()','(select auth.role())'), 'auth.jwt()','(select auth.jwt())');
    end if;
    execute 'alter policy ' || quote_ident(r.policyname) || ' on public.' || quote_ident(r.tablename)
      || coalesce(' using (' || q || ')', '')
      || coalesce(' with check (' || c || ')', '');
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- PART B: covering indexes for unindexed foreign keys
-- ---------------------------------------------------------------------------
create index if not exists idx_list_movies_movie_id on public.list_movies (movie_id);
create index if not exists idx_mood_session_abandoned_user_id on public.mood_session_abandoned (user_id);
create index if not exists idx_mood_sessions_experience_type_id on public.mood_sessions (experience_type_id);
create index if not exists idx_mood_sessions_viewing_context_id on public.mood_sessions (viewing_context_id);
create index if not exists idx_movies_editorial_overlay_curated_by on public.movies_editorial_overlay (curated_by);
create index if not exists idx_recommendation_impressions_movie_id on public.recommendation_impressions (movie_id);
create index if not exists idx_recommendation_impressions_seed_movie_id on public.recommendation_impressions (seed_movie_id);
create index if not exists idx_user_history_mood_session_id on public.user_history (mood_session_id);
create index if not exists idx_user_preferences_genre_id on public.user_preferences (genre_id);
create index if not exists idx_user_watchlist_mood_session_id on public.user_watchlist (mood_session_id);
create index if not exists idx_user_watchlist_movie_id on public.user_watchlist (movie_id);
create index if not exists idx_users_default_viewing_context_id on public.users (default_viewing_context_id);

-- ---------------------------------------------------------------------------
-- PART C: drop duplicate indexes (keep one of each identical pair)
-- ---------------------------------------------------------------------------
-- Plain (non-constraint) duplicates:
drop index if exists public.idx_movie_mood_scores_movie_score;
drop index if exists public.idx_recommendation_events_user_shown_at;
drop index if exists public.idx_user_history_movie_id;
drop index if exists public.idx_user_history_user_watched_at;
drop index if exists public.idx_user_movie_feedback_user_created;
drop index if exists public.user_preferences_user_id_idx;
drop index if exists public.idx_user_ratings_user_rated;
drop index if exists public.idx_watchlist_user_status;
-- Redundant unique constraints (keep movies_tmdb_id_key / ratings_external_pkey):
alter table public.movies drop constraint if exists unique_tmdb_id;
alter table public.ratings_external drop constraint if exists ratings_external_movie_id_unique;

commit;

-- VERIFICATION (read-only, run after): expect 0 unwrapped auth.* policies.
-- select count(*) from pg_policies where schemaname='public'
--   and (qual ~ 'auth\.(uid|role|jwt)\(\)' or with_check ~ 'auth\.(uid|role|jwt)\(\)')
--   and not (coalesce(qual,'')||coalesce(with_check,'')) ~ '\(select auth\.';
