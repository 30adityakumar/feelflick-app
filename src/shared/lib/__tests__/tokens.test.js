import { describe, expect, it } from 'vitest'

import { HP, HP_GRAD, C, RADIUS, SHADOW, SURFACE } from '../tokens'

// Brand-vs-semantic token contract (F3 hardening) — see
// docs/design-system-hardening-f3.md. Guards two invariants: the single brand
// gradient never drifts, and the load-bearing semantic accents are never removed
// (they back gold rating-stars, destructive states, and success/status badges).
describe('design tokens — brand vs semantic contract', () => {
  it('exposes the single brand gradient (purple-600 → pink-500)', () => {
    expect(HP_GRAD).toBe('linear-gradient(135deg, #9333ea 0%, #ec4899 100%)')
  })

  it('keeps the brand identity hues (purple + pink)', () => {
    expect(HP.purple).toBeTruthy()
    expect(HP.pink).toBe('#EC4899')
    expect(HP.purpleDeep).toBeTruthy()
  })

  it('keeps the load-bearing semantic accents (amber / red / green)', () => {
    // NOT brand colors, but relied on app-wide: removing them breaks gold stars,
    // destructive/error states, and success/public/watched badges.
    expect(HP.amber).toBeTruthy()
    expect(HP.red).toBeTruthy()
    expect(HP.green).toBeTruthy()
  })

  it('derives the landing palette C from HP (no divergent brand hexes)', () => {
    expect(C.purple).toBe(HP.purple)
    expect(C.pink).toBe(HP.pink)
  })
})

// F11B.1 — the new shape/elevation/surface scales. Pin them so later waves can
// migrate ad-hoc inline radii/shadows onto a stable target, and so an accidental
// removal/rename is caught.
describe('design tokens — RADIUS scale (F11B.1)', () => {
  it('is the pinned scale', () => {
    expect(RADIUS).toEqual({ xs: 4, sm: 6, md: 8, lg: 12, xl: 16, pill: 9999 })
  })

  it('ascends and ends in a pill', () => {
    const ramp = ['xs', 'sm', 'md', 'lg', 'xl']
    for (let i = 1; i < ramp.length; i++) {
      expect(RADIUS[ramp[i]]).toBeGreaterThan(RADIUS[ramp[i - 1]])
    }
    expect(RADIUS.pill).toBeGreaterThan(RADIUS.xl)
  })
})

describe('design tokens — SHADOW (F11B.1)', () => {
  it('exposes exactly card/hover/focus', () => {
    expect(Object.keys(SHADOW).sort()).toEqual(['card', 'focus', 'hover'])
  })

  it('focus ring uses the brand purple (#A78BFA = rgb 167,139,250)', () => {
    expect(SHADOW.focus).toContain('167,139,250')
  })
})

describe('design tokens — SURFACE (F11B.1)', () => {
  it('aliases existing surface values (introduces no new palette)', () => {
    expect(SURFACE.base).toBe(HP.bgDeep)
    expect(SURFACE.panel).toBe(HP.panel)
    expect(SURFACE.card).toBe(HP.panel)
    expect(SURFACE.elevated).toBe(C.bgLight)
  })
})
