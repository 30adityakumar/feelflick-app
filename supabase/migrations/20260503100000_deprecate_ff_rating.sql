-- Mark ff_rating and ff_final_rating as deprecated.
-- Columns remain for backwards compatibility during migration.
-- Scheduled for removal 2026-05-18.

COMMENT ON COLUMN public.movies.ff_rating IS
  'DEPRECATED 2026-04-18. Use ff_audience_rating (0-100 scale). Column scheduled for removal 2026-05-18.';

COMMENT ON COLUMN public.movies.ff_final_rating IS
  'DEPRECATED 2026-04-18. Use ff_personal_rating (via personalRating.js) or ff_audience_rating. Column scheduled for removal 2026-05-18.';
