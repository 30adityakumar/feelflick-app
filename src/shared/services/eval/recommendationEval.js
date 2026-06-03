// src/shared/services/eval/recommendationEval.js
/**
 * Recommendation TRUST + EVALUATION foundation (Phase F8A).
 *
 * Pure, deterministic, dependency-free metric functions. They take plain
 * records (shaped like `recommendation_impressions` rows or scored film
 * objects) and return numbers — NOT the engine. The engine is deliberately
 * NOT imported here so these metrics can evaluate ANY version of the engine's
 * output without coupling to its internals (which F8B may change). This file
 * defines *what good looks like*; it never tunes scoring.
 *
 * No DB calls. No `@/` imports. Safe to run offline (Vitest + a Node runner).
 *
 * Record shapes (all fields optional / null-safe):
 *   ImpressionRecord — mirrors recommendation_impressions:
 *     { userId, movieId, placement, shownDate (YYYY-MM-DD), skipped, clicked,
 *       markedWatched, addedToWatchlist, pickReasonType, pickReasonLabel,
 *       score, seedMovieId, algorithmVersion }
 *   FilmRecord — a scored candidate / result-set member:
 *     { id, director_name, primary_genre, release_year, original_language }
 *   ReasonRecord — an explanation string + its provenance:
 *     { text, type, seedTitle? }
 *
 * Every metric documents: what it measures, healthy direction, and its
 * limitation. The rubric thresholds live in REASON_RUBRIC below.
 */

// ============================================================================
// CONSTANTS — shared classification sets
// ============================================================================

/** pick_reason_type values that carry no real justification. */
export const GENERIC_REASON_TYPES = new Set(['unknown', 'generic', 'default', 'fallback', null, undefined, ''])

/** Generic explanation phrases — present, but say nothing specific. */
export const GENERIC_REASON_PHRASES = [
  'picked for you',
  'recommended for you',
  'you might like this',
  'you might also like',
  'a pick for your brief',
  'because you might enjoy it',
  'built for your taste', // borderline: keep as weak, not good
]

/**
 * Fabrication patterns an explanation must NEVER contain — claims FeelFlick
 * cannot substantiate (fake social proof, invented critics, streaming claims,
 * "people like you" counts). Matching ANY of these is an automatic FAIL.
 * (Aligns with CLAUDE.md "No fake social proof" + the trust wedge.)
 */
export const FABRICATION_PATTERNS = [
  /\bcritics?\s+(agree|say|love|rave)/i,
  /\beveryone\s+(loves|is talking)/i,
  /\baward[-\s]?winning\b/i,
  /\b(oscar|academy award|golden globe|bafta)\b/i,
  /\b#?1\b\s*(pick|movie|film|choice)?/i,
  /\bbest\s+(movie|film)\s+of\b/i,
  /\b\d+\s*(people|users|viewers|fans)\s+like\s+you/i,
  /\bnow\s+(streaming|on)\s+(netflix|hulu|disney|prime|max|apple)/i,
  /\bmillions?\s+of\s+(viewers|fans|people)/i,
  /\btrending\s+#?\d+/i,
]

/** Explanation-quality verdicts. */
export const REASON_VERDICT = Object.freeze({
  GOOD: 'good',
  WEAK: 'weak',
  GENERIC: 'generic',
  UNSAFE: 'unsafe',
})

/** Rubric thresholds (documented in docs/recommendation-trust-evaluation-f8a.md §6). */
export const REASON_RUBRIC = Object.freeze({
  /** Max words before an explanation reads as a paragraph, not a line. */
  maxWords: 14,
  /** Min words before an explanation is too thin to mean anything. */
  minWords: 2,
})

/** Cold/warm taste tiers by lifetime films logged. */
export const TASTE_TIERS = Object.freeze({
  cold: { min: 0, max: 4 },     // < 5 films — heavy fallback territory
  warming: { min: 5, max: 19 }, // 5–19 — signal forming
  warm: { min: 20, max: Infinity }, // 20+ — taste-deep
})

// ============================================================================
// SMALL HELPERS
// ============================================================================

