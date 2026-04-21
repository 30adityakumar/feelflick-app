import { describe, expect, it } from 'vitest'

import {
  SKIP_FLOOR,
  skipRecencyWeight,
  skipSeverity,
  buildSkipWeightMap,
  buildCooldownSet,
} from '../skip-signals'

// ============================================================================
// skipRecencyWeight
// ============================================================================

describe('skipRecencyWeight', () => {
  it('returns 1.0 for skip < 7 days ago', () => {
    const recent = new Date(Date.now() - 3 * 86400000).toISOString()
    expect(skipRecencyWeight(recent)).toBe(1.0)
  })

  it('returns 0.6 for skip 7-29 days ago', () => {
    const mid = new Date(Date.now() - 15 * 86400000).toISOString()
    expect(skipRecencyWeight(mid)).toBe(0.6)
  })

  it('returns 0.3 for skip 30-89 days ago', () => {
    const older = new Date(Date.now() - 60 * 86400000).toISOString()
    expect(skipRecencyWeight(older)).toBe(0.3)
  })

  it('returns SKIP_FLOOR for skip 90+ days ago', () => {
    const old = new Date(Date.now() - 120 * 86400000).toISOString()
    expect(skipRecencyWeight(old)).toBe(SKIP_FLOOR)
  })
})

// ============================================================================
// skipSeverity
// ============================================================================

describe('skipSeverity', () => {
  it('hero skip = 1.5', () => {
    expect(skipSeverity('hero')).toBe(1.5)
  })

  it('row skip = 1.0', () => {
    expect(skipSeverity('quick_picks')).toBe(1.0)
    expect(skipSeverity('hidden_gems')).toBe(1.0)
  })

  it('unknown placement defaults to 1.0', () => {
    expect(skipSeverity('unknown_surface')).toBe(1.0)
  })
})

// ============================================================================
// buildSkipWeightMap
// ============================================================================

describe('buildSkipWeightMap', () => {
  it('returns empty map for no skips', () => {
    const rows = [
      { movie_id: 1, placement: 'hero', shown_at: new Date().toISOString(), skipped: false },
    ]
    expect(buildSkipWeightMap(rows).size).toBe(0)
  })

  it('aggregates multiple skips for same movie', () => {
    const recent = new Date(Date.now() - 2 * 86400000).toISOString()
    const rows = [
      { movie_id: 1, placement: 'hero', shown_at: recent, skipped: true },
      { movie_id: 1, placement: 'quick_picks', shown_at: recent, skipped: true },
    ]
    const map = buildSkipWeightMap(rows)
    // hero: 1.0 * 1.5 = 1.5, row: 1.0 * 1.0 = 1.0, total = 2.5
    expect(map.get(1)).toBe(2.5)
  })

  it('applies recency decay to older skips', () => {
    const thirtyDaysAgo = new Date(Date.now() - 40 * 86400000).toISOString()
    const rows = [
      { movie_id: 2, placement: 'quick_picks', shown_at: thirtyDaysAgo, skipped: true },
    ]
    const map = buildSkipWeightMap(rows)
    // 0.3 * 1.0 = 0.3
    expect(map.get(2)).toBe(0.3)
  })

  it('hero skip has higher weight than row skip at same recency', () => {
    const recent = new Date(Date.now() - 1 * 86400000).toISOString()
    const heroRows = [{ movie_id: 1, placement: 'hero', shown_at: recent, skipped: true }]
    const rowRows = [{ movie_id: 2, placement: 'quick_picks', shown_at: recent, skipped: true }]
    const heroMap = buildSkipWeightMap(heroRows)
    const rowMap = buildSkipWeightMap(rowRows)
    expect(heroMap.get(1)).toBeGreaterThan(rowMap.get(2))
  })
})

// ============================================================================
// buildCooldownSet
// ============================================================================

describe('buildCooldownSet', () => {
  it('hero skipped < 3d ago → in heroCooldown', () => {
    const rows = [
      { movie_id: 1, placement: 'hero', shown_at: new Date(Date.now() - 2 * 86400000).toISOString(), skipped: true },
    ]
    const { heroCooldown } = buildCooldownSet(rows)
    expect(heroCooldown.has(1)).toBe(true)
  })

  it('hero skipped > 3d ago → not in heroCooldown', () => {
    const rows = [
      { movie_id: 1, placement: 'hero', shown_at: new Date(Date.now() - 5 * 86400000).toISOString(), skipped: true },
    ]
    const { heroCooldown } = buildCooldownSet(rows)
    expect(heroCooldown.has(1)).toBe(false)
  })

  it('hero shown but NOT skipped → not in cooldown', () => {
    const rows = [
      { movie_id: 1, placement: 'hero', shown_at: new Date(Date.now() - 1 * 86400000).toISOString(), skipped: false },
    ]
    const { heroCooldown, rowCooldown } = buildCooldownSet(rows)
    expect(heroCooldown.has(1)).toBe(false)
    expect(rowCooldown.has(1)).toBe(false)
  })

  it('any surface skipped < 2d ago → in rowCooldown', () => {
    const rows = [
      { movie_id: 2, placement: 'quick_picks', shown_at: new Date(Date.now() - 1 * 86400000).toISOString(), skipped: true },
    ]
    const { rowCooldown } = buildCooldownSet(rows)
    expect(rowCooldown.has(2)).toBe(true)
  })

  it('any surface skipped > 2d ago → not in rowCooldown', () => {
    const rows = [
      { movie_id: 2, placement: 'quick_picks', shown_at: new Date(Date.now() - 3 * 86400000).toISOString(), skipped: true },
    ]
    const { rowCooldown } = buildCooldownSet(rows)
    expect(rowCooldown.has(2)).toBe(false)
  })

  it('separates hero and row cooldowns correctly', () => {
    const rows = [
      { movie_id: 1, placement: 'hero', shown_at: new Date(Date.now() - 2.5 * 86400000).toISOString(), skipped: true },
      { movie_id: 2, placement: 'quick_picks', shown_at: new Date(Date.now() - 1 * 86400000).toISOString(), skipped: true },
    ]
    const { heroCooldown, rowCooldown } = buildCooldownSet(rows)
    // Movie 1: hero skipped 2.5d ago → heroCooldown yes (<3d), rowCooldown no (>2d)
    expect(heroCooldown.has(1)).toBe(true)
    expect(rowCooldown.has(1)).toBe(false)
    // Movie 2: row skipped 1d ago → heroCooldown no (not hero), rowCooldown yes
    expect(heroCooldown.has(2)).toBe(false)
    expect(rowCooldown.has(2)).toBe(true)
  })
})
