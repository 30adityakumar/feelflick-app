// src/features/profile-v2/derive.js
// Pure deriver functions that turn the raw Supabase fetch result
// (user_history + joined movies + user_ratings + taste_fingerprint) into
// the shapes that top.jsx / bottom.jsx components expect.
//
// All functions are pure — no Supabase calls, no React. Test by hand if needed.

import { HP } from './data'

// 6-color cycle for mood axes / radar / chart bars. Order is roughly
// "intense → calm" so the radar reads pleasantly when sorted by weight.
const MOOD_PALETTE = ['#EF4444', '#A78BFA', '#F472B6', '#7DD3FC', '#FBBF24', '#34D399']

const DECADE_LABELS = (year) => year != null ? `${Math.floor(year / 10) * 10}s` : null

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// === USER (identity + cover stats) ===

export function deriveUser({ authUser, dbUser, history }) {
  const fullName =
    dbUser?.name
    || authUser?.user_metadata?.full_name
    || authUser?.user_metadata?.name
    || (authUser?.email ? authUser.email.split('@')[0] : null)
    || 'You'
  const avatarUrl = dbUser?.avatar_url || authUser?.user_metadata?.avatar_url || authUser?.user_metadata?.picture || null
  const handle = '@' + (fullName.split(' ')[0] || 'you').toLowerCase().replace(/[^a-z0-9_]/g, '')
  const joinedRaw = dbUser?.joined_at || authUser?.created_at
  const joined = joinedRaw
    ? new Date(joinedRaw).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : '—'
  const filmsLogged = history.length
  const hoursWatched = Math.round((history.reduce((s, h) => s + (h.movies?.runtime || 0), 0) / 60))
  return {
    name: fullName,
    initial: (fullName[0] || 'Y').toUpperCase(),
    avatarUrl,
    handle,
    joined,
    filmsLogged,
    hoursWatched,
  }
}

// === Stats (quick-stats grid) ===

export function deriveStats({ history, ratings }) {
  const filmsLogged = history.length
  const hoursWatched = Math.round((history.reduce((s, h) => s + (h.movies?.runtime || 0), 0) / 60))
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const filmsThisMonth = history.filter(h => h.watched_at && new Date(h.watched_at) >= startOfMonth).length
  const filmsRated = ratings.length
  // DNA confidence: simple bucket from rated count; saturates at 50 ratings.
  const conf = Math.min(100, Math.round((filmsRated / 50) * 100))
  return { filmsLogged, hoursWatched, filmsThisMonth, filmsRated, dnaConfidence: conf }
}

// === MOODS (radar) ===

export function deriveMoods(fingerprint) {
  const top = fingerprint?.topMoodTags || []
  if (top.length === 0) return []
  // Normalize: weight = share (0-1), already in fingerprint. Pad to ≤6.
  return top.slice(0, 6).map((t, i) => ({
    name: capitalize(t.key),
    weight: Math.max(0.05, Math.min(1, t.share)),
    hex: MOOD_PALETTE[i % MOOD_PALETTE.length],
    count: t.count,
  }))
}

// === DIRECTORS (top 5 by watch count, with avg rating) ===

export function deriveDirectors({ history, ratingsByMovieId }) {
  const buckets = new Map()
  for (const h of history) {
    const dir = h.movies?.director_name
    if (!dir) continue
    if (!buckets.has(dir)) buckets.set(dir, { films: 0, ratingSum: 0, ratingN: 0, signature: '' })
    const b = buckets.get(dir)
    b.films += 1
    const r = ratingsByMovieId.get(h.movie_id)?.rating
    if (r != null) { b.ratingSum += r; b.ratingN += 1 }
  }
  const list = [...buckets.entries()]
    .map(([name, b]) => ({
      name,
      films: b.films,
      // Convert 1-10 → 1-5 for "★ avg" display
      avg: b.ratingN > 0 ? Math.round((b.ratingSum / b.ratingN / 2) * 10) / 10 : null,
      signature: '',  // editorial — populated by overlay/LLM in a later PR
    }))
    .filter(d => d.films >= 2)  // need at least 2 films to call it "signature"
    .sort((a, b) => (b.films - a.films) || ((b.avg ?? 0) - (a.avg ?? 0)))
    .slice(0, 5)
  // Cycle accent colors
  return list.map((d, i) => ({ ...d, accent: MOOD_PALETTE[i % MOOD_PALETTE.length] }))
}

