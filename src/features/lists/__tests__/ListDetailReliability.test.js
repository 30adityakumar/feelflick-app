import { describe, it, expect } from 'vitest'
import src from '../ListDetail.jsx?raw'

// F9.3 — ListDetail delete must settle honestly (source guard; the full component is heavy to render).
describe('ListDetail — F9.3 delete reliability', () => {
  it('guards against double-delete with a synchronous ref', () => {
    expect(src).toMatch(/deletingRef\.current/) // in-flight guard
    expect(src).toMatch(/if \(deletingRef\.current\) return/)
  })

  it('navigates away ONLY after the DB delete resolves with no error (no false success)', () => {
    const errIdx = src.indexOf("if (error) {")
    const navIdx = src.indexOf("navigate('/lists', { replace: true }) // success only")
    expect(errIdx).toBeGreaterThan(0)
    expect(navIdx).toBeGreaterThan(errIdx) // the navigate sits after the error-return branch
  })

  it('surfaces a safe error and keeps the list visible on failure (no raw backend text)', () => {
    expect(src).toMatch(/setDeleteError\('Could not delete this list\. Please try again\.'\)/)
    expect(src).toMatch(/role="alert"/)
    // the raw error only goes to the console, never into state/UI
    expect(src).toMatch(/console\.error\('\[ListDetail\.delete\]', error\)/)
    expect(src).not.toMatch(/setDeleteError\(error/)
  })
})
