// Personal-list builder for the /home "For you" row.
//
// Generates up to 4 dynamically-personalized list cards from the user's
// taste profile + fingerprint. Each slot is independent: if a signal is
// missing (no director affinity, no 4-star rating, etc.) the slot is
// skipped and we return whatever filled.
//
// Caller (useHomeData) falls back to the static CURATED_LISTS row when
// this function returns fewer than `MIN_PERSONAL_LISTS` results.
//
// Public shape (matches the CuratedLists data contract — same ListCard
// renders both):
//   {
//     id, slug,                  // unique per user/slot
//     title, blurb,              // dynamic, user-specific copy
//     palette,                   // [c1, c2] from paletteForSlug
//     posters,                   // string[] of TMDB poster_path
//     kind,                      // 'director' | 'similar' | 'genre' | 'decade'
//     meta,                      // routing payload for /lists/personal/:type
//   }

import { GENRES } from '@/features/onboarding/data'
import { MOVIE_ENGINE_COLS } from '@/shared/services/movieFields'
import { rankSlotCandidates, scoreMovieForUser } from '@/shared/services/recommendations'
import { applyAllExclusions, applyExclusionsNoLanguage } from '@/shared/services/exclusions'

export const MIN_PERSONAL_LISTS = 1

// Recency floor — pre-1990 films stay hidden unless the user has shown
// they tolerate classics (i.e. they've logged at least one pre-1990 film).
// Mirrors the briefing's `RECENCY_FLOOR_YEAR = 1990` constant. Skipping
// this lets Citizen Kane / Casablanca / etc. surface in personal lists
// even when the user doesn't watch pre-1990 cinema.
const RECENCY_FLOOR = 1990
function recencyFloor(profile) {
  // V2 profile signal — flips false when user has zero pre-1990 watches.
  if (profile?.preferences?.toleratesClassics === false) return RECENCY_FLOOR
  return null
}

// Candidate pool size per slot. We pre-narrow this many rows server-side
// (SQL-cheap), then hand them to rankSlotCandidates() which runs the full
// engine pipeline — embedding boosts, slot boosts, diversity, impression
// logging. 80 keeps the in-JS scoring cost bounded (~80 × 5 slots = 400
// scoreMovieForUser calls, all pure compute).
const POOL_SIZE = 80

// PostgREST .not('id', 'in', '(...)') errors when the array is empty.
// Always guard with this helper before adding the filter.
function applyExcludeIds(query, ids) {
  if (!ids || ids.length === 0) return query
  return query.not('id', 'in', `(${ids.join(',')})`)
}

