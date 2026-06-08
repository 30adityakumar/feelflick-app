// src/features/home/__tests__/homeDerive.test.js
// F4.2 — pure unit coverage for the extracted Home derivation helpers. No render,
// no Supabase, no live services. These lock the BEHAVIOR-PRESERVED move from
// useHomeData.jsx (mood ordering) + sections-top.jsx (seed / shuffle / queue).

import { describe, it, expect, vi, afterEach } from 'vitest'
import {
  ONBOARDING_MOOD_TO_BRIEFING,
  orderBriefingMoodKeys,
  todaySeed,
  shuffleBySeed,
  buildBriefingQueue,
} from '../homeDerive'

// The Briefing's available mood keys (the keys of MOOD_BRIDGE in useHomeData).
const AVAILABLE = ['tender', 'thrilled', 'curious', 'cozy', 'melancholy', 'witty']

afterEach(() => { vi.useRealTimers() })

// ── orderBriefingMoodKeys ─────────────────────────────────────────────────────
describe('orderBriefingMoodKeys', () => {
  it('empty / non-array baseline preserves the available mood-key order', () => {
    expect(orderBriefingMoodKeys([], AVAILABLE)).toEqual(AVAILABLE)
    expect(orderBriefingMoodKeys(undefined, AVAILABLE)).toEqual(AVAILABLE)
    expect(orderBriefingMoodKeys(null, AVAILABLE)).toEqual(AVAILABLE)
  })
  it('a known onboarding mood moves its mapped Briefing mood to the front', () => {
    // 'cozy' → 'cozy'; expect cozy first, then the rest in original order.
    expect(orderBriefingMoodKeys(['cozy'], AVAILABLE)).toEqual(['cozy', 'tender', 'thrilled', 'curious', 'melancholy', 'witty'])
    // 'wired' → 'curious'
    expect(orderBriefingMoodKeys(['wired'], AVAILABLE)).toEqual(['curious', 'tender', 'thrilled', 'cozy', 'melancholy', 'witty'])
  })
  it('multiple known baseline moods keep their mapped order, then the remainder', () => {
    // tender→tender, fun→witty  →  [tender, witty, ...remaining-in-original-order]
    expect(orderBriefingMoodKeys(['tender', 'fun'], AVAILABLE)).toEqual(['tender', 'witty', 'thrilled', 'curious', 'cozy', 'melancholy'])
  })
  it('unknown onboarding keys are ignored (discarded mappings)', () => {
    expect(orderBriefingMoodKeys(['nope', 'cozy', 'xyz'], AVAILABLE)).toEqual(['cozy', 'tender', 'thrilled', 'curious', 'melancholy', 'witty'])
  })
  it('available moods absent from the baseline are appended in original order', () => {
    const out = orderBriefingMoodKeys(['fun'], AVAILABLE) // fun→witty first
    expect(out[0]).toBe('witty')
    expect(out.slice(1)).toEqual(['tender', 'thrilled', 'curious', 'cozy', 'melancholy'])
  })
  it('does not mutate its input arrays', () => {
    const baseline = ['cozy', 'fun']
    const available = [...AVAILABLE]
    const baseSnap = [...baseline]
    const availSnap = [...available]
    orderBriefingMoodKeys(baseline, available)
    expect(baseline).toEqual(baseSnap)
    expect(available).toEqual(availSnap)
  })
  // NOTE: duplicate onboarding mappings (e.g. wired+mythic both → curious) remain
  // behavior-preserved (NOT deduplicated) — deferred to a later intentional phase.
  it('preserves the current duplicate-mapping behavior (no dedup in F4.2)', () => {
    // wired→curious and mythic→curious: 'curious' appears once at the front
    // (filtered out of the remainder), exactly as the inline block did.
    expect(ONBOARDING_MOOD_TO_BRIEFING.wired).toBe('curious')
    expect(ONBOARDING_MOOD_TO_BRIEFING.mythic).toBe('curious')
    expect(orderBriefingMoodKeys(['wired', 'mythic'], AVAILABLE))
      .toEqual(['curious', 'curious', 'tender', 'thrilled', 'cozy', 'melancholy', 'witty'])
  })
})