// === MOTIFS (chip cloud) — derived from mood_tags frequency ===

export function deriveMotifs({ history }) {
  const counts = new Map()
  for (const h of history) {
    for (const tag of h.movies?.mood_tags || []) {
      counts.set(tag, (counts.get(tag) || 0) + 1)
    }
  }
  if (counts.size === 0) return []
  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12)
  const max = sorted[0][1]
  return sorted.map(([tag, count]) => ({
    tag: capitalize(tag),
    w: max > 0 ? count / max : 0,
  }))
}

// === MIXTAPE (top 5 rated 5★ = rating ≥ 9 on the 1-10 scale, joined w/ history movie) ===

export function deriveMixtape({ history, ratingsByMovieId }) {
  const movieById = new Map()
  for (const h of history) {
    if (h.movies?.id) movieById.set(h.movies.id, h.movies)
  }
  const candidates = [...ratingsByMovieId.values()]
    .filter(r => r.rating >= 9)
    .filter(r => movieById.has(r.movie_id))
    .sort((a, b) => new Date(b.rated_at || 0) - new Date(a.rated_at || 0))
    .slice(0, 5)
  return candidates.map(r => {
    const m = movieById.get(r.movie_id)
    const year = m.release_date ? new Date(m.release_date).getFullYear() : null
    return {
      tmdbId: m.tmdb_id,
      title: m.title,
      year,
      dir: m.director_name || '—',
      rating: Math.round(r.rating / 2),  // 1-5 for the badge
      why: r.review_text || '',
      poster: m.poster_path ? `https://image.tmdb.org/t/p/w500${m.poster_path}` : null,
    }
  })
}

// === TRAJECTORY (last 12 months, count + dominant mood per month) ===

function pickDominantMood(moodCounts) {
  if (moodCounts.size === 0) return { mood: null, hex: HP.purple }
  const sorted = [...moodCounts.entries()].sort((a, b) => b[1] - a[1])
  const mood = capitalize(sorted[0][0])
  const idx = Math.abs(mood.charCodeAt(0) + mood.length) % MOOD_PALETTE.length
  return { mood, hex: MOOD_PALETTE[idx] }
}

export function deriveTrajectory({ history }) {
  if (history.length === 0) return []
  const now = new Date()
  const monthsBack = 12
  const buckets = []
  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    buckets.push({
      key: `${d.getFullYear()}-${d.getMonth()}`,
      label: MONTH_LABELS[d.getMonth()],
      count: 0,
      moodCounts: new Map(),
    })
  }
  const idxByKey = new Map(buckets.map((b, i) => [b.key, i]))

  for (const h of history) {
    if (!h.watched_at) continue
    const d = new Date(h.watched_at)
    const key = `${d.getFullYear()}-${d.getMonth()}`
    const idx = idxByKey.get(key)
    if (idx == null) continue
    buckets[idx].count += 1
    for (const tag of h.movies?.mood_tags || []) {
      buckets[idx].moodCounts.set(tag, (buckets[idx].moodCounts.get(tag) || 0) + 1)
    }
  }
  return buckets.map(b => {
    const { mood, hex } = pickDominantMood(b.moodCounts)
    return { label: b.label, count: b.count, mood, hex }
  })
}

// "All time" view — one bar per distinct calendar year with watch history.
// Used by the Trajectory toggle's "All time" option.
export function deriveTrajectoryAllTime({ history }) {
  if (history.length === 0) return []
  const byYear = new Map()  // year → { count, moodCounts }
  for (const h of history) {
    if (!h.watched_at) continue
    const y = new Date(h.watched_at).getFullYear()
    if (!Number.isFinite(y)) continue
    if (!byYear.has(y)) byYear.set(y, { count: 0, moodCounts: new Map() })
    const b = byYear.get(y)
    b.count += 1
    for (const tag of h.movies?.mood_tags || []) {
      b.moodCounts.set(tag, (b.moodCounts.get(tag) || 0) + 1)
    }
  }
  if (byYear.size === 0) return []
  return [...byYear.entries()]
    .sort(([a], [b]) => a - b)
    .map(([year, b]) => {
      const { mood, hex } = pickDominantMood(b.moodCounts)
      return { label: String(year), count: b.count, mood, hex }
    })
}

