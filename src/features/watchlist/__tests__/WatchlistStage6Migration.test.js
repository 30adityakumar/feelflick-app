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

describe('Stage 6 — local Watchlist activation boundary + canonical-Button migration', () => {
  const w = read('src/features/watchlist/Watchlist.jsx')

  // (1) still wraps its body in the foundation scope
  it('still imports + renders <ThoughtfulRoot>', () => {
    expect(w).toMatch(/from\s+['"]@\/shared\/ui\/thoughtful-seatmate['"]/)
    expect(w).toMatch(/<ThoughtfulRoot>/)
  })
  // (2)
  it('still renders <PageDepth depth="radial">', () => {
    expect(w).toMatch(/<PageDepth\s+depth="radial"/)
  })
  // (3) imports the canonical Button
  it('imports the canonical Button from @/shared/ui/Button', () => {
    expect(w).toMatch(/import\s+Button\s+from\s+['"]@\/shared\/ui\/Button['"]/)
  })
  // (4) no longer imports PrimaryAction as a component (the CSS-path import does not count)
  it('does not import the PrimaryAction component', () => {
    expect(w).not.toMatch(/import\s*\{[^}]*\bPrimaryAction\b[^}]*\}\s*from\s*['"]@\/shared\/ui\/thoughtful-seatmate['"]/)
  })
  // (5) no longer renders <PrimaryAction>
  it('does not render <PrimaryAction>', () => {
    expect(w).not.toMatch(/<PrimaryAction[\s/>]/)
  })
  // (6) explicitly loads the temporary compatibility stylesheet
  it('explicitly imports PrimaryAction.css as temporary visual compatibility', () => {
    expect(w).toMatch(/import\s+['"]@\/shared\/ui\/thoughtful-seatmate\/PrimaryAction\.css['"]/)
  })
  // (7) the compat class string carries both required classes
  it('WATCHLIST_PRIMARY_COMPAT_CLASS contains ts-action-primary and ts-action-primary--md', () => {
    const m = w.match(/const\s+WATCHLIST_PRIMARY_COMPAT_CLASS\s*=\s*'([^']*)'/)
    expect(m, 'compat-class constant present').toBeTruthy()
    expect(m[1]).toContain('ts-action-primary')
    expect(m[1]).toContain('ts-action-primary--md')
  })
  // (8) exactly two direct canonical primary Buttons for this migration
  it('renders exactly two direct primary Buttons using the compat class', () => {
    const count = (w.match(/className=\{WATCHLIST_PRIMARY_COMPAT_CLASS\}/g) || []).length
    expect(count).toBe(2)
  })
  // (9) both specify variant="primary", size="md", className={WATCHLIST_PRIMARY_COMPAT_CLASS}
  it('both migrated Buttons specify variant="primary", size="md" and the compat class', () => {
    const buttons = w.match(/<Button\b[\s\S]*?<\/Button>/g) || []
    const migrated = buttons.filter((b) => b.includes('WATCHLIST_PRIMARY_COMPAT_CLASS'))
    expect(migrated).toHaveLength(2)
    for (const b of migrated) {
      expect(b).toMatch(/variant="primary"/)
      expect(b).toMatch(/size="md"/)
      expect(b).toMatch(/className=\{WATCHLIST_PRIMARY_COMPAT_CLASS\}/)
    }
  })
  // (10) both preserve the single child <span> wrapping the label
  it('both migrated Buttons preserve a single child <span> label', () => {
    const buttons = (w.match(/<Button\b[\s\S]*?<\/Button>/g) || []).filter((b) => b.includes('WATCHLIST_PRIMARY_COMPAT_CLASS'))
    for (const b of buttons) {
      expect(b).toMatch(/<span>[^<]+<\/span>/)
    }
    // the original labels are preserved
    expect(w).toMatch(/<span>Open Discover →<\/span>/)
    expect(w).toMatch(/<span>Try again<\/span>/)
  })
})

describe('Stage 6 — no fourth production surface adopts the foundation', () => {
  const importsFoundation = /['"]@\/shared\/ui\/thoughtful-seatmate(['"/]|$)/
  it('only Tonight + Film File + Watchlist + Browse + Discover + Cinematic DNA + the dev showcase import the foundation', () => {
    const offenders = []
    for (const f of walk(join(ROOT, 'src'))) {
      const r = rel(f)
      if (r.startsWith('src/shared/ui/thoughtful-seatmate')) continue
      if (r.startsWith('src/features/home/') || r.startsWith('src/features/movie/') || r.startsWith('src/features/watchlist/') || r.startsWith('src/features/browse/') || r.startsWith('src/features/discover/') || r.startsWith('src/features/profile/')) continue
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
