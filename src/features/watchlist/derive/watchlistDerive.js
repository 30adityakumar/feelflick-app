// src/features/watchlist/derive/watchlistDerive.js
// F6.4 — pure Watchlist derivations for the CALM SAVED-INTENT role. The Watchlist is
// "films I chose to remember for another moment" — not a ranked recommendation feed.
// So this layer no longer computes (or exposes) any match percentage, approximate
// score, "perfect for tonight", or "stale" classification, and it needs NO recommendation
// profile or taste fingerprint. It derives only honest saved-film attributes (mood,
// runtime, year, director, saved date/age) + deterministic saved-date ordering.
//
// Frozen elsewhere: the recommendation engine, computeUserProfile, scoreMovieForUser,
// computeMatchPercent and the fingerprint services are UNCHANGED — F6.4 simply stops
// being a consumer of them. The user_watchlist delete filters + reliability live in the
// provider (F6.3) and are untouched.

import { HP, MOOD_HEX, tmdbImg } from '../data'
import { formatShortDate } from '@/shared/lib/format/date'

export function capitalize(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ') : ''
}

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
  const ms = Date.now() - new Date(iso).getTime()
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)))
}

// Neutral, non-guilt saved-age phrasing. Recent → relative; older → an explicit date.
// "saved" is a calm fact, never "stale / waiting / overdue".
export function savedAgeLabel(iso) {
  if (!iso) return 'Saved'
  const d = daysAgo(iso)
  if (d === 0) return 'Saved today'
  if (d === 1) return 'Saved yesterday'
  if (d < 30) return `Saved ${d} days ago`
  return `Saved on ${formatShortDate(new Date(iso))}`
}

// Map a user_watchlist × movies row to the saved-film presentation shape. No score,
// percentage, rank, "perfect" or "stale" — and no fingerprint/profile input.
export function deriveItems({ rows }) {
  return (rows || []).map(r => {
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

// Distinct film moods present in the saved collection, ranked by count (descending).
// These drive the "filter by film mood" pills — only moods that match ≥1 saved film.
export function deriveAvailableMoods(items) {
  const counts = new Map()
  for (const it of items) {
    if (!it.mood || it.mood === 'Mixed') continue
    counts.set(it.mood, (counts.get(it.mood) || 0) + 1)
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([mood, count]) => ({ mood, count, hex: hexFor(mood) }))
}

// Deterministic saved-intent ordering. Default 'recent' (added_at descending — the
// order the backend already returns). No recommendation ranking.
export const SORTS = ['recent', 'oldest', 'runtime', 'title']

export function sortItems(items, sort) {
  const arr = (items || []).slice()
  const t = (iso) => (iso ? new Date(iso).getTime() : 0)
  if (sort === 'oldest') arr.sort((a, b) => t(a.addedAt) - t(b.addedAt))
  else if (sort === 'runtime') arr.sort((a, b) => (a.runtime || 0) - (b.runtime || 0))
  else if (sort === 'title') arr.sort((a, b) => String(a.title).localeCompare(String(b.title)))
  else arr.sort((a, b) => t(b.addedAt) - t(a.addedAt)) // 'recent' (default)
  return arr
}
