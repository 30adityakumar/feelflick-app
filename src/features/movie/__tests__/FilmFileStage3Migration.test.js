/* global process */
import { describe, expect, it } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { join, relative } from 'node:path'

// Stage 3 — Film File pilot guardrails. These assert the migration's STRUCTURE
// (local activation boundary, Stage 1 primitives consumed, no third production
// surface adopts the foundation, the rendered Film File files are free of legacy
// styling, no global .ts-root / token promotion). Product behaviour is covered by
// the other Film File suites (hierarchy / landmarks / a11y / watched-flow /
// trust-framing / provider-truth / viewer-notes / route-error, all unchanged).

const ROOT = process.cwd()
const read = (p) => readFileSync(join(ROOT, p), 'utf8')

function walk(dir, acc = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, e.name)
    if (e.isDirectory()) {
      if (['node_modules', 'dist', '.git'].includes(e.name)) continue
      walk(full, acc)
    } else if (/\.(jsx?|css)$/.test(e.name)) acc.push(full)
  }
  return acc
}
const rel = (f) => relative(ROOT, f).split('\\').join('/')

// Slice one top-level function's source out of a module (decl → next top-level
// function, or EOF) — lets us purity-check a single rendered export.
function fnSource(src, decl) {
  const start = src.indexOf(decl)
  if (start === -1) throw new Error(`declaration not found: ${decl}`)
  const after = src.slice(start + decl.length)
  const m = after.search(/\n(?:export )?(?:default )?function /)
  return m === -1 ? src.slice(start) : src.slice(start, start + decl.length + m)
}

// The rendered Film File files fully migrated to Inter / graphite / ivory.
const MIGRATED = [
  'src/features/movie/MovieDetail.jsx',
  'src/features/movie/sections-top.jsx',
  'src/features/movie/sections-bottom.jsx',
  'src/features/movie/PrimaryCaseCard.jsx',
  'src/features/movie/ViewerNotes.jsx',
  'src/features/movie/components/DecisionEvidence.jsx',
  'src/features/movie/components/SocialContext.jsx',
  'src/features/movie/components/ExplorationTail.jsx',
  'src/features/movie/components/FilmFileDisclosure.jsx',
  'src/features/movie/components/AccessibleMediaDialog.jsx',
  'src/features/movie/movie.css',
]

describe('Stage 3 — local Film File activation boundary', () => {
  it('wraps the Film File body in <ThoughtfulRoot> and paints the canvas with <PageDepth>', () => {
    const md = read('src/features/movie/MovieDetail.jsx')
    expect(md).toMatch(/from\s+['"]@\/shared\/ui\/thoughtful-seatmate['"]/)
    expect(md).toMatch(/<ThoughtfulRoot>/)
    expect(md).toMatch(/<PageDepth\s+depth="radial"/)
  })

  it('consumes the Stage 1 PrimaryAction for the primary action and Surface for the leading case card', () => {
    const top = read('src/features/movie/sections-top.jsx')
    expect(top).toMatch(/import\s*\{[^}]*PrimaryAction[^}]*\}\s*from\s+['"]@\/shared\/ui\/thoughtful-seatmate['"]/)
    expect(top).toMatch(/<PrimaryAction/)
    const card = read('src/features/movie/PrimaryCaseCard.jsx')
    expect(card).toMatch(/import\s*\{[^}]*Surface[^}]*\}\s*from\s+['"]@\/shared\/ui\/thoughtful-seatmate['"]/)
    expect(card).toMatch(/<Surface\b/)
  })
})

describe('Stage 3 — no third production surface adopts the foundation', () => {
  const importsFoundation = /['"]@\/shared\/ui\/thoughtful-seatmate(['"/]|$)/
  it('only the authorized adopters + the dev-only showcase import the foundation', () => {
    const offenders = []
    for (const f of walk(join(ROOT, 'src'))) {
      const r = rel(f)
      if (r.startsWith('src/shared/ui/thoughtful-seatmate')) continue // the foundation itself
      if (r.startsWith('src/features/home/')) continue // Tonight (Stage 2)
      if (r.startsWith('src/features/movie/')) continue // Film File (Stage 3, this pilot)
      if (r.startsWith('src/features/watchlist/')) continue // Library/Watchlist (Stage 6)
      if (r.startsWith('src/features/design-lab/thoughtful-seatmate-foundations')) continue // dev-only showcase
      if (r.includes('/__tests__/')) continue
      if (!/\.(jsx?)$/.test(r)) continue
      if (importsFoundation.test(readFileSync(f, 'utf8'))) offenders.push(r)
    }
    expect(offenders).toEqual([])
  })
})

describe("Stage 3 — the rendered Film File files are free of legacy styling", () => {
  // (The legacy purple→pink gradient is enforced separately + app-wide by
  // `npm run guard:foundations`, so it is intentionally NOT re-asserted here.)
  it('no Newsreader/editorial font, no Outfit, no FILM_PALETTE chrome, no mood-hex, no rose hex', () => {
    for (const p of MIGRATED) {
      const src = read(p)
      expect(src, `${p} editorial font`).not.toMatch(/var\(--font-editorial\)/)
      expect(src, `${p} Newsreader/Outfit`).not.toMatch(/Newsreader|Outfit/)
      expect(src, `${p} FILM_PALETTE contextual colour`).not.toMatch(/FILM_PALETTE/)
      expect(src, `${p} mood-hex`).not.toMatch(/\.hex\b/)
      expect(src, `${p} rose hex (small text)`).not.toMatch(/#DD4E83/i)
    }
  })

  it('the rendered RENDERED sections-bottom exports (YourTake/ProvidersSection) carry no legacy HP literal hex', () => {
    const bottom = read('src/features/movie/sections-bottom.jsx')
    for (const decl of ['function ProvidersSection(', 'function YourTakeUnlocked(']) {
      if (!bottom.includes(decl)) continue
      const body = fnSource(bottom, decl)
      expect(body, `${decl} editorial font`).not.toMatch(/var\(--font-editorial\)/)
      expect(body, `${decl} FILM_PALETTE`).not.toMatch(/FILM_PALETTE/)
    }
  })
})

describe('Stage 3 — no global activation or token replacement', () => {
  it('does not add .ts-root globally (shell / html / body / global CSS)', () => {
    for (const p of ['src/app/AppShell.jsx', 'src/index.css', 'src/styles/globals.css', 'index.html']) {
      expect(read(p), p).not.toMatch(/ts-root/)
    }
  })

  it('does not leak the scoped --ts-* tokens into the global token sources', () => {
    expect(read('src/shared/lib/tokens.js')).not.toMatch(/--ts-|TS_TOKENS/)
    expect(read('src/index.css')).not.toMatch(/--ts-/)
  })
})