/** @param {number} n @param {number} d @returns {number} safe ratio 0..1 */
function ratio(n, d) {
  if (!d || d <= 0) return 0
  return n / d
}

/** @param {number} x @returns {number} rounded to 3 decimals */
function round3(x) {
  return Math.round((x + Number.EPSILON) * 1000) / 1000
}

/** @param {any[]} arr @returns {any[]} non-null members */
function compact(arr) {
  return Array.isArray(arr) ? arr.filter((x) => x != null) : []
}

/** @param {FilmRecord} f @returns {number|null} decade bucket (e.g. 1990) */
function decadeOf(f) {
  const y = f?.release_year
  return Number.isFinite(y) ? Math.floor(y / 10) * 10 : null
}

// ============================================================================
// 1. FIT-QUALITY PROXIES (outcome rates) — feedback-loop health
// ============================================================================

/**
 * Outcome rates over a set of impression records. The denominator is total
 * impressions; numerators are the boolean outcome flags.
 *
 * `outcomeCaptureRate` is the most important field today: the fraction of
 * impressions that recorded ANY outcome at all. If this is near zero, every
 * downstream rate is unmeasurable — you cannot tune toward an outcome you do
 * not capture. (See F8A baseline: this is the #1 data gap.)
 *
 * Healthy direction: watchRate/saveRate UP, skipRate DOWN — but ONLY once
 * outcomeCaptureRate is high enough to trust. Limitation: skip is also a
 * deliberate engine signal, so a non-zero skipRate is healthy, not a defect.
 *
 * @param {ImpressionRecord[]} impressions
 * @returns {{ total:number, skipRate:number, clickRate:number, watchRate:number,
 *   saveRate:number, outcomeCaptureRate:number }}
 */
export function outcomeRates(impressions) {
  const rows = compact(impressions)
  const total = rows.length
  let skipped = 0, clicked = 0, watched = 0, saved = 0, anyOutcome = 0
  for (const r of rows) {
    const s = !!r.skipped, c = !!r.clicked, w = !!r.markedWatched, a = !!r.addedToWatchlist
    if (s) skipped++
    if (c) clicked++
    if (w) watched++
    if (a) saved++
    if (s || c || w || a) anyOutcome++
  }
  return {
    total,
    skipRate: round3(ratio(skipped, total)),
    clickRate: round3(ratio(clicked, total)),
    watchRate: round3(ratio(watched, total)),
    saveRate: round3(ratio(saved, total)),
    outcomeCaptureRate: round3(ratio(anyOutcome, total)),
  }
}

// ============================================================================
// 2. REPEATED-PICK FATIGUE (déjà vu) — product trust
// ============================================================================

/**
 * Measure repeated-pick fatigue for a single surface (default: the hero).
 * For each user, order their impressions on that surface by shownDate and look
 * for the same movie reappearing.
 *
 * Returns:
 *  - distinctRatio: distinct movies / total impressions (1.0 = never repeats).
 *  - consecutiveRepeatRate: fraction of adjacent (day N, day N+1) pairs where
 *    the surfaced movie is identical — the literal "I saw this yesterday" feel.
 *  - maxStreak: longest run of the same movie back-to-back for any user.
 *
 * Healthy direction: distinctRatio HIGH, consecutiveRepeatRate LOW, maxStreak
 * small. Limitation: a legitimately re-surfaced strong pick is not always
 * fatigue; pair with skipRate on repeats to disambiguate.
 *
 * @param {ImpressionRecord[]} impressions
 * @param {{ placement?: string }} [opts]
 * @returns {{ surface:string, totalShown:number, distinctMovies:number,
 *   distinctRatio:number, consecutiveRepeatRate:number, maxStreak:number }}
 */
