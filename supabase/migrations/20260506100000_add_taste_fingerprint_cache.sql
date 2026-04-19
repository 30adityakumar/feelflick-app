-- MIGRATION: Add taste fingerprint cache to user_profiles_computed

ALTER TABLE public.user_profiles_computed
  ADD COLUMN IF NOT EXISTS taste_fingerprint jsonb,
  ADD COLUMN IF NOT EXISTS taste_fingerprint_computed_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_upc_taste_fingerprint_at
  ON public.user_profiles_computed(taste_fingerprint_computed_at);

COMMENT ON COLUMN public.user_profiles_computed.taste_fingerprint IS
  'Cached {topMoodTags, topToneTags, topFitProfiles} aggregated from watch history. TTL 24h.';
