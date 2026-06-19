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

})

// Slice E (final canonical-Button consumer migration) — Film File's two trailer controls
// (hero size="md", sticky-bar size="sm") now render the canonical <Button variant="primary">
// directly instead of the PrimaryAction wrapper, while temporarily preserving the legacy
// flat-ivory recipe via the ts-action-primary* compat classes + an explicit PrimaryAction.css
// import. This drives production PrimaryAction component imports to ZERO (retirement-gate
// condition 1). STRUCTURE only; behaviour stays covered by the other Film File suites.
describe('Stage 3 / Slice E — canonical-Button migration of the trailer controls', () => {
  const top = read('src/features/movie/sections-top.jsx')
  // strip JSX {/* … */} comments (incl. braces), then block + whole-line comments, so
  // comment mentions / stripped-comment artifacts don't confuse the structural matches
  const topCode = top
    .replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n').map(l => l.replace(/^\s*\/\/.*$/, '')).join('\n')
  const buttons = topCode.match(/<Button\b[\s\S]*?<\/Button>/g) || []
  const hero = buttons.find(b => b.includes('ff-movie-hero-action-btn')) || ''
  const sticky = buttons.find(b => b.includes('MOVIE_PRIMARY_COMPAT_SM')) || ''

  // (1) Film File still activates its own foundation scope
  it('Movie still uses <ThoughtfulRoot> and <PageDepth>', () => {
    const md = read('src/features/movie/MovieDetail.jsx')
    expect(md).toMatch(/<ThoughtfulRoot>/)
    expect(md).toMatch(/<PageDepth\s+depth="radial"/)
  })
  // (2) Surface remains the leading case card primitive
  it('Surface remains used for the leading case card', () => {
    const card = read('src/features/movie/PrimaryCaseCard.jsx')
    expect(card).toMatch(/import\s*\{[^}]*Surface[^}]*\}\s*from\s+['"]@\/shared\/ui\/thoughtful-seatmate['"]/)
    expect(card).toMatch(/<Surface\b/)
  })
  // (3) imports the canonical Button
  it('sections-top imports the canonical Button from @/shared/ui/Button', () => {
    expect(top).toMatch(/import\s+Button\s+from\s+['"]@\/shared\/ui\/Button['"]/)
  })
  // (4) no longer imports the PrimaryAction component
  it('does not import the PrimaryAction component', () => {
    expect(top).not.toMatch(/import\s*\{[^}]*\bPrimaryAction\b[^}]*\}\s*from\s*['"]@\/shared\/ui\/thoughtful-seatmate['"]/)
  })
  // (5) no longer renders <PrimaryAction>
  it('does not render <PrimaryAction>', () => {
    expect(topCode).not.toMatch(/<PrimaryAction[\s/>]/)
  })
  // (6) explicitly imports PrimaryAction.css
  it('explicitly imports PrimaryAction.css as temporary visual compatibility', () => {
    expect(top).toMatch(/import\s+['"]@\/shared\/ui\/thoughtful-seatmate\/PrimaryAction\.css['"]/)
  })
  // (7) MD compat constant
  it('MOVIE_PRIMARY_COMPAT_MD contains ts-action-primary and ts-action-primary--md', () => {
    const m = topCode.match(/const\s+MOVIE_PRIMARY_COMPAT_MD\s*=\s*'([^']*)'/)
    expect(m, 'MD constant present').toBeTruthy()
    expect(m[1]).toContain('ts-action-primary')
    expect(m[1]).toContain('ts-action-primary--md')
  })
  // (8) SM compat constant
  it('MOVIE_PRIMARY_COMPAT_SM contains ts-action-primary and ts-action-primary--sm', () => {
    const m = topCode.match(/const\s+MOVIE_PRIMARY_COMPAT_SM\s*=\s*'([^']*)'/)
    expect(m, 'SM constant present').toBeTruthy()
    expect(m[1]).toContain('ts-action-primary')
    expect(m[1]).toContain('ts-action-primary--sm')
  })
  // (9) exactly two direct canonical Buttons using those constants
  it('renders exactly two direct primary Buttons using the compat constants', () => {
    expect(buttons.length).toBe(2)
    expect(hero, 'hero Button present').toBeTruthy()
    expect(sticky, 'sticky Button present').toBeTruthy()
    expect(hero).toContain('MOVIE_PRIMARY_COMPAT_MD')
    expect(sticky).toContain('MOVIE_PRIMARY_COMPAT_SM')
  })
  // (10) hero Button preserves its full contract
  it('hero Button preserves variant/size/route-classes/disabled/title/style + grouping span(svg + Play Trailer)', () => {
    expect(hero).toMatch(/variant="primary"/)
    expect(hero).toMatch(/size="md"/)
    expect(hero).toMatch(/className=\{`\$\{MOVIE_PRIMARY_COMPAT_MD\} ff-movie-hero-action-btn ff-movie-hero-action-btn--primary`\}/)
    expect(hero).toMatch(/disabled=\{!hasTrailer\}/)
    expect(hero).toMatch(/title=\{hasTrailer \? undefined : 'No trailer available'\}/)
    expect(hero).toMatch(/style=\{\{ cursor: hasTrailer \? 'pointer' : 'not-allowed', opacity: hasTrailer \? 1 : 0\.5 \}\}/)
    // one outer grouping span, holding the svg then the Play Trailer text
    expect(hero).toMatch(/>\s*<span>\s*<svg[\s\S]*?<\/svg>\s*Play Trailer\s*<\/span>\s*<\/Button>/)
    expect((hero.match(/<svg\b/g) || []).length).toBe(1)
    expect(hero).toMatch(/<path d="M5 3v18l16-9z"\/>/)
  })
  // (11) sticky Button preserves its full contract
  it('sticky Button preserves variant/size/disabled/title/style + one child span(Play Trailer)', () => {
    expect(sticky).toMatch(/variant="primary"/)
    expect(sticky).toMatch(/size="sm"/)
    expect(sticky).toMatch(/className=\{MOVIE_PRIMARY_COMPAT_SM\}/)
    expect(sticky).toMatch(/disabled=\{!hasTrailer\}/)
    expect(sticky).toMatch(/title=\{hasTrailer \? undefined : 'No trailer available'\}/)
    expect(sticky).toMatch(/padding:'8px 14px', borderRadius:RADIUS\.sm/)
    expect(sticky).toMatch(/fontSize:12, fontWeight:600/)
    expect(sticky).toMatch(/>\s*<span>Play Trailer<\/span>\s*<\/Button>/)
  })
  // (12) neither migrated Button passes loading
  it('neither migrated trailer Button passes a loading prop', () => {
    expect(hero).not.toMatch(/\bloading\b/)
    expect(sticky).not.toMatch(/\bloading\b/)
  })
})

describe('Stage 3 / Slice E — PrimaryAction wrapper retired from production but retained', () => {
  // (13) repo-wide production PrimaryAction component imports are now zero
  it('zero production PrimaryAction component imports remain (tests + design-lab excluded)', () => {
    const offenders = []
    for (const f of walk(join(ROOT, 'src'))) {
      const r = rel(f)
      if (r.includes('/__tests__/')) continue
      if (r.startsWith('src/features/design-lab/')) continue // dev-only showcase
      if (!/\.jsx?$/.test(r)) continue
      if (/import\s*\{[^}]*\bPrimaryAction\b[^}]*\}\s*from\s*['"]@\/shared\/ui\/thoughtful-seatmate['"]/.test(readFileSync(f, 'utf8'))) offenders.push(r)
    }
    expect(offenders).toEqual([])
  })
  // (14) Home + Watchlist still render Button directly with their compat classes + explicit stylesheet imports
  it('Home and Watchlist still use canonical Button + ts-action-primary* + explicit PrimaryAction.css import', () => {
    for (const p of ['src/features/home/sections-top.jsx', 'src/features/watchlist/Watchlist.jsx']) {
      const src = read(p)
      expect(src, `${p} imports Button`).toMatch(/import\s+Button\s+from\s+['"]@\/shared\/ui\/Button['"]/)
      expect(src, `${p} imports PrimaryAction.css`).toMatch(/import\s+['"]@\/shared\/ui\/thoughtful-seatmate\/PrimaryAction\.css['"]/)
      expect(src, `${p} carries ts-action-primary compat classes`).toMatch(/ts-action-primary ts-action-primary--md/)
      expect(src, `${p} no PrimaryAction component import`).not.toMatch(/import\s*\{[^}]*\bPrimaryAction\b[^}]*\}\s*from\s*['"]@\/shared\/ui\/thoughtful-seatmate['"]/)
    }
  })
  // (15) the PrimaryAction barrel export still exists (retained, not removed)
  it('the PrimaryAction barrel export is retained', () => {
    expect(read('src/shared/ui/thoughtful-seatmate/index.js')).toMatch(/export\s*\{\s*default as PrimaryAction\s*\}\s*from\s*'\.\/PrimaryAction'/)
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
