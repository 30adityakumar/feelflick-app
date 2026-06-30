// src/features/browse/useCuriosityPaths.js
// "Start somewhere" curiosity-path derivation for /browse.
//
// These are NOT a recommendation feed — each path is a meaningful entry point
// that opens a real Browse territory (it just writes filters to the URL). Paths
// are derived from already-computed profile evidence; PERSONAL paths require real
// thresholds (top genre, a non-English language the user returns to, a director
// their ratings reward). EDITORIAL paths (hidden gems, cult classics, short &
// sharp) are catalogue-wide and labelled neutrally.
//
// Performance + honesty contract (per approval):
//   • derive candidates from ONE computeUserProfileV3 call (cached by the engine),
//     never a catalogue page request per candidate;
//   • validate min result count + pull representative artwork through a single
//     bounded, BATCHED set of lightweight peekTerritory() probes (3 columns,
//     count-only, limit 5) — at most one per candidate, run ONCE per user and
//     memoized here, never on ordinary re-renders;
//   • deterministic ordering (personal first, fixed editorial order) so the row +
//     visual baselines stay stable;
//   • render fewer than six rather than fabricate a path (a path is dropped if its
//     territory has fewer than MIN_PATH_RESULTS films);
//   • stale derivations are ignored (cancelled) when the user changes.

import { useEffect, useState } from 'react'
import { computeUserProfileV3 } from '@/shared/services/recommendations'
import { peekTerritory } from '@/shared/api/browse'
import { GENRES } from '@/features/onboarding/data'
import { LANG_OPTIONS } from './data'

const MIN_PATH_RESULTS = 6
const LANG_LABEL = Object.fromEntries(LANG_OPTIONS.filter(o => o.value).map(o => [o.value, o.label]))

// userId → Promise<path[]>. Memoized so re-mounts / re-renders never re-derive
// or re-query. The engine also caches the V3 profile, so this is belt-and-braces.
const pathsCache = new Map()

// Pure derivation from profile evidence — no I/O. Personal paths only appear when
// the supporting signal genuinely exists; editorial paths always qualify.
function deriveCandidates(profile) {
  const out = []

  // Personal — strongest genre (top preferred genre from watch history)
  const topGenreId = profile?._legacy?.genres?.preferred?.[0]
  const genreName = topGenreId != null ? GENRES.find(g => g.id === topGenreId)?.dbName : null
  if (genreName) {
    out.push({ key: 'genre', kind: 'personal', kicker: 'Your top genre', title: genreName, sub: 'The territory you keep returning to', filters: { genre: genreName } })
  }

  // Personal — a non-English language the user keeps returning to (world cinema)
  const primary = profile?.filters?.language_primary
  const distro = profile?._legacy?.languages?.distributionSorted || []
  let worldLang = null
  if (primary && primary !== 'en' && LANG_LABEL[primary]) worldLang = primary
  else {
    const nonEn = distro.find(d => d?.lang && d.lang !== 'en' && LANG_LABEL[d.lang])
    if (nonEn) worldLang = nonEn.lang
  }
  if (worldLang) {
    out.push({ key: 'language', kind: 'personal', kicker: 'World cinema', title: `${LANG_LABEL[worldLang]} cinema`, sub: 'A cinema you\'ve rated your way into', filters: { lang: worldLang } })
  }

  // Personal — a filmmaker the user's ratings reward
  const director = profile?.affinity?.directors?.[0]?.name
  if (director && director !== 'Unknown') {
    out.push({ key: 'director', kind: 'personal', kicker: 'Filmmaker trail', title: director, sub: 'A director your watch history singles out', filters: { director } })
  }

  // Editorial — always-available catalogue lenses (neutral labels, real fields)
  out.push({ key: 'hidden', kind: 'editorial', kicker: 'Less obvious', title: 'Hidden gems', sub: 'Films that didn\'t find the audience they deserve', filters: { vibe: ['hidden'] } })
  out.push({ key: 'cult', kind: 'editorial', kicker: 'Lasting pull', title: 'Cult classics', sub: 'Divisive on release. Still talked about.', filters: { sort: 'cult_status_score.desc' } })
  out.push({ key: 'short', kind: 'editorial', kicker: 'Time-led', title: 'Short & sharp', sub: 'Under 90 minutes. No filler.', filters: { runtime: 'short' } })

  return out
}

async function buildPaths(userId) {
  let profile = null
  try { profile = userId ? await computeUserProfileV3(userId) : null } catch { profile = null }

  const candidates = deriveCandidates(profile)

  // Bounded + batched: one cheap probe per candidate, run together, once.
  const peeks = await Promise.all(candidates.map(c =>
    peekTerritory({
      genre: c.filters.genre || '',
      lang: c.filters.lang || '',
      decade: c.filters.decade || '',
      runtime: c.filters.runtime || '',
      director: c.filters.director || '',
      limit: 5,
    }).catch(() => ({ count: 0, posters: [] })),
  ))

  return candidates
    .map((c, i) => ({ ...c, count: peeks[i].count, poster: peeks[i].posters[0] || null }))
    .filter(p => p.count >= MIN_PATH_RESULTS) // render fewer rather than fabricate
    .slice(0, 6)
}

/**
 * @param {string|null} userId
 * @returns {{ paths: Array<{key,kind,kicker,title,sub,filters,count,poster}>, loading: boolean }}
 */
export function useCuriosityPaths(userId) {
  const [state, setState] = useState({ paths: [], loading: true })

  useEffect(() => {
    let cancelled = false
    const key = userId || 'anon'
    if (!pathsCache.has(key)) pathsCache.set(key, buildPaths(userId))
    setState(s => (s.loading ? s : { ...s, loading: true }))
    pathsCache.get(key)
      .then(paths => { if (!cancelled) setState({ paths, loading: false }) })
      .catch(() => { if (!cancelled) setState({ paths: [], loading: false }) })
    return () => { cancelled = true }
  }, [userId])

  return state
}
