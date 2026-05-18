-- ============================================================================
-- Seed: Parasite (tmdb_id 496243) editorial overlay
-- ============================================================================
-- Lifts the curated WHY / MOOD_FINGERPRINT / FF_TAKE / CRITIC_QUOTES /
-- FILM_PALETTE / daypartFit values that used to live in
-- src/features/movie-v2/data.js into the new movies_editorial_overlay table.
-- After this seed lands, the page no longer special-cases tmdb_id 496243 —
-- Parasite is just the first curated row.
--
-- Idempotent: ON CONFLICT DO NOTHING keeps re-runs safe.
-- No-op if Parasite isn't in the local movies catalog yet (the SELECT returns
-- zero rows, the INSERT inserts zero rows).

BEGIN;

INSERT INTO public.movies_editorial_overlay (
  movie_id,
  why_for_you,
  mood_fingerprint,
  ff_take,
  critic_quotes,
  film_palette,
  daypart_fit,
  hero_signature
)
SELECT
  m.id,
  -- why_for_you
  jsonb_build_object(
    'eyebrow',  'Why this is your kind of film',
    'headline', 'Bong shares your DNA.',
    'rationale',
    'Two-handers with class tension, a director who never wastes a frame, and a 132-minute runtime that fits your weeknight sweet spot. Park Chan-wook is your highest-confidence director—Bong shares his exact lineage of escalating dread with comic precision.',
    'reasons',
    jsonb_build_array(
      jsonb_build_object('id','mood',     'icon','mood',     'title','Sharp · Tense · Surprising',     'detail','Matches three of your top mood weights. You''ve rated 12 thrillers 4★+ this year.',                 'moodKey','Tense'),
      jsonb_build_object('id','motif',    'icon','dna',      'title','Class tension as motif',          'detail','You''ve returned to this thread in 7 films (Snowpiercer, Joker, The Florida Project).',              'moodKey','Class-coded'),
      jsonb_build_object('id','director', 'icon','director', 'title','Director: Bong Joon-ho',          'detail','New to your library. Adjacent to Park Chan-wook (5★) and Lee Chang-dong (4★).',                     'moodKey','Surprising'),
      jsonb_build_object('id','time',     'icon','time',     'title','132 min · Wednesday-night fit',   'detail','Right in your runtime sweet spot. You watch 70% of films in the 100–140 min band.',                  'moodKey','Cerebral')
    )
  ),
  -- mood_fingerprint
  jsonb_build_array(
    jsonb_build_object('name','Tense',       'weight',0.94, 'hex','#EF4444'),
    jsonb_build_object('name','Surprising',  'weight',0.88, 'hex','#A78BFA'),
    jsonb_build_object('name','Sharp',       'weight',0.85, 'hex','#34D399'),
    jsonb_build_object('name','Dark-comic',  'weight',0.72, 'hex','#FBBF24'),
    jsonb_build_object('name','Class-coded', 'weight',0.81, 'hex','#F472B6'),
    jsonb_build_object('name','Cerebral',    'weight',0.68, 'hex','#7DD3FC')
  ),
  -- ff_take
  jsonb_build_object(
    'body',   'A perfect machine. Bong builds his cage room by room—one staircase, one storm, one peach, one stone. By the time the gate clicks shut, you realize you walked in willingly. The best thriller of its decade and the funniest film about housekeeping ever made.',
    'byline', 'The FeelFlick Take',
    'meta',   'Updated for your taste profile · est. read 1 min'
  ),
  -- critic_quotes
  jsonb_build_array(
    jsonb_build_object('quote','A symphony of social rage, told with the precision of a heist film and the cruelty of a fable.',                                       'author','Pauline Kael (in spirit)', 'outlet','The New Yorker'),
    jsonb_build_object('quote','Bong directs like he''s building furniture for a flood. Every joint holds. Every joint, in the end, betrays.',                          'author','A. O. Scott',              'outlet','The Times')
  ),
  -- film_palette
  jsonb_build_object(
    'primary',   '#C8392F',
    'secondary', '#F2C24B',
    'glow',      '#7B2A1F',
    'accent',    '#A78BFA',
    'rgb', jsonb_build_object(
      'primary',   '200, 57, 47',
      'secondary', '242, 194, 75',
      'glow',      '123, 42, 31',
      'accent',    '167, 139, 250'
    )
  ),
  -- daypart_fit
  'Wednesday night · 132 quiet minutes',
  -- hero_signature
  'Nº 0496'
FROM public.movies m
WHERE m.tmdb_id = 496243
ON CONFLICT (movie_id) DO NOTHING;

COMMIT;
