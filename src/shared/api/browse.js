// src/shared/api/browse.js
// Supabase-powered browse for filter mode (not text search — that stays on TMDB).

import { supabase } from '@/shared/lib/supabase/client'

/**
 * Fetch the calling user's "taste twins" — other users above an overall
 * similarity threshold — and return the union of films they've rated highly.
 * Used by /browse's "Twins loved" toggle to filter the catalog to films
 * the user's taste-twins consistently scored well.
 *
 * Returns an array of internal movies.id integers (possibly empty).
 *
 * Performance: two round-trips. First gets ≤20 twins, second pulls all
 * their high-rated films in one IN query. Could be cached client-side per
 * session in a future pass — twin set changes slowly.
 *
 * @param {string} userId — calling user's auth UUID
 * @param {object} [opts]
 * @param {number} [opts.similarityFloor=0.5]  exclude twins below this
 * @param {number} [opts.ratingFloor=8]        only count ratings ≥ this (1-10)
 * @param {number} [opts.maxTwins=20]
 * @returns {Promise<number[]>}
 */
export async function fetchTwinsLovedMovieIds(userId, {
  similarityFloor = 0.5,
  ratingFloor = 8,
  maxTwins = 20,
} = {}) {
  if (!userId) return []
  const { data: twins, error: twinErr } = await supabase
    .from('user_similarity')
    .select('user_b_id, overall_similarity')
    .eq('user_a_id', userId)
    .gte('overall_similarity', similarityFloor)
    .order('overall_similarity', { ascending: false })
    .limit(maxTwins)
  if (twinErr || !twins?.length) return []

  const twinIds = twins.map(t => t.user_b_id).filter(Boolean)
  if (twinIds.length === 0) return []

  const { data: ratings, error: rateErr } = await supabase
    .from('user_ratings')
    .select('movie_id')
    .in('user_id', twinIds)
    .gte('rating', ratingFloor)
    .not('movie_id', 'is', null)
  if (rateErr || !ratings?.length) return []

  // Dedupe — many twins may have rated the same film.
  const set = new Set()
  for (const r of ratings) if (r.movie_id != null) set.add(r.movie_id)
  return Array.from(set)
}

/**
 * Read the user's chosen subscription/streaming-provider preferences from
 * user_settings.settings.prefs.subscriptions. Returns the array of provider
 * keys the user has marked as "I have this" (truthy values in the JSON).
 * Returns [] when the user hasn't configured any.
 *
 * @param {string} userId
 * @returns {Promise<string[]>}
 */
export async function fetchUserSubscriptions(userId) {
  if (!userId) return []
  const { data } = await supabase
    .from('user_settings')
    .select('settings')
    .eq('user_id', userId)
    .maybeSingle()
  const subs = data?.settings?.prefs?.subscriptions
  if (!subs || typeof subs !== 'object') return []
  return Object.keys(subs).filter(k => subs[k])
}

// 18 = a clean 6×3 grid at wide desktop (the locked Browse page rhythm). This is
// the Supabase catalogue page size; TMDB text-search mode keeps TMDB's own native
// page boundaries (≈20) — see Browse.jsx — so results are never silently dropped.
export const PAGE_SIZE = 18

// Mood-pill labels surfaced on /browse map to one or more underlying
// `mood_tags` strings (Supabase ARRAY column). The mapping is opinionated —
// "Slow-burn" and "Cerebral" aren't single mood tags, so we combine the
// best mood-tag proxies. Returns null when nothing maps.
// Keys here MUST match the `id` field in data.js MOODS so the URL param
// value lines up — that's why "slow" (not "slow-burn") is the key.
const MOOD_PILL_TO_TAGS = {
  tense:      ['tense', 'suspenseful'],
  slow:       ['meditative', 'somber'],
  tender:     ['tender', 'heartwarming'],
  cerebral:   ['mysterious', 'cerebral'],
  cozy:       ['heartwarming', 'lighthearted', 'whimsical'],
  melancholy: ['melancholic', 'bittersweet'],
}
export function moodPillToTags(pill) {
  if (!pill || pill === 'all') return null
  return MOOD_PILL_TO_TAGS[pill] || null
}

