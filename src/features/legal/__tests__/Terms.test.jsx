import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

// Mock the shared chrome (tested elsewhere) so this focuses on the legal document content.
vi.mock('@/app/header/SiteHeaderHost', () => ({ default: () => <div data-testid="site-header" /> }))
vi.mock('@/features/landing/components/LandingFooter', () => ({ default: () => <footer data-testid="site-footer" /> }))

import Terms from '../Terms'

const renderPage = () => render(<MemoryRouter><Terms /></MemoryRouter>)

afterEach(() => cleanup())

describe('Terms — rebuilt legal document', () => {
  it('keeps the title, last-updated date, and the shared chrome', () => {
    renderPage()
    const h1s = screen.getAllByRole('heading', { level: 1 })
    expect(h1s).toHaveLength(1)
    expect(h1s[0]).toHaveTextContent('Terms of Service')
    expect(screen.getByText(/Last updated: November 15, 2025/)).toBeInTheDocument()
    expect(screen.getByTestId('site-header')).toBeInTheDocument()
    expect(screen.getByTestId('site-footer')).toBeInTheDocument()
  })

  it('preserves the load-bearing legal clauses verbatim', () => {
    const { container } = renderPage()
    const txt = container.textContent

    // Discovery-tool disclaimer (FeelFlick does not host/stream).
    expect(txt).toMatch(/FeelFlick is a discovery tool/)
    expect(txt).toMatch(/We do not host, stream, or provide direct access/)
    expect(txt).toMatch(/responsible for obtaining legal access/)
    // Responsibilities.
    expect(txt).toMatch(/responsible for all activity that occurs under your account/i)
    expect(txt).toMatch(/Do not scrape, hack, or reverse-engineer/)
    // IP + TMDB attribution.
    expect(txt).toMatch(/exclusive property of FeelFlick/)
    expect(txt).toMatch(/uses the TMDB API but is not endorsed or certified by TMDB/)
    expect(txt).toMatch(/may not copy, modify, distribute, or sell/)
    // Disclaimers / liability.
    expect(txt).toMatch(/without warranties of any kind/)
    expect(txt).toMatch(/shall not exceed the amount you paid us \(if any\) in the past 12 months/)
    // Termination + changes.
    expect(txt).toMatch(/suspend or terminate your account/)
    expect(txt).toMatch(/Continued use of FeelFlick after changes/)
    // Contact emails as real mailto links.
    expect(container.querySelector('a[href="mailto:support@feelflick.com"]')).not.toBeNull()
    expect(container.querySelector('a[href="mailto:legal@feelflick.com"]')).not.toBeNull()
    // TMDB link present.
    expect(container.querySelector('a[href="https://www.themoviedb.org/"]')).not.toBeNull()
  })

  it('uses the new editorial chrome — no retired copy, gradients, or Lucide icons in content', () => {
    const { container } = renderPage()
    expect(container.textContent).not.toMatch(/films that know you/i)
    expect(container.querySelector('.ff-landing')).not.toBeNull()
    expect(container.querySelector('.ff-l-legal')).not.toBeNull()
    expect(container.querySelectorAll('svg')).toHaveLength(0)
    expect(container.innerHTML).not.toMatch(/from-purple|to-pink|bg-clip-text/)
  })
})
