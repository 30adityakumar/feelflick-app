import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { useEffect, useState } from 'react'
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react'

// ── Controllable shared-status mock ───────────────────────────────────────────
// Drives the optimistic flip + settle/revert that the Movie-local settlement effect
// observes (loading.{watched,watchlist} true→false + the resulting state).
const status = { isInWatchlist: false, isWatched: false, loading: { watchlist: false, watched: false }, internalId: 7 }
const forces = new Set()
const toggleWatched = vi.fn()
const toggleWatchlist = vi.fn()
function bump() { act(() => { forces.forEach((f) => f()) }) }

vi.mock('@/shared/hooks/useUserMovieStatus', () => ({
  useUserMovieStatus: () => {
    const [, f] = useState(0)
    useEffect(() => { const fn = () => f((n) => n + 1); forces.add(fn); return () => forces.delete(fn) }, [])
    return { isInWatchlist: status.isInWatchlist, isWatched: status.isWatched, loading: status.loading, toggleWatchlist, toggleWatched, internalId: status.internalId }
  },
}))
vi.mock('@/shared/hooks/useAuthSession', () => ({ useAuthSession: () => ({ user: { id: 'u1' } }) }))
vi.mock('@/shared/hooks/usePageMeta', () => ({ usePageMeta: () => {} }))
vi.mock('@/shared/services/interactions', () => ({ trackShare: vi.fn(), trackTrailerPlay: vi.fn() }))
vi.mock('react-router-dom', () => ({ useNavigate: () => vi.fn(), useParams: () => ({ id: '496243' }) }))
const MV = { id: 496243, title: 'Parasite', year: 2019, tagline: 'Act like you own the place.', overview: 'A class war.', trailerYouTubeId: 'abc', ffMatch: 88, runtime: 132, director: 'Bong Joon-ho', genres: ['Drama'], language: 'KO', poster: '', backdrop: '', tmdbRating: 8.5, ffCritic: 91, ffAudience: 90, daypartFit: 'evening' }
vi.mock('../useMovieData', () => ({
  useMovieDataFetch: () => ({ mv: MV, filmDbRow: null, moodAxes: null, overlay: null, cast: [], videos: [], similar: [], dirShelf: [], providers: { flatrate: [], rent: [], buy: [] }, boundaryWarnings: [], loading: false, error: null }),
  MovieDataProvider: ({ children }) => children,
  useMovieData: () => ({ mv: MV, boundaryWarnings: [] }),
}))
vi.mock('../hooks/useTasteFingerprint', () => ({ useTasteFingerprint: () => ({ fingerprint: null }) }))
vi.mock('../hooks/useDirectorAffinity', () => ({ useDirectorAffinity: () => ({ count: 0 }) }))
vi.mock('../hooks/useFriendsLoved', () => ({ useFriendsLoved: () => ({ friends: [] }) }))
vi.mock('../hooks/useTasteTwin', () => ({ useTasteTwin: () => ({ twin: null }) }))
// Mock the watched-only chapter to a light marker carrying the scroll/focus target
// id, and the duplicate mobile action bar to null, so this test focuses on the hero
// actions + the live region (and there is exactly one "Save"/"Mark Watched" button).
vi.mock('../components/PostWatchPortrait', () => ({ default: () => <section id="after-watching" tabIndex={-1} data-testid="postwatch" /> }))
vi.mock('../components/MovieActionBar', () => ({ default: () => null }))
// Mock the heavy tail so the test focuses on the hero actions + the live region.
vi.mock('../sections-bottom', () => {
  const Stub = () => null
  return { CastSection: Stub, VideosSection: Stub, ProvidersSection: Stub, PairsWith: Stub, FriendsLoved: Stub, TasteTwinReview: Stub, TimelineSection: Stub, DirectorShelf: Stub, YourTake: () => <div data-testid="your-take" />, DetailsSection: Stub, MovieFooter: Stub }
})
let reduced = false
vi.mock('framer-motion', () => ({ useReducedMotion: () => reduced }))

import MovieDetail from '../MovieDetail'

const live = () => document.querySelector('[role="status"][aria-live="polite"]')

beforeEach(() => {
  cleanup(); document.body.innerHTML = ''
  status.isInWatchlist = false; status.isWatched = false; status.loading = { watchlist: false, watched: false }
  reduced = false
  toggleWatched.mockClear(); toggleWatchlist.mockClear()
  vi.stubGlobal('IntersectionObserver', class { observe() {} unobserve() {} disconnect() {} })
  Element.prototype.scrollIntoView = vi.fn()
})
afterEach(() => { vi.unstubAllGlobals(); vi.clearAllMocks() })

// Simulate the shared hook's optimistic flip then settle (success) or revert (fail).
function startWatched(targetTrue) { status.loading.watched = true; status.isWatched = targetTrue; bump() }
function settleWatched(success, targetTrue) { status.loading.watched = false; status.isWatched = success ? targetTrue : !targetTrue; bump() }

