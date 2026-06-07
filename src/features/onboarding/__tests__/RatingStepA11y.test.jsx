// src/features/onboarding/__tests__/RatingStepA11y.test.jsx
// F2.17 — RatingStep accessibility + keyboard foundation (render-faithful).
// Live announcements, role=alert, focus-visible affordances, arrow-key parity
// scoped to the rating-stage, and reduced-motion completeness. The frozen
// contracts (SENTIMENT_RATINGS, swipe map, 280ms guard, 700ms auto-finish) are
// exercised through the existing commit path — none are changed here.

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'

vi.mock('@/shared/api/tmdb', () => ({ tmdbImg: (p) => `https://img/${p}` }))

import RatingStep from '../steps/RatingStep'

const film = (id, title) => ({ id, title, poster_path: `/${id}.jpg`, release_date: '2014-01-01' })
const props = (over = {}) => ({
  favoriteMovies: [film(1, 'Alpha'), film(2, 'Beta'), film(3, 'Gamma')],
  ratings: {},
  onRate: vi.fn(),
  onBack: vi.fn(),
  onFinish: vi.fn(),
  error: '',
  ...over,
})

// framer-motion's useReducedMotion reads window.matchMedia (absent in jsdom).
function setMatchMedia(reduced = false) {
  window.matchMedia = vi.fn().mockImplementation((q) => ({
    matches: reduced && /reduced-motion/.test(q),
    media: q, onchange: null,
    addEventListener: vi.fn(), removeEventListener: vi.fn(),
    addListener: vi.fn(), removeListener: vi.fn(), dispatchEvent: vi.fn(),
  }))
}
const live = (container) => container.querySelector('[aria-live="polite"]')

beforeEach(() => setMatchMedia(false))

describe('RatingStep — frozen affordance (unchanged in F2.17)', () => {
  it('keeps the Okay/Liked/Loved buttons and onRate(film, key) mapping', () => {
    const onRate = vi.fn()
    render(<RatingStep {...props({ onRate })} />)
    expect(screen.getByRole('button', { name: 'Okay' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Liked' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Loved' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Loved' }))
    expect(onRate).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }), 'loved')
  })

  it('renders no "See my recommendations" confirm CTA', () => {
    render(<RatingStep {...props()} />)
    expect(screen.queryByRole('button', { name: /see my recommendations/i })).not.toBeInTheDocument()
  })
})

describe('RatingStep — live announcements + error semantics', () => {
  it('surfaces the error container as role=alert', () => {
    render(<RatingStep {...props({ error: 'Could not save your ratings.' })} />)
    expect(screen.getByRole('alert')).toHaveTextContent('Could not save your ratings.')
  })

  it('announces the current film + remaining via a polite, atomic live region', () => {
    const { container } = render(<RatingStep {...props()} />)
    const region = live(container)
    expect(region).toBeTruthy()
    expect(region).toHaveAttribute('aria-atomic', 'true')
    expect(region).toHaveTextContent('Now rating Alpha — 3 to go')
  })

  it('announces the next film after a rating advances', () => {
    const { container } = render(<RatingStep {...props()} />)
    fireEvent.click(screen.getByRole('button', { name: 'Loved' }))
    expect(live(container)).toHaveTextContent('Now rating Beta — 2 to go')
  })

  it('announces the next film after Skip, without calling onRate', () => {
    const onRate = vi.fn()
    const { container } = render(<RatingStep {...props({ onRate })} />)
    fireEvent.click(screen.getByRole('button', { name: /skip for now/i }))
    expect(live(container)).toHaveTextContent('Now rating Beta — 2 to go')
    expect(onRate).not.toHaveBeenCalled()
  })

  it('announces all-rated when every film is rated', () => {
    vi.useFakeTimers()
    try {
      const { container } = render(<RatingStep {...props({ favoriteMovies: [film(1, 'Alpha')] })} />)
      fireEvent.click(screen.getByRole('button', { name: 'Loved' }))
      expect(live(container)).toHaveTextContent('All rated — building your picks')
    } finally {
      vi.useRealTimers()
    }
  })
})

