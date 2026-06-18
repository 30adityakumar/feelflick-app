/* global process */
import { describe, expect, it } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { join, relative } from 'node:path'

// Stage 6 — Library family (Watchlist) migration guardrails. STRUCTURE only
// (boundary, primitive consumption, no 4th adopter, rendered-file purity, no global
// activation, and the shared-nav backward-compatibility that keeps History byte-
// identical). Watchlist BEHAVIOR is covered by the existing watchlist suites
// (WatchlistA11y / WatchlistDataStates / WatchlistRemoval / WatchlistTrust).

const ROOT = process.cwd()
const read = (p) => readFileSync(join(ROOT, p), 'utf8')
function walk(dir, acc = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, e.name)
    if (e.isDirectory()) { if (['node_modules', 'dist', '.git'].includes(e.name)) continue; walk(full, acc) }
    else if (/\.(jsx?|css)$/.test(e.name)) acc.push(full)
  }
  return acc
}
const rel = (f) => relative(ROOT, f).split('\\').join('/')

const MIGRATED = ['src/features/watchlist/Watchlist.jsx', 'src/features/watchlist/watchlist.css']

describe('Stage 6 — local Watchlist activation boundary', () => {
  it('wraps the Watchlist body in <ThoughtfulRoot> + <PageDepth depth="radial"> and consumes PrimaryAction', () => {
    const w = read('src/features/watchlist/Watchlist.jsx')
    expect(w).toMatch(/from\s+['"]@\/shared\/ui\/thoughtful-seatmate['"]/)
    expect(w).toMatch(/<ThoughtfulRoot>/)
    expect(w).toMatch(/<PageDepth\s+depth="radial"/)
    expect(w).toMatch(/<PrimaryAction/)
  })
})

describe('Stage 6 — no fourth production surface adopts the foundation', () => {
  const importsFoundation = /['"]@\/shared\/ui\/thoughtful-seatmate(['"/]|$)/
  it('only Tonight + Film File + Watchlist + the dev showcase import the foundation', () => {
    const offenders = []
    for (const f of walk(join(ROOT, 'src'))) {
      const r = rel(f)
      if (r.startsWith('src/shared/ui/thoughtful-seatmate')) continue
      if (r.startsWith('src/features/home/') || r.startsWith('src/features/movie/') || r.startsWith('src/features/watchlist/')) continue
      if (r.startsWith('src/features/design-lab/thoughtful-seatmate-foundations')) continue
      if (r.includes('/__tests__/')) continue
      if (!/\.(jsx?)$/.test(r)) continue
      if (importsFoundation.test(readFileSync(f, 'utf8'))) offenders.push(r)
    }
    expect(offenders).toEqual([])
  })
})

describe("Stage 6 — the rendered Watchlist files are free of legacy styling", () => {
  it('no editorial font / Outfit / FILM_PALETTE / purple-pink chrome / mood-hex / rose hex', () => {
    for (const p of MIGRATED) {
      const src = read(p)
      expect(src, `${p} editorial font`).not.toMatch(/var\(--font-editorial\)/)
      expect(src, `${p} Newsreader/Outfit`).not.toMatch(/Newsreader|Outfit/)
      expect(src, `${p} FILM_PALETTE`).not.toMatch(/FILM_PALETTE/)
      expect(src, `${p} purple/pink chrome hex`).not.toMatch(/#(9333ea|ec4899|a78bfa|7c3aed)\b/i)
      expect(src, `${p} HP purple/pink`).not.toMatch(/\bHP\.(purple|pink|purpleDeep)\b/)
      expect(src, `${p} mood-hex chrome`).not.toMatch(/\bf\.hex\b/)
    }
  })
})

describe('Stage 6 — shared LibrarySectionNav stays backward-compatible for History', () => {
  // library.css is shared with the (excluded) History/Diary route, which has NO
  // .ts-root. Each colour must be `var(--ts-*, <exact legacy value>)` so History
  // renders byte-identical via the fallback while Watchlist (in .ts-root) gets ivory.
  it('library.css colours are scoped vars with the exact legacy fallbacks preserved', () => {
    const css = read('src/features/library/library.css')
    expect(css).toMatch(/color:\s*var\(--ts-text-muted,\s*rgba\(250, 250, 250, 0\.55\)\)/)
    expect(css).toMatch(/color:\s*var\(--ts-text-secondary,\s*rgba\(250, 250, 250, 0\.85\)\)/)
    expect(css).toMatch(/color:\s*var\(--ts-text-primary,\s*#faf5ff\)/)
    expect(css).toMatch(/border-bottom-color:\s*var\(--ts-focus,\s*#DD4E83\)/)
    expect(css).toMatch(/outline:\s*2px solid var\(--ts-focus,\s*#a78bfa\)/)
  })
})

describe('Stage 6 — no global activation or token replacement', () => {
  it('does not add .ts-root globally or leak --ts-* into global token sources', () => {
    for (const p of ['src/app/AppShell.jsx', 'src/index.css', 'src/styles/globals.css', 'index.html']) {
      expect(read(p), p).not.toMatch(/ts-root/)
    }
    expect(read('src/shared/lib/tokens.js')).not.toMatch(/--ts-|TS_TOKENS/)
    expect(read('src/index.css')).not.toMatch(/--ts-/)
  })
})
