import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

// Mock the shared chrome (tested elsewhere) so this focuses on the legal document content.
vi.mock('@/app/header/SiteHeaderHost', () => ({ default: () => <div data-testid="site-header" /> }))
vi.mock('@/features/landing/components/LandingFooter', () => ({ default: () => <footer data-testid="site-footer" /> }))

import Privacy from '../Privacy'

const renderPage = () => render(<MemoryRouter><Privacy /></MemoryRouter>)

afterEach(() => cleanup())

describe('Privacy — rebuilt legal document', () => {
  it('keeps the title, last-updated date, and the shared chrome', () => {
    renderPage()
    const h1s = screen.getAllByRole('heading', { level: 1 })
    expect(h1s).toHaveLength(1)
    expect(h1s[0]).toHaveTextContent('Privacy Policy')
    expect(screen.getByText(/Last updated: November 15, 2025/)).toBeInTheDocument()
    expect(screen.getByTestId('site-header')).toBeInTheDocument()
    expect(screen.getByTestId('site-footer')).toBeInTheDocument()
  })

  it('preserves the load-bearing legal disclosures verbatim', () => {
    const { container } = renderPage()
    const txt = container.textContent

    // Core privacy promises.
    expect(txt).toMatch(/We do not use your personal data for advertising or sell it to anyone\./)
    expect(txt).toMatch(/We never sell your personal data\./)
    // Analytics/error-monitoring disclosure (must stay accurate).
    expect(txt).toMatch(/PostHog/)
    expect(txt).toMatch(/Sentry/)
    expect(txt).toMatch(/turn product analytics off any time in Account/i)
    // Infra providers.
    expect(txt).toMatch(/Supabase/)
    expect(txt).toMatch(/TMDB/)
    // Taste-match discovery is opt-in.
    expect(txt).toMatch(/Appear in taste-match discovery/)
    // Children's privacy.
    expect(txt).toMatch(/children under 13/i)
    // Rights.
    expect(txt).toMatch(/Export your watchlist/i)
    expect(txt).toMatch(/Delete your account/i)
    // Liability / disclaimer.
    expect(txt).toMatch(/is not legal advice/i)
    // Contact email (present as a real mailto link, in rights + contact).
    expect(container.querySelectorAll('a[href="mailto:privacy@feelflick.com"]').length).toBeGreaterThanOrEqual(1)
  })

  it('uses the new editorial chrome — no retired copy, gradients, or Lucide icons in content', () => {
    const { container } = renderPage()
    expect(container.textContent).not.toMatch(/films that know you/i)
    expect(container.querySelector('.ff-landing')).not.toBeNull()
    expect(container.querySelector('.ff-l-legal')).not.toBeNull()
    // No Lucide/SVG icons in the document body (chrome mocked out).
    expect(container.querySelectorAll('svg')).toHaveLength(0)
    // No leftover purple/pink gradient utility classes.
    expect(container.innerHTML).not.toMatch(/from-purple|to-pink|bg-clip-text/)
  })
})
