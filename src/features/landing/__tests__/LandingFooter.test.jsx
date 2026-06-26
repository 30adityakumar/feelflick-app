import { afterEach, describe, expect, it } from 'vitest'
import { render, screen, within, cleanup } from '@testing-library/react'
import LandingFooter from '../components/LandingFooter'

afterEach(() => cleanup())

describe('LandingFooter', () => {
  it('shows the brand, tagline and a supporting line', () => {
    render(<LandingFooter />)
    expect(screen.getByText('FEELFLICK')).toBeInTheDocument()
    expect(screen.getByText('Movies, made personal.')).toBeInTheDocument()
    expect(screen.getByText(/Discovery shaped by your taste, your mood and your curiosity/i)).toBeInTheDocument()
  })

  it('groups valid public/legal links into a labelled Footer nav (no /feedback)', () => {
    render(<LandingFooter />)
    const nav = screen.getByRole('navigation', { name: /footer/i })
    for (const title of ['Explore', 'Company', 'Connect']) {
      expect(within(nav).getByText(title)).toBeInTheDocument()
    }
    const expected = [
      ['Discover', '/discover'],
      ['Browse', '/browse'],
      ['About', '/about'],
      ['Privacy', '/privacy'],
      ['Terms', '/terms'],
    ]
    for (const [label, href] of expected) {
      expect(within(nav).getByRole('link', { name: label })).toHaveAttribute('href', href)
    }
    expect(within(nav).getByRole('link', { name: 'Contact' })).toHaveAttribute('href', 'mailto:hello@feelflick.com')
    expect(nav.querySelector('a[href="/feedback"]')).toBeNull()
  })

  it('keeps the required TMDB attribution (logo + notice) and the copyright', () => {
    const { container } = render(<LandingFooter />)
    expect(screen.getByText(/This product uses the TMDB API but is not endorsed or certified by TMDB\./i)).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'The Movie Database (TMDB)' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'The Movie Database (TMDB)' })).toHaveAttribute('href', 'https://www.themoviedb.org/')
    expect(screen.getByText('© 2026 FeelFlick')).toBeInTheDocument()
    // No retired tagline reintroduced.
    expect(container.textContent).not.toMatch(/films that know you/i)
  })
})
