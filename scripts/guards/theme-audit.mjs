#!/usr/bin/env node
/* eslint-disable no-console */
// === Thoughtful Seatmate — website-wide theme audit =========================
//
// Companion to legacy-gradient-guard.mjs. After the website-wide globalization,
// the canonical `.theme-thoughtful` root + the legacy compatibility aliases
// (src/index.css) recolour most legacy consumers automatically. This audit scans
// production source for the legacy-system signatures and CLASSIFIES each one, so
// we can prove no FORBIDDEN UI chrome renders, while transparently reporting the
// temporary compatibility debt that the alias layer neutralises.
//
// Classifications:
//   • forbidden-ui-chrome        → FAILS the build. A legacy face actually rendered
//                                  (Outfit/Newsreader in a font-family) or a raw
//                                  purple→pink gradient in rendered production code.
//   • legacy-compat-alias        → allowed (reported). A legacy token NAME that the
//                                  canonical theme remaps (HP.purple, --font-editorial,
//                                  purpleDeep, the index.css alias block, var(--color-*
//                                  fallbacks), FILM_PALETTE data).
//   • allowed-artwork-or-identity→ allowed. Mood / avatar / chart DATA hex (palette
//                                  arrays + mood→hex maps) and semantic amber/red/green.
//   • test-fixture / dev-only    → allowed. __tests__ + design-lab.
//
// Run: node scripts/guards/theme-audit.mjs   (--json for machine output)
import { readFile, readdir } from 'node:fs/promises'
import { join, relative, extname, basename } from 'node:path'

const ROOT = process.cwd()
const JSON_OUT = process.argv.includes('--json')
const SCAN_EXTS = new Set(['.js', '.jsx', '.css', '.html'])
const SKIP_DIRS = new Set(['node_modules', 'dist', '.git', 'coverage', 'test-results', 'playwright-report'])

// Files that legitimately DEFINE the canonical tokens or the compatibility aliases.
const ALIAS_SOURCE_FILES = new Set([
  'src/index.css',
  'src/shared/ui/thoughtful-seatmate/foundations.css',
  'src/shared/ui/thoughtful-seatmate/tokens.js',
  'src/shared/lib/tokens.js',
])

const isTest = (p) => /(^|\/)__tests__\//.test(p) || /\.test\.[jt]sx?$/.test(p)
const isDev = (p) => p.includes('design-lab')

