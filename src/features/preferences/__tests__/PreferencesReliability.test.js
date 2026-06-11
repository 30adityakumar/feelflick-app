import { describe, it, expect } from 'vitest'
import dataSrc from '../usePreferencesData.jsx?raw'
import viewSrc from '../Preferences.jsx?raw'
import fs from 'node:fs'
import { resolve } from 'node:path'

// F9.3 — Preferences save reliability + phone-safe responsive layout (source guard).
describe('Preferences — F9.3 save reliability', () => {
  it('surfaces a safe save error (no silent false-success, no raw backend text)', () => {
    expect(dataSrc).toMatch(/setSaveError\('Could not save your preferences\. Please try again\.'\)/)
    expect(dataSrc).toMatch(/console\.error\('\[usePreferencesData\.save\]', e\)/)
    expect(dataSrc).not.toMatch(/setSaveError\(e[.)]/) // never the raw error object/message
  })

  it('guards against duplicate submit synchronously and exposes saveError', () => {
    expect(dataSrc).toMatch(/if \(deletingRef|if \(!userId \|\| !dirty \|\| savingRef\.current\)/)
    expect(dataSrc).toMatch(/savingRef\.current = true/)
    expect(dataSrc).toMatch(/loading, saving, savedAt, saveError, dirty/)
  })

  it('documents the onboarding-write race as impossible (PostAuthGate gates /preferences)', () => {
    expect(dataSrc).toMatch(/onboarding-write race/i)
    expect(dataSrc).toMatch(/PostAuthGate/)
  })

  it('the view renders saveError as an accessible alert', () => {
    expect(viewSrc).toMatch(/saveError && <p role="alert"/)
  })
})

describe('Preferences — F9.3 phone-safe layout', () => {
  it('fixed multi-column grids now stack via auto-fit/minmax', () => {
    expect(viewSrc).not.toMatch(/gridTemplateColumns: 'repeat\(3,1fr\)'/)
    expect(viewSrc).not.toMatch(/gridTemplateColumns: 'repeat\(4,1fr\)'/)
    expect(viewSrc.match(/repeat\(auto-fit, minmax\(/g)?.length).toBeGreaterThanOrEqual(3)
  })

  it('css pulls in the wide section padding at phone widths', () => {
    const css = fs.readFileSync(resolve(import.meta.dirname, '../preferences.css'), 'utf8')
    expect(css).toMatch(/@media \(max-width: 600px\)/)
    expect(css).toMatch(/\.ff-preferences-v2 section \{ padding-left: 20px/)
    expect(css).toMatch(/:focus-visible/) // visible keyboard focus
  })
})
