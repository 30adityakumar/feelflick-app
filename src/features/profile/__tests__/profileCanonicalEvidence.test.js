import { describe, it, expect, afterEach, vi } from 'vitest'
import { dedupeHistoryByMovie } from '@/shared/lib/canonicalHistory'
import { deriveUser, deriveStats, deriveDirectors, deriveDecades, deriveRuntime, deriveDaypart, deriveYIR, deriveTrajectory } from '../derive'
import { aggregateWatchHistorySignals } from '../buildSummaryRequest'

// F7.3 — duplicate-resistance. Film A is logged via three watch paths (onboarding, Discover,
// Home) with distinct watched_at; Film B once. Once Profile feeds CANONICAL history to every
// derivation, Film A contributes exactly once everywhere — and the raw (un-deduped) input is
// shown to inflate, proving the canonical boundary is what corrects it.

const movieA = { director_name: 'Mara Vance', runtime: 120, mood_tags: ['tender'], tone_tags: ['quiet'], fit_profile: 'slow-burn', release_date: '2021-04-01', title: 'Lantern Hill' }
const movieB = { director_name: 'Cole Park', runtime: 90, mood_tags: ['cozy'], tone_tags: ['warm'], fit_profile: 'easy', release_date: '2019-01-01', title: 'Winter Tenants' }
const A = (watched_at, src) => ({ movie_id: 1, watched_at, id: `a-${src}`, source: src, movies: movieA })
const B = { movie_id: 2, watched_at: '2026-03-05T12:00:00Z', id: 'b', movies: movieB }

const dupRows = [
  A('2026-03-01T20:00:00Z', 'onboarding'),
  A('2026-03-02T20:00:00Z', 'discover_marked'),
  A('2026-03-03T20:00:00Z', 'home'),   // latest A
  B,
]
const canonical = dedupeHistoryByMovie(dupRows)   // → [A(Mar 3), B]

afterEach(() => vi.useRealTimers())

describe('Profile derivations count each film once from canonical history (F7.3)', () => {
  it('canonical history has one row per film, at A\'s latest watch', () => {
    expect(canonical).toHaveLength(2)
    expect(canonical.find(r => r.movie_id === 1)).toMatchObject({ watched_at: '2026-03-03T20:00:00Z', source: 'home' })
  })

  it('Quick stats: films logged + hours count A once (raw input would inflate)', () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date('2026-03-20T12:00:00Z'))
    const sCanon = deriveStats({ history: canonical, ratings: [], fingerprint: null })
    const sRaw = deriveStats({ history: dupRows, ratings: [], fingerprint: null })
    expect(sCanon.filmsLogged).toBe(2)              // not 4
    expect(sCanon.hoursWatched).toBe(4)             // round((120+90)/60) = 4, not round(450/60)=8
    expect(sCanon.filmsThisMonth).toBe(2)           // A (Mar) + B (Mar), once each
    expect(sRaw.filmsLogged).toBe(4)                // raw inflates → boundary matters
    expect(sRaw.hoursWatched).toBe(8)
  })

  it('deriveUser films logged counts A once', () => {
    expect(deriveUser({ authUser: null, dbUser: null, history: canonical }).filmsLogged).toBe(2)
    expect(deriveUser({ authUser: null, dbUser: null, history: dupRows }).filmsLogged).toBe(4)
  })

  it('Director affinity: a film watched 3× does NOT become a false "signature director"', () => {
    const dCanon = deriveDirectors({ history: canonical, ratingsByMovieId: new Map() })
    const dRaw = deriveDirectors({ history: dupRows, ratingsByMovieId: new Map() })
    // raw input: A's director shows 3 films (the ≥2 "signature" gate is met by ONE duplicated film)
    expect(dRaw.find(d => d.name === 'Mara Vance')?.films).toBe(3)
    // canonical: A counts once (< 2) → correctly NOT a signature director
    expect(dCanon.find(d => d.name === 'Mara Vance')).toBeUndefined()
  })

  it('Decades / runtime / daypart / YIR / trajectory: fed canonical = fed one-row-per-film', () => {
    const uniques = [canonical.find(r => r.movie_id === 1), canonical.find(r => r.movie_id === 2)]
    for (const derive of [deriveDecades, deriveRuntime, deriveDaypart, deriveYIR, deriveTrajectory]) {
      expect(derive({ history: canonical })).toEqual(derive({ history: uniques }))
      // and the raw (duplicated) input produces a different result → duplicates were inflating
      expect(derive({ history: dupRows })).not.toEqual(derive({ history: canonical }))
    }
  })

  it('Generated-summary evidence: each title + tag appears once', () => {
    const sigCanon = aggregateWatchHistorySignals(canonical)
    const sigRaw = aggregateWatchHistorySignals(dupRows)
    expect(sigCanon.watchedFilms).toEqual(['Lantern Hill', 'Winter Tenants'])      // A once
    expect(sigRaw.watchedFilms.filter(t => t === 'Lantern Hill')).toHaveLength(3)  // raw repeats A ×3
    const tenderCanon = sigCanon.taggedTasteSignature.topMoodTags.find(t => t.tag === 'tender')
    expect(tenderCanon.count).toBe(1)
  })
})