export function repeatedPickFatigue(impressions, opts = {}) {
  const placement = opts.placement ?? 'hero'
  const rows = compact(impressions).filter((r) => r.placement === placement)
  const byUser = new Map()
  for (const r of rows) {
    const key = r.userId ?? '∅'
    if (!byUser.has(key)) byUser.set(key, [])
    byUser.get(key).push(r)
  }

  const allMovies = new Set()
  let totalShown = 0
  let adjacentPairs = 0
  let adjacentRepeats = 0
  let maxStreak = 0

  for (const list of byUser.values()) {
    const seq = [...list].sort((a, b) => String(a.shownDate).localeCompare(String(b.shownDate)))
    let streak = 0
    for (let i = 0; i < seq.length; i++) {
      totalShown++
      allMovies.add(seq[i].movieId)
      if (i > 0) {
        adjacentPairs++
        if (seq[i].movieId === seq[i - 1].movieId) {
          adjacentRepeats++
          streak = streak === 0 ? 2 : streak + 1
        } else {
          streak = 0
        }
        if (streak > maxStreak) maxStreak = streak
      }
    }
  }

  return {
    surface: placement,
    totalShown,
    distinctMovies: allMovies.size,
    distinctRatio: round3(ratio(allMovies.size, totalShown)),
    consecutiveRepeatRate: round3(ratio(adjacentRepeats, adjacentPairs)),
    maxStreak,
  }
}

// ============================================================================
// 3. INTRA-LIST DIVERSITY / ANTI-BUBBLE
// ============================================================================

/**
 * Diversity of a single result set (a carousel row, or one day's picks).
 * Each sub-score is distinct values / total — 1.0 means every film differs on
 * that axis. The composite is their mean.
 *
 * Healthy direction: higher = less clustered. Limitation: a deliberately
 * narrow slot (a director spotlight) SHOULD score low on director diversity —
 * read this per-surface, not as a global target.
 *
 * @param {FilmRecord[]} films
 * @returns {{ n:number, directorDiversity:number, genreDiversity:number,
 *   decadeDiversity:number, composite:number }}
 */
export function intraListDiversity(films) {
  const rows = compact(films)
  const n = rows.length
  if (n === 0) {
    return { n: 0, directorDiversity: 0, genreDiversity: 0, decadeDiversity: 0, composite: 0 }
  }
  const directors = new Set(rows.map((f) => f.director_name).filter(Boolean))
  const genres = new Set(rows.map((f) => f.primary_genre).filter(Boolean))
  const decades = new Set(rows.map(decadeOf).filter((d) => d != null))
  const directorDiversity = round3(ratio(directors.size, n))
  const genreDiversity = round3(ratio(genres.size, n))
  const decadeDiversity = round3(ratio(decades.size, n))
  const composite = round3((directorDiversity + genreDiversity + decadeDiversity) / 3)
  return { n, directorDiversity, genreDiversity, decadeDiversity, composite }
}

/**
 * Language anti-bubble for a result set. The engine claims a language
 * anti-bubble; this measures whether one language dominates.
 *
 * Healthy direction: dominantShare DOWN, distinctLanguages / nonEnglishShare UP
 * (within reason). Limitation: a strong English-only taste is legitimate — this
 * flags a *bubble risk*, not a defect; interpret against the user's own seeds.
 *
 * @param {FilmRecord[]} films
 * @returns {{ n:number, distinctLanguages:number, dominantLanguage:string|null,
 *   dominantShare:number, nonEnglishShare:number }}
 */
export function languageMix(films) {
  const rows = compact(films)
  const n = rows.length
  if (n === 0) {
    return { n: 0, distinctLanguages: 0, dominantLanguage: null, dominantShare: 0, nonEnglishShare: 0 }
  }
  const counts = new Map()
  let nonEnglish = 0
  for (const f of rows) {
    const lang = f.original_language || 'und'
    counts.set(lang, (counts.get(lang) || 0) + 1)
    if (lang !== 'en') nonEnglish++
  }
  let dominantLanguage = null
  let dominantCount = 0
  for (const [lang, c] of counts) {
    if (c > dominantCount) { dominantCount = c; dominantLanguage = lang }
  }
  return {
    n,
    distinctLanguages: counts.size,
    dominantLanguage,
    dominantShare: round3(ratio(dominantCount, n)),
    nonEnglishShare: round3(ratio(nonEnglish, n)),
  }
}

// ============================================================================
// 4. REASON / EXPLANATION COVERAGE
// ============================================================================

