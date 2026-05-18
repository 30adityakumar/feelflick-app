-- 2026-05-19 — movies_editorial_overlay.arc_points
--
-- Discover-v5's Magazine spread renders a per-film "Emotional Arc" curve
-- (10 sampled points 0–1). The chart currently synthesizes those points
-- from fit_profile via arcPointsFrom() in useDiscoverData.jsx. For
-- curated films we want a hand-tuned curve instead — same shape, but
-- editorially placed.
--
-- One JSONB column on the existing overlay table; useDiscoverData prefers
-- the stored curve when present and falls back to the synthesized one
-- when not (deliberate cold-start safety net — most films will never get
-- a curated arc).

ALTER TABLE public.movies_editorial_overlay
  ADD COLUMN IF NOT EXISTS arc_points JSONB;
