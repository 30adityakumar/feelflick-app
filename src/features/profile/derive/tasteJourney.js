// src/features/profile/derive/tasteJourney.js
// Pure deterministic "taste journey" derivation for Cinematic DNA → Journey.
//
// Splits the canonical watch history (one row per film) into chronologically balanced chapters
// and surfaces, per chapter, the single strongest NON-REDUNDANT mood shift relative to the prior
// chapter. It NEVER forces three chapters and NEVER fabricates dates or prose:
//   • returns []                       when there is too little evidence (hidden by the section)
//   • returns 2 chapters               for a medium evidence span
//   • returns 3 chapters               only for a larger evidence span
// Dates are the real min/max watched_at of each chapter. A chapter's "change" tag is only emitted
// when a mood is supported by enough films in that chapter (no single-film "defining trait").
// No LLM: titles + the one factual sentence are deterministic.

export const MIN_FILMS_FOR_JOURNEY = 12
export const MIN_PER_CHAPTER = 4
export const THREE_CHAPTER_MIN_FILMS = 24
export const MIN_SPAN_MONTHS_2 = 6
export const MIN_SPAN_MONTHS_3 = 18
const MIN_MOOD_SUPPORT = 2 // a mood must appear in ≥2 films of a chapter to be a "change"

const ERA_TONE = ['#eda8cc', '#e5636f', '#91d2ee'] // passport-family hues, fixed order

const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s)
const monthsBetween = (a, b) => (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth())

function dominantMoods(rows) {
  const counts = new Map()
  for (const r of rows) for (const t of (r.movies?.mood_tags || [])) counts.set(t, (counts.get(t) || 0) + 1)
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1)) // count desc, then key asc (stable)
}

/**
 * @param {{ history?: Array<{ watched_at?: string, movies?: { mood_tags?: string[] } }> }} args
 * @returns {Array<{ index, fromYear, toYear, range, count, title, change, tags, color }>}
 */
export function deriveTasteJourney({ history = [] } = {}) {
  const rows = (Array.isArray(history) ? history : [])
    .filter((h) => h?.watched_at && !Number.isNaN(new Date(h.watched_at).getTime()))
    .sort((a, b) => new Date(a.watched_at) - new Date(b.watched_at))

  if (rows.length < MIN_FILMS_FOR_JOURNEY) return []
  const span = monthsBetween(new Date(rows[0].watched_at), new Date(rows[rows.length - 1].watched_at))
  if (span < MIN_SPAN_MONTHS_2) return []

  // Decide chapter count from evidence only — never forced.
  let n = 2
  if (rows.length >= THREE_CHAPTER_MIN_FILMS && span >= MIN_SPAN_MONTHS_3) n = 3
  if (Math.floor(rows.length / n) < MIN_PER_CHAPTER) n = 2
  if (Math.floor(rows.length / n) < MIN_PER_CHAPTER) return []

  // Chronologically balanced segments (by count).
  const segs = []
  const per = Math.floor(rows.length / n)
  for (let i = 0; i < n; i++) {
    const start = i * per
    const end = i === n - 1 ? rows.length : start + per
    segs.push(rows.slice(start, end))
  }

  const chapters = []
  let prevTopKey = null
  for (let i = 0; i < segs.length; i++) {
    const seg = segs[i]
    const from = new Date(seg[0].watched_at)
    const to = new Date(seg[seg.length - 1].watched_at)
    const moods = dominantMoods(seg).filter(([, c]) => c >= MIN_MOOD_SUPPORT)

    // The "change" = the strongest supported mood that is NOT the previous chapter's headline
    // (so each chapter carries its own differentiator). Falls back to the chapter's top mood.
    const fresh = moods.find(([k]) => k !== prevTopKey) || moods[0] || null
    const topKey = fresh ? fresh[0] : null
    const tags = moods.slice(0, 3).map(([k]) => cap(k))

    chapters.push({
      index: i,
      fromYear: from.getFullYear(),
      toYear: to.getFullYear(),
      range: from.getFullYear() === to.getFullYear() ? `${from.getFullYear()}` : `${from.getFullYear()}–${to.getFullYear()}`,
      count: seg.length,
      title: topKey ? `${cap(topKey)} came forward.` : 'A widening picture.',
      change: topKey ? `Across ${seg.length} films, ${cap(topKey)} was your most repeated signal.` : `${seg.length} films, no single dominant signal.`,
      tags,
      color: ERA_TONE[i % ERA_TONE.length],
    })
    prevTopKey = topKey
  }

  // Guard: if a chapter could not produce a differentiator (no supported mood), drop to fewer
  // chapters rather than show an empty era — re-segment at n-1, or hide entirely.
  if (chapters.some((c) => c.tags.length === 0) && n === 3) {
    return deriveTasteJourneyN({ rows, n: 2 })
  }
  return chapters
}

// Internal: re-run segmentation at a forced lower n (used only by the differentiator guard).
function deriveTasteJourneyN({ rows, n }) {
  if (Math.floor(rows.length / n) < MIN_PER_CHAPTER) return []
  const segs = []
  const per = Math.floor(rows.length / n)
  for (let i = 0; i < n; i++) segs.push(rows.slice(i * per, i === n - 1 ? rows.length : i * per + per))
  const chapters = []
  let prevTopKey = null
  for (let i = 0; i < segs.length; i++) {
    const seg = segs[i]
    const from = new Date(seg[0].watched_at); const to = new Date(seg[seg.length - 1].watched_at)
    const moods = dominantMoods(seg).filter(([, c]) => c >= MIN_MOOD_SUPPORT)
    const fresh = moods.find(([k]) => k !== prevTopKey) || moods[0] || null
    const topKey = fresh ? fresh[0] : null
    chapters.push({
      index: i, fromYear: from.getFullYear(), toYear: to.getFullYear(),
      range: from.getFullYear() === to.getFullYear() ? `${from.getFullYear()}` : `${from.getFullYear()}–${to.getFullYear()}`,
      count: seg.length,
      title: topKey ? `${cap(topKey)} came forward.` : 'A widening picture.',
      change: topKey ? `Across ${seg.length} films, ${cap(topKey)} was your most repeated signal.` : `${seg.length} films, no single dominant signal.`,
      tags: moods.slice(0, 3).map(([k]) => cap(k)),
      color: ERA_TONE[i % ERA_TONE.length],
    })
    prevTopKey = topKey
  }
  return chapters
}
