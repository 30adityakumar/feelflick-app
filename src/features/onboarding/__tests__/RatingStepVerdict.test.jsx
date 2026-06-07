// src/features/onboarding/__tests__/RatingStepVerdict.test.jsx
// F2.18 — editorial verdict revoice: word-led Okay/Liked/Loved controls, visible
// label == accessible name, no dating-app symbols/stamps/next-card peek, and
// tap-primary copy. The frozen keys/mappings/guards/timers are exercised here +
// in OnboardingSteps + RatingStepA11y; nothing about them changes.

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

vi.mock('@/shared/api/tmdb', () => ({ tmdbImg: (p) => `https://img/${p}` }))

import RatingStep from '../steps/RatingStep'

const film = (id, title) => ({ id, title, poster_path: `/${id}.jpg`, release_date: '2014-01-01' })
const props = (over = {}) => ({
  favoriteMovies: [film(1, 'Alpha'), film(2, 'Beta'), film(3, 'Gamma')],
  ratings: {}, onRate: vi.fn(), onBack: vi.fn(), onFinish: vi.fn(), error: '', ...over,
})

beforeEach(() => {
  window.matchMedia = vi.fn().mockImplementation((q) => ({
    matches: false, media: q, onchange: null,
    addEventListener: vi.fn(), removeEventListener: vi.fn(),
    addListener: vi.fn(), removeListener: vi.fn(), dispatchEvent: vi.fn(),
  }))
})

describe('RatingStep — editorial verdict controls', () => {
  it('names the three controls Okay / Liked / Loved (never Meh)', () => {
    render(<RatingStep {...props()} />)
    expect(screen.getByRole('button', { name: 'Okay' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Liked' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Loved' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Meh' })).not.toBeInTheDocument()
  })

  it('matches each visible label to its accessible name (WCAG 2.5.3)', () => {
    render(<RatingStep {...props()} />)
    for (const label of ['Okay', 'Liked', 'Loved']) {
      const btn = screen.getByRole('button', { name: label })
      expect(btn).toHaveTextContent(label)
      expect(btn).toHaveAttribute('aria-label', label)
    }
  })

  it('renders no ✕ / ✓ / ♥ verdict symbols', () => {
    const { container } = render(<RatingStep {...props()} />)
    expect(container.textContent).not.toMatch(/[✕✓♥]/)
  })

  it('maps Okay→okay, Liked→liked, Loved→loved on click (frozen keys)', () => {
    for (const [label, key] of [['Okay', 'okay'], ['Liked', 'liked'], ['Loved', 'loved']]) {
      const onRate = vi.fn()
      const { unmount } = render(<RatingStep {...props({ onRate })} />)
      fireEvent.click(screen.getByRole('button', { name: label }))
      expect(onRate).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }), key)
      unmount()
    }
  })

  it('keeps aria-pressed reflecting the committed verdict', () => {
    render(<RatingStep {...props({ ratings: { 1: 9 } })} />) // 9 = SENTIMENT_RATINGS.loved
    expect(screen.getByRole('button', { name: 'Loved' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Okay' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('gives every verdict control a ≥44px target + focus-visible ring', () => {
    render(<RatingStep {...props()} />)
    for (const label of ['Okay', 'Liked', 'Loved']) {
      const cls = screen.getByRole('button', { name: label }).getAttribute('class')
      expect(cls).toMatch(/min-h-\[48px\]/)
      expect(cls).toMatch(/focus-visible:ring-2/)
    }
  })
})

describe('RatingStep — dating-app idiom removed', () => {
  it('renders only the current poster — no next-card peek', () => {
    const { container } = render(<RatingStep {...props()} />)
    expect(container.querySelectorAll('img')).toHaveLength(1)
  })

  it('renders no directional stamp (no font-extrabold overlay, "Loved" not duplicated)', () => {
    const { container } = render(<RatingStep {...props()} />)
    expect(container.querySelector('.font-extrabold')).toBeNull()
    expect(screen.getAllByText('Loved')).toHaveLength(1)
  })

  it('leads with tap-primary guidance, not swipe-first / punitive language', () => {
    render(<RatingStep {...props()} />)
    expect(screen.getByText(/choose your verdict below\. swipe is optional\./i)).toBeInTheDocument()
    expect(screen.queryByText(/swipe right to love/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/left to pass/i)).not.toBeInTheDocument()
  })

  it('treats Skip as a quiet tertiary "Skip for now" with no arrow', () => {
    render(<RatingStep {...props()} />)
    const skip = screen.getByRole('button', { name: /skip for now/i })
    expect(skip).toHaveTextContent('Skip for now')
    expect(skip.textContent).not.toMatch(/→/)
    expect(skip.getAttribute('class')).toMatch(/min-h-\[44px\]/)
  })
})
