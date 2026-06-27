// src/features/onboarding/__tests__/CelebrationReveal.test.jsx
// F2.20 a11y foundation (one sr-only atomic status, single visible h1, no focus
// movement) + F2.21 visual polish (de-gamified editorial spine, no infinite
// motion). Reduced-motion VISUAL timing (delays→0) is verified in Playwright;
// jsdom checks structure + the source-level motion/artifact contracts only.

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

vi.mock('@/shared/api/tmdb', () => ({ tmdbImg: (p) => `https://img/${p}` }))

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
    expect(screen.getByText(/your taste, tuned/i)).toBeInTheDocument()
    expect(screen.getByText(/your first signals are in/i)).toBeInTheDocument()
    expect(screen.getByText(/from your picks/i)).toBeInTheDocument()
    expect(screen.getByText(/next up/i)).toBeInTheDocument()
    expect(screen.getByText(/your taste is in/i)).toBeInTheDocument()
    expect(screen.getByText(/your picks for tonight/i)).toBeInTheDocument()
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
    expect(screen.getByText(/your picks for tonight/i)).toBeInTheDocument()
    expect(document.querySelectorAll('img')).toHaveLength(5)
  })
})

describe('CelebrationReveal — F2.21 removed artifacts', () => {
  it('renders no Sparkles/icon svg, no Edition text, no heart, no Mark Watched', () => {
    const { container } = render(<CelebrationReveal {...props()} />)
    expect(container.querySelectorAll('svg')).toHaveLength(0)
    expect(screen.queryByText(/edition/i)).toBeNull()
    expect(container.textContent).not.toMatch(/♥/)
    expect(screen.queryByText(/mark watched/i)).toBeNull()
    expect(screen.queryByText(/sharpens by tomorrow/i)).toBeNull()
  })

  it('shows no count-receipt stats (no "N films · N genres · N loved")', () => {
    const { container } = render(<CelebrationReveal {...props()} />)
    expect(container.textContent).not.toMatch(/\d+\s*(films?|genres?)\b/i)
    expect(container.textContent).not.toMatch(/\d+\s*(loved|liked)\b/i)
  })

  it('source contains no Sparkles import, no CelebrationParticles, no Edition №001', () => {
    expect(SRC).not.toMatch(/lucide-react/)
    expect(SRC).not.toMatch(/Sparkles/)
    expect(SRC).not.toMatch(/CelebrationParticles/)
    expect(SRC).not.toMatch(/Edition №001/)
    expect(SRC).not.toMatch(/Mark Watched/)
    expect(SRC).not.toMatch(/sharpens by tomorrow/)
  })
})

describe('CelebrationReveal — retained editorial spine', () => {
  it('renders the kicker, taste line, poster caption, apex, and Next-up coaching', () => {
    render(<CelebrationReveal {...props()} />)
    expect(screen.getByText(/your taste, tuned/i)).toBeInTheDocument()
    expect(screen.getByText(/your first signals are in/i)).toBeInTheDocument()
    expect(screen.getByText(/from your picks/i)).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/tonight is\s*yours\./i)
    expect(screen.getByText('Next up')).toBeInTheDocument()
    expect(screen.getByText(/shaped by everything you just shared/i)).toBeInTheDocument()
  })

  it('shows the selected mood pills (by their real labels)', () => {
    render(<CelebrationReveal {...props({ moods: ['cozy', 'mythic'] })} />)
    expect(screen.getByText(MOODS.find(m => m.key === 'cozy').label)).toBeInTheDocument()
    expect(screen.getByText(MOODS.find(m => m.key === 'mythic').label)).toBeInTheDocument()
  })

  it('taste line degrades cleanly without ratings (uses "the films you chose")', () => {
    render(<CelebrationReveal {...props({ ratings: {} })} />)
    expect(screen.getByText(/the films you chose/i)).toBeInTheDocument()
    expect(screen.queryByText(/how those films landed/i)).toBeNull()
  })
})

describe('CelebrationReveal — motion contracts (source-level)', () => {
  it('contains NO CelebrationReveal-owned infinite loop', () => {
    expect(SRC).not.toMatch(/repeat:\s*Infinity/)
  })

  it('preserves the 900ms fade-out and the F2.20 reduced-motion delay guards', () => {
    expect(SRC).toMatch(/fadingOut \? 0\.9/)          // 900ms fade preserved
    expect(SRC).toMatch(/reduced \? 0 :/)              // reduced-motion delays → 0
    expect(SRC).not.toMatch(/scale:\s*\[1, 1\.012, 1\]/) // no whole-stage breathing
  })
})
