-- ============================================================================
-- user_settings — per-user account preferences (notifications, engine prefs, privacy)
-- ============================================================================
-- Single JSONB column to keep schema flexible as the prototype evolves. The
-- shape inside `settings` matches what /account-v2 reads / writes:
--
--   {
--     "notifications": [{ "id", "label", "desc", "enabled", "badge" }, …],
--     "prefs": {
--       "runtimeFloor": 80, "runtimeCap": 170,
--       "languages": ["Korean", ...],
--       "subtitles": "always-welcome",
--       "spoilerTier": "brief",
--       "avoidGenres": ["Horror", ...]
--     },
--     "privacy": {
--       "profilePublic": true, "diaryPublic": false, …
--     }
--   }
--
-- One row per user; owner-only RLS — these are private per-user signals, never
-- shared cross-user (mirrors user_profiles_computed policy from
-- 20260514000000_enable_rls_owner_policies_user_data.sql).

BEGIN;

CREATE TABLE IF NOT EXISTS public.user_settings (
  user_id     UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  settings    JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auto-bump updated_at on UPDATE.
CREATE OR REPLACE FUNCTION public.set_user_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_user_settings_updated_at ON public.user_settings;
CREATE TRIGGER trg_user_settings_updated_at
  BEFORE UPDATE ON public.user_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_user_settings_updated_at();

ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own settings" ON public.user_settings;
CREATE POLICY "Users can view own settings"
  ON public.user_settings FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own settings" ON public.user_settings;
CREATE POLICY "Users can insert own settings"
  ON public.user_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own settings" ON public.user_settings;
CREATE POLICY "Users can update own settings"
  ON public.user_settings FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own settings" ON public.user_settings;
CREATE POLICY "Users can delete own settings"
  ON public.user_settings FOR DELETE
  USING (auth.uid() = user_id);

REVOKE TRUNCATE, REFERENCES, TRIGGER ON TABLE public.user_settings FROM anon, authenticated;

COMMIT;
