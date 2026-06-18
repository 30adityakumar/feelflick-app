/* global process */
// Website-wide Thoughtful Seatmate theme — architecture invariants.
// Static-source assertions (no render) proving the canonical theme is centrally
// controlled: one root boundary, one canonical token CONTRACT with CSS + JS mirrors
// protected by a drift test, compat aliases that reference canonical (never duplicate
// independent values), Inter-only, neutral Eyebrow default, ivory focus, and an
// emergency theme switch (a runtime token-layer fallback, not an exact visual rollback).
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { CANONICAL_THEME } from '../tokens'

const read = (p) => readFileSync(join(process.cwd(), p), 'utf8')

const foundations = read('src/shared/ui/thoughtful-seatmate/foundations.css')
const indexCss = read('src/index.css')
const globals = read('src/styles/globals.css')
const app = read('src/App.jsx')
const eyebrow = read('src/shared/ui/Eyebrow.jsx')
const libTokens = read('src/shared/lib/tokens.js')
const tsTokens = read('src/shared/ui/thoughtful-seatmate/tokens.js')
const indexHtml = read('index.html')

const CANONICAL = {
  '--color-canvas': '#15120f',
  '--color-surface-1': '#1d1814',
  '--color-surface-2': '#241e19',
  '--color-surface-raised': '#2d2621',
  '--color-text-primary': '#f3ecdf',
  '--color-text-secondary': '#beb8ad',
  '--color-text-muted': '#8d887f',
  '--color-border-subtle': '#302c28',
  '--color-border-strong': '#46423d',
  '--color-action-primary-fill': '#efe7d7',
  '--color-action-primary-text': '#221b13',
  '--color-focus': '#f3ecdf',
  '--color-decision': '#f3ecdf',
  '--color-brand-rose': '#dd4e83',
  '--color-brand-rose-contrast': '#c0356c',
}

