// src/features/dna/derive/dnaProfileDerivations.js
// Pure, deterministic derivations specific to the /DNA social profile. No React, no Supabase.
// These complement the existing profile derivations in src/features/profile/derive.js (which the
// DNA data hook also reuses) — here we add only what the social profile needs on top:
//   • current-year-by-month trend (through the current month, never future),
//   • a truthful "rewatches" count from RAW watch events,
//   • a deterministic merged activity stream (watch/rate/review/list, de-duplicated),
//   • curated-vs-fallback resolution for the Featured section (with honest labels),
//   • real-backed Highlights,
//   • section-visibility resolution for visitor / view-as-visitor projection.

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// Normalize one canonical history row → a light movie view the components render.
export function movieView(h) {
  const m = h?.movies || {}
  return {
    id: m.id ?? h?.movie_id ?? null,
    tmdbId: m.tmdb_id ?? null,
    title: m.title || 'Untitled',
    year: m.release_date ? new Date(m.release_date).getFullYear() : null,
    posterPath: m.poster_path || null,
    backdropPath: m.backdrop_path || null,
    director: m.director_name || null,
    runtime: Number.isFinite(m.runtime) ? m.runtime : null,
  }
}

function movieMap(history) {
  const map = new Map()
  for (const h of history) {
    const id = h?.movies?.id ?? h?.movie_id
    if (id != null && !map.has(id)) map.set(id, movieView(h))
  }
  return map
}

// === Current-year trend (one bucket per month, Jan..current month only) ========================
// `now` is injected for deterministic tests; defaults to real clock in the app.
export function deriveYearByMonth(history, now = new Date()) {
  const year = now.getFullYear()
  const currentMonth = now.getMonth()
  const buckets = []
  for (let mo = 0; mo <= currentMonth; mo++) buckets.push({ label: MONTHS[mo], count: 0 })
  for (const h of history) {
    if (!h?.watched_at) continue
    const d = new Date(h.watched_at)
    if (d.getFullYear() !== year) continue
    const mo = d.getMonth()
    if (mo > currentMonth) continue // never surface a future month
    buckets[mo].count += 1
  }
  return buckets
}

// NOTE: there is intentionally NO "rewatches" metric here. The repository does not track rewatch
// events — user_history has a UNIQUE(user_id, movie_id, watched_at) constraint and the app dedupes
// by (user, movie) (see src/features/history). "Hours watched" is used as the honest 4th stat.

// === Activity stream (deterministic, de-duplicated) ============================================
// A watch + rating + review of the SAME film collapse into ONE item (keyed by movie), timestamped
// at the most recent of watched/rated. Lists appear as their own items. Newest first, bounded.
export function deriveActivity({ canonicalHistory = [], ratingsByMovieId = new Map(), lists = [], limit = 12 } = {}) {
  const items = []
  for (const h of canonicalHistory) {
    const m = movieView(h)
    if (m.id == null) continue
    const r = ratingsByMovieId.get(h.movie_id)
    const watchedAt = h.watched_at ? new Date(h.watched_at).getTime() : null
    const ratedAt = r?.rated_at ? new Date(r.rated_at).getTime() : null
    const at = Math.max(watchedAt || 0, ratedAt || 0) || watchedAt || ratedAt
    if (!at) continue
    const hasReview = !!(r?.review_text && String(r.review_text).trim())
    const kind = hasReview ? 'reviewed' : r ? 'rated' : 'watched'
    items.push({
      id: `m${m.id}`,
      type: 'film',
      kind,
      at,
      movie: {
        ...m,
        rating: r?.rating != null ? Math.round((r.rating / 2) * 10) / 10 : null,
        reviewExcerpt: hasReview ? String(r.review_text).trim().slice(0, 160) : null,
      },
    })
  }
  for (const l of lists) {
    const at = l?.updatedAt || l?.updated_at
    const t = at ? new Date(at).getTime() : null
    if (!t) continue
    items.push({ id: `l${l.id}`, type: 'list', kind: 'list_updated', at: t, list: { id: l.id, title: l.title, count: l.count ?? 0 } })
  }
  items.sort((a, b) => b.at - a.at)
  return items.slice(0, limit)
}

// === Featured (curated → honest fallback) ======================================================
function topRatedFilms(history, ratingsByMovieId, n) {
  return [...history]
    .map((h) => ({
      m: movieView(h),
      r: ratingsByMovieId.get(h.movie_id)?.rating ?? null,
      at: h.watched_at ? new Date(h.watched_at).getTime() : 0,
    }))
    .filter((x) => x.m.id != null)
    .sort((a, b) => (b.r ?? -1) - (a.r ?? -1) || b.at - a.at)
    .slice(0, n)
    .map((x) => x.m)
}

