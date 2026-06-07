// src/features/onboarding/__tests__/MoodStep.test.jsx
// F2.9 — MoodStep selection behavior: up-to-MAX_MOODS, calm max feedback, and
// the settle (no-checkbox) selected state. Real component, stateful harness.

import { describe, it, expect, vi, beforeAll } from 'vitest'
import { useState } from 'react'
import { render, screen, fireEvent } from '@testing-library/react'

// framer-motion's useReducedMotion reads window.matchMedia (jsdom lacks it).
beforeAll(() => {
  if (!window.matchMedia) {
    window.matchMedia = vi.fn().mockImplementation(query => ({
      matches: false, media: query, onchange: null,
      addEventListener: vi.fn(), removeEventListener: vi.fn(),
      addListener: vi.fn(), removeListener: vi.fn(), dispatchEvent: vi.fn(),
    }))
  }
})

import MoodStep from '../steps/MoodStep'
import { MOODS, MAX_MOODS } from '../data'

// Stateful harness so toggle()'s setMoods(prev => …) actually applies + re-renders.
function Harness({ initial = [] }) {
  const [moods, setMoods] = useState(initial)
  return <MoodStep moods={moods} setMoods={setMoods} onNext={() => {}} firstName={null} />
}

const tile = (label) => screen.getByRole('button', { name: new RegExp(label, 'i') })
const pressedCount = () =>
  screen.getAllByRole('button').filter(b => b.getAttribute('aria-pressed') === 'true').length

describe('MoodStep — selection + max feedback', () => {
  it('allows selecting up to MAX_MOODS (3) moods', () => {
    render(<Harness />)
    fireEvent.click(tile(MOODS[0].label))
    fireEvent.click(tile(MOODS[1].label))
    fireEvent.click(tile(MOODS[2].label))
    expect(pressedCount()).toBe(MAX_MOODS)
  })

  it('does NOT add a 4th mood once 3 are selected', () => {
    render(<Harness initial={[MOODS[0].key, MOODS[1].key, MOODS[2].key]} />)
    expect(pressedCount()).toBe(3)
    fireEvent.click(tile(MOODS[3].label)) // attempt a 4th
    expect(pressedCount()).toBe(3)
    expect(tile(MOODS[3].label)).toHaveAttribute('aria-pressed', 'false')
  })

  it('shows calm max feedback (footer status + sr-only live region) at the cap', () => {
    render(<Harness initial={[MOODS[0].key, MOODS[1].key, MOODS[2].key]} />)
    expect(screen.getByText(/that's your max$/i)).toBeInTheDocument()  // footer status
    expect(screen.getByText(/maximum of 3/i)).toBeInTheDocument()      // sr-only aria-live
  })

  it('dims/aria-disables unselected tiles at the cap but keeps selected tiles tappable', () => {
    render(<Harness initial={[MOODS[0].key, MOODS[1].key, MOODS[2].key]} />)
    expect(tile(MOODS[3].label)).toHaveAttribute('aria-disabled', 'true')  // unselected
    expect(tile(MOODS[0].label)).not.toHaveAttribute('aria-disabled')      // selected
    fireEvent.click(tile(MOODS[0].label)) // unselect — must still work at cap
    expect(pressedCount()).toBe(2)
  })

  it('no longer renders a checkbox ✓ glyph on selected tiles', () => {
    render(<Harness initial={[MOODS[0].key]} />)
    expect(tile(MOODS[0].label)).toHaveAttribute('aria-pressed', 'true')
    expect(screen.queryByText('✓')).not.toBeInTheDocument()
  })

  it('does not show max feedback below the cap', () => {
    render(<Harness initial={[MOODS[0].key, MOODS[1].key]} />)
    expect(screen.queryByText(/your max/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/maximum of 3/i)).not.toBeInTheDocument()
    expect(tile(MOODS[3].label)).not.toHaveAttribute('aria-disabled')
  })
})
