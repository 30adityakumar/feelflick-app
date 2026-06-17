/* global process */
import { describe, expect, it } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { join, relative } from 'node:path'

const ROOT = process.cwd()
const NS = 'src/shared/ui/thoughtful-seatmate'
const SHOWCASE = 'src/features/design-lab/thoughtful-seatmate-foundations'
const EXTS = new Set(['.js', '.jsx', '.css'])

function walk(dir, acc = []) {
  let entries
  try { entries = readdirSync(dir, { withFileTypes: true }) } catch { return acc }
  for (const e of entries) {
    const full = join(dir, e.name)
    if (e.isDirectory()) {
      if (e.name === 'node_modules' || e.name === 'dist' || e.name === '.git') continue
      walk(full, acc)
    } else if (EXTS.has(full.slice(full.lastIndexOf('.')))) acc.push(full)
  }
  return acc
}
const rel = (f) => relative(ROOT, f).split('\\').join('/')

// Usage-based forbidden patterns (avoid flagging explanatory prose). Mirrors the
// guard, incl. rgb/rgba/var forms of the legacy linear gradient and forbidden --ts-*
// token names.
const PURITY = [
  /linear-gradient\([^)]*(?:9333ea|ec4899|rgba?\(\s*147[\s,]+51[\s,]+234|rgba?\(\s*236[\s,]+72[\s,]+153|var\(\s*--purple|var\(\s*--pink)/i,
  /--ts-[a-z0-9-]*(gradient|decision|signal|context|aura|plum|purple|pink)/i,
  /var\(\s*--(brand-gradient|gradient-primary)/i,
  /--(brand-gradient|gradient-primary)\s*:/i,
  /\bHP_GRAD\b/,
  /#(9333ea|ec4899|a78bfa|7c3aed)/i,
  /var\(\s*--(purple|pink)-/i,
  /--(purple|pink)-\d/i,
  /font-family\s*:[^;}]*(Newsreader|Outfit)/i,
  /['"](Newsreader|Outfit)['"]/,
  /var\(\s*--context-/i,
]

describe('Stage 1 foundation — purity', () => {
  it('uses only the scoped --ts-* foundation (no legacy gradient/purple/pink/font/contextual)', () => {
    const files = [...walk(join(ROOT, NS)), ...walk(join(ROOT, SHOWCASE))]
      .filter((f) => !rel(f).includes('/__tests__/'))
    const violations = []
    for (const f of files) {
      const text = readFileSync(f, 'utf8')
      for (const re of PURITY) if (re.test(text)) violations.push(`${rel(f)} :: ${re}`)
    }
    expect(violations).toEqual([])
  })

  it('detection patterns catch legacy-gradient evasions (hex / rgb / var) and forbidden --ts names', () => {
    const evasions = [
      'background: linear-gradient(135deg, #9333ea, #ec4899)',
      'background: linear-gradient(135deg, rgb(147, 51, 234), rgb(236, 72, 153))',
      'background: linear-gradient(135deg, rgba(147,51,234,1), rgba(236,72,153,1))',
      'background: linear-gradient(135deg, var(--purple-600), var(--pink-500))',
      '--ts-decision-signal: #dd4e83',
      '--ts-brand-gradient: x',
    ]
    for (const s of evasions) expect(PURITY.some((re) => re.test(s))).toBe(true)
  })
})

describe('Stage 1 — production non-adoption', () => {
  // Match both static (`from '…'`) and dynamic (`import('…')`) specifiers.
  const importsFoundation = /['"]@\/shared\/ui\/thoughtful-seatmate(['"/]|$)/
  const importsShowcase = /['"]@\/features\/design-lab\/thoughtful-seatmate-foundations/
  const all = walk(join(ROOT, 'src')).filter((f) => f.endsWith('.js') || f.endsWith('.jsx'))

  it('no production surface imports the foundation (only the dev-only showcase may)', () => {
    const offenders = []
    for (const f of all) {
      const r = rel(f)
      if (r.startsWith(NS) || r.startsWith(SHOWCASE) || r.includes('/__tests__/')) continue
      if (importsFoundation.test(readFileSync(f, 'utf8'))) offenders.push(r)
    }
    expect(offenders).toEqual([])
  })

  it('the showcase is imported only by the router, under a dev-only guard', () => {
    const importers = []
    for (const f of all) {
      const r = rel(f)
      if (r.startsWith(SHOWCASE) || r.includes('/__tests__/')) continue
      if (importsShowcase.test(readFileSync(f, 'utf8'))) importers.push(r)
    }
    expect(importers).toEqual(['src/app/router.jsx'])
    // and that router import sits behind the literal import.meta.env.DEV guard
    const router = readFileSync(join(ROOT, 'src/app/router.jsx'), 'utf8')
    expect(/import\.meta\.env\.DEV[\s\S]{0,60}import\('@\/features\/design-lab\/thoughtful-seatmate-foundations\/Showcase'\)/.test(router)).toBe(true)
  })
})

describe('Stage 1 — guard is mandatory in CI', () => {
  const wf = readFileSync(join(ROOT, '.github/workflows/app-quality.yml'), 'utf8')

  it('the App Quality Gate runs `npm run guard:foundations`', () => {
    expect(wf).toMatch(/run:\s*npm run guard:foundations\b/)
  })

  it('the guard is not optional (no continue-on-error directive, no baseline regeneration in CI)', () => {
    expect(wf).not.toMatch(/continue-on-error\s*:/i)
    expect(wf).not.toContain('guard:foundations:update')
  })
})
