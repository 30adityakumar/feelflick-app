/* global process */
// Website-wide Adaptive Editorial Cinema theme — architecture invariants (ADR 021).
// Static-source assertions (no render) proving the canonical theme is centrally
// controlled: one root boundary, one canonical token CONTRACT with CSS + JS mirrors,
// compat aliases that reference canonical (never independent values), Inter-only,
// neutral focus, a neutralised legacy purple/pink bridge (NOT coral), and an
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
const indexHtml = read('index.html')

const CANONICAL = {
  '--color-canvas': '#0f1010',
  '--color-surface-1': '#171819',
  '--color-surface-2': '#222427',
  '--color-surface-raised': '#2e3135',
  '--color-text-primary': '#f5f2eb',
  '--color-text-secondary': '#c9c5bc',
  '--color-text-muted': '#a5a198',
  '--color-border-subtle': '#3a3d41',
  '--color-border-strong': '#747a82',
  '--color-action-primary-fill': '#f0ece4',
  '--color-action-primary-text': '#0f1010',
  '--color-focus': '#f5f2eb',
  '--color-decision': '#f5f2eb',
  '--color-brand-accent': '#e5636f',
  '--color-brand-accent-text': '#ed7a87',
  '--color-brand-accent-strong': '#b83d4f',
}

describe('one root theme boundary (App.jsx)', () => {
  it('applies a single theme class at the app root with a legacy fallback switch', () => {
    expect(app).toMatch(/theme-thoughtful/)
    expect(app).toMatch(/theme-legacy/)
    expect(app).toMatch(/VITE_UI_THEME/)
  })
})

describe('canonical token contract — CSS mirror (foundations.css)', () => {
  it('defines every canonical --color-* token with the exact Adaptive Editorial Cinema value', () => {
    expect(foundations).toMatch(/\.theme-thoughtful\s*\{/)
    for (const [name, value] of Object.entries(CANONICAL)) {
      expect(foundations, name).toMatch(new RegExp(`${name}\\s*:\\s*${value}\\b`, 'i'))
    }
  })
  it('declares Inter font roles + opt-in neutral depth; no serif, no purple/pink hue', () => {
    expect(foundations).toMatch(/--font-ui\s*:\s*'Inter'/)
    expect(foundations).toMatch(/--font-display\s*:\s*'Inter'/)
    expect(foundations).not.toMatch(/Newsreader|Outfit|Georgia|Times/i)
    expect(foundations).not.toMatch(/9333ea|ec4899|a78bfa|7c3aed|dd4e83/i)
  })
  it('keeps the canonical tokens class-scoped (NOT in :root) so the theme is removable for rollback', () => {
    expect(foundations).not.toMatch(/:root\s*\{[^}]*--(ts|color)-/)
  })
})

describe('canonical token contract — JS mirror (CANONICAL_THEME)', () => {
  it('mirrors the CSS values 1:1', () => {
    const jsByVar = {
      '--color-canvas': CANONICAL_THEME.colorCanvas,
      '--color-surface-raised': CANONICAL_THEME.colorSurfaceRaised,
      '--color-text-primary': CANONICAL_THEME.colorTextPrimary,
      '--color-text-muted': CANONICAL_THEME.colorTextMuted,
      '--color-border-strong': CANONICAL_THEME.colorBorderStrong,
      '--color-action-primary-fill': CANONICAL_THEME.colorActionPrimaryFill,
      '--color-focus': CANONICAL_THEME.colorFocus,
      '--color-brand-accent': CANONICAL_THEME.colorBrandAccent,
      '--color-brand-accent-strong': CANONICAL_THEME.colorBrandAccentStrong,
    }
    for (const [name, jsVal] of Object.entries(jsByVar)) {
      expect(jsVal, name).toBe(CANONICAL[name])
    }
    expect(CANONICAL_THEME.fontUi).toMatch(/^'Inter'/)
  })
})

describe('legacy compatibility bridge (index.css) — neutralised, not coral', () => {
  it('keeps the legacy rollback fallbacks in :root (purple/pink hexes + Newsreader font)', () => {
    expect(indexCss).toMatch(/:root\s*\{/)
    expect(indexCss).toMatch(/--purple-600:\s*#9333ea/i)
    expect(indexCss).toMatch(/--font-display:\s*'Newsreader'/)
  })
  it('remaps BOTH legacy scales to the neutral graphite/ivory ramp under the theme (pink is NOT coral)', () => {
    // Under .theme-thoughtful the purple AND pink scales resolve to neutral canonical
    // tokens. The cinematic accent must never leak through legacy utilities.
    expect(indexCss).toMatch(/--purple-500:\s*var\(--color-border-strong\)/)
    expect(indexCss).toMatch(/--pink-500:\s*var\(--color-border-strong\)/)
    expect(indexCss).not.toMatch(/--pink-(300|400|500|600):\s*var\(--color-brand-accent/)
  })
  it('aliases legacy fonts to Inter and the legacy rose name to the coral accent', () => {
    expect(indexCss).toMatch(/--font-editorial:\s*var\(--font-ui\)/)
    expect(indexCss).toMatch(/--font-display:\s*var\(--font-ui\)/)
    expect(indexCss).toMatch(/--brand-rose:\s*var\(--color-brand-accent\)/)
  })
  it('does NOT define a new brand gradient token under the theme', () => {
    const themeBlock = indexCss.slice(indexCss.indexOf('.theme-thoughtful'))
    expect(themeBlock).not.toMatch(/--brand-gradient:\s*linear-gradient/)
  })
})

describe('browser chrome (globals.css)', () => {
  it('uses deep ink canvas + Inter body', () => {
    expect(globals).toMatch(/color-scheme:\s*dark/)
    expect(globals).toMatch(/background:\s*#0f1010/)
    expect(globals).toMatch(/font-family:\s*Inter/)
  })
  it('uses canonical neutral scrollbar tokens (no cool slate)', () => {
    expect(globals).toMatch(/--color-border-subtle/)
    expect(globals).toMatch(/--color-border-strong/)
    expect(globals).not.toMatch(/#334155|#94a3b8/)
  })
  it('uses the canonical neutral focus outline (never a brand hue)', () => {
    expect(globals).toMatch(/outline:\s*2px solid var\(--color-focus/)
    expect(globals).not.toMatch(/outline:[^;]*(brand-accent|dd4e83|9333ea)/i)
  })
})

describe('font loading (index.html) — Inter only', () => {
  it('loads Inter and never the retired editorial faces', () => {
    expect(indexHtml).toMatch(/family=Inter/)
    expect(indexHtml).not.toMatch(/family=Newsreader|family=Outfit|Newsreader|Outfit/)
  })
})
