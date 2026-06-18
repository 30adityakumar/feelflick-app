/* global process */
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { TS_TOKENS, TS_PAGE_DEPTH } from '../tokens'

const EXPECTED_KEYS = [
  'canvas', 'surface1', 'surface2', 'surfaceRaised',
  'textPrimary', 'textSecondary', 'textMuted',
  'borderSubtle', 'borderStrong',
  'actionPrimaryFill', 'actionPrimaryText', 'focus',
  'brandRose', 'brandRoseContrast',
]
const toCssVar = (k) => '--ts-' + k.replace(/([A-Z])/g, '-$1').replace(/([a-z])(\d)/g, '$1-$2').toLowerCase()

// Stage 1 scoped token contract. Pins the accepted Thoughtful Seatmate foundation
// values, guards the "one restrained solid rose" rule, and asserts the forbidden
// token categories (gradient / decision-signal / contextual) do NOT exist.
describe('Thoughtful Seatmate Stage 1 — TS_TOKENS contract', () => {
  it('pins the exact accepted foundation values', () => {
    expect(TS_TOKENS).toEqual({
      canvas: '#15120f',
      surface1: '#1d1814',
      surface2: '#241e19',
      surfaceRaised: '#2d2621',
      textPrimary: '#f3ecdf',
      textSecondary: '#beb8ad',
      textMuted: '#8d887f',
      borderSubtle: '#302c28',
      borderStrong: '#46423d',
      actionPrimaryFill: '#efe7d7',
      actionPrimaryText: '#221b13',
      focus: '#f3ecdf',
      brandRose: '#dd4e83',
      brandRoseContrast: '#c0356c',
    })
  })

  it('exposes exactly the 14 expected keys (no extra/forbidden token added by name)', () => {
    expect(Object.keys(TS_TOKENS).sort()).toEqual([...EXPECTED_KEYS].sort())
    for (const k of Object.keys(TS_TOKENS)) {
      expect(k).not.toMatch(/gradient|decision|signal|context|aura|plum|purple|pink/i)
    }
  })

  it('keeps exactly one rose accent (+ a contrast variant, not a second identity)', () => {
    expect(TS_TOKENS.brandRose).toBe('#dd4e83')
    expect(TS_TOKENS.brandRoseContrast).toBe('#c0356c')
    const roseKeys = Object.keys(TS_TOKENS).filter((k) => /rose/i.test(k))
    expect(roseKeys.sort()).toEqual(['brandRose', 'brandRoseContrast'])
  })

  it('defines NO gradient / decision-signal / contextual-color token', () => {
    const keys = Object.keys(TS_TOKENS)
    expect(keys.some((k) => /gradient/i.test(k))).toBe(false)
    expect(keys.some((k) => /decision/i.test(k))).toBe(false)
    expect(keys.some((k) => /context|aura|extract/i.test(k))).toBe(false)
    // and never the legacy purple/pink/plum hues as target tokens
    const vals = Object.values(TS_TOKENS).map((v) => v.toLowerCase())
    expect(vals).not.toContain('#9333ea')
    expect(vals).not.toContain('#ec4899')
    expect(vals).not.toContain('#a78bfa')
  })

  it('decision/primary are neutral ivory — never rose', () => {
    expect(TS_TOKENS.focus).toBe('#f3ecdf') // ivory, not rose
    expect(TS_TOKENS.actionPrimaryFill).not.toBe(TS_TOKENS.brandRose)
    expect(TS_TOKENS.actionPrimaryFill).not.toBe(TS_TOKENS.brandRoseContrast)
  })

  it('exposes neutral depth recipes that are NOT the legacy brand gradient', () => {
    expect(TS_PAGE_DEPTH.radial).toContain('radial-gradient')
    expect(TS_PAGE_DEPTH.linear).toContain('linear-gradient')
    expect(TS_PAGE_DEPTH.none).toBe('#15120f')
    for (const recipe of Object.values(TS_PAGE_DEPTH)) {
      // graphite surfaces only — no legacy purple/pink stops
      expect(recipe.toLowerCase()).not.toContain('9333ea')
      expect(recipe.toLowerCase()).not.toContain('ec4899')
    }
    expect(TS_PAGE_DEPTH.radial).toContain('#241e19')
    expect(TS_PAGE_DEPTH.radial).toContain('#15120f')
  })
})

// Website-wide globalization: the canonical --color-* tokens are now the single
// source of truth (under .theme-thoughtful), and --ts-* alias them 1:1 — so the
// pilot namespace can never drift from canonical, and changing a canonical value
// propagates everywhere. foundations.css must mirror TS_TOKENS via the canonical
// --color-* tokens.
describe('foundations.css mirrors TS_TOKENS via the canonical --color-* tokens', () => {
  const css = readFileSync(join(process.cwd(), 'src/shared/ui/thoughtful-seatmate/foundations.css'), 'utf8')
  const colorMap = Object.fromEntries(
    [...css.matchAll(/(--color-[a-z0-9-]+)\s*:\s*([^;]+);/gi)].map(([, name, val]) => [name, val.trim()])
  )
  const toColorVar = (k) => toCssVar(k).replace('--ts-', '--color-')

  it('defines every canonical --color-* token with the exact TS_TOKENS value', () => {
    for (const k of EXPECTED_KEYS) {
      expect(colorMap[toColorVar(k)], k).toBe(TS_TOKENS[k])
    }
  })

  it('aliases every --ts-* token to its canonical --color-* (canonical contract, no independent values)', () => {
    for (const k of EXPECTED_KEYS) {
      const tsVar = toCssVar(k)
      const colorVar = toColorVar(k)
      expect(css, tsVar).toMatch(new RegExp(`${tsVar}\\s*:\\s*var\\(${colorVar}`))
    }
  })

  it('defines no forbidden --ts-* token in CSS (gradient/decision/contextual/purple/plum)', () => {
    for (const [name] of [...css.matchAll(/(--ts-[a-z0-9-]+)\s*:/gi)]) {
      expect(name).not.toMatch(/gradient|decision|signal|context|aura|plum|purple|pink/i)
    }
  })

  it('keeps the canonical tokens out of :root (theme is class-scoped + removable for rollback)', () => {
    expect(css).toContain('.theme-thoughtful {')
    expect(css).not.toMatch(/:root\s*\{[^}]*--(ts|color)-/)
  })
})
