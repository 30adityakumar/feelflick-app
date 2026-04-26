-- ============================================================================
-- Enable RLS + owner-only policies on private per-user behavioral tables
-- ============================================================================
-- Tables: user_history, user_profiles_computed, recommendation_events,
--         recommendation_impressions
--
-- 💡 Why owner-only (no public SELECT): these four tables hold
-- private per-user behavioral signals (watch history, computed
-- profile, recommendation events/impressions). Unlike user_ratings
-- which is intentionally social/public-readable, these must never
-- leak across users — including to other authenticated users.

BEGIN;

-- ============================================================================
-- user_history
-- ============================================================================

ALTER TABLE public.user_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own history" ON public.user_history;
CREATE POLICY "Users can view own history"
  ON public.user_history FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own history" ON public.user_history;
CREATE POLICY "Users can insert own history"
  ON public.user_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own history" ON public.user_history;
CREATE POLICY "Users can update own history"
  ON public.user_history FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own history" ON public.user_history;
CREATE POLICY "Users can delete own history"
  ON public.user_history FOR DELETE
  USING (auth.uid() = user_id);

-- 💡 Why REVOKE TRUNCATE, REFERENCES, TRIGGER from anon and
-- authenticated: Supabase's default grants include these three
-- DDL-adjacent privileges which RLS does not gate. SELECT/INSERT/
-- UPDATE/DELETE remain granted because RLS policies enforce
-- ownership on those. service_role grants are untouched —
-- pipeline scripts use service_role and bypass RLS.
REVOKE TRUNCATE, REFERENCES, TRIGGER ON TABLE public.user_history FROM anon, authenticated;

-- ============================================================================
-- user_profiles_computed
-- ============================================================================

ALTER TABLE public.user_profiles_computed ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles_computed;
CREATE POLICY "Users can view own profile"
  ON public.user_profiles_computed FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles_computed;
CREATE POLICY "Users can insert own profile"
  ON public.user_profiles_computed FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles_computed;
CREATE POLICY "Users can update own profile"
  ON public.user_profiles_computed FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own profile" ON public.user_profiles_computed;
CREATE POLICY "Users can delete own profile"
  ON public.user_profiles_computed FOR DELETE
  USING (auth.uid() = user_id);

REVOKE TRUNCATE, REFERENCES, TRIGGER ON TABLE public.user_profiles_computed FROM anon, authenticated;

-- ============================================================================
-- recommendation_events
-- ============================================================================

ALTER TABLE public.recommendation_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own recommendation events" ON public.recommendation_events;
CREATE POLICY "Users can view own recommendation events"
  ON public.recommendation_events FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own recommendation events" ON public.recommendation_events;
CREATE POLICY "Users can insert own recommendation events"
  ON public.recommendation_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own recommendation events" ON public.recommendation_events;
CREATE POLICY "Users can update own recommendation events"
  ON public.recommendation_events FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own recommendation events" ON public.recommendation_events;
CREATE POLICY "Users can delete own recommendation events"
  ON public.recommendation_events FOR DELETE
  USING (auth.uid() = user_id);

REVOKE TRUNCATE, REFERENCES, TRIGGER ON TABLE public.recommendation_events FROM anon, authenticated;

-- ============================================================================
-- recommendation_impressions
-- ============================================================================

ALTER TABLE public.recommendation_impressions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own recommendation impressions" ON public.recommendation_impressions;
CREATE POLICY "Users can view own recommendation impressions"
  ON public.recommendation_impressions FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own recommendation impressions" ON public.recommendation_impressions;
CREATE POLICY "Users can insert own recommendation impressions"
  ON public.recommendation_impressions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own recommendation impressions" ON public.recommendation_impressions;
CREATE POLICY "Users can update own recommendation impressions"
  ON public.recommendation_impressions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own recommendation impressions" ON public.recommendation_impressions;
CREATE POLICY "Users can delete own recommendation impressions"
  ON public.recommendation_impressions FOR DELETE
  USING (auth.uid() = user_id);

REVOKE TRUNCATE, REFERENCES, TRIGGER ON TABLE public.recommendation_impressions FROM anon, authenticated;

COMMIT;
