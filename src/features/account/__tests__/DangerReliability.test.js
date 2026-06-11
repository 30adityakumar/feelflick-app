import { describe, it, expect } from 'vitest'
import src from '../sections-bottom.jsx?raw'

// F9.3 — Account destructive-action a11y + reliability + copy honesty (source guard).
describe('Account — F9.3 delete-modal a11y + pending', () => {
  it('the delete dialog is labelled by its visible title', () => {
    expect(src).toMatch(/aria-labelledby="del-modal-title"/)
    expect(src).toMatch(/<h2 id="del-modal-title"/)
  })

  it('closes on Escape and focuses the first field on open', () => {
    expect(src).toMatch(/e\.key === 'Escape'/)
    expect(src).toMatch(/emailRef\.current\?\.focus\(\)/)
  })

  it('removes outline:none from the modal inputs (keyboard focus is visible)', () => {
    // both del-confirm-email + del-reason had outline:'none'; neither should anymore
    const modal = src.slice(src.indexOf('del-modal-title'), src.indexOf('Schedule deletion') + 40)
    expect(modal).not.toMatch(/outline:'none'/)
  })

  it('disables the destructive button while the request is pending', () => {
    expect(src).toMatch(/disabled=\{!enabled \|\| busy\}/)
    expect(src).toMatch(/busy \? 'Scheduling…' : 'Schedule deletion'/)
  })
})

describe('Account — F9.3 Reset taste profile confirmation + honest copy', () => {
  it('requires a two-step confirmation (confirmFirst)', () => {
    const reset = src.slice(src.indexOf('Reset taste profile') - 40, src.indexOf('Reset taste profile') + 320)
    expect(reset).toMatch(/confirmFirst/)
  })

  it('copy is accurate — no misleading "mood weights" / "watches stay logged"', () => {
    const reset = src.slice(src.indexOf('Reset taste profile') - 40, src.indexOf('Reset taste profile') + 320)
    expect(reset).not.toMatch(/mood weights start from zero/)
    expect(reset).not.toMatch(/existing watches stay logged/)
    expect(reset).toMatch(/onboarding/i) // describes what actually happens
  })

  it('does NOT regress the B1.2 analytics copy (still honest, no "no PII")', () => {
    expect(src).not.toMatch(/Aggregated, no PII/)
    expect(src).toMatch(/Privacy-safe usage analytics/)
  })
})
