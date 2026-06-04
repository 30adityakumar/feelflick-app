import { describe, expect, it } from 'vitest'

import { HP, HP_GRAD, C } from '../tokens'

// Brand-vs-semantic token contract (F3 hardening) — see
// docs/design-system-hardening-f3.md. Guards two invariants: the single brand
// gradient never drifts, and the load-bearing semantic accents are never removed
// (they back gold rating-stars, destructive states, and success/status badges).
describe('design tokens — brand vs semantic contract', () => {
  it('exposes the single brand gradient (purple-600 → pink-500)', () => {
    expect(HP_GRAD).toBe('linear-gradient(135deg, #9333ea 0%, #ec4899 100%)')
  })

  it('keeps the brand identity hues (purple + pink)', () => {
    expect(HP.purple).toBeTruthy()
    expect(HP.pink).toBe('#EC4899')
    expect(HP.purpleDeep).toBeTruthy()
  })

  it('keeps the load-bearing semantic accents (amber / red / green)', () => {
    // NOT brand colors, but relied on app-wide: removing them breaks gold stars,
    // destructive/error states, and success/public/watched badges.
    expect(HP.amber).toBeTruthy()
    expect(HP.red).toBeTruthy()
    expect(HP.green).toBeTruthy()
  })

  it('derives the landing palette C from HP (no divergent brand hexes)', () => {
    expect(C.purple).toBe(HP.purple)
    expect(C.pink).toBe(HP.pink)
  })
})
