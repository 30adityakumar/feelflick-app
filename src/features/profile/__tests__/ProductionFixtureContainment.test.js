/* global process */
import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { join, relative } from 'node:path'

// Containment guard: normal PRODUCTION execution of the Cinematic DNA surface can NEVER activate the
// capture-only / e2e visual fixtures. The deterministic capture data (the rich/same-content
// identities, "The Thinking Heart", "126 watched", fixture film titles) lives ONLY under e2e/ test
// ownership and the untracked .cdna-tmp helper, both of which work exclusively via Playwright network
// interception that does not exist in a shipped build. This test fails loudly if any production
// Profile source imports a fixture, references a fixture-only mode string, exposes a runtime
// fixture switch (query param / localStorage), or bakes a prototype identity as a production fallback.

const ROOT = process.cwd()
const PROFILE_SRC = join(ROOT, 'src/features/profile')
const rel = (f) => relative(ROOT, f).split('\\').join('/')

function walk(dir, acc = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, e.name)
    if (e.isDirectory()) { if (e.name === '__tests__') continue; walk(full, acc) } // skip tests (legitimately use fixtures)
    else if (/\.(js|jsx)$/.test(e.name)) acc.push(full)
  }
  return acc
}

const FILES = walk(PROFILE_SRC)

// Forbidden in PRODUCTION profile source (tests excluded above).
const FORBIDDEN = [
  [/from\s+['"][^'"]*e2e\/fixtures/i, 'imports an e2e fixture'],
  [/from\s+['"][^'"]*\.cdna-tmp/i, 'imports a .cdna-tmp capture helper'],
  [/fixture-samecontent/i, 'references the capture-only same-content fixture'],
  [/installProfileFixture|installSameContent/, 'references a capture fixture installer'],
  [/['"]established_rich['"]|['"]established_current['"]|['"]established_stale['"]|['"]established_missing['"]/, 'references a fixture-only mode string'],
  [/The Thinking Heart|126 watched|42 rated|\bAurora \d|\bReverie \d|\bLantern \d/, 'bakes a prototype/fixture identity literal'],
  [/sb-stub-auth-token/, 'references the capture-only stub auth token'],
  // No runtime fixture switch: production must not branch identity on a URL/localStorage flag.
  [/(searchParams|URLSearchParams|location\.search)[\s\S]{0,80}(fixture|mock|demo|sample|mode)/i, 'reads a URL fixture/demo switch'],
  [/localStorage[\s\S]{0,40}(fixture|mock|demo|sample)/i, 'reads a localStorage fixture/demo switch'],
]

describe('Cinematic DNA — production fixture containment', () => {
  it('no production Profile source imports or activates a capture/e2e fixture', () => {
    const violations = []
    for (const f of FILES) {
      const text = readFileSync(f, 'utf8')
      for (const [re, why] of FORBIDDEN) if (re.test(text)) violations.push(`${rel(f)} :: ${why}`)
    }
    expect(violations).toEqual([])
  })

  it('the profile data layer reads only the real Supabase client (no fixture/demo data source)', () => {
    const hook = readFileSync(join(PROFILE_SRC, 'useProfileData.jsx'), 'utf8')
    expect(hook).toMatch(/@\/shared\/lib\/supabase/) // real client only
    expect(hook).not.toMatch(/fixture|mock data|demo data|sampleProfile/i)
  })

  it('scans a meaningful number of production Profile files (guard is wired)', () => {
    expect(FILES.length).toBeGreaterThan(10)
  })
})
