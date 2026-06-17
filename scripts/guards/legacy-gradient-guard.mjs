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
import { readFile, writeFile, readdir, stat } from 'node:fs/promises'
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

  if (failures.length) {
    console.error('✗ legacy-gradient / Stage-1 purity guard FAILED:\n' + failures.map((f) => '  • ' + f).join('\n'))
    process.exit(1)
  }
  const total = Object.values(current).reduce((a, b) => a + b, 0)
  console.log(`✓ legacy-gradient guard passed (${Object.keys(current).length} baselined files / ${total} allowlisted occurrences unchanged; Stage-1 namespace pure)`)
}

main().catch((e) => { console.error(e); process.exit(1) })
