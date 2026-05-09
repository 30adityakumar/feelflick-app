-- MIGRATION: Add taste_baseline_moods column to users.
--
-- Stores the 2-3 mood keys (text) selected during OnboardingV2 Step 1 ("Mood baseline").
-- Used as a cold-start signal on /home before the recommendation profile has enough
-- behavioral data to be predictive.
--
-- Mood keys are stable strings defined in src/features/onboarding-v2/data.js MOODS:
--   'cozy' | 'wired' | 'tender' | 'fun' | 'tense' | 'mythic'
--
-- This is intentionally distinct from `users.favorite_moods` (int4[]), which is
-- defined for a different purpose and uses integer mood IDs.

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS taste_baseline_moods text[];

COMMENT ON COLUMN public.users.taste_baseline_moods IS
  'Mood keys selected during OnboardingV2 Step 1. Cold-start signal for /home recommendations. Stable string keys from src/features/onboarding-v2/data.js MOODS. Distinct from favorite_moods (int4[]) which serves a different purpose.';
