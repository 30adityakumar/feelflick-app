/* global process */
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { TS_TOKENS, TS_PAGE_DEPTH, CANONICAL_THEME } from '../tokens'

// Adaptive Editorial Cinema (ADR 021) token contract. Pins the accepted deep-ink /
// paper-white / coral-accent foundation values, guards the canonical contract, and
// asserts the forbidden token categories (gradient / decision-signal / contextual /
// purple-pink target hues) do NOT exist. The CSS mirror (foundations.css) is
// drift-tested against this JS source below.

const EXPECTED_KEYS = [
  'canvas', 'surface1', 'surface2', 'surfaceRaised',
  'textPrimary', 'textSecondary', 'textMuted',
  'borderSubtle', 'borderStrong',
  'actionPrimaryFill', 'actionPrimaryText', 'focus',
  'brandAccent', 'brandAccentText', 'brandAccentStrong',
]
const toTsVar = (k) => '--ts-' + k.replace(/([A-Z])/g, '-$1').replace(/([a-z])(\d)/g, '$1-$2').toLowerCase()
const toColorVar = (k) => toTsVar(k).replace('--ts-', '--color-')

describe('Adaptive Editorial Cinema — TS_TOKENS contract', () => {
  it('pins the exact accepted foundation values', () => {
    expect(TS_TOKENS).toEqual({
      canvas: '#0f1010',
      surface1: '#171819',
      surface2: '#222427',
      surfaceRaised: '#2e3135',
      textPrimary: '#f5f2eb',
      textSecondary: '#c9c5bc',
      textMuted: '#a5a198',
      borderSubtle: '#3a3d41',
      borderStrong: '#747a82',
      actionPrimaryFill: '#f0ece4',
      actionPrimaryText: '#0f1010',
      focus: '#f5f2eb',
      brandAccent: '#e5636f',
      brandAccentText: '#ed7a87',
      brandAccentStrong: '#b83d4f',
    })
  })

  it('exposes exactly the 15 expected keys (no extra/forbidden token added by name)', () => {
    expect(Object.keys(TS_TOKENS).sort()).toEqual([...EXPECTED_KEYS].sort())
    for (const k of Object.keys(TS_TOKENS)) {
      // No legacy/forbidden token categories as TARGET token names. ("rose" is allowed
      // only as a compatibility ALIAS in CSS, never as a TS_TOKENS key.)
      expect(k).not.toMatch(/gradient|decision|signal|context|aura|plum|purple|pink|rose/i)
    }
  })

  it('keeps exactly one cinematic coral-red accent family (signature + text + strong)', () => {
    expect(TS_TOKENS.brandAccent).toBe('#e5636f')
    expect(TS_TOKENS.brandAccentText).toBe('#ed7a87')
    expect(TS_TOKENS.brandAccentStrong).toBe('#b83d4f')
    const accentKeys = Object.keys(TS_TOKENS).filter((k) => /accent/i.test(k))
    expect(accentKeys.sort()).toEqual(['brandAccent', 'brandAccentStrong', 'brandAccentText'])
  })

  it('defines NO gradient / decision-signal / contextual-color token, and no purple/pink/rose hue values', () => {
    const keys = Object.keys(TS_TOKENS)
    expect(keys.some((k) => /gradient/i.test(k))).toBe(false)
    expect(keys.some((k) => /context|aura|extract/i.test(k))).toBe(false)
    const vals = Object.values(TS_TOKENS).map((v) => v.toLowerCase())
    // legacy purple/pink target hues must never reappear as token values
    for (const banned of ['#9333ea', '#ec4899', '#a78bfa', '#7c3aed', '#dd4e83', '#c0356c']) {
      expect(vals, banned).not.toContain(banned)
    }
  })

  it('decision/primary/focus are neutral — never the brand accent', () => {
    expect(TS_TOKENS.focus).toBe('#f5f2eb') // paper-white, not coral
    expect(TS_TOKENS.actionPrimaryFill).not.toBe(TS_TOKENS.brandAccent)
    expect(TS_TOKENS.actionPrimaryFill).not.toBe(TS_TOKENS.brandAccentStrong)
    expect(TS_TOKENS.actionPrimaryFill).toBe('#f0ece4') // neutral inverse, not a brand hue
  })

  it('CANONICAL_THEME mirrors TS_TOKENS 1:1 (same values, color* naming)', () => {
    expect(CANONICAL_THEME.colorCanvas).toBe(TS_TOKENS.canvas)
    expect(CANONICAL_THEME.colorTextPrimary).toBe(TS_TOKENS.textPrimary)
    expect(CANONICAL_THEME.colorBrandAccent).toBe(TS_TOKENS.brandAccent)
    expect(CANONICAL_THEME.colorActionPrimaryFill).toBe(TS_TOKENS.actionPrimaryFill)
    expect(CANONICAL_THEME.colorBorderStrong).toBe(TS_TOKENS.borderStrong)
    expect(CANONICAL_THEME.fontUi).toMatch(/Inter/)
  })

  it('exposes opt-in neutral depth recipes (deep-ink, not the legacy brand gradient); flat is default', () => {
    expect(TS_PAGE_DEPTH.none).toBe('#0f1010') // flat ink is the default composition
    expect(TS_PAGE_DEPTH.radial).toContain('radial-gradient')
    expect(TS_PAGE_DEPTH.linear).toContain('linear-gradient')
    for (const recipe of Object.values(TS_PAGE_DEPTH)) {
      expect(recipe.toLowerCase()).not.toContain('9333ea')
      expect(recipe.toLowerCase()).not.toContain('ec4899')
    }
    expect(TS_PAGE_DEPTH.radial).toContain('#0f1010')
  })
})

