// src/features/profile/buildSummaryRequest.js
// Shared helpers for calling the generate-taste-summary edge function.
//
// Two responsibilities, kept as separate pure functions so each caller can
// reuse only what it needs:
//
//   aggregateWatchHistorySignals(historyRows)
//     Pure. Takes raw Supabase rows with movies(title, mood_tags, tone_tags,
//     fit_profile) joined and returns { watchedFilms, taggedTasteSignature }
//     — the two pieces every v1 and v2 caller of the edge function build the
//     same way.
//
//   buildSummaryRequestBody({ stats, watchedFilms, taggedTasteSignature })
//     Pure. Maps the caller's stats shape (topGenres/topDirectors/topMoods/
//     watchedCount/avgRating/ratingPersonality) plus the aggregated signals
//     into the JSON body the edge function expects. Empty stats are tolerated
//     — the edge function uses genres as secondary context only.

const topN = (obj, n) =>
  Object.entries(obj).sort(([, a], [, b]) => b - a).slice(0, n)

/**
 * Aggregate mood/tone/fit signals + watched-film titles from raw history rows.
 *
 * @param {Array<{movies?: { title?: string, mood_tags?: string[], tone_tags?: string[], fit_profile?: string }}>} historyRows
 * @returns {{ watchedFilms: string[], taggedTasteSignature: { topMoodTags: Array<{tag:string,count:number}>, topToneTags: Array<{tag:string,count:number}>, topFitProfiles: Array<{profile:string,count:number}> } }}
 */
export function aggregateWatchHistorySignals(historyRows) {
  const rows = historyRows ?? []
  const watchedFilms = rows
    .map((h) => h?.movies)
    .filter(Boolean)
    .map((m) => m.title)
    .filter(Boolean)

  const tagCounts = { mood: {}, tone: {}, fit: {} }
  for (const h of rows) {
    const m = h?.movies
    if (!m) continue
    ;(m.mood_tags ?? []).forEach((t) => { tagCounts.mood[t] = (tagCounts.mood[t] || 0) + 1 })
    ;(m.tone_tags ?? []).forEach((t) => { tagCounts.tone[t] = (tagCounts.tone[t] || 0) + 1 })
    if (m.fit_profile) tagCounts.fit[m.fit_profile] = (tagCounts.fit[m.fit_profile] || 0) + 1
  }

  return {
    watchedFilms,
    taggedTasteSignature: {
      topMoodTags:    topN(tagCounts.mood, 6).map(([tag, count]) => ({ tag, count })),
      topToneTags:    topN(tagCounts.tone, 4).map(([tag, count]) => ({ tag, count })),
      topFitProfiles: topN(tagCounts.fit, 3).map(([profile, count]) => ({ profile, count })),
    },
  }
}

/**
 * Assemble the request body for the generate-taste-summary edge function.
 *
 * @param {object} input
 * @param {object} [input.stats]            v1 stats shape (topGenres/topDirectors/topMoods/...)
 * @param {string[]} [input.watchedFilms]   from aggregateWatchHistorySignals
 * @param {object} [input.taggedTasteSignature] from aggregateWatchHistorySignals
 * @returns {object}
 */
export function buildSummaryRequestBody({ stats = {}, watchedFilms = [], taggedTasteSignature = null } = {}) {
  return {
    genres: (stats.topGenres ?? []).slice(0, 3).map((g) => ({
      name: g.name,
      pct: g.pct ?? 0,
    })),
    directors: (stats.topDirectors ?? []).slice(0, 3).map((d) => ({
      name: d.name,
      count: d.count ?? d.films ?? 0,
    })),
    moods: (stats.topMoods ?? []).slice(0, 3).map((m) => ({
      name: m.name,
      sessions: m.sessions ?? m.count ?? 0,
    })),
    totalWatched: stats.watchedCount ?? stats.totalWatched ?? 0,
    avgRating:    stats.avgRating ?? 0,
    ratingLabel:  stats.ratingPersonality ?? stats.ratingLabel ?? '',
    watchedFilms,
    taggedTasteSignature,
  }
}
