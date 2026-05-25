-- ============================================================================
-- user_discover_preferences — learned Stage 2 filter modes per user
-- ============================================================================
-- One row per user. Counts how often each option was the user's committed
-- selection in each Stage 2 dimension (intention / time / who / energy).
-- Read on Stage 2 mount to pre-select the mode; written on Stage 2 → 3
-- commit ("Show me my edition →") to learn from the user's actual picks.
--
-- The hybrid blend (heuristic vs learned) lives in the frontend
-- (predictDiscoverDefaults in DiscoverV5.jsx): before N=3 commits, predict
-- from mood / runtime / hour-of-day; from N commits onward, trust the
-- learned mode per dimension, falling back to heuristic when a dimension
-- has no learned signal yet.
--
-- Owner-only RLS — these are private per-user signals (mirrors
-- user_settings policy from 20260517000200_add_user_settings.sql).

BEGIN;

CREATE TABLE IF NOT EXISTS public.user_discover_preferences (
  user_id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  intention_counts  JSONB NOT NULL DEFAULT '{}'::jsonb,
  time_counts       JSONB NOT NULL DEFAULT '{}'::jsonb,
  who_counts        JSONB NOT NULL DEFAULT '{}'::jsonb,
  energy_counts     JSONB NOT NULL DEFAULT '{}'::jsonb,
  total_commits     INTEGER NOT NULL DEFAULT 0,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auto-bump updated_at on UPDATE.
CREATE OR REPLACE FUNCTION public.set_user_discover_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_user_discover_preferences_updated_at
  ON public.user_discover_preferences;
CREATE TRIGGER trg_user_discover_preferences_updated_at
  BEFORE UPDATE ON public.user_discover_preferences
  FOR EACH ROW EXECUTE FUNCTION public.set_user_discover_preferences_updated_at();

ALTER TABLE public.user_discover_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own discover preferences"
  ON public.user_discover_preferences;
CREATE POLICY "Users can view own discover preferences"
  ON public.user_discover_preferences FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own discover preferences"
  ON public.user_discover_preferences;
CREATE POLICY "Users can insert own discover preferences"
  ON public.user_discover_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own discover preferences"
  ON public.user_discover_preferences;
CREATE POLICY "Users can update own discover preferences"
  ON public.user_discover_preferences FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own discover preferences"
  ON public.user_discover_preferences;
CREATE POLICY "Users can delete own discover preferences"
  ON public.user_discover_preferences FOR DELETE
  USING (auth.uid() = user_id);

REVOKE TRUNCATE, REFERENCES, TRIGGER
  ON TABLE public.user_discover_preferences FROM anon, authenticated;

COMMIT;