describe('RatingStep — keyboard parity (scoped to the rating stage)', () => {
  const stage = () => screen.getByRole('group', { name: /rate alpha/i })

  it('ArrowRight on the stage commits loved', () => {
    const onRate = vi.fn()
    render(<RatingStep {...props({ onRate })} />)
    fireEvent.keyDown(stage(), { key: 'ArrowRight' })
    expect(onRate).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }), 'loved')
  })

  it('ArrowUp on the stage commits liked', () => {
    const onRate = vi.fn()
    render(<RatingStep {...props({ onRate })} />)
    fireEvent.keyDown(stage(), { key: 'ArrowUp' })
    expect(onRate).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }), 'liked')
  })

  it('ArrowLeft on the stage commits okay', () => {
    const onRate = vi.fn()
    render(<RatingStep {...props({ onRate })} />)
    fireEvent.keyDown(stage(), { key: 'ArrowLeft' })
    expect(onRate).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }), 'okay')
  })

  it('does NOT rate when Arrow keys are pressed on a sentiment button or Skip', () => {
    const onRate = vi.fn()
    render(<RatingStep {...props({ onRate })} />)
    fireEvent.keyDown(screen.getByRole('button', { name: 'Loved' }), { key: 'ArrowRight' })
    fireEvent.keyDown(screen.getByRole('button', { name: /skip for now/i }), { key: 'ArrowLeft' })
    expect(onRate).not.toHaveBeenCalled()
  })
})

describe('RatingStep — guard, auto-finish, focus, reduced motion', () => {
  it('commits only once on rapid double activation (double-commit guard)', () => {
    const onRate = vi.fn()
    render(<RatingStep {...props({ onRate })} />)
    const loved = screen.getByRole('button', { name: 'Loved' })
    fireEvent.click(loved)
    fireEvent.click(loved)
    expect(onRate).toHaveBeenCalledTimes(1)
  })

  it('fires onFinish exactly once, 700ms after the last rating', () => {
    vi.useFakeTimers()
    try {
      const onFinish = vi.fn()
      render(<RatingStep {...props({ favoriteMovies: [film(1, 'Alpha'), film(2, 'Beta')], onFinish })} />)
      fireEvent.click(screen.getByRole('button', { name: 'Loved' })) // rate Alpha
      act(() => { vi.advanceTimersByTime(300) })                     // clear the 280ms guard
      fireEvent.click(screen.getByRole('button', { name: 'Loved' })) // rate Beta → allRated
      expect(onFinish).not.toHaveBeenCalled()
      act(() => { vi.advanceTimersByTime(700) })
      expect(onFinish).toHaveBeenCalledTimes(1)
      act(() => { vi.advanceTimersByTime(2000) })
      expect(onFinish).toHaveBeenCalledTimes(1)
    } finally {
      vi.useRealTimers()
    }
  })

  it('gives the sentiment buttons and Skip a focus-visible affordance', () => {
    render(<RatingStep {...props()} />)
    expect(screen.getByRole('button', { name: 'Loved' }).className).toMatch(/focus-visible:ring-2/)
    expect(screen.getByRole('button', { name: /skip for now/i }).className).toMatch(/focus-visible:ring-2/)
  })

  it('makes the rating stage keyboard-focusable with a descriptive label', () => {
    render(<RatingStep {...props()} />)
    const region = screen.getByRole('group', { name: /rate alpha/i })
    expect(region).toHaveAttribute('tabindex', '0')
    expect(region).toHaveAttribute('aria-describedby', 'rating-kbd-help')
  })

  // NOTE: reduced-motion *drag-disable* is a framer-motion runtime behavior
  // (useReducedMotion caches its media-query subscription per module, so flipping
  // matchMedia mid-file is unreliable in jsdom) — it is verified in the Playwright
  // emulateMedia('prefers-reduced-motion','reduce') pass. The CSS-based
  // motion-reduce additions (the F2.17 work) are unit-tested below.
  it('marks the loading skeleton as motion-reduce safe', () => {
    const { container } = render(<RatingStep {...props()} />)
    const skeleton = container.querySelector('.animate-pulse')
    expect(skeleton).toBeTruthy()
    expect(skeleton.getAttribute('class')).toMatch(/motion-reduce:animate-none/)
  })

  it('marks the all-rated handoff sparkle as motion-reduce safe', () => {
    vi.useFakeTimers()
    try {
      const { container } = render(<RatingStep {...props({ favoriteMovies: [] })} />)
      const pulse = container.querySelector('.animate-pulse')
      expect(pulse).toBeTruthy()
      expect(pulse.getAttribute('class')).toMatch(/motion-reduce:animate-none/)
    } finally {
      vi.useRealTimers()
    }
  })
})
