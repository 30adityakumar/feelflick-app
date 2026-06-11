import { describe, it, expect } from 'vitest'
import src from '../immersive.jsx?raw'

// F9.3 — Browse must not show an exact, false-precision "Match %"; it uses a qualitative fit label.
describe('Browse QuickLook — F9.3 honest fit label, no exact Match %', () => {
  it('no longer renders an exact "Match %" value', () => {
    expect(src).not.toMatch(/matchScore \+ '%'/)
    expect(src).not.toMatch(/label:\s*'Match'/)
  })

  it('shows a qualitative fit label instead', () => {
    expect(src).toMatch(/label:\s*'Fit'/)
    expect(src).toMatch(/fitLabel\(matchScore\)/)
    for (const l of ['Strong fit', 'Good fit', 'Light fit', 'Worth a look']) {
      expect(src).toContain(l)
    }
  })

  it('keeps the underlying score computation unchanged (scoring not touched)', () => {
    // the composite score is still computed from real signals — only its PRESENTATION changed
    expect(src).toMatch(/const matchScore = mood==='all' \? film\.ff : Math\.round\(0\.6\*\(film\.fit\[mood\]\*100\)/)
  })
})