/**
 * TMDB genre name → TMDB genre ID mapping (stable, matches our imported data).
 * Used to convert genre filter to TMDB discover `with_genres` param in search mode.
 */
export const TMDB_GENRE_IDS = {
  Action: 28, Adventure: 12, Animation: 16, Comedy: 35, Crime: 80,
  Documentary: 99, Drama: 18, Family: 10751, Fantasy: 14, History: 36,
  Horror: 27, Music: 10402, Mystery: 9648, Romance: 10749,
  'Science Fiction': 878, Thriller: 53, War: 10752, Western: 37,
  // Browse's genre filter value for science fiction is the shorthand "Sci-Fi"
  // (matches the DB primary_genre column). Alias it so a Sci-Fi genre is genuinely
  // applied in TMDB text-search mode too — otherwise the active genre chip would
  // read as applied while being silently dropped from the TMDB query.
  'Sci-Fi': 878,
}

const SELECT_FIELDS = [
  'id', 'tmdb_id', 'title', 'poster_path', 'backdrop_path',
  'release_date', 'release_year', 'vote_average', 'vote_count',
  'ff_final_rating', 'ff_confidence', 'original_language', 'runtime',
  'primary_genre', 'genres', 'overview',
  'pacing_score', 'intensity_score', 'emotional_depth_score',
  'cult_status_score', 'discovery_potential', 'accessibility_score', 'vfx_level_score',
  'director_name', 'dialogue_density', 'attention_demand',
  'ff_critic_rating', 'ff_critic_confidence',
  'ff_audience_rating', 'ff_audience_confidence',
  'ff_rating_genre_normalized', 'ff_critic_audience_gap',
  'mood_tags',
].join(', ')

/**
 * Runtime bucket → SQL range
 */
function runtimeRange(value) {
  switch (value) {
    case 'short':  return { lt: 90 }
    case 'medium': return { gte: 90, lte: 130 }
    case 'long':   return { gt: 130, lte: 180 }
    case 'epic':   return { gt: 180 }
    default:       return null
  }
}

/**
 * Decade → release_year range
 */
function decadeToYearRange(decade) {
  if (!decade) return null
  if (decade === 'pre1970') return { lte: 1969 }
  const start = Number(decade)
  if (!Number.isFinite(start)) return null
  return { gte: start, lte: start + 9 }
}

/**
 * Sort param → Supabase column + ascending
 */
function sortToOrder(sortBy) {
  switch (sortBy) {
    case 'ff_rating.desc':            return { column: 'ff_audience_rating', ascending: false }
    case 'vote_average.desc':         return { column: 'vote_average', ascending: false }
    case 'vote_count.desc':           return { column: 'vote_count', ascending: false }
    case 'release_date.desc':         return { column: 'release_year', ascending: false }
    case 'release_date.asc':          return { column: 'release_year', ascending: true }
    case 'discovery_potential.desc':  return { column: 'discovery_potential', ascending: false }
    // Critics sort ORDERS the user's chosen territory by critic rating; it does
    // NOT narrow it. Films with no/low critic evidence simply sort last (the
    // browseMovies .order uses nullsFirst:false). Critic CONFIDENCE only gates the
    // visible critic badge/evidence on the card, never the result set — so genre /
    // era / language / runtime scope and the result count stay honest.
    case 'ff_critic_rating.desc':     return { column: 'ff_critic_rating', ascending: false }
    case 'cult_status_score.desc':    return { column: 'cult_status_score', ascending: false }
    case 'accessibility_score.desc':  return { column: 'accessibility_score', ascending: false }
    case 'popularity.desc':
    default:                          return { column: 'popularity', ascending: false }
  }
}