describe('Film File — watched settlement + live region (F5.4)', () => {
  it('22/23. exactly one polite/atomic live region, initially empty', () => {
    render(<MovieDetail />)
    const regions = document.querySelectorAll('[role="status"][aria-live="polite"][aria-atomic="true"]')
    expect(regions.length).toBe(1)
    expect(regions[0].textContent).toBe('')
  })

  it('1/2/3/4/5/6. settled success announces, no scroll/confetti before success', () => {
    render(<MovieDetail />)
    fireEvent.click(screen.getByRole('button', { name: /mark parasite as watched/i }))
    expect(toggleWatched).toHaveBeenCalledTimes(1)
    startWatched(true)
    // optimistic only — not settled yet → no announce, no scroll, no confetti
    expect(live().textContent).toBe('')
    expect(Element.prototype.scrollIntoView).not.toHaveBeenCalled()
    expect(document.querySelector('[aria-hidden] [style*="mv-confetti"]')).toBeNull()
    settleWatched(true, true)
    expect(live().textContent).toMatch(/Marked Parasite as watched\. The post-watch chapter is now available\./)
    expect(Element.prototype.scrollIntoView).toHaveBeenCalled()
  })

  it('8. normal motion scrolls with smooth behavior', () => {
    render(<MovieDetail />)
    fireEvent.click(screen.getByRole('button', { name: /mark parasite as watched/i }))
    startWatched(true); settleWatched(true, true)
    expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith(expect.objectContaining({ behavior: 'smooth' }))
  })

  it('7/9. reduced motion uses auto scroll + renders no confetti', () => {
    reduced = true
    render(<MovieDetail />)
    fireEvent.click(screen.getByRole('button', { name: /mark parasite as watched/i }))
    startWatched(true); settleWatched(true, true)
    expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith(expect.objectContaining({ behavior: 'auto' }))
    expect(document.querySelector('[style*="mv-confetti"]')).toBeNull()
  })

  it('10/11/12/13. failure/revert announces failure, no scroll, retryable', () => {
    render(<MovieDetail />)
    fireEvent.click(screen.getByRole('button', { name: /mark parasite as watched/i }))
    startWatched(true)               // optimistic
    settleWatched(false, true)        // revert → isWatched back to false
    expect(live().textContent).toMatch(/Could not update watched status\. Try again\./)
    expect(Element.prototype.scrollIntoView).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: /mark parasite as watched/i })).toBeEnabled() // still retryable
  })

  it('14. initial hydration (no click) does not announce or scroll', () => {
    render(<MovieDetail />)
    // simulate the mount sync flipping isWatched WITHOUT a loading transition
    status.isWatched = true; bump()
    expect(live().textContent).toBe('')
    expect(Element.prototype.scrollIntoView).not.toHaveBeenCalled()
  })
})

describe('Film File — Save settlement (F5.4)', () => {
  it('16/20. Save success announces after settlement + button exposes pressed/busy', () => {
    render(<MovieDetail />)
    const save = screen.getByRole('button', { name: /add parasite to watchlist/i })
    fireEvent.click(save)
    expect(toggleWatchlist).toHaveBeenCalledTimes(1)
    status.loading.watchlist = true; status.isInWatchlist = true; bump()
    expect(screen.getByRole('button', { name: /remove parasite from watchlist/i })).toHaveAttribute('aria-busy', 'true')
    expect(live().textContent).toBe('') // not settled yet
    status.loading.watchlist = false; bump()
    expect(live().textContent).toMatch(/Saved Parasite for later\./)
    expect(screen.getByRole('button', { name: /remove parasite from watchlist/i })).toHaveAttribute('aria-pressed', 'true')
  })

  it('18/19. Save failure/revert announces failure, no false success', () => {
    render(<MovieDetail />)
    fireEvent.click(screen.getByRole('button', { name: /add parasite to watchlist/i }))
    status.loading.watchlist = true; status.isInWatchlist = true; bump()  // optimistic
    status.loading.watchlist = false; status.isInWatchlist = false; bump() // revert
    expect(live().textContent).toMatch(/Could not update saved films\. Try again\./)
    expect(live().textContent).not.toMatch(/Saved Parasite for later/)
  })
})

describe('Film File — Share fallback (F5.4)', () => {
  it('63/64. native share success announces shared', async () => {
    const share = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { ...navigator, share, clipboard: undefined })
    render(<MovieDetail />)
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: /share/i })) })
    expect(share).toHaveBeenCalledWith(expect.objectContaining({ url: 'https://app.feelflick.com/movie/496243' }))
    expect(live().textContent).toMatch(/Shared Parasite\./)
  })

  it('65/66/69. no native share → clipboard copy of the canonical URL announces copied', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { ...navigator, share: undefined, clipboard: { writeText } })
    render(<MovieDetail />)
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: /share/i })) })
    expect(writeText).toHaveBeenCalledWith('https://app.feelflick.com/movie/496243')
    expect(live().textContent).toMatch(/Link copied for Parasite\./)
  })

  it('67. total failure announces failure', async () => {
    vi.stubGlobal('navigator', { ...navigator, share: undefined, clipboard: { writeText: vi.fn().mockRejectedValue(new Error('x')) } })
    render(<MovieDetail />)
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: /share/i })) })
    expect(live().textContent).toMatch(/Could not share this film\./)
  })
})