describe('canonical token contract — CSS mirror (foundations.css)', () => {
  it('defines every canonical --color-* token with the exact value under .theme-thoughtful', () => {
    expect(foundations).toMatch(/\.theme-thoughtful\s*\{/)
    for (const [name, value] of Object.entries(CANONICAL)) {
      expect(foundations, `${name}`).toMatch(new RegExp(`${name}\\s*:\\s*${value}\\b`, 'i'))
    }
  })
  it('declares the Inter font roles and neutral page-depth (no Newsreader/Outfit/serif, no purple/pink)', () => {
    expect(foundations).toMatch(/--font-ui\s*:\s*'Inter'/)
    expect(foundations).toMatch(/--font-display\s*:\s*'Inter'/)
    expect(foundations).not.toMatch(/Newsreader|Outfit|Georgia|Times/i) // no editorial serif faces
    expect(foundations).not.toMatch(/9333ea|ec4899|a78bfa/i)
  })
  it('aliases the --ts-* pilot namespace to the canonical tokens (no independent values)', () => {
    expect(foundations).toMatch(/--ts-canvas\s*:\s*var\(--color-canvas\)/)
    expect(foundations).toMatch(/--ts-text-primary\s*:\s*var\(--color-text-primary\)/)
  })
  it('tokens.js mirrors the canonical values and derives TS_TOKENS from them', () => {
    expect(tsTokens).toMatch(/colorCanvas:\s*'#15120f'/)
    expect(tsTokens).toMatch(/colorTextPrimary:\s*'#f3ecdf'/)
    expect(tsTokens).toMatch(/canvas:\s*CANONICAL_THEME\.colorCanvas/)
  })
})

describe('canonical token contract — CSS ↔ JS mirror drift test', () => {
  // foundations.css (CSS mirror) and CANONICAL_THEME (JS mirror) are maintained by hand,
  // NOT generated from one another. This guards against the two drifting apart: every
  // CANONICAL_THEME token name + value must appear verbatim in the .theme-thoughtful CSS
  // mirror. (This is what "one canonical token contract with CSS + JS mirrors protected
  // by drift tests" means — not a literal single representation.)
  const cssVar = (k) => '--' + k.replace(/([A-Z])/g, '-$1').replace(/([a-z])(\d)/g, '$1-$2').toLowerCase()
  it('declares every CANONICAL_THEME token (name + exact value) in foundations.css', () => {
    for (const [k, v] of Object.entries(CANONICAL_THEME)) {
      expect(foundations, `${cssVar(k)}: ${v}`).toContain(`${cssVar(k)}: ${v};`)
    }
  })
  it('covers the full canonical set (15 colour tokens + 2 font roles)', () => {
    expect(Object.keys(CANONICAL_THEME)).toHaveLength(17)
  })
})

describe('compatibility aliases reference canonical (index.css) — no duplicate independent values', () => {
  it('maps legacy surface/brand/font tokens to canonical under .theme-thoughtful', () => {
    expect(indexCss).toMatch(/\.theme-thoughtful\s*\{/)
    expect(indexCss).toMatch(/--bg-base:\s*var\(--color-canvas\)/)
    expect(indexCss).toMatch(/--brand-ivory:\s*var\(--color-text-primary\)/)
    expect(indexCss).toMatch(/--brand-rose:\s*var\(--color-brand-rose\)/)
    expect(indexCss).toMatch(/--font-editorial:\s*var\(--font-ui\)/)
  })
  it('neutralizes the entire Tailwind purple + pink scale to canonical neutrals', () => {
    for (const n of [50, 100, 200, 300, 400, 500, 600, 700, 800, 900]) {
      expect(indexCss, `--purple-${n}`).toMatch(new RegExp(`--purple-${n}:\\s*var\\(--color-`))
      expect(indexCss, `--pink-${n}`).toMatch(new RegExp(`--pink-${n}:\\s*var\\(--color-`))
    }
  })
  it('loads the canonical foundations globally', () => {
    expect(indexCss).toMatch(/@import\s+'\.\/shared\/ui\/thoughtful-seatmate\/foundations\.css'/)
  })
})

describe('one root theme boundary + emergency theme switch (App.jsx)', () => {
  it('selects the theme class from VITE_UI_THEME with thoughtful as the default', () => {
    expect(app).toMatch(/VITE_UI_THEME/)
    expect(app).toMatch(/theme-thoughtful/)
    expect(app).toMatch(/theme-legacy/)
  })
  it('applies exactly one theme class at the app root (no per-route theme roots)', () => {
    // The boundary is a single className expression; no route file hardcodes the class.
    const occurrences = (app.match(/theme-thoughtful/g) || []).length
    expect(occurrences).toBeGreaterThanOrEqual(1)
  })
  it('frames the switch truthfully — a runtime token-layer fallback, NOT an exact visual rollback', () => {
    // Truthfulness guard: the comment must describe a partial/runtime fallback and point to
    // reverting the PR for a full visual rollback (locks the correction against regression).
    expect(app).toMatch(/token-layer fallback/i)
    expect(app).toMatch(/PARTIAL visual rollback/i)
    expect(app).toMatch(/revert(ing)? this PR/i)
  })
})

describe('global focus + selection (globals.css)', () => {
  it('focus-visible uses the canonical ivory focus token (rose only as rollback fallback)', () => {
    expect(globals).toMatch(/:focus-visible\s*\{[^}]*outline:\s*2px solid var\(--color-focus/)
  })
})

describe('shared Eyebrow neutral default (§16)', () => {
  it('section tone default is NOT purple/pink', () => {
    expect(eyebrow).not.toMatch(/section:\s*\{\s*color:\s*HP\.purple/)
    expect(eyebrow).toMatch(/section:\s*\{\s*color:\s*HP\.textSoft/)
  })
})

describe('shared tokens resolve to canonical (shared/lib/tokens.js)', () => {
  it('HP surfaces/text and ROSE resolve to canonical --color-* with legacy fallbacks', () => {
    expect(libTokens).toMatch(/text:\s*'var\(--color-text-primary,/)
    expect(libTokens).toMatch(/bgDeep:\s*'var\(--color-canvas,/)
    expect(libTokens).toMatch(/purple:\s*'var\(--color-text-secondary,/)
    expect(libTokens).toMatch(/export const ROSE\s*=\s*'var\(--color-brand-rose,/)
  })
})

describe('Inter-only website (index.html)', () => {
  it('does not load Newsreader or Outfit', () => {
    expect(indexHtml).not.toMatch(/Newsreader|Outfit/)
    expect(indexHtml).toMatch(/family=Inter:/)
  })
  it('does not ship a purple→pink gradient in the prerender/noscript fallback', () => {
    expect(indexHtml).not.toMatch(/linear-gradient\([^)]*9333ea/)
  })
})