/**
 * Browse movies from Supabase with full FeelFlick filter support.
 *
 * @param {object} opts
 * @param {number}  opts.page
 * @param {string}  opts.genre       primary_genre name (e.g. "Thriller")
 * @param {string}  opts.sortBy      sort key
 * @param {string}  opts.decade      e.g. "2010" or "pre1970"
 * @param {string}  opts.lang        ISO 639-1 code
 * @param {string}  opts.rating      minimum ff_final_rating (e.g. "7.5")
 * @param {string}  opts.runtime     "short"|"medium"|"long"|"epic"
 * @param {string}  opts.pacing      "slow"|"fast"
 * @param {string}  opts.intensity   "chill"|"intense"
 * @param {string}  opts.depth       "surface"|"deep"
 * @param {string[]} opts.vibe       array: ["cult","hidden","accessible","spectacle"]
 * @param {string}  opts.director    partial director name (case-insensitive)
 * @param {boolean} opts.hideWatched exclude movies the user has watched
 * @param {number[]} opts.watchedIds movie IDs to exclude when hideWatched is true
 * @param {string}  opts.dialogue    "heavy"|"light"
 * @param {string}  opts.attention   "low"|"high"
 * @param {number}  opts.minCritic   minimum ff_critic_rating (0 = off)
 * @param {number}  opts.minAudience minimum ff_audience_rating (0 = off)
 * @param {string}  opts.criticAudienceGap ""|"critic_picks"|"crowd_pleasers"
 * @param {boolean} opts.exceptionalGenre  filter to ff_rating_genre_normalized >= 8.5
 * @param {string}  opts.mood        Browse mood pill id: 'tense' | 'slow' | 'tender' | 'cerebral' | 'cozy' | 'melancholy'
 * @param {number[]|null} opts.restrictToIds  When non-null, hard-filter to
 *   only this set of movies.id values. Used by /browse's "Twins loved"
 *   toggle (caller resolves the twin set via fetchTwinsLovedMovieIds and
 *   passes it through). Empty array means "no matches", null means "no filter".
 * @returns {{ movies: object[], totalCount: number, totalPages: number }}
 */
