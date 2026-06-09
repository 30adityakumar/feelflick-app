import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { useState } from 'react'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'

vi.mock('framer-motion', () => ({ useReducedMotion: () => false }))

import { MovieHero, StickyActionBar } from '../sections-top'
import { MovieDataProvider } from '../useMovieData'
import FilmFileDisclosure from '../components/FilmFileDisclosure'

const MV = { id: 1, title: 'Parasite', year: 2019, runtime: 132, director: 'Bong Joon-ho', genres: ['Drama'], language: 'KO', poster: '', backdrop: '', tmdbRating: 8.5, ffCritic: 91, ffAudience: 90, daypartFit: 'evening', trailerYouTubeId: 'abc' }
const heroProps = { onPlayTrailer() {}, onBack() {}, onShare() {}, isInWatchlist: false, isWatched: false, onToggleWatchlist() {}, onToggleWatched() {}, loading: { watched: false, watchlist: false }, canAct: true, celebrate: false }
const withData = (node) => render(<MovieDataProvider value={{ mv: MV, boundaryWarnings: [] }}>{node}</MovieDataProvider>)

beforeEach(() => { cleanup(); document.body.innerHTML = ''; vi.stubGlobal('IntersectionObserver', class { observe() {} unobserve() {} disconnect() {} }) })
afterEach(() => vi.unstubAllGlobals())

describe('Final touch-target + icon semantics (F5.7)', () => {
  it('64/66/67. hero Share is 44×44, type=button, with an aria-hidden icon', () => {
    withData(<MovieHero {...heroProps} />)
    const share = screen.getByRole('button', { name: 'Share this film' })
    expect(share.style.width).toBe('44px')
    expect(share.style.height).toBe('44px')
    expect(share).toHaveAttribute('type', 'button')
    expect(share.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
  })

  it('65/66. hero Back is ≥44px, type=button', () => {
    withData(<MovieHero {...heroProps} />)
    const back = screen.getByRole('button', { name: 'Go back' })
    expect(back.style.minHeight).toBe('44px')
    expect(back).toHaveAttribute('type', 'button')
  })

  it('64. sticky Back icon control is 44×44 with type=button (when the bar is shown)', () => {
    const { container } = render(<MovieDataProvider value={{ mv: MV }}><StickyActionBar onPlayTrailer={() => {}} onBack={() => {}} onToggleWatchlist={() => {}} isInWatchlist={false} loading={{}} canAct /></MovieDataProvider>)
    // the bar is inert/aria-hidden until scrolled — show it so its controls are real
    Object.defineProperty(window, 'scrollY', { value: 200, configurable: true })
    fireEvent.scroll(window)
    const back = container.querySelector('.ff-movie-sticky-bar button[aria-label="Go back"]')
    expect(back.style.width).toBe('44px')
    expect(back.style.height).toBe('44px')
    expect(back).toHaveAttribute('type', 'button')
    Object.defineProperty(window, 'scrollY', { value: 0, configurable: true })
  })
})

function TwoDisclosures() {
  const [n, setN] = useState(0)
  return (
    <div>
      <button type="button" onClick={() => setN((x) => x + 1)}>bump {n}</button>
      <FilmFileDisclosure heading="First disclosure"><p>one</p></FilmFileDisclosure>
      <FilmFileDisclosure heading="Second disclosure"><p>two</p></FilmFileDisclosure>
    </div>
  )
}

describe('Disclosure independence + rerender persistence (F5.7)', () => {
  it('68/69. opening one disclosure leaves the other closed and survives an unrelated rerender', () => {
    const { container } = render(<TwoDisclosures />)
    const [d1, d2] = container.querySelectorAll('details')
    const s1 = d1.querySelector('summary')
    // open the first
    s1.click()
    expect(d1.open).toBe(true)
    expect(d2.open).toBe(false) // no accordion exclusivity
    // an unrelated parent rerender must not collapse it
    fireEvent.click(screen.getByText(/bump/))
    expect(container.querySelectorAll('details')[0].open).toBe(true)
  })
})
