import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { useState } from 'react'
import DecisionMarker from '../DecisionMarker'

// === Stage 5 (B2) — DecisionMarker ↔ canonical committed-state reconciliation =
//
// Both pilots (Tonight mood-pills / Watched / Save; Film File watched / saved /
// reaction-tag) expressed the ivory-only committed state by hand: a semantic state
// (aria-pressed/aria-checked) + ≥2 non-colour cues (label change + ivory keyline /
// icon / weight). DecisionMarker is NOT a competing pattern — it is the OPTIONAL
// supplementary ivory dot for that same pattern (aria-hidden; never sufficient
// alone). This test pins the reconciled contract so any future migrated control
// (and any DecisionMarker change) keeps it: the marker may be added, but the owning
// control still carries the real state + ≥2 non-colour cues.

// A minimal committed-state control in the canonical shape, optionally adding the
// supplementary DecisionMarker — mirrors how a migrated surface should compose it.
function CommittedControl({ withMarker }) {
  const [on, setOn] = useState(false)
  return (
    <button
      type="button"
      aria-pressed={on}                 // (1) semantic state
      onClick={() => setOn(v => !v)}
      style={{ border: `1px solid ${on ? 'var(--ts-focus, #f3ecdf)' : 'var(--ts-border-subtle, #302c28)'}` }} // (2) ivory keyline cue
    >
      {withMarker ? <DecisionMarker active={on} srLabel="Saved" /> : null}
      {on ? '✓ Saved' : 'Save'}        {/* (3) label + icon cue */}
    </button>
  )
}

describe('DecisionMarker — composed with the canonical committed-state pattern', () => {
  it('the owning control supplies the semantic state + non-colour cues (marker is supplementary)', async () => {
    const { rerender } = render(<CommittedControl withMarker />)
    const btn = screen.getByRole('button')
    // inactive: aria-pressed=false, "Save" label, marker present but not active
    expect(btn.getAttribute('aria-pressed')).toBe('false')
    expect(btn.textContent).toContain('Save')
    expect(btn.querySelector('.ts-decision-marker').getAttribute('data-active')).toBeNull()
    expect(btn.querySelector('.ts-sr-only')).toBeNull()

    btn.click()
    rerender(<CommittedControl withMarker />)
    // active: aria-pressed=true (state), label+icon changed (cue), keyline + marker lit + SR text
    expect(btn.getAttribute('aria-pressed')).toBe('true')
    expect(btn.textContent).toContain('✓ Saved')
    expect(btn.querySelector('.ts-decision-marker').getAttribute('data-active')).toBe('true')
    expect(btn.querySelector('.ts-sr-only').textContent).toBe('Saved')
  })

  it('the pattern is valid WITHOUT the marker too (pilots used keyline + label, no dot)', () => {
    render(<CommittedControl withMarker={false} />)
    const btn = screen.getByRole('button')
    expect(btn.getAttribute('aria-pressed')).toBe('false') // semantic state present
    expect(btn.querySelector('.ts-decision-marker')).toBeNull() // marker optional
    expect(btn.textContent).toContain('Save') // label cue present
  })
})
