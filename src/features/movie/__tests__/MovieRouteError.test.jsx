import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'

let ROUTE_ID = '496243'
let DATA = { mv: null, loading: false, error: { kind: 'not_found' } }
const navigate = vi.fn()

vi.mock('../useMovieData', () => ({
  useMovieDataFetch: () => DATA,
  MovieDataProvider: ({ children }) => children,
  useMovieData: () => ({ mv: DATA.mv }),
}))
vi.mock('react-router-dom', () => ({ useNavigate: () => navigate, useParams: () => ({ id: ROUTE_ID }) }))
vi.mock('@/shared/hooks/useAuthSession', () => ({ useAuthSession: () => ({ user: null }) }))
vi.mock('@/shared/hooks/usePageMeta', () => ({ usePageMeta: () => {} }))
vi.mock('@/shared/hooks/useUserMovieStatus', () => ({ useUserMovieStatus: () => ({ isInWatchlist: false, isWatched: false, loading: {}, toggleWatchlist: vi.fn(), toggleWatched: vi.fn(), internalId: null }) }))
vi.mock('@/shared/services/interactions', () => ({ trackShare: vi.fn(), trackTrailerPlay: vi.fn() }))
vi.mock('framer-motion', () => ({ useReducedMotion: () => false }))
vi.mock('../hooks/useTasteFingerprint', () => ({ useTasteFingerprint: () => ({ fingerprint: null }) }))
vi.mock('../hooks/useDirectorAffinity', () => ({ useDirectorAffinity: () => ({ count: 0 }) }))
vi.mock('../hooks/useFriendsLoved', () => ({ useFriendsLoved: () => ({ friends: [] }) }))
vi.mock('../hooks/useTasteTwin', () => ({ useTasteTwin: () => ({ twin: null }) }))

import MovieDetail from '../MovieDetail'

beforeEach(() => { cleanup(); document.body.innerHTML = ''; ROUTE_ID = '496243'; DATA = { mv: null, loading: false, error: { kind: 'not_found' } }; navigate.mockClear() })
afterEach(() => vi.clearAllMocks())

describe('Film File route errors — sanitized PageError (F5.7)', () => {
  it('38. invalid id → "isn’t valid" copy', () => {
    ROUTE_ID = 'abc'; DATA = { mv: null, loading: false, error: { kind: 'not_found' } }
    render(<MovieDetail />)
    expect(screen.getByText(/That movie link isn’t valid\./i)).toBeInTheDocument()
  })

  it('39. not-found (valid id) → 404 copy', () => {
    render(<MovieDetail />)
    expect(screen.getByText('404 · Film File Not Found')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: /Couldn’t find that movie\./i })).toBeInTheDocument()
  })

  it('40. load error → "We couldn’t open this Film File." copy', () => {
    DATA = { mv: null, loading: false, error: { kind: 'load_error' } }
    render(<MovieDetail />)
    expect(screen.getByText(/We couldn’t open this Film File\./i)).toBeInTheDocument()
  })

  it('41/42/43. exactly one h1, alert semantics, and NO raw error text', () => {
    DATA = { mv: null, loading: false, error: { kind: 'load_error', raw: 'PGRST relation movies does not exist' } }
    const { container } = render(<MovieDetail />)
    expect(container.querySelectorAll('h1').length).toBe(1)
    expect(container.querySelector('[role="alert"]')).toBeTruthy()
    expect(container.textContent).not.toMatch(/PGRST|relation|does not exist|TMDB|supabase|500/i)
  })

  it('44/45/46/47. Back + Go to Home (routes /home), 44px/type, no fake Retry', () => {
    render(<MovieDetail />)
    const back = screen.getByRole('button', { name: 'Go back' })
    const home = screen.getByRole('button', { name: 'Go to Home' })
    expect(back).toHaveAttribute('type', 'button')
    expect(home).toHaveAttribute('type', 'button')
    expect(back.style.minHeight).toBe('44px')
    expect(home.style.minHeight).toBe('44px')
    fireEvent.click(home)
    expect(navigate).toHaveBeenCalledWith('/home')
    expect(screen.queryByRole('button', { name: /retry|try again/i })).not.toBeInTheDocument()
  })
})
