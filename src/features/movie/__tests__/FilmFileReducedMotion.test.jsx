import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'

let reduced = false
vi.mock('framer-motion', () => ({ useReducedMotion: () => reduced }))

import { MovieHero, StickyActionBar } from '../sections-top'
import { MovieDataProvider } from '../useMovieData'

const MV = { id: 1, title: 'Parasite', year: 2019, runtime: 132, director: 'Bong Joon-ho', genres: ['Drama'], language: 'KO', poster: 'p.jpg', backdrop: 'b.jpg', tmdbRating: 8.5, ffCritic: 91, ffAudience: 90, daypartFit: 'evening', trailerYouTubeId: 'abc' }
const withData = (value, node) => render(<MovieDataProvider value={value}>{node}</MovieDataProvider>)
const heroProps = { onPlayTrailer() {}, onBack() {}, onShare() {}, isInWatchlist: false, isWatched: false, onToggleWatchlist() {}, onToggleWatched() {}, loading: { watched: false, watchlist: false }, canAct: true, celebrate: false }

beforeEach(() => { cleanup(); document.body.innerHTML = ''; reduced = false; vi.stubGlobal('IntersectionObserver', class { observe() {} unobserve() {} disconnect() {} }) })
afterEach(() => { vi.unstubAllGlobals() })

describe('Sticky action bar — inert / tab order (F5.4)', () => {
  it('59/60. hidden bar is aria-hidden + inert (controls leave the tab order)', () => {
    const { container } = withData({ mv: MV }, <StickyActionBar onPlayTrailer={() => {}} onBack={() => {}} onToggleWatchlist={() => {}} isInWatchlist={false} loading={{}} canAct />)
    const bar = container.querySelector('.ff-movie-sticky-bar')
    expect(bar).toHaveAttribute('aria-hidden', 'true')
    expect(bar).toHaveAttribute('inert')
    expect(bar.style.pointerEvents).toBe('none')
  })

  it('61. scrolled bar becomes interactive (no aria-hidden/inert)', () => {
    // StickyActionBar looks up the sentinel by id; add it to the document so the
    // IntersectionObserver effect doesn't bail out early with "if (!sentinel) return"
    const sentinel = document.createElement('div')
    sentinel.id = 'hero-actions-sentinel'
    document.body.appendChild(sentinel)

    // Stub IntersectionObserver to immediately report sentinel as not-intersecting
    // (hero actions scrolled out of view → bar should become visible)
    vi.stubGlobal('IntersectionObserver', class {
      constructor(cb) { this._cb = cb }
      observe(el) { this._cb([{ isIntersecting: false, target: el }]) }
      unobserve() {}
      disconnect() {}
    })
    const { container } = withData({ mv: MV }, <StickyActionBar onPlayTrailer={() => {}} onBack={() => {}} />)
    const bar = container.querySelector('.ff-movie-sticky-bar')
    expect(bar.getAttribute('aria-hidden')).toBeNull()
    expect(bar.hasAttribute('inert')).toBe(false)
    expect(bar.style.pointerEvents).toBe('auto')

    document.body.removeChild(sentinel)
  })
})

describe('Reduced motion — JS-driven motion suppressed (F5.4)', () => {
  it('71. backdrop parallax stays put under reduced motion', () => {
    reduced = true
    const { container } = withData({ mv: MV, boundaryWarnings: [] }, <MovieHero {...heroProps} />)
    Object.defineProperty(window, 'scrollY', { value: 400, configurable: true })
    fireEvent.scroll(window)
    const parallax = container.querySelector('[style*="translateY"]')
    expect(parallax.style.transform).toMatch(/translateY\(0px\)/)
    Object.defineProperty(window, 'scrollY', { value: 0, configurable: true })
  })

})

describe('Decorative icons hidden (F5.4)', () => {
  it('Mark Watched / Save icons are aria-hidden', () => {
    withData({ mv: MV, boundaryWarnings: [] }, <MovieHero {...heroProps} />)
    const watched = screen.getByRole('button', { name: /mark.*watched/i })
    expect(watched.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
  })
})
