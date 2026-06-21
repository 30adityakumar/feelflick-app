#!/usr/bin/env node
/* eslint-disable no-console */
// === Thoughtful Seatmate — legacy-gradient + Stage-1 purity guard ===========
//
// The legacy purple→pink gradient is RETIRED from the target system (visual-system
// closure). This guard does NOT remove existing debt — it freezes it and fails CI
// on any NEW use. Two checks:
//
//   A. APP-WIDE BASELINE — counts legacy-gradient occurrences across src/ + index.html
//      and compares to a committed, reviewable allowlist baseline. A new file with a
//      match, or an increased count in a baselined file, FAILS. (Existing debt passes.)
//
//   B. STAGE-1 PURITY — the new Thoughtful Seatmate foundation + its showcase must be
//      free of the legacy gradient, legacy purple/pink hexes/vars, the legacy fonts
//      (Newsreader/Outfit) in font-family usage, and contextual-color vars. Uses
//      USAGE-based patterns (not bare words) to avoid flagging explanatory prose.
//
// No automatic rewriting. Run: `node scripts/guards/legacy-gradient-guard.mjs`
//   --update-baseline   regenerate the app-wide baseline (review the diff).
//
// SCOPE NOTE: broader bans (new Newsreader/Outfit/purple/plum/contextual usage on
// production target surfaces) remain REVIEW rules — see the Stage 1 implementation
// record. Only the legacy gradient (app-wide) and Stage-1 purity are automated here.
import { readFile, writeFile, readdir } from 'node:fs/promises'
import { join, relative } from 'node:path'

const ROOT = process.cwd()
const BASELINE_PATH = join(ROOT, 'scripts/guards/legacy-gradient-baseline.json')

// Dirs whose contents are NOT part of the app-wide debt scan: the pure Stage-1
// namespace + showcase (covered by the purity check) and anything containing the
// guard's own pattern strings.
const APP_SCAN_EXCLUDE = [
  'src/shared/ui/thoughtful-seatmate',
  'src/features/design-lab',
]
const PURITY_DIRS = [
  'src/shared/ui/thoughtful-seatmate',
  'src/features/design-lab/thoughtful-seatmate-foundations',
]
const SCAN_EXTS = new Set(['.js', '.jsx', '.css', '.html'])

