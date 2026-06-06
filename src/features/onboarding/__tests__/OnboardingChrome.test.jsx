// src/features/onboarding/__tests__/OnboardingChrome.test.jsx
// F2.6 — persistent onboarding chrome: Progress progressbar semantics +
// reduced-motion resilience, and TasteStrip's non-color category labels +
// hide-when-empty behavior.

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

// framer-motion's useReducedMotion (Progress) reads window.matchMedia, which
// jsdom doesn't provide. Default to "no preference"; one test flips it.
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

import Progress from '../components/Progress'
import TasteStrip from '../components/TasteStrip'

describe('Progress — progressbar semantics', () => {
  it('exposes role=progressbar with min/max and aria-valuenow = step + 1', () => {
    render(<Progress step={0} />)
    const bar = screen.getByRole('progressbar', { name: /onboarding progress/i })
    expect(bar).toHaveAttribute('aria-valuemin', '1')
    expect(bar).toHaveAttribute('aria-valuemax', '4')
    expect(bar).toHaveAttribute('aria-valuenow', '1')
  })

  it('aria-valuenow tracks the current step (step 3 → 4 of 4)', () => {
    render(<Progress step={3} />)
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '4')
  })

  it('renders the FEELFLICK wordmark without font-black / font-extrabold', () => {
    render(<Progress step={1} />)
    const mark = screen.getByText('FEELFLICK')
    expect(mark.className).not.toMatch(/font-(black|extrabold)/)
  })

  it('still renders the progressbar under prefers-reduced-motion', () => {
    window.matchMedia = vi.fn().mockImplementation(query => ({
      matches: true, media: query, onchange: null,
      addEventListener: vi.fn(), removeEventListener: vi.fn(),
      addListener: vi.fn(), removeListener: vi.fn(), dispatchEvent: vi.fn(),
    }))
    render(<Progress step={2} />)
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '3')
  })
})

describe('TasteStrip — non-color labels + hide-when-empty', () => {
  it('returns null when all counts are zero', () => {
    const { container } = render(<TasteStrip moods={[]} genres={[]} films={[]} ratings={{}} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders explicit category labels (not color-only) when counts exist', () => {
    render(<TasteStrip moods={['cozy']} genres={[18, 28]} films={[{ id: 1 }]} ratings={{ 1: 9 }} />)
    expect(screen.getByText('Mood')).toBeInTheDocument()
    expect(screen.getByText('Genre')).toBeInTheDocument()
    expect(screen.getByText('Film')).toBeInTheDocument()
    expect(screen.getByText('Rated')).toBeInTheDocument()
  })

  it('omits a category whose count is zero', () => {
    render(<TasteStrip moods={['cozy']} genres={[]} films={[]} ratings={{}} />)
    expect(screen.getByText('Mood')).toBeInTheDocument()
    expect(screen.queryByText('Genre')).not.toBeInTheDocument()
    expect(screen.queryByText('Film')).not.toBeInTheDocument()
    expect(screen.queryByText('Rated')).not.toBeInTheDocument()
  })
})