/**
 * Coverage of *typed, grounded* explanations across impressions. Measures
 * whether the engine actually attached a real reason (not a generic fallback)
 * and how often it was able to ground in a seed film.
 *
 * Healthy direction: groundedShare UP, genericShare DOWN. Limitation: a typed
 * reason can still be low-quality prose — pair with scoreExplanation (below).
 *
 * @param {ImpressionRecord[]} impressions
 * @returns {{ total:number, groundedShare:number, genericShare:number,
 *   seedShare:number, distinctReasonTypes:number, byType:Record<string,number> }}
 */
export function reasonCoverage(impressions) {
  const rows = compact(impressions)
  const total = rows.length
  const byType = {}
  let grounded = 0, generic = 0, seeded = 0
  for (const r of rows) {
    const t = r.pickReasonType
    byType[t ?? '(null)'] = (byType[t ?? '(null)'] || 0) + 1
    if (GENERIC_REASON_TYPES.has(t)) generic++
    else grounded++
    if (r.seedMovieId != null) seeded++
  }
  return {
    total,
    groundedShare: round3(ratio(grounded, total)),
    genericShare: round3(ratio(generic, total)),
    seedShare: round3(ratio(seeded, total)),
    distinctReasonTypes: Object.keys(byType).length,
    byType,
  }
}

// ============================================================================
// 5. EXPLANATION-QUALITY RUBRIC (programmatic)
// ============================================================================

/**
 * Score a single explanation string against the F8A rubric. This is a
 * heuristic proxy for the human rubric in the doc — it cannot judge true
 * relevance (that needs the user's profile), but it reliably catches the two
 * failure modes that matter most for trust: generic emptiness and unsafe
 * fabrication.
 *
 * Dimensions (each boolean / scored):
 *  - safe:        contains NO fabrication pattern (hard gate — fail ⇒ UNSAFE)
 *  - grounded:    pick_reason_type is a real type (not generic)
 *  - specific:    references a concrete entity (a seed title, a proper noun,
 *                 or a genre/era token) rather than only filler
 *  - brief:       within [minWords, maxWords]
 *  - notGeneric:  not one of the known generic phrases
 *
 * Verdict precedence: UNSAFE > GENERIC > WEAK > GOOD.
 *
 * @param {ReasonRecord} reason
 * @returns {{ verdict:string, score:number, safe:boolean, grounded:boolean,
 *   specific:boolean, brief:boolean, notGeneric:boolean, words:number }}
 */
export function scoreExplanation(reason) {
  const text = (reason?.text ?? '').trim()
  const lower = text.toLowerCase()
  const words = text ? text.split(/\s+/).length : 0

  const safe = !FABRICATION_PATTERNS.some((re) => re.test(text))
  const grounded = !GENERIC_REASON_TYPES.has(reason?.type)
  const notGeneric = text.length > 0 && !GENERIC_REASON_PHRASES.some((p) => lower === p || lower.includes(p))
  const brief = words >= REASON_RUBRIC.minWords && words <= REASON_RUBRIC.maxWords

  // Specific = mentions the seed title, OR a capitalized proper noun beyond the
  // first word, OR a genre/era cue. Cheap proxy for "names something concrete."
  const seedTitle = (reason?.seedTitle ?? '').trim()
  const mentionsSeed = seedTitle.length > 0 && text.includes(seedTitle)
  const properNoun = /\b[A-Z][a-z]+/.test(text.replace(/^\W*\w+\s*/, '')) // skip 1st word
  const genreEraCue = /\b(drama|comedy|thriller|horror|sci-?fi|romance|noir|western|documentary|\d{4}s)\b/i.test(text)
  const specific = !!(mentionsSeed || properNoun || genreEraCue)

  // Composite score (0..1) over the soft dimensions; safety is a hard gate.
  const softHits = [grounded, specific, brief, notGeneric].filter(Boolean).length
  const score = safe ? round3(softHits / 4) : 0

  let verdict
  if (!safe) verdict = REASON_VERDICT.UNSAFE
  else if (!notGeneric || !grounded) verdict = REASON_VERDICT.GENERIC
  else if (!specific || !brief) verdict = REASON_VERDICT.WEAK
  else verdict = REASON_VERDICT.GOOD

  return { verdict, score, safe, grounded, specific, brief, notGeneric, words }
}

