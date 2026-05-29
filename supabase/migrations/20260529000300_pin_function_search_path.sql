-- Migration: pin search_path on app SECURITY DEFINER / plpgsql functions
--
-- WHY: 28 functions had no fixed `search_path` (advisor: function_search_path_mutable).
-- A mutable search_path on a SECURITY DEFINER function is a hijack vector. Pinning the
-- path removes the vulnerability and silences the lint.
--
-- PATH CHOICE — `public, extensions, pg_catalog` (NOT `''`):
--   * public      -> the app's tables + pg_trgm (installed in public)
--   * extensions  -> pgvector lives here; match_movies/find_top_neighbors/etc. use
--                    vector operators (<=>, <->) that would break under `''` or a
--                    path missing `extensions`.
--   * pg_catalog  -> built-ins.
-- Using `''` (full-qualification) would break the unqualified pgvector/pg_trgm
-- operators these functions rely on, so we pin to the exact schemas they need.
--
-- SCOPE: only app functions. pg_trgm's own functions (gtrgm_*, similarity, word_*)
-- live in public too but are extension-owned and intentionally excluded.
--
-- Forward-only. No behavior change (same schemas, just pinned).

begin;

alter function public.check_duplicate_feedback() set search_path = public, extensions, pg_catalog;
alter function public.check_duplicate_ratings() set search_path = public, extensions, pg_catalog;
alter function public.check_foreign_keys(p_table_name text) set search_path = public, extensions, pg_catalog;
alter function public.check_indexes(table_names text[]) set search_path = public, extensions, pg_catalog;
alter function public.check_invalid_watchlist_statuses() set search_path = public, extensions, pg_catalog;
alter function public.check_unique_constraints(table_names text[]) set search_path = public, extensions, pg_catalog;
alter function public.cleanup_expired_profile_caches() set search_path = public, extensions, pg_catalog;
alter function public.count_brief_candidates(p_mood_id integer, p_energy integer, p_attention text, p_tone text, p_time text, p_era text, p_languages text[]) set search_path = public, extensions, pg_catalog;
alter function public.database_health_check() set search_path = public, extensions, pg_catalog;
alter function public.find_top_neighbors(source_embedding vector, exclude_id integer, k integer) set search_path = public, extensions, pg_catalog;
alter function public.get_high_skip_movies(min_impressions integer, min_skip_rate numeric) set search_path = public, extensions, pg_catalog;
alter function public.get_mood_recommendations(p_mood_id integer, p_viewing_context_id integer, p_experience_type_id integer, p_energy_level integer, p_intensity_openness integer, p_limit integer) set search_path = public, extensions, pg_catalog;
alter function public.get_mood_recommendations(p_mood_id integer, p_viewing_context_id integer, p_experience_type_id integer, p_energy_level integer, p_intensity_openness integer, p_limit integer, p_user_id uuid) set search_path = public, extensions, pg_catalog;
alter function public.get_mood_recommendations_v2(p_mood_id integer, p_viewing_context_id integer, p_experience_type_id integer, p_energy_level integer, p_intensity_openness integer, p_limit integer, p_user_id uuid, p_use_semantic_similarity boolean) set search_path = public, extensions, pg_catalog;
alter function public.get_positive_feedback_movies(p_user_id uuid) set search_path = public, extensions, pg_catalog;
alter function public.get_seed_neighbors(seed_ids integer[], exclude_ids integer[], top_n integer, min_ff_rating numeric) set search_path = public, extensions, pg_catalog;
alter function public.get_watchlist_with_status(p_user_id uuid, p_status text) set search_path = public, extensions, pg_catalog;
alter function public.handle_new_auth_user() set search_path = public, extensions, pg_catalog;
alter function public.increment_session_interactions(session_id uuid) set search_path = public, extensions, pg_catalog;
alter function public.invalidate_user_profile_cache() set search_path = public, extensions, pg_catalog;
alter function public.match_movies(query_embedding vector, match_threshold double precision, match_count integer) set search_path = public, extensions, pg_catalog;
alter function public.match_movies_by_seeds(seed_ids integer[], exclude_ids integer[], match_count integer, min_ff_rating numeric) set search_path = public, extensions, pg_catalog;
alter function public.match_movies_for_seed(seed_movie_id integer, match_count integer, min_release_date date, language text, exclude_ids integer[]) set search_path = public, extensions, pg_catalog;
alter function public.movies_null_profile(p_schema text, p_table text, p_only_missing boolean) set search_path = public, extensions, pg_catalog;
alter function public.set_movies_editorial_overlay_updated_at() set search_path = public, extensions, pg_catalog;
alter function public.set_user_discover_preferences_updated_at() set search_path = public, extensions, pg_catalog;
alter function public.set_user_settings_updated_at() set search_path = public, extensions, pg_catalog;
alter function public.update_movie_completion_stats() set search_path = public, extensions, pg_catalog;

commit;

-- VERIFICATION (read-only): expect 0 rows = all app functions now pinned.
-- select p.proname from pg_proc p join pg_namespace n on n.oid=p.pronamespace
-- where n.nspname='public' and p.prokind='f' and p.proconfig is null
--   and not exists (select 1 from pg_depend d where d.objid=p.oid and d.deptype='e');