// === DECADES (% of watched films per decade) ===

export function deriveDecades({ history }) {
  const counts = new Map()
  let total = 0
  for (const h of history) {
    const dateStr = h.movies?.release_date
    if (!dateStr) continue
    const year = new Date(dateStr).getFullYear()
    if (Number.isNaN(year)) continue
    const label = DECADE_LABELS(year)
    counts.set(label, (counts.get(label) || 0) + 1)
    total += 1
  }
  if (total === 0) return []
  return [...counts.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))  // oldest first
    .map(([d, count]) => ({ d, pct: Math.round((count / total) * 100) }))
}

// === RUNTIME (median + sweet spot band + shortest/longest) ===

export function deriveRuntime({ history }) {
  const films = history.filter(h => Number.isFinite(h.movies?.runtime) && h.movies.runtime > 0)
  if (films.length === 0) return null
  const sortedByRuntime = [...films].sort((a, b) => a.movies.runtime - b.movies.runtime)
  const runtimes = sortedByRuntime.map(h => h.movies.runtime)
  const median = runtimes[Math.floor(runtimes.length / 2)]
  const p25 = runtimes[Math.floor(runtimes.length * 0.25)]
  const p75 = runtimes[Math.floor(runtimes.length * 0.75)]
  const inBand = films.filter(h => h.movies.runtime >= p25 && h.movies.runtime <= p75).length
  return {
    median,
    band: `${p25}–${p75}`,
    share: inBand / films.length,
    shortest: { title: sortedByRuntime[0].movies.title, value: sortedByRuntime[0].movies.runtime },
    longest:  { title: sortedByRuntime[sortedByRuntime.length - 1].movies.title, value: sortedByRuntime[sortedByRuntime.length - 1].movies.runtime },
  }
}

// === DAYPART (% of watches by time-of-day bin) ===

export function deriveDaypart({ history }) {
  const buckets = { Morning: 0, Afternoon: 0, Evening: 0, Late: 0 }
  let total = 0
  for (const h of history) {
    if (!h.watched_at) continue
    const hour = new Date(h.watched_at).getHours()
    let bucket
    if (hour >= 5 && hour < 12) bucket = 'Morning'
    else if (hour >= 12 && hour < 17) bucket = 'Afternoon'
    else if (hour >= 17 && hour < 21) bucket = 'Evening'
    else bucket = 'Late'
    buckets[bucket] += 1
    total += 1
  }
  if (total === 0) return []
  return [
    { label: 'Morning',   pct: Math.round((buckets.Morning   / total) * 100) },
    { label: 'Afternoon', pct: Math.round((buckets.Afternoon / total) * 100) },
    { label: 'Evening',   pct: Math.round((buckets.Evening   / total) * 100) },
    { label: 'Late',      pct: Math.round((buckets.Late      / total) * 100) },
  ]
}

// === FRIENDS (top 3 taste twins from user_similarity, joined with films-count) ===

const FRIEND_PALETTE = ['#A78BFA', '#F472B6', '#7DD3FC', '#FBBF24', '#34D399', '#F59E0B']

export function deriveFriends({ simARows = [], simBRows = [], filmsByFriendId = new Map() }) {
  const merged = [
    ...simARows.map(r => ({ userId: r.user_b_id, name: r.users?.name || null, match: r.overall_similarity })),
    ...simBRows.map(r => ({ userId: r.user_a_id, name: r.users?.name || null, match: r.overall_similarity })),
  ]
    .filter(f => f.userId && f.name)
    .sort((a, b) => (b.match ?? 0) - (a.match ?? 0))
    .slice(0, 4)
  return merged.map((f, i) => ({
    userId: f.userId,
    name: f.name,
    initial: (f.name[0] || '?').toUpperCase(),
    match: Math.round((f.match ?? 0) * 100),
    films: filmsByFriendId.get(f.userId) ?? 0,
    avatarBg: FRIEND_PALETTE[i % FRIEND_PALETTE.length],
  }))
}

