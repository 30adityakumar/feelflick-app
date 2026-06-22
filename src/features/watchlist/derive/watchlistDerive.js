// src/features/watchlist/derive/watchlistDerive.js
// Pure Watchlist derivations for the CALM SAVED-INTENT role. The Watchlist is "films I chose to
// remember for another moment" — not a ranked recommendation feed. No match percentage, score,
// "perfect for tonight", "stale" classification, recommendation profile, or taste fingerprint.
// It derives honest saved-film attributes (mood, runtime, year, director, saved date/age),
// deterministic retrieval (search + filter + sort), and the mood-filter top/More split.
//
// Frozen elsewhere: the recommendation engine, computeUserProfile, scoreMovieForUser,
// computeMatchPercent and the fingerprint services are UNCHANGED — this is not a consumer of them.

import { HP, MOOD_HEX, tmdbImg } from '../data'
import { formatShortDate } from '@/shared/lib/format/date'

export function capitalize(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ') : ''
}

// First listed mood tag is treated as the film's primary mood (documented contract; mood_tags
// order is producer-defined). null/empty → null (caller renders as "Mixed", never a filter).
export function pickPrimaryMood(moodTags) {
  if (!Array.isArray(moodTags) || moodTags.length === 0) return null
  return capitalize(moodTags[0])
}

export function hexFor(mood) {
  if (!mood) return HP.textSoft
  return MOOD_HEX[mood] || MOOD_HEX[mood.toLowerCase()] || HP.purple
}

export function daysAgo(iso) {
  if (!iso) return 0
  const t = new Date(iso).getTime()
  if (Number.isNaN(t)) return 0
  const ms = Date.now() - t
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)))
}

// Neutral, non-guilt saved-age phrasing. Recent → relative; older → an explicit date. "Saved" is
// a calm fact, never "stale / waiting / overdue". Invalid or FUTURE timestamps degrade to "Saved"
// (never "today"/negative). Uses the fixed en-US formatter for deterministic screenshots/tests.
export function savedAgeLabel(iso) {
  if (!iso) return 'Saved'
  const t = new Date(iso).getTime()
  if (Number.isNaN(t)) return 'Saved'
  if (t > Date.now()) return 'Saved' // future timestamp → no negative/“today” claim
  const d = daysAgo(iso)
  if (d === 0) return 'Saved today'
  if (d === 1) return 'Saved yesterday'
  if (d < 30) return `Saved ${d} days ago`
  return `Saved on ${formatShortDate(new Date(iso))}`
}

// Map a user_watchlist × movies row to the saved-film presentation shape. No score, percentage,
// rank, "perfect" or "stale" — and no fingerprint/profile input.
export function deriveItems({ rows }) {
  return (rows || []).map((r) => {
    const m = r.movies || {}
    const mood = pickPrimaryMood(m.mood_tags)
    return {
      id: r.movie_id,
      internalId: m.id,
      tmdbId: m.tmdb_id,
      title: m.title || 'Untitled',
      year: m.release_date ? new Date(m.release_date).getFullYear() : '',
      runtime: m.runtime || 0,
      dir: m.director_name || '—',
      mood: mood || 'Mixed',
      hex: hexFor(mood),
      addedAt: r.added_at || null,
      addedDaysAgo: daysAgo(r.added_at),
      savedDate: r.added_at ? formatShortDate(new Date(r.added_at)) : '',
      savedLabel: savedAgeLabel(r.added_at),
      poster: m.poster_path ? tmdbImg(m.poster_path, 'w500') : null,
    }
  })
}

// Distinct film moods present in the saved collection, ranked by count (descending) with an
// alphabetical (en) tie-break for determinism. Drives the mood filter — only moods matching ≥1
// saved film ever appear (a zero-result filter is impossible).
export function deriveAvailableMoods(items) {
  const counts = new Map()
  for (const it of items) {
    if (!it.mood || it.mood === 'Mixed') continue
    counts.set(it.mood, (counts.get(it.mood) || 0) + 1)
  }
  return [...counts.entries()]
    .sort((a, b) => (b[1] - a[1]) || a[0].localeCompare(b[0], 'en'))
    .map(([mood, count]) => ({ mood, count, hex: hexFor(mood) }))
}

// Split the count-ranked moods into primary pills + a "More" overflow. `topN` is decided by the
// caller from the viewport (3 desktop/tablet, 2 at ≤360px). An active mood that would fall into
// "More" stays represented there (selected), and an active mood is never lost across resizes.
export function splitMoods(availableMoods, { topN = 3, activeMood = null } = {}) {
  const moods = (availableMoods || []).map((m) => (typeof m === 'string' ? m : m.mood))
  const primary = moods.slice(0, topN)
  const extra = moods.slice(topN)
  if (activeMood && !primary.includes(activeMood) && !extra.includes(activeMood) && moods.includes(activeMood)) {
    extra.unshift(activeMood)
  }
  return { primary, extra }
}

// Deterministic, locale-stable search normalization: trim → Unicode NFKD → strip combining
// diacritics → lowercase (NOT toLocaleLowerCase — locale-independent for tests) → collapse
// whitespace.
export function normalizeSearch(value) {
  return String(value ?? '')
    .trim()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '') // strip combining diacritical marks
    .toLowerCase()
    .replace(/\s+/g, ' ')
}

// Local search over title + director + primary mood only (the smallest truthful scope; all three
// are already fetched). Empty/whitespace query → all items.
export function searchItems(items, query) {
  const q = normalizeSearch(query)
  if (!q) return items || []
  return (items || []).filter((it) => {
    const hay = `${normalizeSearch(it.title)} ${normalizeSearch(it.dir)} ${normalizeSearch(it.mood)}`
    return hay.includes(q)
  })
}

// Deterministic saved-intent ordering. Every mode has a stable tie-break chain ending in the
// movie id so equal primary keys never reorder between renders/environments. No recommendation rank.
export const SORTS = ['recent', 'oldest', 'runtime', 'title']

const titleCollator = new Intl.Collator('en', { sensitivity: 'base', numeric: true })
const byId = (a, b) => (a.id ?? 0) - (b.id ?? 0)
const byTitle = (a, b) => titleCollator.compare(String(a.title || ''), String(b.title || '')) || byId(a, b)
const t = (iso) => (iso ? new Date(iso).getTime() : 0)

export function sortItems(items, sort) {
  const arr = (items || []).slice()
  if (sort === 'oldest') {
    arr.sort((a, b) => (t(a.addedAt) - t(b.addedAt)) || byTitle(a, b))
  } else if (sort === 'runtime') {
    // Positive known runtime ascending; unknown/zero runtime LAST (never the "shortest").
    arr.sort((a, b) => {
      const ra = a.runtime > 0 ? a.runtime : Infinity
      const rb = b.runtime > 0 ? b.runtime : Infinity
      return (ra - rb) || byTitle(a, b)
    })
  } else if (sort === 'title') {
    arr.sort(byTitle)
  } else {
    arr.sort((a, b) => (t(b.addedAt) - t(a.addedAt)) || byTitle(a, b)) // 'recent' (default)
  }
  return arr
}
