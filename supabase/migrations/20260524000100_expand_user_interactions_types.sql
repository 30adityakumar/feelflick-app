-- ============================================================================
-- user_interactions: expand interaction_type CHECK to include 'save' + 'watch'
-- ============================================================================
-- The /discover engine learning loop was biased toward negative signals
-- because only Skip wrote user_interactions rows with the Stage 2 context
-- metadata (moods, intention, energy, who). Positive actions (Save, Mark
-- Watched, See More) didn't fire trackInteraction.
--
-- After updating handlers in DiscoverV5.jsx to call trackInteraction on
-- those positive actions, the inserts failed against the existing
-- interaction_type CHECK constraint which didn't allow 'save' or 'watch'.
-- This migration expands the allowed set so the engine can distinguish
-- between Save (intent to revisit), Watch (mark as already seen), and
-- See More (clicked through to film page — already allowed as 'click').

BEGIN;

ALTER TABLE public.user_interactions
  DROP CONSTRAINT IF EXISTS user_interactions_interaction_type_check;

ALTER TABLE public.user_interactions
  ADD CONSTRAINT user_interactions_interaction_type_check
  CHECK (interaction_type = ANY (ARRAY[
    'view'::text,
    'hover'::text,
    'click'::text,
    'search'::text,
    'filter'::text,
    'scroll'::text,
    'play_trailer'::text,
    'share'::text,
    'dismiss'::text,
    'save'::text,
    'watch'::text
  ]));

COMMIT;
