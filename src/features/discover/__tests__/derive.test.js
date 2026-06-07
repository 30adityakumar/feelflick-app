// src/features/discover/__tests__/derive.test.js
// F3.2 — contract tests for the pure Discover derivation helpers extracted from
// Discover.jsx. These lock the TRUST-CRITICAL behaviour before the F3 redesign:
// the honest "Because…" line (null-not-fabricate), the Stage-3 mood-fit floors +
// session-shown demotion, the onboarding→Discover mood bridge, the constellation
// naming, and the Stage-2 predicted defaults. Values asserted here are FROZEN
// product contracts (F3.2 brief).

import { describe, it, expect } from 'vitest'
import {
  MOODS,
  ONBOARDING_TO_DISCOVER,
  constellationName,
  buildBecauseLine,
  diversifyTop3,
  predictDiscoverDefaults,
  TOP_MOOD_FIT_FLOOR,
  ALT_MOOD_FIT_FLOOR,
  SESSION_SHOWN_PENALTY,
} from '../derive'

// ── frozen floor/penalty values ───────────────────────────────────────────────
describe('frozen ranking constants', () => {
  it('floors + session penalty match the documented contract', () => {
    expect(TOP_MOOD_FIT_FLOOR).toBe(0.35)
    expect(ALT_MOOD_FIT_FLOOR).toBe(0.25)
    expect(SESSION_SHOWN_PENALTY).toBe(30)
  })
})

