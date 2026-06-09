import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'

import { ProvidersSection } from '../sections-bottom'
import { MovieDataProvider } from '../useMovieData'

const P = (over = {}) => ({ flatrate: [], rent: [], buy: [], link: '', ...over })
const withProviders = (providers, providerStatus) =>
  render(<MovieDataProvider value={{ providers, providerStatus }}><ProvidersSection /></MovieDataProvider>)

describe('ProvidersSection — honest provider states (F5.7)', () => {
  it('20. loading shows "Checking availability…" as a status, not an alert', () => {
    const { container } = withProviders(P(), 'loading')
    expect(screen.getByText(/Checking availability…/i)).toBeInTheDocument()
    expect(container.querySelector('[role="status"]')).toBeTruthy()
    expect(container.querySelector('[role="alert"]')).toBeNull()
  })

  it('21/22/23. found renders providers + JustWatch + the United States attribution', () => {
    const found = P({ flatrate: [{ name: 'Mock Stream', logoPath: '/l.png', logo: 'M', tint: '#fff' }], link: 'https://justwatch.com/x' })
    withProviders(found, 'found')
    expect(screen.getByText('Streaming', { exact: false })).toBeTruthy()
    expect(screen.getByRole('link', { name: /Watch on Mock Stream/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /More options on JustWatch/i })).toBeInTheDocument()
    expect(screen.getByText(/Availability for the United States via TMDB and JustWatch/i)).toBeInTheDocument()
  })

  it('24/25. empty renders "Availability not found" without claiming universal unavailability', () => {
    const { container } = withProviders(P(), 'empty')
    expect(screen.getByRole('heading', { level: 2, name: 'Availability not found' })).toBeInTheDocument()
    expect(screen.getByText(/We couldn’t find streaming, rental, or purchase options for the United States\./i)).toBeInTheDocument()
    expect(container.textContent).not.toMatch(/unavailable everywhere|not streaming anywhere|no one carries|not available\b/i)
    expect(container.querySelector('[role="alert"]')).toBeNull()
  })

  it('26/27/28. error renders "Availability unavailable", no raw message, keeps a JustWatch option', () => {
    const { container } = withProviders(P(), 'error')
    expect(screen.getByRole('heading', { level: 2, name: 'Availability unavailable' })).toBeInTheDocument()
    expect(screen.getByText(/Provider information couldn’t be reached right now\./i)).toBeInTheDocument()
    expect(container.textContent).not.toMatch(/TMDB \d|500|PGRST|status_message|fetch|endpoint/i)
    expect(screen.getByRole('link', { name: /Search on JustWatch/i })).toHaveAttribute('href', 'https://www.justwatch.com')
    expect(container.querySelector('[role="alert"]')).toBeNull()
  })

  it('29/30. external link indicates a new tab; provider logo alt does not duplicate the link name', () => {
    const found = P({ flatrate: [{ name: 'Mock Stream', logoPath: '/l.png', logo: 'M', tint: '#fff' }] })
    const { container } = withProviders(found, 'found')
    const watch = screen.getByRole('link', { name: /Watch on Mock Stream/i })
    expect(watch).toHaveAttribute('target', '_blank')
    expect(watch.getAttribute('rel')).toMatch(/noopener/)
    const logo = container.querySelector('img')
    expect(logo).toHaveAttribute('alt', '')
  })

  it('idle renders nothing; uses a labelled section with an h2', () => {
    const { container } = withProviders(P(), 'idle')
    expect(container).toBeEmptyDOMElement()
    withProviders(P(), 'empty')
    expect(screen.getByLabelText('Where to watch')).toBeInTheDocument()
  })

  it('falls back to data-derived found/empty when providerStatus is absent (back-compat)', () => {
    const found = P({ flatrate: [{ name: 'X', logo: 'X', tint: '#fff' }] })
    withProviders(found, undefined)
    expect(screen.getByText('Streaming', { exact: false })).toBeTruthy()
  })
})
