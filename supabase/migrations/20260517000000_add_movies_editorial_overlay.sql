-- ============================================================================
-- movies_editorial_overlay — curated per-film FeelFlick editorial fields
-- ============================================================================
-- One row per movie that the editorial team has hand-curated. Any field can be
-- null; the /movie-v2/:id page prefers the overlay value when present and
-- falls back to dynamic (TMDB / taste-engine derived) content when missing.
--
-- Read access is intentionally public (anyone can SELECT) — the overlay is
-- editorial content meant to be shown to every visitor. Writes are admin-only
-- and happen via a service-role Edge Function (added in PR 3); no client
-- write policy is granted here.

BEGIN;

CREATE TABLE IF NOT EXISTS public.movies_editorial_overlay (
  movie_id          INTEGER PRIMARY KEY REFERENCES public.movies(id) ON DELETE CASCADE,

  -- Section overrides — any subset may be set; null falls back to dynamic.
  why_for_you       JSONB,   -- { rationale, reasons: [{ id, icon, title, detail, moodKey }] }
  mood_fingerprint  JSONB,   -- [{ name, weight, hex }]
  ff_take           JSONB,   -- { body, byline, meta }
  critic_quotes     JSONB,   -- [{ quote, author, outlet }]
  film_palette      JSONB,   -- { primary, secondary, glow, accent, rgb: {...} }
  daypart_fit       TEXT,    -- e.g. "Wednesday night · 132 quiet minutes"
  hero_signature    TEXT,    -- e.g. "Nº 0496"

  -- Provenance
  curated_by        UUID REFERENCES auth.users(id),
  curated_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_movies_editorial_overlay_curated_at
  ON public.movies_editorial_overlay (curated_at DESC);

-- Keep updated_at fresh
CREATE OR REPLACE FUNCTION public.set_movies_editorial_overlay_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_movies_editorial_overlay_updated_at
  ON public.movies_editorial_overlay;
CREATE TRIGGER trg_movies_editorial_overlay_updated_at
  BEFORE UPDATE ON public.movies_editorial_overlay
  FOR EACH ROW EXECUTE FUNCTION public.set_movies_editorial_overlay_updated_at();

-- RLS: anyone can read; writes are service-role only (no policy granted to
-- anon/authenticated). PR 3's Edge Function uses service_role and bypasses RLS.
ALTER TABLE public.movies_editorial_overlay ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone reads editorial overlay" ON public.movies_editorial_overlay;
CREATE POLICY "Anyone reads editorial overlay"
  ON public.movies_editorial_overlay FOR SELECT
  USING (true);

-- Same hardening pattern as the other behavioral tables.
REVOKE TRUNCATE, REFERENCES, TRIGGER ON TABLE public.movies_editorial_overlay
  FROM anon, authenticated;

COMMIT;