// A line is "data/identity" if the legacy hex appears as a quoted DATA value: an
// array of hexes, a mood/avatar/tint/palette field, or a *_PALETTE constant. These
// are allowed (charts, avatars, mood dots) — not chrome.
const DATA_HEX_CONTEXT = /(palette|PALETTE|avatar|AVATAR|mood|tint|\bhex\b|weights|\bh:\s*['"]#)/

// Patterns. Each: [regex, kind, hardFailIfChrome]
const PATTERNS = [
  // Rendered legacy fonts — FORBIDDEN when in a font-family / quoted face.
  [/font-family\s*:[^;}'"]*(Newsreader|Outfit)/gi, 'legacy-font', true],
  [/fontFamily\s*:\s*['"][^'"]*(Newsreader|Outfit)/g, 'legacy-font', true],
  [/['"](Newsreader|Outfit)['"]/g, 'legacy-font-literal', true],
  // Purple→pink gradient (linear OR conic) in any colour syntax — FORBIDDEN chrome.
  [/(linear|conic)-gradient\([^)]*(?:9333ea|ec4899|rgba?\(\s*147[\s,]+51[\s,]+234|rgba?\(\s*236[\s,]+72[\s,]+153|var\(\s*--purple|var\(\s*--pink)/gi, 'legacy-gradient', true],
  // Legacy purple/pink hex literals (reported; chrome vs data decided by context).
  [/#(9333ea|ec4899|a78bfa|7c3aed|c084fc|581c87)/gi, 'purple-pink-hex', true],
  // Legacy token NAMES the canonical theme remaps (always compat-alias, reported only).
  [/--font-editorial\b/g, 'editorial-font-var', false],
  [/\bpurpleDeep\b/g, 'purpleDeep-token', false],
  [/\bFILM_PALETTE\b/g, 'film-palette', false],
  [/\bHP\.(purple|pink)\b/g, 'hp-purple-token', false],
  [/\bHP_GRAD\b/g, 'hp-grad-token', false],
]

function classify(relPath, lineText, kind) {
  if (isTest(relPath)) return 'test-fixture'
  if (isDev(relPath)) return 'dev-only'
  // Canonical / alias source files legitimately carry every legacy name.
  if (ALIAS_SOURCE_FILES.has(relPath)) return 'legacy-compat-alias'
  // A canonical var with a legacy hex FALLBACK is migrated, not chrome.
  if (/var\(\s*--color-[a-z-]+\s*,/.test(lineText)) return 'legacy-compat-alias'
  if (/var\(\s*--ts-[a-z-]+\s*,/.test(lineText)) return 'legacy-compat-alias'
  // Token-name patterns are the compat layer (aliased to Inter / ivory).
  if (kind === 'editorial-font-var' || kind === 'purpleDeep-token' || kind === 'hp-purple-token' || kind === 'film-palette' || kind === 'hp-grad-token') {
    return 'legacy-compat-alias'
  }
  // A bare purple/pink hex.
  if (kind === 'purple-pink-hex') {
    // A purple/pink hex inside a CSS *style declaration* (outline/background/border/
    // color/box-shadow/fill/stroke/gradient: …) is rendered chrome → forbidden.
    if (relPath.endsWith('.css') && /(outline|background|border|color|box-shadow|shadow|fill|stroke|gradient)\s*:/i.test(lineText)) {
      return 'forbidden-ui-chrome'
    }
    // In JS/JSX, a hex that is an OBJECT VALUE (`key: '#hex'`) or an ARRAY ELEMENT
    // (`['#hex', …]`) is DATA — a mood/avatar/tag/chart palette (identity/data-viz),
    // which §11 explicitly allows (avatars, mood dots, charts stay colourful).
    const objectValue = /:\s*['"]#[0-9a-f]{3,8}['"]/i.test(lineText)
    const arrayElement = /[[,]\s*['"]#[0-9a-f]{3,8}['"]/i.test(lineText)
    if (objectValue || arrayElement || DATA_HEX_CONTEXT.test(lineText)) return 'allowed-artwork-or-identity'
    return 'forbidden-ui-chrome'
  }
  // Fonts + gradients reaching here are rendered chrome.
  return 'forbidden-ui-chrome'
}

async function walk(dir, out) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    if (e.name.startsWith('.') && e.name !== '.') continue
    const full = join(dir, e.name)
    if (e.isDirectory()) { if (!SKIP_DIRS.has(e.name)) await walk(full, out); continue }
    if (SCAN_EXTS.has(extname(e.name))) out.push(full)
  }
}

const buckets = {
  'forbidden-ui-chrome': [], 'legacy-compat-alias': [],
  'allowed-artwork-or-identity': [], 'test-fixture': [], 'dev-only': [],
}

const files = []
await walk(join(ROOT, 'src'), files)
files.push(join(ROOT, 'index.html'))

for (const file of files) {
  const rel = relative(ROOT, file)
  let src
  try { src = await readFile(file, 'utf8') } catch { continue }
  const lines = src.split('\n')
  for (const [re, kind, fails] of PATTERNS) {
    re.lastIndex = 0
    let m
    while ((m = re.exec(src))) {
      const idx = m.index
      const lineNo = src.slice(0, idx).split('\n').length
      const lineText = lines[lineNo - 1] || ''
      // Skip matches inside comments (cheap heuristic: line starts with * or // or contains the match only in a /* */).
      const trimmed = lineText.trim()
      if (trimmed.startsWith('*') || trimmed.startsWith('//') || trimmed.startsWith('<!--')) { if (re.lastIndex === idx) re.lastIndex++; continue }
      const cls = classify(rel, lineText, kind)
      buckets[cls].push({ file: rel, line: lineNo, kind, text: trimmed.slice(0, 120), fails })
      if (re.lastIndex === idx) re.lastIndex++
    }
  }
}

if (JSON_OUT) {
  console.log(JSON.stringify(buckets, null, 2))
  process.exit(buckets['forbidden-ui-chrome'].length ? 1 : 0)
}

const counts = Object.fromEntries(Object.entries(buckets).map(([k, v]) => [k, v.length]))
console.log('Thoughtful Seatmate theme audit')
console.log('  forbidden-ui-chrome          :', counts['forbidden-ui-chrome'])
console.log('  legacy-compat-alias (aliased):', counts['legacy-compat-alias'])
console.log('  allowed-artwork-or-identity  :', counts['allowed-artwork-or-identity'])
console.log('  test-fixture                 :', counts['test-fixture'])
console.log('  dev-only                     :', counts['dev-only'])

if (buckets['forbidden-ui-chrome'].length) {
  console.error('\n✗ FORBIDDEN legacy UI chrome still rendered in production source:')
  for (const f of buckets['forbidden-ui-chrome'].slice(0, 60)) {
    console.error(`  ${f.file}:${f.line}  [${f.kind}]  ${f.text}`)
  }
  if (buckets['forbidden-ui-chrome'].length > 60) console.error(`  …and ${buckets['forbidden-ui-chrome'].length - 60} more`)
  process.exit(1)
}
console.log('\n✓ theme audit passed — no forbidden legacy UI chrome renders; remaining legacy names are aliased compatibility debt (neutralised by .theme-thoughtful).')