// ── MOODS model ───────────────────────────────────────────────────────────────
describe('MOODS — the 8-axis mood vocabulary', () => {
  it('exposes the eight documented mood ids', () => {
    expect(MOODS.map(m => m.id)).toEqual(
      ['tender', 'tense', 'slow', 'cerebral', 'cozy', 'bittersweet', 'mythic', 'restless'],
    )
  })
  it('every mood carries id/label/hex/x/y/hint', () => {
    MOODS.forEach(m => {
      expect(m).toMatchObject({
        id: expect.any(String), label: expect.any(String), hex: expect.stringMatching(/^#/),
        x: expect.any(Number), y: expect.any(Number), hint: expect.any(String),
      })
    })
  })
})

// ── constellationName ─────────────────────────────────────────────────────────
describe('constellationName', () => {
  it('empty selection → "Your night"', () => {
    expect(constellationName([])).toBe('Your night')
  })
  it('one known mood → its documented single name', () => {
    expect(constellationName(['tender'])).toBe('Soft Focus')
    expect(constellationName(['cozy'])).toBe('Comfort Reel')
  })
  it('two known moods are order-independent', () => {
    expect(constellationName(['slow', 'tender'])).toBe('The Quiet Ache')
    expect(constellationName(['tender', 'slow'])).toBe('The Quiet Ache')
  })
  it('two moods without a named combination use the "label × label" fallback (input order)', () => {
    expect(constellationName(['tender', 'tense'])).toBe('Tender × Tense')
  })
  it('three moods use the "A, B & C" label-list format', () => {
    expect(constellationName(['tender', 'tense', 'slow'])).toBe('Tender, Tense & Slow-burn')
  })
  it('does not mutate the input array', () => {
    const sel = ['tender', 'slow']
    const snapshot = [...sel]
    constellationName(sel)
    expect(sel).toEqual(snapshot)
  })
})

// ── ONBOARDING_TO_DISCOVER ────────────────────────────────────────────────────
describe('ONBOARDING_TO_DISCOVER bridge', () => {
  it('locks all six onboarding→Discover mood mappings', () => {
    expect(ONBOARDING_TO_DISCOVER).toEqual({
      cozy: 'cozy',
      wired: 'cerebral',
      tender: 'tender',
      fun: 'restless',
      tense: 'tense',
      mythic: 'mythic',
    })
  })
})

// ── buildBecauseLine ──────────────────────────────────────────────────────────
const dir = (name) => ({ affinities: { directors: [{ name }] } })

describe('buildBecauseLine — honest "Because…" proof', () => {
  it('no film → null', () => {
    expect(buildBecauseLine({ film: null, profile: {}, selected: ['tender'] })).toBeNull()
  })

  it('rated director affinity wins (top slot)', () => {
    const film = { dir: 'Bong Joon-ho' }
    expect(buildBecauseLine({ film, profile: dir('bong joon-ho'), selected: ['tender'] }))
      .toBe('Because Bong Joon-ho reads the room the way you do.')
  })

  it('focused pick uses a valid constellation when no director affinity', () => {
    const film = { dir: 'Nobody' }
    expect(buildBecauseLine({ film, profile: {}, selected: ['tender'] }))
      .toBe('For your soft focus night.')
  })

  it('focused pick falls back to the primary selected mood (× constellation skipped)', () => {
    const film = { dir: 'Nobody' }
    // ['tender','tense'] has no named combo → "Tender × Tense" → skipped → primary mood
    expect(buildBecauseLine({ film, profile: {}, selected: ['tender', 'tense'] }))
      .toBe('For your tender night.')
  })

  it('no supported signal → null', () => {
    const film = { dir: 'Nobody' }
    expect(buildBecauseLine({ film, profile: {}, selected: [] })).toBeNull()
  })

  it('alternate uses an evocative real film tag', () => {
    const film = { dir: 'X', year: 2000, _raw: { mood_tags: ['haunting'], tone_tags: [] } }
    expect(buildBecauseLine({ film, profile: {}, selected: ['tender'], isAlt: true }))
      .toBe('A haunting take on your night.')
  })

  it('alternate article handles "A" vs "An"', () => {
    const film = { dir: 'X', year: 2000, _raw: { mood_tags: ['exhilarating'] } }
    expect(buildBecauseLine({ film, profile: {}, selected: ['tender'], isAlt: true }))
      .toBe('An exhilarating take on your night.')
  })

  it('alternate falls back to concrete director + year', () => {
    const film = { dir: 'Celine Song', year: 2023, _raw: { mood_tags: ['dark'] } }
    expect(buildBecauseLine({ film, profile: {}, selected: ['tender'], isAlt: true }))
      .toBe("Celine Song's 2023 register.")
  })

  it('generic tags do NOT generate fabricated evocative language', () => {
    const film = { dir: 'Celine Song', year: 2023, _raw: { mood_tags: ['dark', 'tense'] } }
    const line = buildBecauseLine({ film, profile: {}, selected: ['tender'], isAlt: true })
    expect(line).toBe("Celine Song's 2023 register.")
    expect(line).not.toMatch(/take on your night/)
  })

  it('director affinity still outranks alternate-specific signals', () => {
    const film = { dir: 'Bong Joon-ho', year: 2019, _raw: { mood_tags: ['haunting'] } }
    expect(buildBecauseLine({ film, profile: dir('Bong Joon-ho'), selected: ['tender'], isAlt: true }))
      .toBe('Because Bong Joon-ho reads the room the way you do.')
  })

  it('does not mutate the fixture data', () => {
    const film = { dir: 'X', year: 2000, _raw: { mood_tags: ['haunting'], tone_tags: [] } }
    const snap = JSON.parse(JSON.stringify(film))
    const selected = ['tender']
    buildBecauseLine({ film, profile: {}, selected, isAlt: true })
    expect(film).toEqual(snap)
    expect(selected).toEqual(['tender'])
  })
})

// ── diversifyTop3 ─────────────────────────────────────────────────────────────
const film = (id, rank, moodFit, genre) => ({ id, _rankScore: rank, moodFitRaw: moodFit, primary_genre: genre })

describe('diversifyTop3 — mood-fit floors + diversity + session demotion', () => {
  it('null/empty input is returned unchanged', () => {
    expect(diversifyTop3(null)).toBeNull()
    expect(diversifyTop3([])).toEqual([])
  })

  it('a high-rank but below-TOP-floor film cannot become #1 when a qualifying film exists', () => {
    const a = film('a', 100, 0.10, 'Drama')   // top rank, below 0.35 floor
    const b = film('b', 50, 0.50, 'Comedy')    // lower rank, above floor
    const out = diversifyTop3([a, b])
    expect(out[0].id).toBe('b')
  })

  it('top falls back to the overall highest-ranked film when none meet the floor', () => {
    const a = film('a', 100, 0.10, 'Drama')
    const b = film('b', 80, 0.20, 'Comedy')
    const out = diversifyTop3([a, b])
    expect(out[0].id).toBe('a') // highest rank, since nothing clears 0.35
  })

  it('alternates prefer distinct genres among qualifying candidates', () => {
    const a = film('a', 100, 0.9, 'Drama')
    const b = film('b', 90, 0.9, 'Drama')   // same genre as a — should be skipped for slot 2
    const c = film('c', 80, 0.9, 'Comedy')  // new genre — preferred for slot 2
    const out = diversifyTop3([a, b, c])
    expect(out.slice(0, 3).map(f => f.id)).toEqual(['a', 'c', 'b'])
    expect(out[0].primary_genre).toBe('Drama')
    expect(out[1].primary_genre).toBe('Comedy')
  })

  it('never uses a below-ALT-floor film merely to fill a slot', () => {
    const a = film('a', 100, 0.9, 'Drama')
    const b = film('b', 90, 0.10, 'Comedy') // below 0.25 alt floor
    const out = diversifyTop3([a, b])
    // a is the protected top; b stays in the queue tail, NOT promoted into an alt slot
    expect(out[0].id).toBe('a')
    expect(out.indexOf(out.find(f => f.id === 'b'))).toBe(1) // b is just the next queue item, not a "chosen" alt
  })

  it('can return fewer than three protected picks', () => {
    const a = film('a', 100, 0.9, 'Drama')
    const b = film('b', 90, 0.10, 'Comedy') // below alt floor → not a protected alt
    const out = diversifyTop3([a, b])
    expect(out).toHaveLength(2) // all films still present, just no forced 3rd
  })

  it('the session-shown penalty can demote a previously-shown film', () => {
    const a = film('a', 100, 0.9, 'Drama')  // shown → 100 - 30 = 70
    const b = film('b', 80, 0.9, 'Comedy')  // 80
    const out = diversifyTop3([a, b], new Set(['a']))
    expect(out[0].id).toBe('b')
  })

  it('original _rankScore values are not modified', () => {
    const a = film('a', 100, 0.9, 'Drama')
    const b = film('b', 80, 0.9, 'Comedy')
    diversifyTop3([a, b], new Set(['a']))
    expect(a._rankScore).toBe(100)
    expect(b._rankScore).toBe(80)
  })

  it('does not duplicate ids', () => {
    const films = [film('a', 100, 0.9, 'Drama'), film('b', 90, 0.8, 'Comedy'), film('c', 80, 0.7, 'Sci-Fi'), film('d', 70, 0.6, 'Drama')]
    const out = diversifyTop3(films)
    const ids = out.map(f => f.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(ids).toHaveLength(4)
  })

  it('remaining films preserve the reranked queue order after the protected picks', () => {
    const a = film('a', 100, 0.9, 'Drama')
    const b = film('b', 90, 0.9, 'Drama')
    const c = film('c', 80, 0.9, 'Comedy')
    const d = film('d', 70, 0.9, 'Sci-Fi')
    const out = diversifyTop3([a, b, c, d])
    // top: a (Drama), c (Comedy new genre), d (Sci-Fi new genre); tail: b
    expect(out.map(f => f.id)).toEqual(['a', 'c', 'd', 'b'])
  })

  it('does not mutate the input array', () => {
    const films = [film('a', 50, 0.9, 'Drama'), film('b', 100, 0.9, 'Comedy')]
    const snapshot = films.slice()
    diversifyTop3(films)
    expect(films).toEqual(snapshot) // same elements, same order
  })
})

// ── predictDiscoverDefaults ───────────────────────────────────────────────────
describe('predictDiscoverDefaults — heuristic + learned blend', () => {
  it('empty/cold input returns the documented defaults', () => {
    expect(predictDiscoverDefaults({})).toEqual({ intention: 'move', time: 'std', energy: 'steady', who: 'alone' })
  })

  it('every mood maps to its documented intention', () => {
    const map = { cerebral: 'think', slow: 'think', cozy: 'comfort', tense: 'distract', restless: 'distract', tender: 'move', bittersweet: 'move', mythic: 'surprise' }
    for (const [mood, intention] of Object.entries(map)) {
      expect(predictDiscoverDefaults({ selected: [mood] }).intention).toBe(intention)
    }
  })

  it('runtime boundaries map to the correct time band', () => {
    const time = (avg) => predictDiscoverDefaults({ profile: { preferences: { avgRuntime: avg } } }).time
    expect(time(99)).toBe('short')
    expect(time(100)).toBe('std')
    expect(time(130)).toBe('std')
    expect(time(131)).toBe('long')
    expect(time(160)).toBe('long')
    expect(time(161)).toBe('epic')
  })

  it('hour-of-day boundaries map to the correct energy', () => {
    const energy = (h) => predictDiscoverDefaults({ hourOfDay: h }).energy
    expect(energy(3)).toBe('wiped')
    expect(energy(4)).toBe('steady')
    expect(energy(13)).toBe('steady')
    expect(energy(14)).toBe('wired')
    expect(energy(19)).toBe('wired')
    expect(energy(20)).toBe('steady')
    expect(energy(21)).toBe('steady')
    expect(energy(22)).toBe('wiped')
  })

  it('learned data below the trust threshold (3 commits) is ignored', () => {
    const out = predictDiscoverDefaults({ selected: ['tender'], learnedPrefs: { total_commits: 2, intention_counts: { think: 5 } } })
    expect(out.intention).toBe('move') // heuristic (tender→move), NOT learned 'think'
  })

  it('learned data at exactly 3 commits is used', () => {
    const out = predictDiscoverDefaults({
      selected: ['tender'],
      learnedPrefs: { total_commits: 3, intention_counts: { think: 5 }, time_counts: { long: 2 }, energy_counts: { wired: 1 }, who_counts: { partner: 1 } },
    })
    expect(out).toEqual({ intention: 'think', time: 'long', energy: 'wired', who: 'partner' })
  })

  it('learned preferences fall back independently per dimension', () => {
    const out = predictDiscoverDefaults({
      selected: ['tender'],
      hourOfDay: 15, // → wired heuristic
      learnedPrefs: { total_commits: 3, intention_counts: { think: 5 }, time_counts: {}, energy_counts: null, who_counts: {} },
    })
    expect(out.intention).toBe('think')  // learned
    expect(out.time).toBe('std')         // empty learned → heuristic
    expect(out.energy).toBe('wired')     // null learned → heuristic (hour 15)
    expect(out.who).toBe('alone')        // empty learned → heuristic
  })

  it('invalid/empty count objects fall back to the heuristic', () => {
    const out = predictDiscoverDefaults({ selected: ['cozy'], learnedPrefs: { total_commits: 3, intention_counts: {} } })
    expect(out.intention).toBe('comfort') // cozy→comfort heuristic
  })

  it('does not mutate the input objects', () => {
    const learnedPrefs = { total_commits: 3, intention_counts: { think: 5 } }
    const snap = JSON.parse(JSON.stringify(learnedPrefs))
    const selected = ['tender']
    predictDiscoverDefaults({ selected, profile: { preferences: { avgRuntime: 120 } }, hourOfDay: 15, learnedPrefs })
    expect(learnedPrefs).toEqual(snap)
    expect(selected).toEqual(['tender'])
  })
})
