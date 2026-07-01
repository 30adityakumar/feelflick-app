import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

// The exact canonicalization DnaLowercaseRedirect performs (router.jsx).
const canonicalize = (pathname) => pathname.replace(/^\/dna(?=\/|$)/, '/DNA')

describe('/DNA lowercase → canonical redirect logic', () => {
  it('/dna → /DNA', () => { expect(canonicalize('/dna')).toBe('/DNA') })
  it('/dna/:id → /DNA/:id (preserves the id)', () => { expect(canonicalize('/dna/abc-123')).toBe('/DNA/abc-123') })
  it('does not rewrite unrelated paths that merely start with "dna"', () => {
    expect(canonicalize('/dnalab')).toBe('/dnalab')
    expect(canonicalize('/browse')).toBe('/browse')
  })
})

describe('router.jsx wiring', () => {
  it('registers the DNA-portrait routes + lowercase redirect and keeps the social /profile routes', () => {
    const src = readFileSync(resolve(import.meta.dirname, '../../../app/router.jsx'), 'utf8')
    expect(src).toMatch(/path: 'DNA'/)          // /DNA → the Cinematic DNA portrait (TasteProfile)
    expect(src).toMatch(/path: 'DNA\/:userId'/)
    expect(src).toMatch(/path: 'dna'/)
    expect(src).toMatch(/path: 'dna\/:userId'/)
    expect(src).toMatch(/function DnaLowercaseRedirect/)
    expect(src).toMatch(/replace\(\/\^\\\/dna/) // the canonicalization regex is present
    expect(src).toMatch(/path: 'profile'/)      // /profile → the social profile (DnaPage)
    expect(src).toMatch(/path: 'profile\/:userId'/)
  })
})
