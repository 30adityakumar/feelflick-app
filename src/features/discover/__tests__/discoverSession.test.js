import { describe, it, expect } from 'vitest'
import { initSession, dismiss, setFocus, roleOf, focusedFilm, MAX_SESSION_FILMS } from '../discoverSession'

// Films: pressure axes + novelty 0..100, fit per selected mood 0..1.
function film(over = {}) {
  const { id, rank = 100, moodFitRaw = 0.8, fit = { slow: moodFitRaw },
    intensity = 50, attention = 50, depth = 50, pacing = 50, discovery = 30, polarization = 20, lang = 'en' } = over
  return {
    id, title: `F${id}`, moodFitRaw, _rankScore: rank, fit,
    _raw: { llm_intensity: intensity, llm_attention_demand: attention, llm_emotional_depth: depth, llm_pacing: pacing, discovery_potential: discovery, polarization_score: polarization, original_language: lang },
  }
}
const ctxOf = (ranked) => ({ ranked, selected: ['slow'], profile: { filters: { language_primary: 'en' } }, allowAlternates: true })

// A pool with a clear closest, a gentler (low pressure), a bolder (high novelty),
// plus fresh reserves for promotion/refill.
function pool() {
  return [
    film({ id: 1, rank: 200, moodFitRaw: 0.90, fit: { slow: 0.90 }, intensity: 80, attention: 80, depth: 80, discovery: 20, polarization: 20 }), // closest
    film({ id: 2, rank: 150, moodFitRaw: 0.85, fit: { slow: 0.85 }, intensity: 20, attention: 20, depth: 20, discovery: 20, polarization: 20 }), // gentler
    film({ id: 3, rank: 140, moodFitRaw: 0.85, fit: { slow: 0.85 }, intensity: 80, attention: 80, depth: 80, discovery: 95, polarization: 95, lang: 'ko' }), // bolder
    film({ id: 4, rank: 130, moodFitRaw: 0.84, fit: { slow: 0.84 }, intensity: 18, attention: 18, depth: 18, discovery: 25, polarization: 20 }), // gentler reserve
    film({ id: 5, rank: 120, moodFitRaw: 0.83, fit: { slow: 0.83 }, intensity: 82, attention: 82, depth: 82, discovery: 92, polarization: 90, lang: 'ja' }), // bolder reserve
    film({ id: 6, rank: 110, moodFitRaw: 0.82, fit: { slow: 0.82 }, intensity: 50, attention: 50, depth: 50, discovery: 30, polarization: 20 }), // neutral reserve (lead-able)
  ]
}

describe('initSession', () => {
  it('assigns three distinct roles, focuses the closest, marks them exposed', () => {
    const s = initSession(ctxOf(pool()))
    expect(s.roles.closest.id).toBe(1)
    expect(s.roles.gentler.id).toBeDefined()
    expect(s.roles.bolder.id).toBeDefined()
    expect(new Set([s.roles.closest.id, s.roles.gentler.id, s.roles.bolder.id]).size).toBe(3)
    expect(s.focusId).toBe(1)
    expect(s.roles.closest._placement).toBe('discover_lead')
    expect(s.exposedIds.has(1)).toBe(true)
    expect(s.exhaustion).toBeNull()
  })
})

describe('focus ≠ role', () => {
  it('setFocus changes only focus, never roles or exposure', () => {
    const s = initSession(ctxOf(pool()))
    const altId = s.roles.gentler.id
    const exposedBefore = new Set(s.exposedIds)
    const s2 = setFocus(s, altId)
    expect(s2.focusId).toBe(altId)
    expect(roleOf(s2, altId)).toBe('gentler')          // still gentler, not closest
    expect(s2.roles.closest.id).toBe(1)                 // closest unchanged
    expect([...s2.exposedIds].sort()).toEqual([...exposedBefore].sort()) // no new exposure
    expect(focusedFilm(s2).id).toBe(altId)
  })
})

