// src/features/onboarding/__tests__/CelebrationReveal.test.jsx
// F2.20 — CelebrationReveal a11y/semantic foundation. ONE concise sr-only
// completion status (not a multi-stage live region), a single visible h1, no
// focus movement, and render-safety across data variants. Reduced-motion VISUAL
// timing (delays→0) is verified in Playwright; jsdom checks structure only.

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'

vi.mock('@/shared/api/tmdb', () => ({ tmdbImg: (p) => `https://img/${p}` }))

import CelebrationReveal from '../components/CelebrationReveal'

const film = (id, title, poster = `/${id}.jpg`) => ({ id, title, poster_path: poster, release_date: '2014-01-01' })
const props = (over = {}) => ({
  moods: ['cozy'],
  selectedGenres: [18],
  favoriteMovies: [film(1, 'Alpha'), film(2, 'Beta'), film(3, 'Gamma'), film(4, 'Delta'), film(5, 'Echo')],
  ratings: { 1: 9, 2: 7 },
  fadingOut: false,
  ...over,
})

function setMatchMedia(reduced = false) {
  window.matchMedia = vi.fn().mockImplementation((q) => ({
    matches: reduced && /reduced-motion/.test(q),
    media: q, onchange: null,
    addEventListener: vi.fn(), removeEventListener: vi.fn(),
    addListener: vi.fn(), removeListener: vi.fn(), dispatchEvent: vi.fn(),
  }))
}
const status = () => document.querySelector('[role="status"]')
beforeEach(() => setMatchMedia(false))

describe('CelebrationReveal — semantics', () => {
  it('renders exactly one visible h1 "Tonight is yours." (not aria-hidden)', () => {
    render(<CelebrationReveal {...props()} />)
    const h1s = screen.getAllByRole('heading', { level: 1 })
    expect(h1s).toHaveLength(1)
    expect(h1s[0]).toHaveTextContent(/tonight is\s*yours\./i)
    expect(h1s[0]).not.toHaveAttribute('aria-hidden', 'true')
  })

  it('exposes exactly one polite + atomic status — not on the visible wrapper', () => {
    const { container } = render(<CelebrationReveal {...props()} />)
    const statuses = container.querySelectorAll('[role="status"]')
    expect(statuses).toHaveLength(1)
    expect(statuses[0]).toHaveAttribute('aria-live', 'polite')
    expect(statuses[0]).toHaveAttribute('aria-atomic', 'true')
    expect(statuses[0].className).toMatch(/sr-only/)
    // the visible heading is NOT inside the live region
    expect(within(statuses[0]).queryByRole('heading')).toBeNull()
  })

  it('announces one concise completion sentence after mount (no count tally / list)', () => {
    render(<CelebrationReveal {...props()} />)
    expect(status()).toHaveTextContent(/your taste is tuned.*opening your first picks\./i)
    expect(status().textContent).not.toMatch(/genre|loved|liked|\d+\s*film/i)
  })

  it('does not move focus', () => {
    render(<CelebrationReveal {...props()} />)
    expect(document.body).toHaveFocus()
  })
})

describe('CelebrationReveal — announcement variants', () => {
  it('degrades to the no-title sentence when no usable titles exist', () => {
    render(<CelebrationReveal {...props({ favoriteMovies: [{ id: 1, poster_path: '/1.jpg' }] })} />)
    expect(status()).toHaveTextContent('Your taste is tuned. Opening your first picks.')
    expect(status().textContent).not.toMatch(/undefined|with ,|,\s+and\b/)
  })

  it('uses one title cleanly', () => {
    render(<CelebrationReveal {...props({ favoriteMovies: [film(1, 'Inception')] })} />)
    expect(status()).toHaveTextContent('Your taste is tuned with Inception. Opening your first picks.')
  })

  it('joins two titles with "and"', () => {
    render(<CelebrationReveal {...props({ favoriteMovies: [film(1, 'Alpha'), film(2, 'Beta')] })} />)
    expect(status()).toHaveTextContent('Your taste is tuned with Alpha and Beta. Opening your first picks.')
  })

  it('keeps 3+ titles concise with "and more"', () => {
    render(<CelebrationReveal {...props()} />)
    expect(status()).toHaveTextContent('Your taste is tuned with Alpha, Beta, and more. Opening your first picks.')
  })
})

describe('CelebrationReveal — content + data variants', () => {
  it('renders the apex + coaching copy', () => {
    render(<CelebrationReveal {...props()} />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/tonight is\s*yours\./i)
    expect(screen.getByText(/see films you already know/i)).toBeInTheDocument()
    expect(screen.getByText(/mark watched/i)).toBeInTheDocument()
  })

  it.each([
    ['one mood', { moods: ['cozy'] }],
    ['three moods', { moods: ['cozy', 'wired', 'mythic'] }],
    ['five films', {}],
    ['missing-poster fallback', { favoriteMovies: [film(1, 'NoPoster', null)] }],
    ['no loved ratings', { ratings: { 1: 7, 2: 5 } }],
    ['mixed liked/loved', { ratings: { 1: 9, 2: 7, 3: 5 } }],
    ['empty optional data', { moods: [], selectedGenres: [], favoriteMovies: [], ratings: {} }],
  ])('renders without error and one live region: %s', (_label, over) => {
    expect(() => render(<CelebrationReveal {...props(over)} />)).not.toThrow()
    expect(document.querySelectorAll('[role="status"]')).toHaveLength(1)
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
  })

  it('keeps decorative posters out of the a11y tree (alt="")', () => {
    const { container } = render(<CelebrationReveal {...props()} />)
    const imgs = container.querySelectorAll('img')
    expect(imgs.length).toBe(5)
    imgs.forEach(img => expect(img.getAttribute('alt')).toBe(''))
  })
})

describe('CelebrationReveal — reduced motion (structure; visual timing is Playwright)', () => {
  it('still renders one live region + the full composition under reduced motion', () => {
    setMatchMedia(true)
    render(<CelebrationReveal {...props()} />)
    expect(document.querySelectorAll('[role="status"]')).toHaveLength(1)
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getByText(/see films you already know/i)).toBeInTheDocument()
    expect(document.querySelectorAll('img')).toHaveLength(5)
  })
})