// dnaProfile: owner curation. reviews: [{ movieId, rating, reviewText, ratedAt, movie }]. lists: normalized.
export function resolveFeatured({ dnaProfile = {}, history = [], ratingsByMovieId = new Map(), reviews = [], lists = [] } = {}) {
  const byId = movieMap(history)
  const resolveIds = (ids) => (Array.isArray(ids) ? ids.map((id) => byId.get(id)).filter(Boolean) : [])

  // My Four
  const curatedFour = resolveIds(dnaProfile.featuredFilmIds).slice(0, 4)
  const myFour = curatedFour.length > 0
    ? { films: curatedFour, curated: true, label: 'Chosen to represent me' }
    : { films: topRatedFilms(history, ratingsByMovieId, 4), curated: false, label: 'Selected from your highest-rated films' }

  // Cover — curated cover ids, else My Four films
  const coverFilms = resolveIds(dnaProfile.coverMovieIds).slice(0, 4)
  const cover = coverFilms.length > 0 ? coverFilms : myFour.films

  // Pinned review
  let pinnedReview = null
  if (dnaProfile.pinnedReviewMovieId != null) {
    const found = reviews.find((rv) => rv.movieId === dnaProfile.pinnedReviewMovieId)
    if (found) pinnedReview = { review: found, curated: true }
  }
  if (!pinnedReview && reviews.length > 0) {
    const sorted = [...reviews].sort((a, b) => new Date(b.ratedAt || 0) - new Date(a.ratedAt || 0))
    const strong = sorted.find((rv) => (rv.rating ?? 0) >= 8) || sorted[0]
    if (strong) pinnedReview = { review: strong, curated: false }
  }

  // Featured list
  let featuredList = null
  if (dnaProfile.featuredListId != null) {
    const found = lists.find((l) => l.id === dnaProfile.featuredListId)
    if (found) featuredList = { list: found, curated: true }
  }
  if (!featuredList && lists.length > 0) {
    const sorted = [...lists].sort((a, b) => new Date(b.updatedAt || b.updated_at || 0) - new Date(a.updatedAt || a.updated_at || 0))
    featuredList = { list: sorted[0], curated: false }
  }

  const currentExploration = typeof dnaProfile.currentExploration === 'string' && dnaProfile.currentExploration.trim()
    ? dnaProfile.currentExploration.trim()
    : null

  return { myFour, cover, pinnedReview, featuredList, currentExploration }
}

// === Highlights (only categories with real backing rows) =======================================
export function resolveHighlights({ dnaProfile = {}, history = [], ratingsByMovieId = new Map(), now = new Date() } = {}) {
  const available = []

  const four = (dnaProfile.featuredFilmIds?.length ? resolveFeaturedFour(dnaProfile, history) : topRatedFilms(history, ratingsByMovieId, 4))
  if (four.length > 0) available.push({ key: 'myfour', label: 'My Four', items: four })

  const year = now.getFullYear()
  const thisYear = history.filter((h) => h.watched_at && new Date(h.watched_at).getFullYear() === year).map(movieView)
  if (thisYear.length > 0) available.push({ key: 'year', label: String(year % 100).padStart(2, '0'), title: 'This year', items: thisYear.slice(0, 12) })

  // Rewatches — films with 2+ canonical? we only have canonical here; a real rewatch signal needs
  // raw events, so this highlight is built by the hook when raw counts exist. Skipped when absent.

  const order = Array.isArray(dnaProfile.highlights) && dnaProfile.highlights.length ? dnaProfile.highlights : null
  if (!order) return available
  const byKey = new Map(available.map((h) => [h.key, h]))
  const ordered = order.map((k) => byKey.get(k)).filter(Boolean)
  // append any available-but-unordered at the end (so new categories still show)
  for (const h of available) if (!order.includes(h.key)) ordered.push(h)
  return ordered
}

function resolveFeaturedFour(dnaProfile, history) {
  const byId = movieMap(history)
  return (dnaProfile.featuredFilmIds || []).map((id) => byId.get(id)).filter(Boolean).slice(0, 4)
}

// === Section visibility (visitor / view-as-visitor projection) =================================
// Owner sees everything. A visitor (or the owner previewing "view as visitor") sees a section only
// when its public flag is true. Identity + DNA strip require profilePublic (enforced server-side too).
export function resolveSectionVisibility({ visibility = {}, isOwner = false } = {}) {
  if (isOwner) {
    return { films: true, diary: true, reviews: true, lists: true, connections: true, viewingRhythm: true }
  }
  return {
    films: !!visibility.filmsPublic,
    diary: !!visibility.diaryPublic,
    reviews: !!visibility.reviewsPublic,
    lists: !!visibility.listsPublic,
    connections: !!visibility.connectionsPublic,
    viewingRhythm: !!visibility.viewingRhythmPublic,
  }
}