// Drift guard: foundations.css (CSS mirror) must define every canonical --color-*
// token with the exact TS_TOKENS value, and alias every --ts-* to canonical.
describe('foundations.css mirrors TS_TOKENS via the canonical --color-* tokens', () => {
  const css = readFileSync(join(process.cwd(), 'src/shared/ui/thoughtful-seatmate/foundations.css'), 'utf8')
  const colorMap = Object.fromEntries(
    [...css.matchAll(/(--color-[a-z0-9-]+)\s*:\s*([^;]+);/gi)].map(([, name, val]) => [name, val.trim()])
  )

  it('defines every canonical --color-* token with the exact TS_TOKENS value', () => {
    for (const k of EXPECTED_KEYS) {
      expect(colorMap[toColorVar(k)], k).toBe(TS_TOKENS[k])
    }
  })

  it('aliases every --ts-* token to its canonical --color-* (no independent values)', () => {
    for (const k of EXPECTED_KEYS) {
      const tsVar = toTsVar(k)
      const colorVar = toColorVar(k)
      expect(css, tsVar).toMatch(new RegExp(`${tsVar}\\s*:\\s*var\\(${colorVar}`))
    }
  })

  it('keeps the legacy rose names ONLY as compatibility aliases pointing at the coral accent', () => {
    // --color-brand-rose / -contrast must reference the accent, never hold an independent rose hue.
    expect(css).toMatch(/--color-brand-rose\s*:\s*var\(--color-brand-accent\)/)
    expect(css).toMatch(/--color-brand-rose-contrast\s*:\s*var\(--color-brand-accent-strong\)/)
    expect(css.toLowerCase()).not.toContain('#dd4e83')
    expect(css.toLowerCase()).not.toContain('#c0356c')
  })

  it('declares Inter font roles and no serif / purple-pink in the canonical layer', () => {
    expect(css).toMatch(/--font-ui\s*:\s*'Inter'/)
    expect(css).toMatch(/--font-display\s*:\s*'Inter'/)
    expect(css).not.toMatch(/Newsreader|Outfit|Georgia|Times/i)
    expect(css).not.toMatch(/9333ea|ec4899|a78bfa|7c3aed/i)
  })

  it('keeps the canonical tokens out of :root (theme is class-scoped + removable for rollback)', () => {
    expect(css).toContain('.theme-thoughtful {')
    expect(css).not.toMatch(/:root\s*\{[^}]*--(ts|color)-/)
  })
})
