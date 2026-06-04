// src/shared/services/eval/fixtures.js
/**
 * SYNTHETIC fixtures for the recommendation evaluation harness (F8A).
 *
 * 100% fabricated. No real users, no real impressions, no PII. These exist so
 * the harness + its tests are deterministic and runnable with zero DB access.
 * Shapes mirror the live tables (recommendation_impressions, scored films,
 * reason strings) so the same metric code runs against a read-only DB export
 * later without changes.
 *
 * The data is deliberately crafted to EXERCISE each metric:
 *  - a hero sequence with a back-to-back repeat (déjà vu) for one user,
 *  - a result set that clusters on director/genre/decade,
 *  - reasons spanning all four rubric verdicts (good / weak / generic / unsafe).
 */

/** @type {import('./recommendationEval.js').ImpressionRecord[]} */
export const SAMPLE_IMPRESSIONS = [
  // user A — hero across 4 days; day 3 repeats day 2's pick (déjà vu)
  { userId: 'A', movieId: 101, placement: 'hero', shownDate: '2026-05-01', skipped: false, clicked: true, markedWatched: true, addedToWatchlist: false, pickReasonType: 'seed_similar', pickReasonLabel: 'Because you loved Parasite', score: 240, seedMovieId: 9001, algorithmVersion: '2.17' },
  { userId: 'A', movieId: 102, placement: 'hero', shownDate: '2026-05-02', skipped: true, clicked: false, markedWatched: false, addedToWatchlist: false, pickReasonType: 'fit', pickReasonLabel: 'A prestige drama for you', score: 210, seedMovieId: null, algorithmVersion: '2.17' },
  { userId: 'A', movieId: 102, placement: 'hero', shownDate: '2026-05-03', skipped: true, clicked: false, markedWatched: false, addedToWatchlist: false, pickReasonType: 'fit', pickReasonLabel: 'A prestige drama for you', score: 208, seedMovieId: null, algorithmVersion: '2.17' },
  { userId: 'A', movieId: 103, placement: 'hero', shownDate: '2026-05-04', skipped: false, clicked: false, markedWatched: false, addedToWatchlist: true, pickReasonType: 'mood', pickReasonLabel: 'Matches your taste for melancholic films', score: 225, seedMovieId: null, algorithmVersion: '2.17' },
  // user B — hero, all distinct, one generic fallback (no outcome captured)
  { userId: 'B', movieId: 201, placement: 'hero', shownDate: '2026-05-01', skipped: false, clicked: false, markedWatched: false, addedToWatchlist: false, pickReasonType: 'generic', pickReasonLabel: 'Picked for you', score: 150, seedMovieId: null, algorithmVersion: '2.17' },
  { userId: 'B', movieId: 202, placement: 'hero', shownDate: '2026-05-02', skipped: false, clicked: true, markedWatched: false, addedToWatchlist: false, pickReasonType: 'quality', pickReasonLabel: 'Drama at its best', score: 190, seedMovieId: null, algorithmVersion: '2.17' },
  // row impressions (because_you_loved) — feed reasonCoverage / outcomeRates
  { userId: 'A', movieId: 301, placement: 'because_you_loved', shownDate: '2026-05-04', skipped: false, clicked: false, markedWatched: false, addedToWatchlist: false, pickReasonType: 'seed_similar', pickReasonLabel: 'Because you loved Whiplash', score: 180, seedMovieId: 9002, algorithmVersion: '2.17' },
  { userId: 'A', movieId: 302, placement: 'because_you_loved', shownDate: '2026-05-04', skipped: false, clicked: false, markedWatched: false, addedToWatchlist: false, pickReasonType: 'seed_similar', pickReasonLabel: 'Because you loved Whiplash', score: 176, seedMovieId: 9002, algorithmVersion: '2.17' },
]

/**
 * A single result set (one carousel row) — clustered ON PURPOSE so diversity +
 * language metrics produce sub-1.0 values: 3 of 6 are the same director, 4 of 6
 * are Drama, 4 of 6 are from the 2010s, 5 of 6 are English.
 * @type {import('./recommendationEval.js').FilmRecord[]}
 */
export const SAMPLE_RESULT_SET = [
  { id: 401, director_name: 'Bong Joon-ho', primary_genre: 'Drama', release_year: 2019, original_language: 'ko' },
  { id: 402, director_name: 'Denis Villeneuve', primary_genre: 'Drama', release_year: 2013, original_language: 'en' },
  { id: 403, director_name: 'Denis Villeneuve', primary_genre: 'Sci-Fi', release_year: 2016, original_language: 'en' },
  { id: 404, director_name: 'Denis Villeneuve', primary_genre: 'Drama', release_year: 2015, original_language: 'en' },
  { id: 405, director_name: 'Greta Gerwig', primary_genre: 'Drama', release_year: 2019, original_language: 'en' },
  { id: 406, director_name: 'Hayao Miyazaki', primary_genre: 'Animation', release_year: 2001, original_language: 'en' },
]

/**
 * Reason strings spanning all four rubric verdicts, so the rubric scorer is
 * demonstrably exercised end to end.
 * @type {import('./recommendationEval.js').ReasonRecord[]}
 */
export const SAMPLE_REASONS = [
  { text: 'Because you loved Parasite', type: 'seed_similar', seedTitle: 'Parasite' }, // GOOD
  { text: 'More from Denis Villeneuve', type: 'director', seedTitle: '' },             // GOOD
  { text: 'A prestige drama for you', type: 'fit', seedTitle: '' },                    // GOOD (names a genre cue)
  { text: 'Close to your taste profile', type: 'embedding_similarity', seedTitle: '' },// WEAK (typed + safe, but names nothing concrete)
  { text: 'Picked for you', type: 'generic', seedTitle: '' },                          // GENERIC
  { text: 'Recommended for you', type: 'unknown', seedTitle: '' },                     // GENERIC
  { text: 'Critics agree this is the best film of the year', type: 'quality', seedTitle: '' }, // UNSAFE (fabricated social proof)
  { text: 'Award-winning and now streaming on Netflix', type: 'trending', seedTitle: '' },     // UNSAFE
]

/**
 * Synthetic per-user taste depth, spanning all three tiers.
 * @type {Array<{ userId:string, filmsLogged:number }>}
 */
export const SAMPLE_USER_STATS = [
  { userId: 'A', filmsLogged: 64 },  // warm
  { userId: 'B', filmsLogged: 12 },  // warming
  { userId: 'C', filmsLogged: 2 },   // cold
  { userId: 'D', filmsLogged: 0 },   // cold
]

/** Everything bundled for the runner's summarizeEvaluation call. */
export const SAMPLE_DATASET = {
  impressions: SAMPLE_IMPRESSIONS,
  resultSet: SAMPLE_RESULT_SET,
  reasons: SAMPLE_REASONS,
  userStats: SAMPLE_USER_STATS,
  heroPlacement: 'hero',
}