// ── todaySeed ─────────────────────────────────────────────────────────────────
describe('todaySeed', () => {
  it('returns an 8-digit YYYYMMDD UTC integer', () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date('2026-02-13T15:00:00Z'))
    expect(todaySeed()).toBe(20260213)
    expect(String(todaySeed())).toHaveLength(8)
  })
  it('is stable across the same UTC day', () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date('2026-02-13T00:00:01Z'))
    const a = todaySeed()
    vi.setSystemTime(new Date('2026-02-13T23:59:59Z'))
    expect(todaySeed()).toBe(a)
  })
  it('changes at the UTC date rollover, not local midnight', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-02-13T23:30:00Z'))
    const before = todaySeed()
    vi.setSystemTime(new Date('2026-02-14T00:30:00Z')) // crossed UTC midnight
    const after = todaySeed()
    expect(before).toBe(20260213)
    expect(after).toBe(20260214)
    expect(after).not.toBe(before)
  })
  it('depends on the UTC date, not the machine timezone (uses getUTC*)', () => {
    // A fixed UTC instant yields the same UTC date regardless of local TZ.
    vi.useFakeTimers(); vi.setSystemTime(new Date('2026-12-31T23:59:00Z'))
    expect(todaySeed()).toBe(20261231)
  })
})

// ── shuffleBySeed ─────────────────────────────────────────────────────────────
describe('shuffleBySeed', () => {
  const base = () => [1, 2, 3, 4, 5, 6, 7, 8]
  it('same input + same seed is deterministic', () => {
    expect(shuffleBySeed(base(), 12345)).toEqual(shuffleBySeed(base(), 12345))
  })
  it('different seeds produce different orderings', () => {
    expect(shuffleBySeed(base(), 111)).not.toEqual(shuffleBySeed(base(), 999))
  })
  it('preserves membership — every element exactly once', () => {
    const out = shuffleBySeed(base(), 4242)
    expect([...out].sort((a, b) => a - b)).toEqual(base())
    expect(out).toHaveLength(8)
  })
  it('does not mutate the input array', () => {
    const arr = base()
    const snap = [...arr]
    shuffleBySeed(arr, 777)
    expect(arr).toEqual(snap)
  })
  it('seed 0 returns the input order unchanged (current behavior)', () => {
    const arr = base()
    expect(shuffleBySeed(arr, 0)).toEqual(arr)
  })
})

// ── buildBriefingQueue ────────────────────────────────────────────────────────
describe('buildBriefingQueue', () => {
  const films = () => [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }]
  const SEED = 9999

  it('with no hidden ids returns the seeded order', () => {
    expect(buildBriefingQueue(films(), SEED, new Set())).toEqual(shuffleBySeed(films(), SEED))
  })
  it('removes hidden ids and keeps the deterministic shuffled order', () => {
    const expected = shuffleBySeed(films(), SEED).filter(f => f.id !== 2 && f.id !== 4)
    expect(buildBriefingQueue(films(), SEED, new Set([2, 4]))).toEqual(expected)
  })
  it('returns an empty queue when all ids are hidden', () => {
    expect(buildBriefingQueue(films(), SEED, new Set([1, 2, 3, 4, 5]))).toEqual([])
  })
  it('ignores unknown hidden ids (keeps all valid films)', () => {
    expect(buildBriefingQueue(films(), SEED, new Set([99, 100]))).toEqual(shuffleBySeed(films(), SEED))
  })
  it('accepts an array form of hidden ids too', () => {
    expect(buildBriefingQueue(films(), SEED, [2]).every(f => f.id !== 2)).toBe(true)
  })
  it('preserves film object identity (no copies)', () => {
    const src = films()
    const out = buildBriefingQueue(src, SEED, new Set())
    expect(out.every(f => src.includes(f))).toBe(true)
  })
  it('does not mutate the input films array or the hidden-id Set', () => {
    const src = films()
    const srcSnap = src.map(f => ({ ...f }))
    const hidden = new Set([2])
    buildBriefingQueue(src, SEED, hidden)
    expect(src).toEqual(srcSnap)
    expect([...hidden]).toEqual([2])
  })
  it('handles a null/undefined films input safely', () => {
    expect(buildBriefingQueue(undefined, SEED, new Set())).toEqual([])
    expect(buildBriefingQueue(null, SEED, new Set())).toEqual([])
  })
})
