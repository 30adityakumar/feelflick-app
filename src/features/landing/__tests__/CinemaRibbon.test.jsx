import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'

// LandingHero renders inside the LandingAuth provider, which consumes the shared OAuth hook.
const startGoogleAuth = vi.fn()
let hookState
vi.mock('@/shared/hooks/useGoogleAuth', () => ({ useGoogleAuth: () => hookState }))

import CinemaRibbon from '../components/CinemaRibbon'
import { LANDING_POSTERS } from '../data'
import { LandingAuthProvider } from '../LandingAuth'
import LandingHero from '../components/LandingHero'

beforeEach(() => {
  startGoogleAuth.mockReset()
  hookState = { signInWithGoogle: startGoogleAuth, isAuthenticating: false, authError: null, clearAuthError: vi.fn() }
})
afterEach(() => cleanup())

describe('LANDING_POSTERS — five-film editorial set', () => {
  it('has exactly five films with nonempty, unique titles and paths', () => {
    expect(LANDING_POSTERS).toHaveLength(5)
    for (const p of LANDING_POSTERS) {
      expect(p.path).toMatch(/^\/.+\.jpg$/)
      expect(p.title.trim().length).toBeGreaterThan(0)
    }
    expect(new Set(LANDING_POSTERS.map(p => p.title)).size).toBe(5)
    expect(new Set(LANDING_POSTERS.map(p => p.path)).size).toBe(5)
  })

  it('keeps Arrival as the centre (index 2) film', () => {
    expect(LANDING_POSTERS[2].title).toBe('Arrival')
  })
})

describe('CinemaRibbon', () => {
  it('renders a decorative five-poster ribbon: centre eager/high-priority, others lazy, no carousel', () => {
    const { container } = render(<CinemaRibbon />)

    const ribbon = container.querySelector('.ff-l-ribbon')
    expect(ribbon).not.toBeNull()
    expect(ribbon).toHaveAttribute('aria-hidden', 'true')
    expect(container.querySelectorAll('.ff-l-ribbon__poster')).toHaveLength(5)

    const imgs = container.querySelectorAll('img')
    expect(imgs).toHaveLength(5)
    imgs.forEach((img) => expect(img.getAttribute('alt')).toBe('')) // decorative

    // Centre poster (index 2) is the LCP candidate; the rest stay lazy.
    expect(imgs[2].getAttribute('loading')).toBe('eager')
    expect(imgs[2].getAttribute('fetchpriority')).toBe('high') // React fetchPriority -> lowercase DOM attr
    ;[0, 1, 3, 4].forEach((i) => {
      expect(imgs[i].getAttribute('loading')).toBe('lazy')
      expect(imgs[i].getAttribute('fetchpriority')).toBeNull()
    })

    // Not a carousel / scroller: no buttons, tabs, or scroll controls.
    expect(container.querySelectorAll('button, [role="tab"], [role="tablist"], [role="scrollbar"]')).toHaveLength(0)
  })
})

describe('LandingHero — restored structure (unchanged by this pass)', () => {
  const renderHero = () => render(<LandingAuthProvider><LandingHero /></LandingAuthProvider>)

  it('keeps one h1, both hero actions, the three proof statements, and the decorative ribbon', () => {
    const { container } = renderHero()
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    // Both actions remain (primary button + secondary link to the section).
    expect(screen.getByRole('button', { name: /continue with google/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /see how it works/i })).toHaveAttribute('href', '#how-it-works')
    // Three proof statements.
    for (const claim of [/free to start/i, /no ads/i, /private, with direct controls/i]) {
      expect(screen.getByText(claim)).toBeInTheDocument()
    }
    // The ribbon is present and decorative; no carousel controls were introduced.
    expect(container.querySelector('.ff-l-ribbon[aria-hidden="true"]')).not.toBeNull()
    expect(container.querySelectorAll('.ff-l-ribbon button')).toHaveLength(0)
  })
})