// === SKEWS (you-vs-FF medians; 4 comparable bars normalized 0-100) ===

// Maps a raw value into a 0-100 bar fill. Linear within [min, max], clamped
// outside. For inverted axes (older = "more" of the skew) pass invert: true.
function toBarPct(value, { min, max, invert = false }) {
  if (!Number.isFinite(value)) return 50
  const span = max - min
  if (span <= 0) return 50
  const pct = ((value - min) / span) * 100
  const clamped = Math.max(0, Math.min(100, pct))
  return Math.round(invert ? 100 - clamped : clamped)
}

const SKEW_BANDS = {
  runtime:       { min: 60,   max: 240,  invert: false }, // longer = higher
  filmsPerMonth: { min: 0,    max: 20,   invert: false }, // more frequent = higher
  releaseYear:   { min: 1960, max: 2025, invert: true  }, // older = higher
  rating:        { min: 1,    max: 10,   invert: false },
}

export function deriveSkews({ stats, history, ratings, feelflickStats }) {
  // FeelFlick medians — null when feelflick_stats hasn't been seeded.
  const ffRuntime    = numericStat(feelflickStats, 'median_runtime')
  const ffFilmsMonth = numericStat(feelflickStats, 'median_films_month')
  const ffRating     = numericStat(feelflickStats, 'median_user_rating')
  const ffYear       = numericStat(feelflickStats, 'median_release_year')
  if (ffRuntime == null && ffFilmsMonth == null && ffRating == null && ffYear == null) {
    return []
  }

  // Per-user medians, derived from the same fields the RPC uses.
  const userRuntime    = median(history.map(h => h.movies?.runtime).filter(Number.isFinite))
  const userRating     = median(ratings.map(r => r.rating).filter(Number.isFinite))
  const userYear       = median(history
    .map(h => h.movies?.release_date ? new Date(h.movies.release_date).getFullYear() : null)
    .filter(Number.isFinite))
  const userFilmsMonth = stats?.filmsThisMonth ?? null

  const rows = []
  if (Number.isFinite(userRuntime) && ffRuntime != null) {
    rows.push(buildSkewRow('Longer films', userRuntime, ffRuntime, SKEW_BANDS.runtime, ' min'))
  }
  if (Number.isFinite(userFilmsMonth) && ffFilmsMonth != null) {
    rows.push(buildSkewRow('More frequent', userFilmsMonth, ffFilmsMonth, SKEW_BANDS.filmsPerMonth, '/mo'))
  }
  if (Number.isFinite(userYear) && ffYear != null) {
    rows.push(buildSkewRow('Older releases', userYear, ffYear, SKEW_BANDS.releaseYear, ''))
  }
  if (Number.isFinite(userRating) && ffRating != null) {
    rows.push(buildSkewRow('Higher ratings', userRating, ffRating, SKEW_BANDS.rating, '★'))
  }
  return rows
}

function buildSkewRow(label, you, them, band, unit) {
  const youPct  = toBarPct(you, band)
  const themPct = toBarPct(them, band)
  // For inverted axes, the delta should still read in the "you - them" sense
  // of the percent bar so + always means "more of this skew."
  const delta = Math.round(youPct - themPct)
  return {
    label,
    you: youPct,
    them: themPct,
    delta,
    youRaw: round1(you),
    themRaw: round1(them),
    unit,
  }
}

function numericStat(rows, key) {
  if (!Array.isArray(rows)) return null
  const row = rows.find(r => r.stat_key === key)
  if (!row) return null
  const v = row.stat_value
  if (typeof v === 'number') return v
  if (v && typeof v === 'object' && typeof v.value === 'number') return v.value
  return null
}