export async function browseMovies({
  page = 1,
  genre = '',
  sortBy = 'popularity.desc',
  decade = '',
  lang = '',
  rating = '',
  runtime = '',
  pacing = '',
  intensity = '',
  depth = '',
  vibe = [],
  director = '',
  hideWatched = false,
  watchedIds = [],
  dialogue = '',
  attention = '',
  minCritic = 0,
  minAudience = 0,
  criticAudienceGap = '',
  exceptionalGenre = false,
  mood = '',
  restrictToIds = null,
} = {}) {
  // Shortcut: empty restrict list means "show nothing." Avoids building the
  // query just to return zero rows.
  if (Array.isArray(restrictToIds) && restrictToIds.length === 0) {
    return { movies: [], totalCount: 0, totalPages: 1 }
  }
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  let q = supabase
    .from('movies')
    .select(SELECT_FIELDS, { count: 'exact' })
    .eq('is_valid', true)
    .not('poster_path', 'is', null)

  // ── Genre ──────────────────────────────────────────────────────────────────
  if (genre) {
    q = q.eq('primary_genre', genre)
  }

  // ── Language ───────────────────────────────────────────────────────────────
  if (lang) {
    q = q.eq('original_language', lang)
  }

  // ── Decade / Year ──────────────────────────────────────────────────────────
  const yearRange = decadeToYearRange(decade)
  if (yearRange) {
    if (yearRange.gte !== undefined) q = q.gte('release_year', yearRange.gte)
    if (yearRange.lte !== undefined) q = q.lte('release_year', yearRange.lte)
  }

  // ── Quality / Rating ───────────────────────────────────────────────────────
  if (rating) {
    // rating param is on 0-10 scale from URL; convert to 0-100 for ff_audience_rating
    q = q.gte('ff_audience_rating', Math.round(Number(rating) * 10))
  }

  // ── Runtime ────────────────────────────────────────────────────────────────
  const rt = runtimeRange(runtime)
  if (rt) {
    if (rt.lt  !== undefined) q = q.lt('runtime', rt.lt)
    if (rt.lte !== undefined) q = q.lte('runtime', rt.lte)
    if (rt.gte !== undefined) q = q.gte('runtime', rt.gte)
    if (rt.gt  !== undefined) q = q.gt('runtime', rt.gt)
    // Only include movies where runtime is not null
    q = q.not('runtime', 'is', null).gt('runtime', 0)
  }

  // ── Pacing ─────────────────────────────────────────────────────────────────
  if (pacing === 'slow') {
    q = q.lte('pacing_score', 4).not('pacing_score', 'is', null)
  } else if (pacing === 'fast') {
    q = q.gte('pacing_score', 7).not('pacing_score', 'is', null)
  }

  // ── Intensity ──────────────────────────────────────────────────────────────
  if (intensity === 'chill') {
    q = q.lte('intensity_score', 4).not('intensity_score', 'is', null)
  } else if (intensity === 'intense') {
    q = q.gte('intensity_score', 7).not('intensity_score', 'is', null)
  }

  // ── Depth ──────────────────────────────────────────────────────────────────
  if (depth === 'surface') {
    q = q.lte('emotional_depth_score', 4).not('emotional_depth_score', 'is', null)
  } else if (depth === 'deep') {
    q = q.gte('emotional_depth_score', 7).not('emotional_depth_score', 'is', null)
  }

  // ── Vibe (multi-select) ────────────────────────────────────────────────────
  const vibeArr = Array.isArray(vibe) ? vibe : []
  if (vibeArr.includes('cult'))       q = q.gte('cult_status_score', 60)
  if (vibeArr.includes('hidden'))     q = q.gte('discovery_potential', 70)
  if (vibeArr.includes('accessible')) q = q.gte('accessibility_score', 65)
  if (vibeArr.includes('spectacle'))  q = q.gte('vfx_level_score', 65)

  // ── Director ───────────────────────────────────────────────────────────────
  if (director) {
    q = q.ilike('director_name', `%${director}%`)
  }

  // ── Hide Watched ────────────────────────────────────────────────────────────
  if (hideWatched && watchedIds?.length > 0) {
    q = q.not('id', 'in', `(${watchedIds.join(',')})`)
  }

  // ── Dialogue ────────────────────────────────────────────────────────────────
  if (dialogue === 'heavy') {
    q = q.gte('dialogue_density', 65).not('dialogue_density', 'is', null)
  } else if (dialogue === 'light') {
    q = q.lte('dialogue_density', 35).not('dialogue_density', 'is', null)
  }

  // ── Attention ───────────────────────────────────────────────────────────────
  if (attention === 'low') {
    q = q.lte('attention_demand', 35).not('attention_demand', 'is', null)
  } else if (attention === 'high') {
    q = q.gte('attention_demand', 65).not('attention_demand', 'is', null)
  }

  // ── Critic floor ────────────────────────────────────────────────────────────
  if (minCritic > 0) {
    q = q.gte('ff_critic_rating', minCritic).gte('ff_critic_confidence', 60)
  }

  // ── Audience floor ─────────────────────────────────────────────────────────
  if (minAudience > 0) {
    q = q.gte('ff_audience_rating', minAudience).gte('ff_audience_confidence', 60)
  }

  // ── Critic/audience gap ────────────────────────────────────────────────────
  if (criticAudienceGap === 'critic_picks') {
    q = q
      .gte('ff_critic_audience_gap', 15)
      .gte('ff_critic_confidence', 60)
      .gte('ff_audience_confidence', 60)
  } else if (criticAudienceGap === 'crowd_pleasers') {
    q = q
      .lte('ff_critic_audience_gap', -15)
      .gte('ff_critic_confidence', 60)
      .gte('ff_audience_confidence', 60)
  }

  // ── Exceptional for genre ──────────────────────────────────────────────────
  // ASSUMPTION: threshold 8.0 instead of 8.5 — current data tops out at 8.4
  if (exceptionalGenre) {
    q = q.gte('ff_rating_genre_normalized', 8.0)
  }

  // ── Mood pill → mood_tags array contains ──────────────────────────────────
  // Browse mood pills are a curated front-end taxonomy; each maps to one or
  // more raw mood_tags values. Use `overlaps` so the row matches if its
  // mood_tags array intersects the requested tags (any-of, not all-of).
  const moodTags = moodPillToTags(mood)
  if (moodTags && moodTags.length > 0) {
    q = q.overlaps('mood_tags', moodTags)
  }

  // ── Restrict to a specific movie id set (Twins loved filter) ──────────────
  // Caller passes a deduped int[] of movie ids; we constrain the query so
  // ranking + pagination operate on this subset only.
  if (Array.isArray(restrictToIds) && restrictToIds.length > 0) {
    q = q.in('id', restrictToIds)
  }

  // ── Sort & Pagination ──────────────────────────────────────────────────────
  const { column, ascending } = sortToOrder(sortBy)
  q = q
    .order(column, { ascending, nullsFirst: false })
    .range(from, to)

  const { data, count, error } = await q

  if (error) throw error

  const totalCount = count ?? 0
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))

  return { movies: data ?? [], totalCount, totalPages }
}

