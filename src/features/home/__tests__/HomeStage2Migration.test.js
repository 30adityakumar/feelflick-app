/* global process */
import { describe, expect, it } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { join, relative } from 'node:path'

// Stage 2 — Tonight pilot guardrails. These assert the migration's STRUCTURE
// (local activation boundary, Stage 1 primitives consumed, no other surface adopts
// the foundation, Tonight's migrated files are free of legacy styling, no global
// .ts-root). Behavior is covered by the other Home test files (103 tests).

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

// Slice one top-level function's source out of a module (from its declaration to
// the next top-level `function`/`export function`, or EOF). Lets us purity-check
// only the RENDERED exports inside a file that ALSO holds non-rendered, still-
// legacy components.
function fnSource(src, decl) {
  const start = src.indexOf(decl)
  if (start === -1) throw new Error(`declaration not found: ${decl}`)
  const after = src.slice(start + decl.length)
  const m = after.search(/\n(?:export )?function /)
  return m === -1 ? src.slice(start) : src.slice(start, start + decl.length + m)
}

// The Tonight files fully migrated to Inter/graphite/ivory (the rendered surface +
// its dependencies). NOTE: sections-bottom.jsx also holds components NOT rendered on
// Tonight (ContinueWatching/CinematicDNA/TasteMatch/TasteTwinPulse/CuratedLists);
// those retain legacy styling and are out of the rendered-surface scope, so the
// purity grep targets the fully-migrated files only.
const MIGRATED = [
  'src/features/home/Home.jsx',
  'src/features/home/sections-top.jsx',
  'src/features/home/WhyThisPick.jsx',
  'src/features/home/atoms.jsx',
  'src/features/home/home.css',
]