// Legacy-gradient occurrence patterns (app-wide debt baseline). Catches the legacy
// purple→pink gradient across hex, rgb/hsl, CSS-var, and named-color forms so a new
// use cannot evade the baseline by changing colour syntax.
// Targets the legacy purple→pink LINEAR gradient specifically, in any colour syntax
// it could be re-expressed in (hex, rgb/rgba of the exact legacy values, or the
// --purple/--pink scale vars that --brand-gradient expands to). Deliberately NOT
// radial/conic + NOT named colours, to avoid flagging the unrelated existing landing
// radial-blob ambient (scope creep / baseline churn).
const PURPLE_PINK_IN_GRADIENT = /linear-gradient\([^)]*(?:9333ea|ec4899|rgba?\(\s*147[\s,]+51[\s,]+234|rgba?\(\s*236[\s,]+72[\s,]+153|var\(\s*--purple|var\(\s*--pink)/gi
const LEGACY_PATTERNS = [
  PURPLE_PINK_IN_GRADIENT,
  /--brand-gradient\b/g,
  /--gradient-primary\b/g,
  /\bHP_GRAD\b/g,
]

// Stage-1 purity patterns — USAGE-based to avoid matching explanatory comments.
const PURITY_PATTERNS = [
  [PURPLE_PINK_IN_GRADIENT, 'legacy purple→pink gradient (any colour syntax)'],
  [/--ts-[a-z0-9-]*(gradient|decision|signal|context|aura|plum|purple|pink)/gi, 'forbidden --ts-* token name (no gradient/decision-signal/contextual/purple/plum tokens)'],
  [/var\(\s*--brand-gradient/gi, 'legacy --brand-gradient var'],
  [/var\(\s*--gradient-primary/gi, 'legacy --gradient-primary var'],
  [/--(brand-gradient|gradient-primary)\s*:/gi, 'legacy gradient token definition'],
  [/\bHP_GRAD\b/g, 'HP_GRAD legacy gradient constant'],
  [/#(9333ea|ec4899|a78bfa|7c3aed)/gi, 'legacy purple/pink hex'],
  [/var\(\s*--(purple|pink)-/gi, 'legacy purple/pink scale var'],
  [/--(purple|pink)-\d/gi, 'legacy purple/pink scale token'],
  [/font-family\s*:[^;}]*(Newsreader|Outfit)/gi, 'legacy font (Newsreader/Outfit)'],
  [/['"](Newsreader|Outfit)['"]/g, 'legacy font literal (Newsreader/Outfit)'],
  [/var\(\s*--context-/gi, 'contextual-color var (deferred — not implemented)'],
]

// === Stage 5 — migrated-surface purity + adopter allowlist ===================
//
//   C. MIGRATED-SURFACE PURITY — the RENDERED files of each migrated production
//      surface (Tonight, Film File) must stay free of the legacy editorial font,
//      purple/pink chrome, and contextual/poster colour, so a migrated surface can
//      never regress. Zero-tolerance (these files are clean today). Data/hook
//      modules carry avatar/mood IDENTITY colours that are NOT chrome and are out of
//      scope; `home/sections-bottom.jsx` mixes rendered + still-deferred non-rendered
//      components, so its rendered exports are covered by a per-function slice in the
//      Stage 2 test instead of a whole-file scan here.
//
//   D. ADOPTER ALLOWLIST — only the authorized surfaces may import the foundation.
//      A new production adopter outside the allowlist FAILS (mirrors the foundation
//      purity test, enforced here too). Grow ADOPTERS + MIGRATED_FILES one stage at
//      a time as each surface migrates.
const ADOPTERS = ['src/features/home/', 'src/features/movie/', 'src/features/watchlist/', 'src/features/browse/', 'src/features/discover/']
const ADOPTER_EXEMPT = [
  'src/shared/ui/thoughtful-seatmate', // the foundation itself
  'src/features/design-lab/thoughtful-seatmate-foundations', // dev-only showcase
]
const FOUNDATION_IMPORT = /['"]@\/shared\/ui\/thoughtful-seatmate(['"/]|$)/
const MIGRATED_FILES = [
  // Tonight (Stage 2) — rendered presentational files (sections-bottom is excluded:
  // it mixes rendered exports + deferred non-rendered components; the Stage 2 test
  // slice-checks its rendered exports).
  'src/features/home/Home.jsx',
  'src/features/home/sections-top.jsx',
  'src/features/home/WhyThisPick.jsx',
  'src/features/home/atoms.jsx',
  'src/features/home/home.css',
  // Film File (Stage 3)
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
  // Library family (Stage 6) — the Watchlist route. The SHARED LibrarySectionNav
  // (src/features/library/library.css) is migrated via backward-compatible scoped
  // `var(--ts-*, <legacy>)` fallbacks so History (no .ts-root) stays byte-identical;
  // it keeps legacy fallbacks for that reason, so it is intentionally NOT listed here.
  'src/features/watchlist/Watchlist.jsx',
  'src/features/watchlist/watchlist.css',
  // Browse (explicit-curiosity redesign) — Inter-only, flat Ink canvas, neutral
  // controls + coral signature only; no editorial font / purple-pink / contextual colour.
  'src/features/browse/Browse.jsx',
  'src/features/browse/browse.css',
  'src/features/browse/browsePresentation.js',
  'src/features/browse/useCuriosityPaths.js',
  'src/features/browse/components/BrowseMasthead.jsx',
  'src/features/browse/components/BrowseScopedSearch.jsx',
  'src/features/browse/components/BrowseCuriosityPaths.jsx',
  'src/features/browse/components/BrowseFilterBar.jsx',
  'src/features/browse/components/BrowseFilterPopover.jsx',
  'src/features/browse/components/BrowseFilterDrawer.jsx',
  'src/features/browse/components/BrowseActiveFilters.jsx',
  'src/features/browse/components/BrowseResultsHeader.jsx',
  'src/features/browse/components/BrowseFilmGrid.jsx',
  'src/features/browse/components/BrowseFilmCard.jsx',
  'src/features/browse/components/BrowseSurpriseDialog.jsx',
  // Discover (tuned-to-the-moment redesign) — Inter-only, flat Ink canvas, neutral
  // ivory primary actions; mood colour is local accent only (the mood-hex palette
  // lives in derive.js data and is applied dynamically, never as a chrome literal).
  'src/features/discover/Discover.jsx',
  'src/features/discover/discover.css',
  'src/features/discover/discoverDirections.js',
  'src/features/discover/discoverSession.js',
  'src/features/discover/resultPresentation.js',
  'src/features/discover/sections/DiscoverMoodStage.jsx',
  'src/features/discover/sections/MoodConstellation.jsx',
  'src/features/discover/sections/SelectedMoodSummary.jsx',
  'src/features/discover/sections/DiscoverConstellationCenter.jsx',
  'src/features/discover/sections/DiscoverContextStage.jsx',
  'src/features/discover/sections/ContextEditor.jsx',
  'src/features/discover/sections/DiscoverResolveStage.jsx',
  'src/features/discover/sections/DiscoverResultStage.jsx',
  'src/features/discover/sections/DiscoverResultBackdrop.jsx',
  'src/features/discover/sections/DiscoverArtworkLayer.jsx',
  'src/features/discover/sections/DiscoverCinematicScrim.jsx',
  'src/features/discover/sections/DiscoverLeadFilm.jsx',
  'src/features/discover/sections/DiscoverReason.jsx',
  'src/features/discover/sections/DiscoverContextChips.jsx',
  'src/features/discover/sections/DiscoverDirectionDock.jsx',
  'src/features/discover/sections/DiscoverDirectionCard.jsx',
  'src/features/discover/sections/DiscoverExhaustedState.jsx',
  'src/features/discover/sections/DiscoverProgress.jsx',
]
const MIGRATED_PURITY = [
  [/var\(\s*--font-editorial\)/gi, 'editorial font var (migrated surfaces are Inter-only)'],
  [/font-family\s*:[^;}]*(Newsreader|Outfit)/gi, 'legacy font (Newsreader/Outfit)'],
  [/['"](Newsreader|Outfit)['"]/g, 'legacy font literal (Newsreader/Outfit)'],
  [/#(9333ea|ec4899|a78bfa|7c3aed)\b/gi, 'purple/pink chrome hex'],
  [/\bHP\.(purple|pink|purpleDeep)\b/g, 'legacy HP purple/pink chrome'],
  [/\bFILM_PALETTE\b/g, 'poster/mood contextual colour (deferred — forbidden)'],
  [/var\(\s*--context-/gi, 'contextual-color var (deferred)'],
]

async function walk(dir, acc = []) {
  let entries
  try { entries = await readdir(dir, { withFileTypes: true }) } catch { return acc }
  for (const e of entries) {
    const full = join(dir, e.name)
    if (e.isDirectory()) {
      if (e.name === 'node_modules' || e.name === 'dist' || e.name === '.git') continue
      await walk(full, acc)
    } else if (SCAN_EXTS.has(full.slice(full.lastIndexOf('.')))) {
      acc.push(full)
    }
  }
  return acc
}

const rel = (f) => relative(ROOT, f).split('\\').join('/')
const inAny = (relPath, dirs) => dirs.some((d) => relPath === d || relPath.startsWith(d + '/'))

function countLegacy(text) {
  let n = 0
  for (const re of LEGACY_PATTERNS) { const m = text.match(re); if (m) n += m.length }
  return n
}

async function scanAppWide() {
  const files = [...await walk(join(ROOT, 'src')), join(ROOT, 'index.html')]
  const counts = {}
  for (const f of files) {
    const r = rel(f)
    if (inAny(r, APP_SCAN_EXCLUDE)) continue
    let text
    try { text = await readFile(f, 'utf8') } catch { continue }
    const n = countLegacy(text)
    if (n > 0) counts[r] = n
  }
  return counts
}

async function scanPurity() {
  const violations = []
  for (const d of PURITY_DIRS) {
    const files = await walk(join(ROOT, d))
    for (const f of files) {
      // Tests legitimately contain the forbidden pattern strings as assertions.
      if (rel(f).includes('/__tests__/')) continue
      let text
      try { text = await readFile(f, 'utf8') } catch { continue }
      for (const [re, label] of PURITY_PATTERNS) {
        const m = text.match(re)
        if (m) violations.push({ file: rel(f), label, sample: m[0] })
      }
    }
  }
  return violations
}

// C. Migrated-surface purity (zero-tolerance over an explicit rendered-file list).
async function scanMigratedSurfaces() {
  const violations = []
  for (const relPath of MIGRATED_FILES) {
    let text
    try { text = await readFile(join(ROOT, relPath), 'utf8') } catch { continue }
    for (const [re, label] of MIGRATED_PURITY) {
      const m = text.match(re)
      if (m) violations.push({ file: relPath, label, sample: m[0] })
    }
  }
  return violations
}

// D. Adopter allowlist — only ADOPTERS (+ the foundation + showcase) may import the
// Stage 1 foundation. Any other production file importing it FAILS.
async function scanAdopters() {
  const files = await walk(join(ROOT, 'src'))
  const offenders = []
  for (const f of files) {
    const r = rel(f)
    if (!/\.(jsx?)$/.test(r) || r.includes('/__tests__/')) continue
    if (inAny(r, ADOPTER_EXEMPT)) continue
    if (ADOPTERS.some((a) => r.startsWith(a))) continue
    let text
    try { text = await readFile(f, 'utf8') } catch { continue }
    if (FOUNDATION_IMPORT.test(text)) offenders.push(r)
  }
  return offenders
}

async function main() {
  const update = process.argv.includes('--update-baseline')
  const current = await scanAppWide()

  if (update) {
    const sorted = Object.fromEntries(Object.entries(current).sort(([a], [b]) => a.localeCompare(b)))
    await writeFile(BASELINE_PATH, JSON.stringify({
      _comment: 'Legacy purple→pink gradient occurrence allowlist. Existing debt only. Any NEW occurrence (new file, or higher count) fails the guard. The legacy gradient is RETIRED from the target system; do not add new uses. Regenerate intentionally with --update-baseline and review the diff.',
      counts: sorted,
    }, null, 2) + '\n')
    console.log(`✓ baseline written: ${Object.keys(sorted).length} files, ${Object.values(sorted).reduce((a, b) => a + b, 0)} occurrences`)
    return
  }

  let baseline
  try { baseline = JSON.parse(await readFile(BASELINE_PATH, 'utf8')).counts || {} }
  catch { console.error(`✗ missing baseline ${rel(BASELINE_PATH)} — run with --update-baseline`); process.exit(1) }

  const failures = []
  for (const [file, n] of Object.entries(current)) {
    const allowed = baseline[file] ?? 0
    if (n > allowed) failures.push(`NEW legacy purple→pink gradient use in ${file} (${n} found, ${allowed} allowed). The legacy gradient is RETIRED from the target system — do not add new uses (no replacement gradient, no new gradient token).`)
  }

  const purity = await scanPurity()
  for (const v of purity) failures.push(`Stage-1 PURITY violation in ${v.file}: ${v.label} ("${v.sample}"). The Thoughtful Seatmate foundation must use only the scoped --ts-* tokens (Inter only; no legacy gradient/purple/pink/Newsreader/Outfit/contextual color).`)

  const migrated = await scanMigratedSurfaces()
  for (const v of migrated) failures.push(`MIGRATED-SURFACE regression in ${v.file}: ${v.label} ("${v.sample}"). A migrated Thoughtful Seatmate surface must stay Inter-only / ivory / neutral — no editorial font, purple/pink chrome, or contextual/poster colour.`)

  const adopters = await scanAdopters()
  for (const r of adopters) failures.push(`UNAUTHORIZED foundation adopter: ${r} imports @/shared/ui/thoughtful-seatmate but is not an authorized adopter (${ADOPTERS.join(', ')} + the dev showcase). Migrate it under its own gated stage + add it to the guard's ADOPTERS/MIGRATED_FILES.`)

  if (failures.length) {
    console.error('✗ legacy-gradient / Stage-1 purity guard FAILED:\n' + failures.map((f) => '  • ' + f).join('\n'))
    process.exit(1)
  }
  const total = Object.values(current).reduce((a, b) => a + b, 0)
  console.log(`✓ foundation guard passed (legacy-gradient: ${Object.keys(current).length} baselined files / ${total} occ unchanged; Stage-1 namespace pure; ${MIGRATED_FILES.length} migrated-surface files clean; adopter allowlist = ${ADOPTERS.join(' + ')} + showcase)`)
}

main().catch((e) => { console.error(e); process.exit(1) })