/**
 * Lightweight "does this territory have enough films, and what does it look like?"
 * probe for the /browse "Start somewhere" curiosity paths. Applies ONLY the
 * scope filters a path can set (genre / language / decade / runtime / director),
 * so the returned count is the honest size of the territory the path opens, and
 * the posters are real catalogue artwork from inside it.
 *
 * Cheap by design: selects 3 columns, count: 'exact', limit a handful. Callers
 * (useCuriosityPaths) run these once per user, batched + cached — never per render.
 *
 * @param {object} opts  { genre, lang, decade, runtime, director, limit }
 * @returns {Promise<{ count: number, posters: string[] }>}
 */
export async function peekTerritory({ genre = '', lang = '', decade = '', runtime = '', director = '', limit = 5 } = {}) {
  let q = supabase
    .from('movies')
    .select('id, poster_path, title', { count: 'exact' })
    .eq('is_valid', true)
    .not('poster_path', 'is', null)

  if (genre) q = q.eq('primary_genre', genre)
  if (lang) q = q.eq('original_language', lang)
  const yearRange = decadeToYearRange(decade)
  if (yearRange) {
    if (yearRange.gte !== undefined) q = q.gte('release_year', yearRange.gte)
    if (yearRange.lte !== undefined) q = q.lte('release_year', yearRange.lte)
  }
  const rt = runtimeRange(runtime)
  if (rt) {
    if (rt.lt !== undefined) q = q.lt('runtime', rt.lt)
    if (rt.lte !== undefined) q = q.lte('runtime', rt.lte)
    if (rt.gte !== undefined) q = q.gte('runtime', rt.gte)
    if (rt.gt !== undefined) q = q.gt('runtime', rt.gt)
    q = q.not('runtime', 'is', null).gt('runtime', 0)
  }
  if (director) q = q.ilike('director_name', `%${director}%`)

  // Highest FeelFlick-rated first → representative, not random, artwork.
  const { data, count, error } = await q
    .order('ff_audience_rating', { ascending: false, nullsFirst: false })
    .range(0, Math.max(0, limit - 1))
  if (error) throw error
  return {
    count: count ?? 0,
    posters: (data ?? []).map(r => r.poster_path).filter(Boolean),
  }
}

/**
 * Fetch unique primary_genre values from our DB for the genre filter.
 * Replaces the TMDB getGenres() call in browse mode.
 */
export async function getDbGenres() {
  const { data, error } = await supabase
    .from('movies')
    .select('primary_genre')
    .eq('is_valid', true)
    .not('primary_genre', 'is', null)
    .not('primary_genre', 'eq', 'TV Movie')

  if (error) throw error

  const counts = {}
  for (const row of data ?? []) {
    counts[row.primary_genre] = (counts[row.primary_genre] || 0) + 1
  }

  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([name]) => ({ name }))
}