function median(nums) {
  if (!nums || nums.length === 0) return null
  const sorted = [...nums].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid]
}

function round1(n) {
  return Math.round(n * 10) / 10
}

// === YIR (year-in-review banner — current calendar year derivations) ===

export function deriveYIR({ history }) {
  const now = new Date()
  const yearStart = new Date(now.getFullYear(), 0, 1)
  const lastYearStart = new Date(now.getFullYear() - 1, 0, 1)
  const lastYearEnd = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59)

  const thisYear = history.filter(h => h.watched_at && new Date(h.watched_at) >= yearStart)
  if (thisYear.length === 0) return null

  // Binged month — month with most watches this year.
  const monthCounts = new Array(12).fill(0)
  for (const h of thisYear) {
    const d = new Date(h.watched_at)
    monthCounts[d.getMonth()] += 1
  }
  let topMonthIdx = 0
  for (let i = 1; i < 12; i++) {
    if (monthCounts[i] > monthCounts[topMonthIdx]) topMonthIdx = i
  }
  const monthLabels = ['January','February','March','April','May','June','July','August','September','October','November','December']
  const bingedMonth = { month: monthLabels[topMonthIdx], count: monthCounts[topMonthIdx] }

  // New directors discovered this year (first-watched between Jan 1 and now).
  const directorFirstSeen = new Map()
  for (const h of history) {
    const dir = h.movies?.director_name
    if (!dir || !h.watched_at) continue
    const t = new Date(h.watched_at).getTime()
    const prev = directorFirstSeen.get(dir)
    if (prev == null || t < prev) directorFirstSeen.set(dir, t)
  }
  const yearStartT = yearStart.getTime()
  let newDirectors = 0
  for (const t of directorFirstSeen.values()) {
    if (t >= yearStartT) newDirectors += 1
  }

  // Rewatched count — films watched 2+ times overall (any year), among this year's slate.
  const watchCounts = new Map()
  for (const h of history) {
    if (!h.movie_id) continue
    watchCounts.set(h.movie_id, (watchCounts.get(h.movie_id) || 0) + 1)
  }
  let rewatched = 0
  const seenThisYear = new Set()
  for (const h of thisYear) {
    if (!h.movie_id || seenThisYear.has(h.movie_id)) continue
    seenThisYear.add(h.movie_id)
    if ((watchCounts.get(h.movie_id) || 0) >= 2) rewatched += 1
  }

  // Mood growth — biggest YoY delta in mood-tag share.
  const moodShare = (rows) => {
    const counts = new Map()
    let total = 0
    for (const h of rows) {
      for (const tag of h.movies?.mood_tags || []) {
        counts.set(tag, (counts.get(tag) || 0) + 1)
        total += 1
      }
    }
    if (total === 0) return new Map()
    return new Map([...counts.entries()].map(([t, n]) => [t, n / total]))
  }
  const thisYearShare = moodShare(thisYear)
  const lastYear = history.filter(h => {
    if (!h.watched_at) return false
    const t = new Date(h.watched_at)
    return t >= lastYearStart && t <= lastYearEnd
  })
  const lastYearShareMap = moodShare(lastYear)
  let topMoodGrowth = null
  for (const [tag, share] of thisYearShare) {
    const prev = lastYearShareMap.get(tag) ?? 0
    const delta = share - prev
    if (!topMoodGrowth || delta > topMoodGrowth.delta) {
      topMoodGrowth = { mood: capitalize(tag), delta, share }
    }
  }
  if (topMoodGrowth) {
    const pct = Math.round(topMoodGrowth.delta * 100)
    topMoodGrowth = {
      mood: topMoodGrowth.mood,
      delta: `${pct >= 0 ? '+' : ''}${pct}%`,
      note: pct > 0 ? 'You leaned in this year.' : 'Steady from last year.',
    }
  }

  return {
    bingedMonth,
    newDirectors,
    rewatched,
    topMoodGrowth: topMoodGrowth || { mood: '—', delta: '', note: '' },
  }
}

// === helpers ===

function capitalize(s) {
  if (!s) return ''
  return s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ').replace(/-/g, '-')
}
