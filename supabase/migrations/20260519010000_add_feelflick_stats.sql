-- 2026-05-19 — feelflick_stats: nightly-computed community medians
--
-- profile-v2's "How you skew" section currently renders a hardcoded SKEWS
-- array (darker / slower-paced / etc.) for every user. To turn that into a
-- real comparison we need the FeelFlick-wide medians it skews against —
-- runtime, films-per-month, top-mood share, avg rating.
--
-- Single key/value table so the schema doesn't need to change as new
-- aggregates are added. Computed via refresh_feelflick_stats() (created in
-- the next migration), scheduled nightly. The static SKEWS in
-- profile-v2/data.js stays as a cold-start fallback when this table is
-- empty.

CREATE TABLE IF NOT EXISTS public.feelflick_stats (
  stat_key TEXT PRIMARY KEY,
  stat_value JSONB NOT NULL,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Public-readable (any authenticated user can pull medians for comparison
-- on their own /profile page). Writes go through the
-- refresh_feelflick_stats() function with SECURITY DEFINER.
ALTER TABLE public.feelflick_stats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "feelflick_stats_read" ON public.feelflick_stats;
CREATE POLICY "feelflick_stats_read"
  ON public.feelflick_stats
  FOR SELECT
  TO authenticated, anon
  USING (true);