/**
 * Aggregate explanation quality over many reasons.
 *
 * @param {ReasonRecord[]} reasons
 * @returns {{ total:number, meanScore:number, unsafeCount:number,
 *   byVerdict:Record<string,number>, unsafeShare:number, goodShare:number }}
 */
export function explanationQuality(reasons) {
  const rows = compact(reasons)
  const total = rows.length
  const byVerdict = { good: 0, weak: 0, generic: 0, unsafe: 0 }
  let scoreSum = 0
  for (const r of rows) {
    const res = scoreExplanation(r)
    byVerdict[res.verdict]++
    scoreSum += res.score
  }
  return {
    total,
    meanScore: round3(ratio(scoreSum, total)),
    unsafeCount: byVerdict.unsafe,
    unsafeShare: round3(ratio(byVerdict.unsafe, total)),
    goodShare: round3(ratio(byVerdict.good, total)),
    byVerdict,
  }
}

// ============================================================================
// 6. COLD vs WARM SEGMENTATION
// ============================================================================

/**
 * Bucket users into taste tiers by lifetime films logged. The cold→warm jump
 * is where trust is won or lost (F0 risk #6); evaluation must always be sliced
 * by tier, never averaged across it.
 *
 * @param {Array<{ userId:string, filmsLogged:number }>} userStats
 * @returns {{ cold:number, warming:number, warm:number, total:number,
 *   tierOf:(n:number)=>string }}
 */
export function coldWarmSegmentation(userStats) {
  const rows = compact(userStats)
  const counts = { cold: 0, warming: 0, warm: 0 }
  for (const u of rows) {
    counts[tierForFilms(u.filmsLogged)]++
  }
  return { ...counts, total: rows.length, tierOf: tierForFilms }
}

/** @param {number} filmsLogged @returns {'cold'|'warming'|'warm'} */
export function tierForFilms(filmsLogged) {
  const n = Number.isFinite(filmsLogged) ? filmsLogged : 0
  if (n <= TASTE_TIERS.cold.max) return 'cold'
  if (n <= TASTE_TIERS.warming.max) return 'warming'
  return 'warm'
}

// ============================================================================
// 7. TOP-LEVEL SUMMARY
// ============================================================================

/**
 * Compose one baseline evaluation report from a dataset. Every input is
 * optional; missing inputs yield null sections (so the harness degrades
 * gracefully when a signal is not yet captured).
 *
 * @param {{
 *   impressions?: ImpressionRecord[],
 *   resultSet?: FilmRecord[],
 *   reasons?: ReasonRecord[],
 *   userStats?: Array<{ userId:string, filmsLogged:number }>,
 *   heroPlacement?: string,
 * }} dataset
 * @returns {object} structured baseline report
 */
export function summarizeEvaluation(dataset = {}) {
  const impressions = dataset.impressions ?? null
  const resultSet = dataset.resultSet ?? null
  const reasons = dataset.reasons ?? null
  const userStats = dataset.userStats ?? null
  return {
    generatedAt: new Date().toISOString(),
    note: 'Fixture-based offline baseline (F8A). Numbers are synthetic unless sourced from a read-only DB export.',
    fitQuality: impressions ? outcomeRates(impressions) : null,
    repeatedPickFatigue: impressions
      ? repeatedPickFatigue(impressions, { placement: dataset.heroPlacement ?? 'hero' })
      : null,
    diversity: resultSet ? intraListDiversity(resultSet) : null,
    languageMix: resultSet ? languageMix(resultSet) : null,
    reasonCoverage: impressions ? reasonCoverage(impressions) : null,
    explanationQuality: reasons ? explanationQuality(reasons) : null,
    coldWarm: userStats
      ? (({ tierOf, ...rest }) => rest)(coldWarmSegmentation(userStats))
      : null,
  }
}
