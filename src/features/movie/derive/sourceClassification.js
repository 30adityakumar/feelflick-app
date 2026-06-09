// src/features/movie/derive/sourceClassification.js
// Canonical content-provenance model for the Film File (/movie/:id).
//
// This is the code-level encoding of the F5.1 provenance matrix. It records, for
// every visible content surface, WHERE the content comes from — so later phases
// (F5.4 trust redesign) can reason about provenance from one source of truth
// instead of re-deriving it per component.
//
// It deliberately distinguishes two independent axes (do NOT collapse them):
//   origin       — 'real' | 'generated' | 'static'
//     real       = stored facts or user-authored data (TMDB, user_ratings, …)
//     generated  = produced by the LLM overlay edge function (ff_take, critic_quotes,
//                  daypart_fit, and the llm_* enrichment columns)
//     static     = fixed FeelFlick product copy (cold-start / sign-in prompts)
//   presentation — 'direct' | 'derived'
//     direct     = shown roughly as stored/written
//     derived    = transformed/computed before display (a %, a radar geometry, …)
//
// "generated" is NOT a synonym for "computed". The match % is computed from REAL
// signals (origin: real, presentation: derived). The Mood Radar geometry is computed
// (derived) from GENERATED llm_* enrichment (origin: generated, presentation: derived).
//
// This module is pure: no React, no browser APIs, no Supabase, no network, no side
// effects. It records provenance only — it does NOT decide whether anything renders
// and does NOT enforce any trust policy. It contains no user-facing strings.

/**
 * Stable registry of Film File content elements and their provenance.
 * @type {Record<string, { origin: 'real'|'generated'|'static', presentation: 'direct'|'derived', source: string }>}
 */
export const FILM_FILE_SOURCE_REGISTRY = {
  // Real, shown directly ------------------------------------------------------
  heroFacts: {
    origin: 'real', presentation: 'direct',
    source: 'TMDB movie details (title, year, runtime, certification, genres, director)',
  },
  matchPercentage: {
    // Computed from stored/user signals + engine inputs — NOT generated prose.
    origin: 'real', presentation: 'derived',
    source: 'computeMatchPercent(scoreMovieForUser) over the user profile + film signals',
  },
  whyForYou: {
    origin: 'real', presentation: 'derived',
    source: 'film attributes (mood_tags, fit_profile, runtime) × available user taste signals',
  },
  friendsLoved: {
    origin: 'real', presentation: 'direct',
    source: 'followed users (user_follows) × their high user_ratings + user_ratings.review_text',
  },
  tasteTwinReview: {
    origin: 'real', presentation: 'direct',
    source: 'user_similarity top match × that user’s real user_ratings.review_text',
  },
  providers: {
    origin: 'real', presentation: 'direct',
    source: 'TMDB watch/providers (region-keyed, third-party)',
  },
  castAndCredits: {
    origin: 'real', presentation: 'direct',
    source: 'TMDB credits',
  },
  yourTake: {
    origin: 'real', presentation: 'direct',
    source: 'authenticated user’s own user_ratings + user_movie_feedback',
  },
  // Generated (LLM overlay) ---------------------------------------------------
  ffTake: {
    origin: 'generated', presentation: 'direct',
    source: 'movies_editorial_overlay.ff_take (generate-movie-overlay edge function)',
  },
  viewerNotes: {
    origin: 'generated', presentation: 'direct',
    source: 'movies_editorial_overlay.critic_quotes (invented friend-voice personas)',
  },
  daypartFit: {
    origin: 'generated', presentation: 'direct',
    source: 'movies_editorial_overlay.daypart_fit (generated)',
  },
  moodRadar: {
    // Geometry is computed (derived) from GENERATED llm_* enrichment columns.
    origin: 'generated', presentation: 'derived',
    source: 'movies.llm_* enrichment + mood_tags → deriveMoodAxes geometry',
  },
  // Static product copy -------------------------------------------------------
  coldStartCopy: {
    origin: 'static', presentation: 'direct',
    source: 'FeelFlick product copy (cold-start / sign-in prompts, fallback rationale)',
  },
}

// The LLM enrichment columns the Mood Radar reads (mirrors deriveMoodAxes).
const LLM_KEYS = ['llm_intensity', 'llm_pacing', 'llm_emotional_depth', 'llm_dialogue_density', 'llm_attention_demand']

const nonEmptyArray = (v) => Array.isArray(v) && v.length > 0
const nonEmptyString = (v) => typeof v === 'string' && v.trim().length > 0
const hasProviderOffers = (p) =>
  Boolean(p && (nonEmptyArray(p.flatrate) || nonEmptyArray(p.rent) || nonEmptyArray(p.buy)))

/**
 * Classify the Film File content that is actually present for one (film, user) view.
 * Pure + null-safe + non-mutating. Returns EVERY registry element spread with an
 * `available` boolean (the example contract shows both available:true and
 * available:false entries). `available` reflects ONLY presence of the input data —
 * it does NOT decide rendering and does NOT change any availability logic elsewhere.
 *
 * Structural surfaces that exist on every loaded Film File (hero facts, cast/credits,
 * static copy) report available:true. Variable surfaces are derived from their input.
 *
 * @param {object} [args]
 * @param {object|null} [args.overlay]    movies_editorial_overlay row ({ ff_take, critic_quotes, daypart_fit, … })
 * @param {object|null} [args.filmRow]    internal movies row (llm_* columns, mood_tags)
 * @param {number|null} [args.matchPct]   engine match % (or null)
 * @param {Array|null}  [args.whyReasons] derived why-for-you cards (or null)
 * @param {Array|null}  [args.friends]    Friends-Loved entries (or null)
 * @param {object|null} [args.twin]       Taste-Twin entry (or null)
 * @param {object|null} [args.providers]  mapped providers ({ flatrate, rent, buy } or null)
 * @param {object|null} [args.userRating] the user's own rating row (or null)
 * @returns {Record<string, { origin, presentation, source, available: boolean }>}
 */
export function classifyFilmFileContent({
  overlay = null,
  filmRow = null,
  matchPct = null,
  whyReasons = null,
  friends = null,
  twin = null,
  providers = null,
  userRating = null,
} = {}) {
  const R = FILM_FILE_SOURCE_REGISTRY
  const withAvail = (key, available) => ({ ...R[key], available: Boolean(available) })

  return {
    // Structural — present on any loaded Film File.
    heroFacts: withAvail('heroFacts', true),
    castAndCredits: withAvail('castAndCredits', true),
    coldStartCopy: withAvail('coldStartCopy', true),
    // Generated overlay surfaces.
    ffTake: withAvail('ffTake', nonEmptyString(overlay?.ff_take?.body)),
    viewerNotes: withAvail('viewerNotes', nonEmptyArray(overlay?.critic_quotes)),
    daypartFit: withAvail('daypartFit', Boolean(overlay?.daypart_fit)),
    moodRadar: withAvail('moodRadar', LLM_KEYS.some(k => Number.isFinite(filmRow?.[k]))),
    // Derived-from-real surfaces.
    matchPercentage: withAvail('matchPercentage', Number.isFinite(matchPct) && matchPct > 0),
    whyForYou: withAvail('whyForYou', nonEmptyArray(whyReasons) || Boolean(filmRow)),
    // Real social / user / provider surfaces.
    friendsLoved: withAvail('friendsLoved', nonEmptyArray(friends)),
    tasteTwinReview: withAvail('tasteTwinReview', Boolean(twin)),
    providers: withAvail('providers', hasProviderOffers(providers)),
    yourTake: withAvail('yourTake', Boolean(userRating)),
  }
}
