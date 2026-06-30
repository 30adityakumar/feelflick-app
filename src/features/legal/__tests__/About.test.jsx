import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'

// Mock the shared chrome (each has its own tests + needs router/supabase) so this test
// focuses on About's OWN rebuilt content + honesty. The real page is exercised in
// e2e/public/about.e2e.js with the genuine header/footer.
vi.mock('@/app/header/SiteHeaderHost', () => ({ default: () => <div data-testid="site-header" /> }))
vi.mock('@/features/landing/LandingAuth', () => ({ LandingAuthProvider: ({ children }) => <>{children}</> }))
vi.mock('@/features/landing/components/LandingFinalCTA', () => ({
  default: () => <section data-testid="final-cta"><button type="button">Continue with Google</button></section>,
}))
vi.mock('@/features/landing/components/LandingFooter', () => ({ default: () => <footer data-testid="site-footer" /> }))
vi.mock('@/features/landing/components/LandingAuthStatus', () => ({ default: () => null }))

import About from '../About'

afterEach(() => cleanup())

describe('About — rebuilt content', () => {
  it('has one h1 (the brand promise), the section headings, the three modes, and four beliefs', () => {
    render(<About />)
    const h1s = screen.getAllByRole('heading', { level: 1 })
    expect(h1s).toHaveLength(1)
    expect(h1s[0]).toHaveTextContent('Movies, made personal.')

    for (const name of [/except a decision/i, /three ways in/i, /keeps evolving/i, /convictions/i]) {
      expect(screen.getByRole('heading', { level: 2, name })).toBeInTheDocument()
    }
    for (const name of [/for tonight/i, /from your taste/i, /follow a curiosity/i]) {
      expect(screen.getByRole('heading', { level: 3, name })).toBeInTheDocument()
    }
    for (const belief of [
      'Fewer directions, chosen well.',
      'Reasons you can understand.',
      'Taste that keeps evolving.',
      'Private where it should be.',
    ]) {
      expect(screen.getByText(belief)).toBeInTheDocument()
    }
    // Cinematic DNA framed per doctrine (living/correctable, never fixed/score).
    expect(screen.getByText(/living portrait/i)).toBeInTheDocument()
    expect(screen.getByText(/never a fixed label or a single compatibility score/i)).toBeInTheDocument()
    // Shared chrome mounted.
    expect(screen.getByTestId('site-header')).toBeInTheDocument()
    expect(screen.getByTestId('site-footer')).toBeInTheDocument()
    expect(screen.getByTestId('final-cta')).toBeInTheDocument()
  })

  it('carries no retired copy, fabricated stats, false precision, or leftover icons', () => {
    const { container } = render(<About />)
    const txt = container.textContent
    expect(txt).not.toMatch(/films that know you/i)
    expect(txt).not.toMatch(/free\.?\s*forever|always free/i)
    expect(txt).not.toMatch(/\d+\s*%/)
    expect(txt).not.toMatch(/\b\d[\d,]*\+?\s*(films|users|members|reviews)\b/i)
    expect(txt).not.toMatch(/embedding dimensions|text-embedding-3|scoring dimensions/i)
    // No Lucide/SVG icons in About's own content (chrome is mocked out).
    expect(container.querySelectorAll('svg')).toHaveLength(0)
  })
})
