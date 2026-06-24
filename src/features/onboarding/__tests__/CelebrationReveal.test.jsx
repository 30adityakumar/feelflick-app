// Celebration reveal: one concise live announcement, a single visible h1,
// a settled poster composition, and an explicit handoff to Discover.

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

vi.mock('@/shared/api/tmdb', () => ({ tmdbImg: (path) => `https://img/${path}` }))

import CelebrationReveal from '../components/CelebrationReveal'
import { MOODS } from '../data'

const SRC = readFileSync(resolve(import.meta.dirname, '../components/CelebrationReveal.jsx'), 'utf8')
const film = (id, title, poster = `/${id}.jpg`) => ({ id, title, poster_path: poster, release_date: '2014-01-01' })
const props = (over = {}) => ({
  moods: ['cozy'],
  selectedGenres: [18],
  favoriteMovies: [film(1, 'Alpha'), film(2, 'Beta'), film(3, 'Gamma'), film(4, 'Delta'), film(5, 'Echo')],
  ratings: { 1: 9, 2: 7 },
  fadingOut: false,
  ready: true,
  continuing: false,
  onContinue: vi.fn(),
  ...over,
})

function setMatchMedia(reduced = false) {
  window.matchMedia = vi.fn().mockImplementation(query => ({
    matches: reduced && /reduced-motion/.test(query),
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))
}

const status = () => document.querySelector('[role="status"]')
beforeEach(() => setMatchMedia(false))

describe('CelebrationReveal — semantics', () => {
  it('renders exactly one visible h1 "Tonight is yours."', () => {
    render(<CelebrationReveal {...props()} />)
    const headings = screen.getAllByRole('heading', { level: 1 })
    expect(headings).toHaveLength(1)
    expect(headings[0]).toHaveTextContent(/tonight is\s*yours\./i)
    expect(headings[0]).not.toHaveAttribute('aria-hidden', 'true')
  })

  it('exposes exactly one polite atomic status outside the visible heading', () => {
    const { container } = render(<CelebrationReveal {...props()} />)
    const statuses = container.querySelectorAll('[role="status"]')
    expect(statuses).toHaveLength(1)
    expect(statuses[0]).toHaveAttribute('aria-live', 'polite')
    expect(statuses[0]).toHaveAttribute('aria-atomic', 'true')
    expect(statuses[0].className).toMatch(/sr-only/)
    expect(within(statuses[0]).queryByRole('heading')).toBeNull()
  })

  it('announces one concise completion sentence after mount', () => {
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
  it('degrades cleanly without usable titles', () => {
    render(<CelebrationReveal {...props({ favoriteMovies: [{ id: 1, poster_path: '/1.jpg' }] })} />)
    expect(status()).toHaveTextContent('Your taste is tuned. Opening your first picks.')
  })

  it('uses one title cleanly', () => {
    render(<CelebrationReveal {...props({ favoriteMovies: [film(1, 'Inception')] })} />)
    expect(status()).toHaveTextContent('Your taste is tuned with Inception. Opening your first picks.')
  })

  it('joins two titles with and', () => {
    render(<CelebrationReveal {...props({ favoriteMovies: [film(1, 'Alpha'), film(2, 'Beta')] })} />)
    expect(status()).toHaveTextContent('Your taste is tuned with Alpha and Beta. Opening your first picks.')
  })

  it('keeps three or more titles concise', () => {
    render(<CelebrationReveal {...props()} />)
    expect(status()).toHaveTextContent('Your taste is tuned with Alpha, Beta, and more. Opening your first picks.')
  })
})

describe('CelebrationReveal — content and handoff', () => {
  it('renders the editorial spine and direct CTA', () => {
    render(<CelebrationReveal {...props()} />)
    expect(screen.getByText(/your taste, tuned/i)).toBeInTheDocument()
    expect(screen.getByText(/your first signals are in/i)).toBeInTheDocument()
    expect(screen.getByText(/from your picks/i)).toBeInTheDocument()
    expect(screen.getByText(/next up/i)).toBeInTheDocument()
    expect(screen.getByText(/tell us how tonight feels/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /find my first film/i })).toBeEnabled()
  })

  it('holds the CTA until completion writes are ready', () => {
    render(<CelebrationReveal {...props({ ready: false })} />)
    expect(screen.getByRole('button', { name: /tuning your first picks/i })).toBeDisabled()
  })

  it('calls the direct handoff once ready', () => {
    const onContinue = vi.fn()
    render(<CelebrationReveal {...props({ onContinue })} />)
    fireEvent.click(screen.getByRole('button', { name: /find my first film/i }))
    expect(onContinue).toHaveBeenCalledTimes(1)
  })

  it.each([
    ['one mood', { moods: ['cozy'] }],
    ['three moods', { moods: ['cozy', 'wired', 'mythic'] }],
    ['five films', {}],
    ['missing-poster fallback', { favoriteMovies: [film(1, 'NoPoster', null)] }],
    ['no loved ratings', { ratings: { 1: 7, 2: 5 } }],
    ['mixed ratings', { ratings: { 1: 9, 2: 7, 3: 5 } }],
    ['empty optional data', { moods: [], selectedGenres: [], favoriteMovies: [], ratings: {} }],
  ])('renders safely: %s', (_label, override) => {
    expect(() => render(<CelebrationReveal {...props(override)} />)).not.toThrow()
    expect(document.querySelectorAll('[role="status"]')).toHaveLength(1)
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
  })

  it('keeps decorative posters out of the accessibility tree', () => {
    const { container } = render(<CelebrationReveal {...props()} />)
    const images = container.querySelectorAll('img')
    expect(images).toHaveLength(5)
    images.forEach(image => expect(image.getAttribute('alt')).toBe(''))
  })

  it('shows selected mood pills using real labels', () => {
    render(<CelebrationReveal {...props({ moods: ['cozy', 'mythic'] })} />)
    expect(screen.getByText(MOODS.find(mood => mood.key === 'cozy').label)).toBeInTheDocument()
    expect(screen.getByText(MOODS.find(mood => mood.key === 'mythic').label)).toBeInTheDocument()
  })

  it('uses the films-you-chose fallback when ratings are absent', () => {
    render(<CelebrationReveal {...props({ ratings: {} })} />)
    expect(screen.getByText(/the films you chose/i)).toBeInTheDocument()
    expect(screen.queryByText(/how those films landed/i)).toBeNull()
  })
})

describe('CelebrationReveal — motion and removed artifacts', () => {
  it('keeps the full composition under reduced motion', () => {
    setMatchMedia(true)
    render(<CelebrationReveal {...props()} />)
    expect(document.querySelectorAll('[role="status"]')).toHaveLength(1)
    expect(screen.getByRole('button', { name: /find my first film/i })).toBeInTheDocument()
    expect(document.querySelectorAll('img')).toHaveLength(5)
  })

  it('contains no gamified iconography or count receipt', () => {
    const { container } = render(<CelebrationReveal {...props()} />)
    expect(container.querySelectorAll('svg')).toHaveLength(0)
    expect(container.textContent).not.toMatch(/♥|edition|mark watched|sharpens by tomorrow/i)
    expect(container.textContent).not.toMatch(/\d+\s*(films?|genres?|loved|liked)\b/i)
  })

  it('contains no infinite loop and preserves fade and reduced-motion guards', () => {
    expect(SRC).not.toMatch(/repeat:\s*Infinity/)
    expect(SRC).toMatch(/fadingOut \? 0\.9/)
    expect(SRC).toMatch(/reduced \? 0 :/)
    expect(SRC).not.toMatch(/lucide-react|Sparkles|CelebrationParticles/)
  })
})
