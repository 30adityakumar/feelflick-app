-- 2026-05-19 — refresh_feelflick_stats() RPC
--
-- Populates feelflick_stats with community medians used by profile-v2's
-- "How you skew" section. Idempotent — re-running overwrites each row with
-- the latest value.
--
-- Schedule via pg_cron once the extension is enabled, e.g.:
--   SELECT cron.schedule('refresh_feelflick_stats_nightly', '15 3 * * *',
--                        $$SELECT public.refresh_feelflick_stats()$$);
-- (cron currently lives in the supabase schema on this project; left
-- documented here so the cadence is part of the migration record.)

CREATE OR REPLACE FUNCTION public.refresh_feelflick_stats()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  median_runtime         NUMERIC;
  median_films_month     NUMERIC;
  median_avg_rating      NUMERIC;
  top_mood               JSONB;
  median_release_year    NUMERIC;
BEGIN
  -- Median film runtime across every logged watch (joined to movies).
  SELECT percentile_cont(0.5) WITHIN GROUP (ORDER BY m.runtime)
    INTO median_runtime
    FROM public.user_history uh
    JOIN public.movies m ON m.id = uh.movie_id
   WHERE m.runtime IS NOT NULL;

  -- Median films-per-month across users with at least one logged watch.
  WITH per_user_month AS (
    SELECT user_id,
           date_trunc('month', watched_at) AS bucket,
           COUNT(*) AS films
      FROM public.user_history
     WHERE watched_at IS NOT NULL
     GROUP BY user_id, date_trunc('month', watched_at)
  )
  SELECT percentile_cont(0.5) WITHIN GROUP (ORDER BY films)
    INTO median_films_month
    FROM per_user_month;

  -- Median user rating (the rating value users give, not the FF score).
  SELECT percentile_cont(0.5) WITHIN GROUP (ORDER BY rating)
    INTO median_avg_rating
    FROM public.user_ratings
   WHERE rating IS NOT NULL;

  -- Most-watched mood tag community-wide + its share of all tagged watches.
  WITH tag_counts AS (
    SELECT unnest(m.mood_tags) AS tag, COUNT(*) AS n
      FROM public.user_history uh
      JOIN public.movies m ON m.id = uh.movie_id
     WHERE m.mood_tags IS NOT NULL
     GROUP BY tag
  ), totals AS (
    SELECT SUM(n) AS total FROM tag_counts
  )
  SELECT jsonb_build_object(
           'tag', tc.tag,
           'share', CASE WHEN t.total > 0 THEN ROUND((tc.n::NUMERIC / t.total)::NUMERIC, 4) ELSE 0 END
         )
    INTO top_mood
    FROM tag_counts tc, totals t
   ORDER BY tc.n DESC
   LIMIT 1;

  -- Median release year of all logged watches (decade skew).
  SELECT percentile_cont(0.5) WITHIN GROUP (ORDER BY m.release_year)
    INTO median_release_year
    FROM public.user_history uh
    JOIN public.movies m ON m.id = uh.movie_id
   WHERE m.release_year IS NOT NULL;

  INSERT INTO public.feelflick_stats (stat_key, stat_value, computed_at) VALUES
    ('median_runtime',      to_jsonb(median_runtime),      now()),
    ('median_films_month',  to_jsonb(median_films_month),  now()),
    ('median_user_rating',  to_jsonb(median_avg_rating),   now()),
    ('top_mood',            COALESCE(top_mood, '{}'::JSONB), now()),
    ('median_release_year', to_jsonb(median_release_year), now())
  ON CONFLICT (stat_key) DO UPDATE
    SET stat_value = EXCLUDED.stat_value,
        computed_at = EXCLUDED.computed_at;
END
$$;

-- Allow authenticated clients to fire a refresh on-demand from profile-v2
-- when the stored values are stale (>24h). Long-term we'll run this via
-- pg_cron — this hand-trigger is the bootstrap.
GRANT EXECUTE ON FUNCTION public.refresh_feelflick_stats() TO authenticated;

-- Seed run so the table has values immediately.
SELECT public.refresh_feelflick_stats();
