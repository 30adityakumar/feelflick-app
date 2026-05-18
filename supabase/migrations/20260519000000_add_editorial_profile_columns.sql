-- 2026-05-19 — Per-user editorial fields on user_profiles_computed.
--
-- profile-v2's masthead currently renders a hardcoded USER_DEFAULT.summary /
-- archetype / signature for every user (the Parasite-shaped "Patient,
-- class-coded thrillers…" quote). These columns hold the per-user
-- replacement:
--
--   editorial_summary       — 1 prose sentence, generated via the
--                             generate-taste-summary edge function
--   editorial_signature     — 1 short caption, also LLM-generated
--   editorial_archetype     — JSONB array of 3 archetype names, derived
--                             client-side from taste_fingerprint
--                             (top mood × top fit_profile)
--   editorial_generated_at  — timestamp; client regenerates when null or
--                             older than 24 h
--
-- The static USER_DEFAULT in src/features/profile-v2/data.js stays as
-- cold-start fallback when these are null.

ALTER TABLE public.user_profiles_computed
  ADD COLUMN IF NOT EXISTS editorial_summary TEXT,
  ADD COLUMN IF NOT EXISTS editorial_signature TEXT,
  ADD COLUMN IF NOT EXISTS editorial_archetype JSONB,
  ADD COLUMN IF NOT EXISTS editorial_generated_at TIMESTAMPTZ;
