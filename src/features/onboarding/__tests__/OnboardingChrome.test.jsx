// src/features/onboarding/__tests__/OnboardingChrome.test.jsx
// Persistent onboarding chrome — the fused DnaRail (F2.11), which replaces the
// former Progress + TasteStrip. Preserves their pinned contracts: progressbar
// semantics + reduced-motion resilience + the non-color Mood/Genre/Film/Rated
// labels + hide-when-empty, and adds the aria-live tally + Step-4 suppression.

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

// framer-motion's useReducedMotion reads window.matchMedia, which jsdom lacks.
// Default to "no preference"; one test flips it.
beforeEach(() => {
  window.matchMedia = vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))
})

import DnaRail from '../components/DnaRail'

const props = (over = {}) => ({ step: 0, moods: [], genres: [], films: [], ratings: {}, ...over })

describe('DnaRail — progressbar semantics', () => {
  it('exposes role=progressbar with min/max and aria-valuenow = step + 1', () => {
    render(<DnaRail {...props({ step: 0 })} />)
    const bar = screen.getByRole('progressbar', { name: /onboarding progress/i })
    expect(bar).toHaveAttribute('aria-valuemin', '1')
    expect(bar).toHaveAttribute('aria-valuemax', '4')
    expect(bar).toHaveAttribute('aria-valuenow', '1')
  })

  it('aria-valuenow tracks the current step (step 3 → 4 of 4)', () => {
    render(<DnaRail {...props({ step: 3 })} />)
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '4')
  })

  it('renders the FEELFLICK wordmark without font-black / font-extrabold', () => {
    render(<DnaRail {...props({ step: 1 })} />)
    const mark = screen.getByText('FEELFLICK')
    expect(mark.className).not.toMatch(/font-(black|extrabold)/)
  })

  it('still renders the progressbar under prefers-reduced-motion', () => {
    window.matchMedia = vi.fn().mockImplementation(query => ({
      matches: true, media: query, onchange: null,
      addEventListener: vi.fn(), removeEventListener: vi.fn(),
      addListener: vi.fn(), removeListener: vi.fn(), dispatchEvent: vi.fn(),
    }))
    render(<DnaRail {...props({ step: 2 })} />)
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '3')
  })
})

describe('DnaRail — signal tally', () => {
  it('renders explicit category labels (not color-only) when counts exist', () => {
    render(<DnaRail {...props({ step: 2, moods: ['cozy'], genres: [18, 28], films: [{ id: 1 }], ratings: { 1: 9 } })} />)
    expect(screen.getByText('Mood')).toBeInTheDocument()
    expect(screen.getByText('Genre')).toBeInTheDocument()
    expect(screen.getByText('Film')).toBeInTheDocument()
    expect(screen.getByText('Rated')).toBeInTheDocument()
  })

  it('omits a category whose count is zero', () => {
    render(<DnaRail {...props({ step: 1, moods: ['cozy'] })} />)
    expect(screen.getByText('Mood')).toBeInTheDocument()
    expect(screen.queryByText('Genre')).not.toBeInTheDocument()
    expect(screen.queryByText('Film')).not.toBeInTheDocument()
    expect(screen.queryByText('Rated')).not.toBeInTheDocument()
  })

  it('shows no tally labels when all counts are zero, but the progressbar still renders', () => {
    render(<DnaRail {...props({ step: 0 })} />)
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
    expect(screen.queryByText('Mood')).not.toBeInTheDocument()
    expect(screen.queryByText('Genre')).not.toBeInTheDocument()
    expect(screen.queryByText('Film')).not.toBeInTheDocument()
    expect(screen.queryByText('Rated')).not.toBeInTheDocument()
  })

  it('wraps the tally in an aria-live="polite" region', () => {
    const { container } = render(<DnaRail {...props({ step: 1, moods: ['cozy'], genres: [18] })} />)
    const live = container.querySelector('[aria-live="polite"]')
    expect(live).toBeTruthy()
    expect(live).toContainElement(screen.getByText('Mood'))
  })

  it('suppresses the tally on the rating step (step 3) but keeps the progressbar', () => {
    render(<DnaRail {...props({ step: 3, moods: ['cozy'], genres: [18], films: [{ id: 1 }, { id: 2 }] })} />)
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '4')
    expect(screen.queryByText('Mood')).not.toBeInTheDocument()
    expect(screen.queryByText('Genre')).not.toBeInTheDocument()
    expect(screen.queryByText('Film')).not.toBeInTheDocument()
  })
})
