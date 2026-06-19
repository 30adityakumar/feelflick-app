import { describe, expect, it } from 'vitest'

import { HP, HP_GRAD, C, RADIUS, SHADOW, SURFACE, SPACE, LAYOUT, GUTTER, TYPE, MOTION } from '../tokens'

// Brand-vs-semantic token contract (F3 hardening) — see
// docs/design-system-hardening-f3.md. Guards two invariants: the single brand
// gradient never drifts, and the load-bearing semantic accents are never removed
// (they back gold rating-stars, destructive states, and success/status badges).
describe('design tokens — brand vs semantic contract', () => {
  it('exposes the single brand gradient (purple-600 → pink-500)', () => {
    expect(HP_GRAD).toBe('linear-gradient(135deg, #9333ea 0%, #ec4899 100%)')
  })

  it('neutralises the legacy purple/pink hues to canonical theme tokens (with legacy fallback)', () => {
    // Website-wide globalization: the legacy brand hues no longer carry purple/pink —
    // they resolve to the canonical ivory tiers under .theme-thoughtful, reverting to
    // the historical hue only when the theme class is removed (rollback fallback).
    expect(HP.purple).toMatch(/^var\(--color-text-secondary,/)
    expect(HP.pink).toMatch(/^var\(--color-text-secondary,/)
    expect(HP.purpleDeep).toMatch(/^var\(--color-text-muted,/)
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

  it('focus ring uses the neutral paper-white focus token, never a brand hue', () => {
    // Focus is a neutral, high-contrast paper-white signal — never the coral accent
    // and never the legacy purple/pink. Locked so focus can never become brand-colored.
    expect(SHADOW.focus).toContain('--color-focus-ring')
    expect(SHADOW.focus).not.toMatch(/167,\s*139,\s*250|a78bfa|9333ea|ec4899|e5636f|dd4e83|b83d4f/i)
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

describe('design tokens — SPACE rhythm scale (F11B.2)', () => {
  it('pins the gutter + section vertical scale + stack gaps', () => {
    expect(SPACE).toEqual({
      gutter: 88,
      gutterSm: 32,
      sectionLg: 80,
      section: 72,
      sectionMd: 56,
      sectionSm: 48,
      sectionXs: 40,
      stack: 24,
      stackSm: 16,
      stackXs: 12,
    })
  })

  it('section scale descends from lg→xs (named hierarchy, not flat)', () => {
    const ramp = ['sectionLg', 'section', 'sectionMd', 'sectionSm', 'sectionXs']
    for (let i = 1; i < ramp.length; i++) {
      expect(SPACE[ramp[i]]).toBeLessThan(SPACE[ramp[i - 1]])
    }
  })
})

describe('layout tokens — LAYOUT / GUTTER (F12B)', () => {
  it('pins the page-width scale (narrow < app < wide)', () => {
    expect(LAYOUT).toEqual({ pageMax: 1280, pageWide: 1440, pageNarrow: 1080 })
    expect(LAYOUT.pageNarrow).toBeLessThan(LAYOUT.pageMax)
    expect(LAYOUT.pageMax).toBeLessThan(LAYOUT.pageWide)
  })

  it('pins the responsive gutter scale, aligned to SPACE', () => {
    expect(GUTTER).toEqual({ mobile: 20, tablet: 32, desktop: 88 })
    expect(GUTTER.tablet).toBe(SPACE.gutterSm) // 32
    expect(GUTTER.desktop).toBe(SPACE.gutter) // 88
  })
})

describe('type-scale tokens — TYPE (F12B)', () => {
  it('exposes pageTitle/sectionTitle/cardTitle/body, each fully specified', () => {
    for (const key of ['pageTitle', 'sectionTitle', 'cardTitle', 'body']) {
      const t = TYPE[key]
      expect(t).toBeTruthy()
      expect(t).toHaveProperty('size')
      expect(t).toHaveProperty('weight')
      expect(t).toHaveProperty('spacing')
      expect(t).toHaveProperty('lineHeight')
    }
  })

  it('uses non-hero weights (no font-black / weight 900)', () => {
    for (const key of ['pageTitle', 'sectionTitle', 'cardTitle', 'body']) {
      expect(TYPE[key].weight).toBeLessThan(900)
    }
  })
})

describe('motion tokens — MOTION (F12F)', () => {
  it('pins the duration + ease + press vocabulary', () => {
    expect(MOTION).toEqual({
      fast: '120ms',
      base: '180ms',
      slow: '240ms',
      ease: 'cubic-bezier(0.22, 1, 0.36, 1)',
      press: 'translateY(1px)',
    })
  })

  it('durations ascend fast < base < slow', () => {
    const ms = (s) => parseFloat(s)
    expect(ms(MOTION.fast)).toBeLessThan(ms(MOTION.base))
    expect(ms(MOTION.base)).toBeLessThan(ms(MOTION.slow))
  })
})