describe('skip/watch the CLOSEST → promotion', () => {
  it('promotes the strongest remaining as the new closest with promoted placement', () => {
    const s = initSession(ctxOf(pool()))
    const ctx = ctxOf(pool())
    const s2 = dismiss(s, 1, ctx) // remove closest
    expect(s2.roles.closest).toBeTruthy()
    expect(s2.roles.closest.id).not.toBe(1)
    expect(s2.roles.closest._placement).toBe('discover_promoted_lead')
    expect(s2.dismissedIds.has(1)).toBe(true)
    expect(s2.focusId).toBe(s2.roles.closest.id)
    expect(s2.exhaustion).toBeNull()
  })
  it('never returns a dismissed film', () => {
    const s = initSession(ctxOf(pool()))
    const s2 = dismiss(s, 1, ctxOf(pool()))
    const all = [s2.roles.closest?.id, s2.roles.gentler?.id, s2.roles.bolder?.id]
    expect(all).not.toContain(1)
  })
})

describe('skip/watch an ALTERNATE → refill only that role', () => {
  it('keeps the closest, refills only the vacated role, returns focus to closest', () => {
    const s = initSession(ctxOf(pool()))
    const gentlerId = s.roles.gentler.id
    const bolderId = s.roles.bolder.id
    const s2 = dismiss(s, gentlerId, ctxOf(pool()))
    expect(s2.roles.closest.id).toBe(1)                 // closest unchanged (no unrelated promotion)
    expect(s2.roles.bolder.id).toBe(bolderId)           // other alternate untouched
    expect(s2.roles.gentler?.id).not.toBe(gentlerId)    // gentler refilled (or null)
    if (s2.roles.gentler) expect(s2.roles.gentler.id).not.toBe(gentlerId)
    expect(s2.dismissedIds.has(gentlerId)).toBe(true)
    expect(s2.focusId).toBe(1)                          // focus back to closest
    expect(s2.exhaustion).toBeNull()
  })
})

describe('exhaustion reasons', () => {
  it("'cap' when the bounded set is full but more candidates exist", () => {
    // A large fresh pool: keep skipping the closest so each promotion exposes a new
    // unique film. After MAX_SESSION_FILMS unique exposures, the next promotion is a
    // cap stop (not pool).
    const big = Array.from({ length: 20 }, (_, i) => film({
      id: 100 + i, rank: 300 - i, moodFitRaw: 0.9 - i * 0.001, fit: { slow: 0.9 - i * 0.001 },
      intensity: 50, attention: 50, depth: 50, discovery: 30, polarization: 20,
    }))
    let s = initSession({ ranked: big, selected: ['slow'], profile: { filters: { language_primary: 'en' } }, allowAlternates: true })
    let guard = 0
    while (s.roles.closest && s.exhaustion == null && guard++ < 30) {
      s = dismiss(s, s.roles.closest.id, { ranked: big, selected: ['slow'], profile: { filters: { language_primary: 'en' } }, allowAlternates: true })
    }
    expect(s.exhaustion).toBe('cap')
    expect(s.exposedIds.size).toBeLessThanOrEqual(MAX_SESSION_FILMS)
  })

  it("'pool' when no remaining candidate qualifies", () => {
    const small = [
      film({ id: 1, rank: 200, moodFitRaw: 0.9, fit: { slow: 0.9 } }),
      film({ id: 2, rank: 150, moodFitRaw: 0.85, fit: { slow: 0.85 }, intensity: 20, attention: 20, depth: 20 }),
    ]
    let s = initSession(ctxOf(small))
    s = dismiss(s, s.roles.closest.id, ctxOf(small)) // promote 2
    s = dismiss(s, s.roles.closest.id, ctxOf(small)) // nothing left
    expect(s.roles.closest).toBeNull()
    expect(s.exhaustion).toBe('pool')
  })
})