describe('Stage 2 — local activation boundary', () => {
  it('wraps the Tonight body in <ThoughtfulRoot> and paints the canvas with <PageDepth>', () => {
    const home = read('src/features/home/Home.jsx')
    expect(home).toMatch(/from\s+['"]@\/shared\/ui\/thoughtful-seatmate['"]/)
    expect(home).toMatch(/<ThoughtfulRoot>\s*<HomeBody\s*\/>\s*<\/ThoughtfulRoot>/)
    expect(home).toMatch(/<PageDepth\s+depth="radial"/)
  })

})

// Slice D (canonical-Button consumer migration) — Home's single primary action
// ("Open Film File") now renders the canonical <Button variant="primary"> directly
// instead of the PrimaryAction wrapper, while temporarily preserving the legacy flat-
// ivory recipe via the ts-action-primary* compat classes + an explicit PrimaryAction.css
// import. STRUCTURE only; behaviour stays covered by the other Home suites. (Watchlist
// migrated first in Slice C; Movie remains the final wrapper consumer.)
describe('Stage 2 / Slice D — canonical-Button migration of the primary action', () => {
  const top = read('src/features/home/sections-top.jsx')
  const home = read('src/features/home/Home.jsx')
  // Strip block + whole-line comments so comment mentions of <Button> /
  // HOME_PRIMARY_COMPAT_CLASS don't confuse the structural matches below.
  const topCode = top.replace(/\/\*[\s\S]*?\*\//g, '').split('\n').map(l => l.replace(/^\s*\/\/.*$/, '')).join('\n')
  const btnEl = (topCode.match(/<Button\b[\s\S]*?<\/Button>/) || [])[0] || ''

  // (1) still wraps the Tonight body in its own foundation scope
  it('Home still imports + renders its own <ThoughtfulRoot>', () => {
    expect(home).toMatch(/from\s+['"]@\/shared\/ui\/thoughtful-seatmate['"]/)
    expect(home).toMatch(/<ThoughtfulRoot>\s*<HomeBody\s*\/>\s*<\/ThoughtfulRoot>/)
  })
  // (2)
  it('Home still paints the canvas with <PageDepth depth="radial">', () => {
    expect(home).toMatch(/<PageDepth\s+depth="radial"/)
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
  // (6) explicitly loads the temporary compatibility stylesheet
  it('explicitly imports PrimaryAction.css as temporary visual compatibility', () => {
    expect(top).toMatch(/import\s+['"]@\/shared\/ui\/thoughtful-seatmate\/PrimaryAction\.css['"]/)
  })
  // (7) the compat constant carries both required classes
  it('HOME_PRIMARY_COMPAT_CLASS contains ts-action-primary and ts-action-primary--md', () => {
    const m = topCode.match(/const\s+HOME_PRIMARY_COMPAT_CLASS\s*=\s*'([^']*)'/)
    expect(m, 'compat-class constant present').toBeTruthy()
    expect(m[1]).toContain('ts-action-primary')
    expect(m[1]).toContain('ts-action-primary--md')
  })
  // (8) exactly one migrated direct canonical Button uses that constant
  it('renders exactly one direct primary Button using the compat constant', () => {
    expect((topCode.match(/className=\{`\$\{HOME_PRIMARY_COMPAT_CLASS\}/g) || []).length).toBe(1)
    expect((topCode.match(/<Button\b[\s\S]*?<\/Button>/g) || []).length).toBe(1)
  })
  // (9) the Button specifies variant/size + the compat/responsive/focus className
  it('the migrated Button specifies variant="primary", size="md" and the compat/responsive/focus className', () => {
    expect(btnEl).toMatch(/variant="primary"/)
    expect(btnEl).toMatch(/size="md"/)
    expect(btnEl).toMatch(/className=\{`\$\{HOME_PRIMARY_COMPAT_CLASS\} flex-1 lg:flex-none \$\{FOCUS_RING\}`\}/)
  })
  // (10) preserves the outer plain grouping span (the compat structural grouping)
  it('preserves the outer plain grouping span wrapping the label + chevron', () => {
    expect(btnEl).toMatch(/>\s*<span>\s*<span>Open Film File<\/span>/)
    expect(btnEl).toMatch(/<\/span>\s*<\/Button>/)
  })
  // (11) the grouping span holds the exact label span + one aria-hidden ChevronRight
  it('the grouping span holds the Open Film File label span + one aria-hidden ChevronRight', () => {
    expect(btnEl).toMatch(/<span>Open Film File<\/span>/)
    expect((btnEl.match(/<ChevronRight\b/g) || []).length).toBe(1)
    expect(btnEl).toMatch(/<ChevronRight\s+aria-hidden="true"\s+className="h-3\.5 w-3\.5"\s*\/>/)
  })
})

describe('Stage 2 / Slice D — Movie remains the only production PrimaryAction component consumer', () => {
  // (12) After Home migrates, exactly one production wrapper consumer remains: Movie.
  it('exactly one production PrimaryAction component import remains, and it is Movie', () => {
    const offenders = []
    for (const f of walk(join(ROOT, 'src'))) {
      const r = rel(f)
      if (r.includes('/__tests__/')) continue
      if (r.startsWith('src/features/design-lab/')) continue // dev-only showcase
      if (!/\.jsx?$/.test(r)) continue
      if (/import\s*\{[^}]*\bPrimaryAction\b[^}]*\}\s*from\s*['"]@\/shared\/ui\/thoughtful-seatmate['"]/.test(readFileSync(f, 'utf8'))) offenders.push(r)
    }
    expect(offenders).toEqual(['src/features/movie/sections-top.jsx'])
  })
})

describe('Stage 2 — no other production surface adopts the foundation', () => {
  const importsFoundation = /['"]@\/shared\/ui\/thoughtful-seatmate(['"/]|$)/
  // As of Stage 3, Film File (src/features/movie) is the SECOND authorized pilot
  // adopter alongside Tonight + the dev-only showcase. Any OTHER surface is still a
  // violation. (Cross-pilot guard kept here; the canonical allowlist lives in the
  // foundation's purity-and-non-adoption test.)
  it('only the authorized adopters + the dev-only showcase import the Stage 1 foundation', () => {
    const offenders = []
    for (const f of walk(join(ROOT, 'src'))) {
      const r = rel(f)
      if (r.startsWith('src/shared/ui/thoughtful-seatmate')) continue // the foundation itself
      if (r.startsWith('src/features/home/')) continue // Tonight (Stage 2)
      if (r.startsWith('src/features/movie/')) continue // Film File (Stage 3)
      if (r.startsWith('src/features/watchlist/')) continue // Library/Watchlist (Stage 6)
      if (r.startsWith('src/features/design-lab/thoughtful-seatmate-foundations')) continue // dev-only showcase
      if (r.includes('/__tests__/')) continue
      if (!/\.(jsx?)$/.test(r)) continue
      if (importsFoundation.test(readFileSync(f, 'utf8'))) offenders.push(r)
    }
    expect(offenders).toEqual([])
  })

  it('Tonight remains an independent adopter (its own <ThoughtfulRoot> boundary, unchanged by Stage 3)', () => {
    const home = read('src/features/home/Home.jsx')
    expect(home).toMatch(/<ThoughtfulRoot>\s*<HomeBody\s*\/>\s*<\/ThoughtfulRoot>/)
  })
})

describe("Stage 2 — Tonight's migrated files are free of legacy styling", () => {
  // (The legacy purple→pink gradient is enforced separately + app-wide by
  // `npm run guard:foundations`, so it is intentionally NOT re-asserted here — a
  // literal gradient pattern in this file would itself trip that guard.)
  it('no Newsreader/editorial font, no Outfit, no mood-hex', () => {
    for (const p of MIGRATED) {
      const src = read(p)
      expect(src, `${p} font-editorial`).not.toMatch(/var\(--font-editorial\)/)
      expect(src, `${p} Outfit`).not.toMatch(/['"]Outfit['"]|font-family[^;}]*Outfit/i)
      expect(src, `${p} mood-hex`).not.toMatch(/\b(m|currentMood)\.hex\b/)
    }
  })
})

describe("Stage 2 — the RENDERED sections-bottom components are migrated", () => {
  // sections-bottom.jsx is excluded from MIGRATED above because it ALSO holds
  // components NOT rendered on Tonight (ContinueWatching/CinematicDNA/TasteMatch/
  // TasteTwinPulse/CuratedLists), which keep legacy styling until their own routes
  // migrate. But QuickLog, PageEndCard, and SeenTile ARE rendered on Tonight, so we
  // purity-check just those function bodies (this closes the gap that let an
  // HP.border leak survive in QuickLog).
  const bottom = read('src/features/home/sections-bottom.jsx')
  const RENDERED = ['function SeenTile(', 'export function QuickLog(', 'export function PageEndCard(']
  it('SeenTile / QuickLog / PageEndCard use no legacy HP.* / editorial font / mood-hex', () => {
    for (const decl of RENDERED) {
      const body = fnSource(bottom, decl)
      expect(body, `${decl} :: legacy HP.* token`).not.toMatch(/\bHP\./)
      expect(body, `${decl} :: editorial font`).not.toMatch(/var\(--font-editorial\)/)
      expect(body, `${decl} :: Outfit/Newsreader`).not.toMatch(/['"](Outfit|Newsreader)['"]|font-family[^;}]*(Outfit|Newsreader)/i)
      expect(body, `${decl} :: mood-hex`).not.toMatch(/\b(m|currentMood)\.hex\b/)
    }
  })
})

describe('Stage 2 — no global activation or token replacement', () => {
  it('does not add .ts-root globally (shell / html / body / global CSS)', () => {
    for (const p of ['src/app/AppShell.jsx', 'src/index.css', 'src/styles/globals.css', 'index.html']) {
      expect(read(p), p).not.toMatch(/ts-root/)
    }
  })

  it('does not leak the scoped --ts-* tokens into the global token sources', () => {
    // No global token replacement: the foundation stays scoped to .ts-root, never
    // promoted into the global token files by this pilot.
    expect(read('src/shared/lib/tokens.js')).not.toMatch(/--ts-|TS_TOKENS/)
    expect(read('src/index.css')).not.toMatch(/--ts-/)
  })
})