function slugify(str) {
  return String(str || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// === Slot 1: top director affinity ====================================
// Within the director's filmography, ranked by the full engine pipeline
// (rowType 'favorite_genres' — the closest match for "narrow + rank"
// intent). Each candidate gets scoreMovieForUser with embedding-aware
// dimensions firing, plus the row diversity filter so we don't surface
// 4 films by the same DP/writer pair. A Darabont fan whose taste skews
// dark sees "The Mist" surfaced over "The Majestic," even if Majestic
// rates higher on average.
async function buildDirectorSlot({ supabase, userId, profile, watchedIds, paletteForSlug }) {
  const topDirector = profile?.affinities?.directors?.[0]
  if (!topDirector?.name || topDirector.name === 'Unknown') return null

  let q = supabase
    .from('movies')
    .select(MOVIE_ENGINE_COLS)
    .ilike('director_name', topDirector.name)
    .eq('is_valid', true)
    .not('poster_path', 'is', null)
    .order('ff_audience_rating', { ascending: false, nullsFirst: false })
    .limit(POOL_SIZE)
  q = applyAllExclusions(q, profile)
  const floor = recencyFloor(profile)
  if (floor != null) q = q.gte('release_year', floor)
  q = applyExcludeIds(q, watchedIds)

  const { data, error } = await q
  if (error || !data || data.length === 0) return null

  const ranked = await rankSlotCandidates({
    userId,
    profile,
    candidates: data,
    rowType: 'favorite_genres',
    placement: 'director_spotlight',
    limit: 4,
    diversity: false,  // whole row is by-design same director — don't cap at 3
    boost: { director: topDirector.name, directorAmount: 15 },
    pickReasonFor: (m) => ({
      label: `${topDirector.name} · ${m.primary_genre || 'Film'}`,
      type: 'personal_director',
    }),
  })
  const posters = ranked.map(r => r.poster_path).filter(Boolean)
  if (posters.length === 0) return null

  const slug = `personal-director-${slugify(topDirector.name)}`
  return {
    id: slug,
    slug,
    title: `More from ${topDirector.name}`,
    blurb: `Films by ${topDirector.name} you haven’t seen.`,
    palette: paletteForSlug(slug),
    posters,
    kind: 'director',
    meta: { directorName: topDirector.name },
  }
}

// === Slot 2: semantic neighbors of a beloved film, engine-reranked ====
// Two-stage: (1) get_seed_neighbors gives us 30 embedding-similar films,
// (2) rankSlotCandidates runs the full engine pipeline over them — same
// scoreMovieForUser dimensions + embedding boost on top + diversity cap +
// impression logging. The first stage answers "what's similar to this
// film?", the second answers "of those, what does THIS user love?".
//
// Note: user_ratings.rating is a 0–10 scale (matches ff_rating). 8+ is
// the "this is a favorite" threshold (~4 stars on a 5-star UI).
async function buildSimilarSlot({ supabase, userId, profile, watchedIds, paletteForSlug }) {
  const { data: topRated } = await supabase
    .from('user_ratings')
    .select('movie_id, movies!inner(id, title, poster_path)')
    .eq('user_id', userId)
    .gte('rating', 8)
    .order('rated_at', { ascending: false })
    .limit(1)

  const seed = topRated?.[0]
  if (!seed?.movie_id || !seed?.movies?.title) return null

  // Stage 1: 30 embedding-similar candidates (we overshoot then engine-rank).
  const { data: neighbors, error: rpcError } = await supabase.rpc('get_seed_neighbors', {
    seed_ids: [seed.movie_id],
    exclude_ids: watchedIds && watchedIds.length > 0 ? watchedIds : [seed.movie_id],
    top_n: 30,
    min_ff_rating: 70,
  })
  if (rpcError || !neighbors || neighbors.length === 0) return null

  const ids = neighbors.map(n => n.id).filter(Boolean)
  if (ids.length === 0) return null

  // Stage 2: fetch full engine fields. Intentionally bypass the language
  // filter (applyExclusionsNoLanguage) — embedding neighbors are how the
  // engine expands taste across language; the language guard would defeat
  // the purpose of this row. Other exclusions still apply.
  let pool = supabase
    .from('movies')
    .select(MOVIE_ENGINE_COLS)
    .in('id', ids)
  pool = applyExclusionsNoLanguage(pool, profile)
  const { data: rows } = await pool
  if (!rows || rows.length === 0) return null

  // Attach the embedding similarity from the RPC onto each row so the
  // engine helper picks it up and applies the full embedding boost curve.
  const simById = Object.fromEntries(neighbors.map(n => [n.id, n.similarity]))
  const floor = recencyFloor(profile)
  const enriched = rows
    .filter(m => floor == null || (m.release_year ?? 9999) >= floor)
    .map(m => ({
      ...m,
      _embeddingSimilarity: simById[m.id] ?? null,
      _matchedSeedId: seed.movie_id,
      _matchedSeedTitle: seed.movies.title,
    }))
  if (enriched.length === 0) return null

  const ranked = await rankSlotCandidates({
    userId,
    profile,
    candidates: enriched,
    rowType: 'favorite_genres',
    placement: 'because_you_loved',
    limit: 4,
    pickReasonFor: (m, { embeddingReason }) => ({
      label: `Similar to ${embeddingReason?.seedTitle || seed.movies.title}`,
      type: 'personal_similar',
      seedTitle: embeddingReason?.seedTitle || seed.movies.title,
      seedId: seed.movie_id,
    }),
  })
  const posters = ranked.map(r => r.poster_path).filter(Boolean)
  if (posters.length === 0) return null

  const slug = `personal-similar-${seed.movie_id}`
  return {
    id: slug,
    slug,
    title: `Because you loved ${seed.movies.title}`,
    blurb: `Films that share ${seed.movies.title}’s DNA — ranked for you.`,
    palette: paletteForSlug(slug),
    posters,
    kind: 'similar',
    meta: { seedId: seed.movie_id, seedTitle: seed.movies.title },
  }
}

// === Slot 3: top preferred genre, engine-ranked =======================
// Pre-narrows to the user's top genre (≥60 ff_audience_confidence so we
// don't surface obscure films), then the engine ranks against the user's
// tone / mood / pacing / fit-profile signals with a +20 primary-genre
// boost. Result: a Drama lover who skews earnest sees earnest dramas,
// not the 5 highest-rated dramas globally.
async function buildGenreSlot({ supabase, userId, profile, watchedIds, paletteForSlug }) {
  const topGenreId = profile?.genres?.preferred?.[0]
  if (!topGenreId) return null
  const genre = GENRES.find(g => g.id === topGenreId)
  if (!genre) return null

  let q = supabase
    .from('movies')
    .select(MOVIE_ENGINE_COLS)
    .eq('primary_genre', genre.dbName)
    .gte('ff_audience_confidence', 60)
    .eq('is_valid', true)
    .not('poster_path', 'is', null)
    .order('ff_audience_rating', { ascending: false })
    .limit(POOL_SIZE)
  q = applyAllExclusions(q, profile)
  const gfloor = recencyFloor(profile)
  if (gfloor != null) q = q.gte('release_year', gfloor)
  q = applyExcludeIds(q, watchedIds)

  const { data, error } = await q
  if (error || !data || data.length === 0) return null

  const ranked = await rankSlotCandidates({
    userId,
    profile,
    candidates: data,
    rowType: 'favorite_genres',
    placement: 'favorite_genres',
    limit: 4,
    diversity: false,  // whole row is by-design same genre — don't cap at 5
    boost: { primaryGenre: genre.dbName, primaryGenreAmount: 20 },
    pickReasonFor: () => ({
      label: `Because you love ${genre.name}`,
      type: 'personal_genre',
    }),
  })
  const posters = ranked.map(r => r.poster_path).filter(Boolean)
  if (posters.length === 0) return null

  const slug = `personal-genre-${slugify(genre.dbName)}`
  return {
    id: slug,
    slug,
    title: `Your ${genre.name} corner`,
    blurb: `${genre.name} that fits your taste.`,
    palette: paletteForSlug(slug),
    posters,
    kind: 'genre',
    meta: { genreId: genre.id, dbName: genre.dbName, displayName: genre.name },
  }
}

// === Slot: top fit_profile, engine-ranked =============================
// `fit_profile` is the engine's "what kind of film is this?" classifier —
// crowd_pleaser, prestige_drama, challenging_art, comfort_watch, etc.
// The fingerprint reports the user's share of each. We pull the top one
// and surface a list of films in that fit category, engine-ranked for
// the user's full taste signature.
//
// Decade (release_year buckets) is intentionally NOT a slot here — it's
// a calendar artifact, not a taste signal.
export const FIT_PROFILE_LABELS = {
  crowd_pleaser:      { slug: 'crowd-pleaser',     label: 'crowd-pleaser',     title: 'Crowd-pleaser' },
  prestige_drama:     { slug: 'prestige-drama',    label: 'prestige drama',    title: 'Prestige drama' },
  challenging_art:    { slug: 'challenging-art',   label: 'challenging art',   title: 'Challenging art' },
  festival_discovery: { slug: 'festival',          label: 'festival',          title: 'Festival' },
  cult_classic:       { slug: 'cult-classic',      label: 'cult classic',      title: 'Cult classic' },
  comfort_watch:      { slug: 'comfort-watch',     label: 'comfort watch',     title: 'Comfort watch' },
  franchise_entry:    { slug: 'franchise',         label: 'franchise',         title: 'Franchise' },
  genre_popcorn:      { slug: 'genre-popcorn',     label: 'genre popcorn',     title: 'Genre popcorn' },
}

async function buildFitProfileSlot({ supabase, userId, profile, fingerprint, watchedIds, paletteForSlug }) {
  const topFit = fingerprint?.topFitProfiles?.[0]?.key
  if (!topFit) return null
  const fitMeta = FIT_PROFILE_LABELS[topFit]
  if (!fitMeta) return null

  let q = supabase
    .from('movies')
    .select(MOVIE_ENGINE_COLS)
    .eq('fit_profile', topFit)
    .gte('ff_audience_confidence', 60)
    .eq('is_valid', true)
    .not('poster_path', 'is', null)
    .order('ff_audience_rating', { ascending: false })
    .limit(POOL_SIZE)
  q = applyAllExclusions(q, profile)
  const ffloor = recencyFloor(profile)
  if (ffloor != null) q = q.gte('release_year', ffloor)
  q = applyExcludeIds(q, watchedIds)

  const { data, error } = await q
  if (error || !data || data.length === 0) return null

  const ranked = await rankSlotCandidates({
    userId,
    profile,
    candidates: data,
    rowType: 'favorite_genres',
    // TODO migrate placement enum: add 'fit_profile_match' so this row's
    // telemetry separates from the generic genre row. For now we lump
    // it under favorite_genres (semantically the closest existing bucket
    // — a fit_profile filter IS a flavor of genre-based recommendation).
    placement: 'favorite_genres',
    limit: 4,
    // Fit profile narrows hard on one dimension (e.g. crowd_pleaser) and
    // the resulting pool often clusters in a few genres; the genre-cap-5
    // would still bite for less-spread fit profiles. Skip the filter.
    diversity: false,
    boost: { fitProfile: topFit, fitProfileAmount: 15 },
    pickReasonFor: () => ({
      label: `Matches your ${fitMeta.label} taste`,
      type: 'personal_fit',
    }),
  })
  const posters = ranked.map(r => r.poster_path).filter(Boolean)
  if (posters.length === 0) return null

  const slug = `personal-fit-${fitMeta.slug}`
  return {
    id: slug,
    slug,
    title: `Your ${fitMeta.label} corner`,
    blurb: `${fitMeta.title} films ranked for your taste.`,
    palette: paletteForSlug(slug),
    posters,
    kind: 'fit',
    meta: { fitKey: topFit, label: fitMeta.label, title: fitMeta.title },
  }
}

// === Slot: top actor affinity, engine-ranked ==========================
// profile.affinities.actors carries weighted counts. We pull the #1
// actor and surface their films, engine-ranked for the user.
async function buildActorSlot({ supabase, userId, profile, watchedIds, paletteForSlug }) {
  const topActor = profile?.affinities?.actors?.[0]
  if (!topActor?.name || topActor.name === 'Unknown') return null

  // movies.lead_actor_name is the single leading-actor column — narrower
  // than a full cast match, but cheap and aligned with the engine's
  // people scoring (which also reads lead_actor_name).
  let q = supabase
    .from('movies')
    .select(MOVIE_ENGINE_COLS)
    .ilike('lead_actor_name', topActor.name)
    .eq('is_valid', true)
    .not('poster_path', 'is', null)
    .order('ff_audience_rating', { ascending: false, nullsFirst: false })
    .limit(POOL_SIZE)
  q = applyAllExclusions(q, profile)
  const afloor = recencyFloor(profile)
  if (afloor != null) q = q.gte('release_year', afloor)
  q = applyExcludeIds(q, watchedIds)

  const { data, error } = await q
  if (error || !data || data.length === 0) return null

  const ranked = await rankSlotCandidates({
    userId,
    profile,
    candidates: data,
    rowType: 'favorite_genres',
    // TODO migrate placement enum: add 'actor_spotlight' (mirroring the
    // existing 'director_spotlight') so this row's telemetry separates
    // from the generic genre row. Lumped under favorite_genres for now
    // — the closest existing bucket for a "favorite-person affinity" row.
    placement: 'favorite_genres',
    limit: 4,
    diversity: false,  // actor row is single-person on purpose
    pickReasonFor: (m) => ({
      label: `${topActor.name} · ${m.primary_genre || 'Film'}`,
      type: 'personal_actor',
    }),
  })
  const posters = ranked.map(r => r.poster_path).filter(Boolean)
  if (posters.length === 0) return null

  const slug = `personal-actor-${slugify(topActor.name)}`
  return {
    id: slug,
    slug,
    title: `More with ${topActor.name}`,
    blurb: `Films starring ${topActor.name} you haven’t seen.`,
    palette: paletteForSlug(slug),
    posters,
    kind: 'actor',
    meta: { actorName: topActor.name },
  }
}

/**
 * Films your taste-twins (algorithmically-similar users) watched recently.
 *
 * Powers the /home "Taste-twin pulse" row — surfaces a social signal even
 * when the user has zero explicit friends. Uses the `user_similarity`
 * table (precomputed) as the twin graph. Returns engine-friendly rows
 * with a `twinCount` annotation for the UI caption.
 *
 * @param {object} args
 * @param {SupabaseClient} args.supabase
 * @param {string} args.userId
 * @param {object|null} args.profile
 * @param {number[]} args.watchedIds - ids to FILTER OUT of the displayed row
 *   (typically the union of watched + recently-skipped — "don't show me this
 *   again" promise). Misnamed historically; kept for backwards compat.
 * @param {number[]} [args.historyIds] - ids to use for the co-watch lookup
 *   when finding twins (should be ONLY genuinely-watched films, not skips —
 *   skipping a film doesn't make a co-skipper a taste twin). Defaults to
 *   `watchedIds` if not supplied so older callers still work.
 * @param {number} [args.windowDays=21] - "recent" window
 * @param {number} [args.limit=12] - max films returned
 * @returns {Promise<Array>} films sorted by twin-count + engine fit
 */
export async function getTasteTwinPulse({ supabase, userId, profile, watchedIds, historyIds, windowDays = 21, limit = 12 }) {
  if (!profile || !userId) return []
  // Resolve the two roles: `historyIds` for finding twins (defaults to
  // watchedIds so legacy single-arg callers still work), `excludedIds` for
  // hiding films the user already saw or skipped.
  const coWatchIds = historyIds || watchedIds
  const excludedIds = watchedIds

  // === Step 1a: precomputed similarity (primary) ===================
  // `user_similarity` is populated by a background job. When it exists,
  // it carries real fingerprint-based similarity. We look both
  // directions because the table stores user pairs.
  const [simA, simB] = await Promise.all([
    supabase
      .from('user_similarity')
      .select('user_b_id, overall_similarity')
      .eq('user_a_id', userId)
      .order('overall_similarity', { ascending: false })
      .limit(30),
    supabase
      .from('user_similarity')
      .select('user_a_id, overall_similarity')
      .eq('user_b_id', userId)
      .order('overall_similarity', { ascending: false })
      .limit(30),
  ])
  let twinIds = Array.from(new Set([
    ...((simA.data) || []).map(r => r.user_b_id),
    ...((simB.data) || []).map(r => r.user_a_id),
  ])).filter(id => id && id !== userId)

  // === Step 1b: fallback — co-watch overlap (no precompute needed) ==
  // For users with no row in `user_similarity` yet (cold-start or
  // pre-job state), derive twins on-the-fly from co-watched history:
  // "users who watched ≥2 of the same films you've logged." Cheap
  // proxy — gives the section a chance to earn its space even before
  // the similarity job has run.
  if (twinIds.length === 0 && coWatchIds && coWatchIds.length >= 2) {
    const { data: cohabit } = await supabase
      .from('user_history')
      .select('user_id, movie_id')
      .in('movie_id', coWatchIds)
      .neq('user_id', userId)
    const overlap = new Map()
    for (const r of (cohabit || [])) {
      overlap.set(r.user_id, (overlap.get(r.user_id) || 0) + 1)
    }
    twinIds = [...overlap.entries()]
      .filter(([, c]) => c >= 2)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 30)
      .map(([id]) => id)
  }
  if (twinIds.length === 0) return []

  // 2. Twins' recent watches.
  const cutoff = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000).toISOString()
  const { data: history } = await supabase
    .from('user_history')
    .select('movie_id, user_id')
    .in('user_id', twinIds)
    .gte('watched_at', cutoff)
  if (!history || history.length === 0) return []

  // 3. Aggregate twin count per movie (uniqueness on user_id), exclude
  //    anything the current user has already logged OR skipped.
  const watchedSet = new Set(excludedIds || [])
  const movieToTwins = new Map()
  for (const row of history) {
    if (watchedSet.has(row.movie_id)) continue
    if (!movieToTwins.has(row.movie_id)) movieToTwins.set(row.movie_id, new Set())
    movieToTwins.get(row.movie_id).add(row.user_id)
  }
  if (movieToTwins.size === 0) return []

  // 4. Take top-30 by twin-count (pre-filter before engine score).
  const preRanked = [...movieToTwins.entries()]
    .sort((a, b) => b[1].size - a[1].size)
    .slice(0, 30)
  const movieIds = preRanked.map(([id]) => id)

  // 5. Fetch full engine fields, apply standard exclusion stack.
  let q = supabase
    .from('movies')
    .select(MOVIE_ENGINE_COLS)
    .in('id', movieIds)
    .eq('is_valid', true)
    .not('poster_path', 'is', null)
  q = applyAllExclusions(q, profile)
  const floor = recencyFloor(profile)
  if (floor != null) q = q.gte('release_year', floor)
  const { data: movies } = await q
  if (!movies || movies.length === 0) return []

  // 6. Composite ranking: twin count is the primary signal (this is a
  //    "what's moving among your circle" surface), engine score is the
  //    tiebreak (we still want it to match your taste).
  const byId = Object.fromEntries(movies.map(m => [m.id, m]))
  const ranked = preRanked
    .map(([id, twins]) => ({ raw: byId[id], twinCount: twins.size }))
    .filter(r => r.raw)
    .map(r => ({
      ...r,
      score: r.twinCount * 100 + (scoreMovieForUser(r.raw, profile, 'default')?.score ?? 0) * 0.5,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)

  return ranked.map(r => ({ ...r.raw, twinCount: r.twinCount }))
}

/**
 * Films the engine guesses the user has probably watched but hasn't logged.
 * Powers the /home "Have you seen any of these?" quick-log surface.
 *
 * Signal: high audience confidence (lots of ratings → widely seen) + match
 * the user's top fit_profile OR top preferred genre + the full engine
 * exclusion stack + user-fit rerank.
 *
 * @param {object} args
 * @param {SupabaseClient} args.supabase
 * @param {object|null} args.profile - computeUserProfile() output
 * @param {object|null} args.fingerprint - getTasteFingerprint() output
 * @param {number[]} args.watchedIds - movie ids to exclude
 * @param {number} [args.limit=8] - max candidates returned
 * @returns {Promise<Array>} engine-ranked candidate films
 */
export async function getSeenCandidates({ supabase, profile, fingerprint, watchedIds, limit = 8 }) {
  if (!profile) return []

  const topFit = fingerprint?.topFitProfiles?.[0]?.key
  const topGenreId = profile?.genres?.preferred?.[0]
  const genre = topGenreId ? GENRES.find(g => g.id === topGenreId) : null

  // Pool of canonical / widely-rated films. High audience_confidence means
  // many people in our cohort have rated it — proxy for "well-known enough
  // that this user probably saw it." Filtered to fit_profile when we have
  // one, falling back to top genre, falling back to nothing.
  let q = supabase
    .from('movies')
    .select(MOVIE_ENGINE_COLS)
    .gte('ff_audience_confidence', 80)
    .gte('ff_audience_rating', 70)
    .eq('is_valid', true)
    .not('poster_path', 'is', null)
    .order('ff_audience_confidence', { ascending: false })
    .limit(100)

  if (topFit) q = q.eq('fit_profile', topFit)
  else if (genre) q = q.eq('primary_genre', genre.dbName)

  q = applyAllExclusions(q, profile)
  const floor = recencyFloor(profile)
  if (floor != null) q = q.gte('release_year', floor)
  q = applyExcludeIds(q, watchedIds)

  const { data, error } = await q
  if (error || !data || data.length === 0) return []

  // Engine-rerank for user-fit, take top N. Final order combines "well-known"
  // (the query) with "good fit for this person" (the rerank).
  return data
    .map(m => ({ raw: m, score: scoreMovieForUser(m, profile, 'default')?.score ?? 0 }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(s => s.raw)
}

/**
 * Build up to 4 personal lists for the /home "For you" row.
 *
 * Caller should fall back to CURATED_LISTS when this returns fewer than
 * MIN_PERSONAL_LISTS items.
 *
 * @param {object} args
 * @param {SupabaseClient} args.supabase
 * @param {string} args.userId
 * @param {object|null} args.profile - computeUserProfile() output
 * @param {object|null} args.fingerprint - getTasteFingerprint() output
 * @param {number[]} args.watchedIds - movie ids to exclude
 * @param {Function} args.paletteForSlug - existing palette picker
 * @returns {Promise<Array>} up to 4 personal list objects
 */
export async function buildPersonalLists({ supabase, userId, profile, fingerprint, watchedIds, paletteForSlug }) {
  // Gate on the same threshold the fingerprint uses (5 films logged).
  // Without a fingerprint, the user is too cold-start for these signals
  // to mean anything; caller falls back to static curated lists.
  if (!fingerprint || !profile) return []

  // Five candidate slots — director, beloved-film neighbors, top genre,
  // top fit_profile, top actor. We compute all five in parallel and
  // surface the first 4 that fill (any slot returning null is skipped).
  // Order = display priority when more than 4 slots are eligible.
  const slots = await Promise.all([
    buildDirectorSlot({ supabase, userId, profile, watchedIds, paletteForSlug }).catch(() => null),
    buildSimilarSlot({ supabase, userId, profile, watchedIds, paletteForSlug }).catch(() => null),
    buildGenreSlot({ supabase, userId, profile, watchedIds, paletteForSlug }).catch(() => null),
    buildFitProfileSlot({ supabase, userId, profile, fingerprint, watchedIds, paletteForSlug }).catch(() => null),
    buildActorSlot({ supabase, userId, profile, watchedIds, paletteForSlug }).catch(() => null),
  ])
  return slots.filter(Boolean).slice(0, 4)
}
