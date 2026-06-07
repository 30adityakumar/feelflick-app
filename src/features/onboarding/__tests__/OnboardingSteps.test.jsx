// src/features/onboarding/__tests__/OnboardingSteps.test.jsx
//
// Real-component coverage of the SHIPPED onboarding gates + the completeOnboarding
// service. This replaces the earlier isolated footer STUBS, which had drifted from
// the shipped components and were giving false confidence:
//   - the Genres stub gated at >= 3 genres; the real GenresStep ships MIN_GENRES = 1.
//   - the Rating stub asserted a "See my recommendations" confirm button; the real
//     RatingStep has no such button — it auto-finishes after the last card is rated.
//   - a separate OnboardingSkip.test.jsx asserted "no minimum / CTA always enabled",
//     directly contradicting the shipped MIN_MOVIES = 5 (deleted alongside this file).
// These tests render the actual step components so a real-markup regression is caught.

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

// ---------------------------------------------------------------------------
// Module mocks (no live Supabase / TMDB / dev-user reset)
// ---------------------------------------------------------------------------

vi.mock('@/shared/lib/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockResolvedValue({ error: null }),
      upsert: vi.fn().mockResolvedValue({ error: null }),
      delete: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      not: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: [] }),
      maybeSingle: vi.fn().mockResolvedValue({ data: null }),
      single: vi.fn().mockResolvedValue({ data: { id: 'internal-uuid' }, error: null }),
    })),
    auth: {
      updateUser: vi.fn().mockResolvedValue({ data: {}, error: null }),
    },
  },
}))

vi.mock('@/shared/api/tmdb', () => ({
  tmdbImg: (path, _size) => `https://image.tmdb.org/t/p/w342${path}`,
  fetchJson: vi.fn().mockResolvedValue({ id: 1, title: 'Test Movie', poster_path: '/test.jpg' }),
  searchMovies: vi.fn().mockResolvedValue({ results: [] }),
}))

vi.mock('@/shared/services/recommendations', () => ({
  computeUserProfileV3: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/shared/services/analytics', () => ({
  track: vi.fn(),
}))

// framer-motion's useReducedMotion reads window.matchMedia, which jsdom doesn't
// provide. Stub it (test-local, guarded) so the real step components render.
if (!window.matchMedia) {
  window.matchMedia = vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))
}

import GenresStep from '../steps/GenresStep'
import MoviesStep from '../steps/MoviesStep'
import RatingStep from '../steps/RatingStep'
import { GENRES, SENTIMENT_RATINGS } from '../data'

// ---------------------------------------------------------------------------
// GenresStep — shipped minimum is 1 genre (MIN_GENRES = 1)
// ---------------------------------------------------------------------------

describe('GenresStep — real 1-genre minimum', () => {
  const props = (over = {}) => ({
    selectedGenres: [],
    toggleGenre: vi.fn(),
    onBack: vi.fn(),
    onNext: vi.fn(),
    ...over,
  })

  it('Continue is disabled and prompts for at least 1 when nothing is selected', () => {
    render(<GenresStep {...props({ selectedGenres: [] })} />)
    expect(screen.getByRole('button', { name: /continue/i })).toBeDisabled()
    expect(screen.getByText(/select at least 1 to continue/i)).toBeInTheDocument()
  })

  it('Continue is ENABLED at exactly 1 genre (the shipped minimum, NOT 3)', () => {
    render(<GenresStep {...props({ selectedGenres: [GENRES[0].id] })} />)
    expect(screen.getByRole('button', { name: /continue/i })).not.toBeDisabled()
    expect(screen.getByText(/1 selected/i)).toBeInTheDocument()
  })

  it('the instructional copy states the real minimum of 1', () => {
    render(<GenresStep {...props()} />)
    expect(screen.getByText(/pick at least 1/i)).toBeInTheDocument()
  })

  it('clicking a genre tile calls toggleGenre with that genre id', () => {
    const toggleGenre = vi.fn()
    render(<GenresStep {...props({ toggleGenre })} />)
    fireEvent.click(screen.getByRole('button', { name: GENRES[0].name }))
    expect(toggleGenre).toHaveBeenCalledWith(GENRES[0].id)
  })

  it('clicking Continue (when valid) calls onNext', () => {
    const onNext = vi.fn()
    render(<GenresStep {...props({ selectedGenres: [GENRES[0].id], onNext })} />)
    fireEvent.click(screen.getByRole('button', { name: /continue/i }))
    expect(onNext).toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// MoviesStep — shipped minimum is 5 films (MIN_MOVIES = 5)
// ---------------------------------------------------------------------------

describe('MoviesStep — real 5-film minimum', () => {
  const film = (id) => ({ id, title: `Film ${id}`, poster_path: `/${id}.jpg` })
  const props = (over = {}) => ({
    selectedGenreIds: [],
    moods: [],
    favoriteMovies: [],
    addMovie: vi.fn(),
    removeMovie: vi.fn(),
    isMovieSelected: () => false,
    onBack: vi.fn(),
    onFinish: vi.fn(),
    loading: false,
    error: '',
    ...over,
  })

  it('Continue is disabled below 5 films and prompts for the remainder', async () => {
    render(<MoviesStep {...props({ favoriteMovies: [film(1), film(2), film(3), film(4)] })} />)
    expect(await screen.findByRole('button', { name: /^continue$/i })).toBeDisabled()
    expect(screen.getByText(/4 selected.*pick 1 more/i)).toBeInTheDocument()
  })

  it('Continue is ENABLED at exactly 5 films (the shipped minimum)', async () => {
    render(<MoviesStep {...props({ favoriteMovies: [film(1), film(2), film(3), film(4), film(5)] })} />)
    expect(await screen.findByRole('button', { name: /^continue$/i })).not.toBeDisabled()
    expect(screen.getByText(/5 selected/i)).toBeInTheDocument()
  })

  it('with 0 films, the footer prompts for at least 5', async () => {
    render(<MoviesStep {...props({ favoriteMovies: [] })} />)
    expect(await screen.findByText(/select at least 5 films to continue/i)).toBeInTheDocument()
  })

  it('clicking Continue (when valid) calls onFinish', async () => {
    const onFinish = vi.fn()
    render(<MoviesStep {...props({ favoriteMovies: [film(1), film(2), film(3), film(4), film(5)], onFinish })} />)
    fireEvent.click(await screen.findByRole('button', { name: /^continue$/i }))
    expect(onFinish).toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// RatingStep — SENTIMENT_RATINGS mapping + the real sentiment-button affordance
// ---------------------------------------------------------------------------

describe('RatingStep — SENTIMENT_RATINGS mapping', () => {
  it('loved maps to 9', () => {
    expect(SENTIMENT_RATINGS.loved).toBe(9)
  })

  it('liked maps to 7', () => {
    expect(SENTIMENT_RATINGS.liked).toBe(7)
  })

  it('okay maps to 5', () => {
    expect(SENTIMENT_RATINGS.okay).toBe(5)
  })
})

describe('RatingStep — real sentiment buttons (auto-finishes; no confirm button)', () => {
  const film = { id: 42, title: 'Film 42', poster_path: '/42.jpg' }
  const props = (over = {}) => ({
    favoriteMovies: [film],
    ratings: {},
    onRate: vi.fn(),
    onBack: vi.fn(),
    onFinish: vi.fn(),
    error: '',
    ...over,
  })

  it('renders the three verdict buttons (Okay / Liked / Loved) as the rating affordance', () => {
    render(<RatingStep {...props()} />)
    expect(screen.getByRole('button', { name: 'Loved' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Liked' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Okay' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Meh' })).not.toBeInTheDocument()
  })

  it('does NOT render a "See my recommendations" confirm button (the step auto-finishes)', () => {
    render(<RatingStep {...props()} />)
    expect(screen.queryByRole('button', { name: /see my recommendations/i })).not.toBeInTheDocument()
  })

  it('clicking a sentiment button rates the current film with that sentiment', () => {
    const onRate = vi.fn()
    render(<RatingStep {...props({ onRate })} />)
    fireEvent.click(screen.getByRole('button', { name: 'Loved' }))
    expect(onRate).toHaveBeenCalledWith(film, 'loved')
  })
})

// ---------------------------------------------------------------------------
// completeOnboarding — DB write expectations (real service)
// ---------------------------------------------------------------------------

import { completeOnboarding } from '@/shared/services/onboarding'
import { supabase } from '@/shared/lib/supabase/client'
import { computeUserProfileV3 } from '@/shared/services/recommendations'
import { track } from '@/shared/services/analytics'

const MOCK_SESSION = {
  user: {
    id: 'user-123',
    email: 'test@example.com',
    user_metadata: { name: 'Test User' },
  },
}

const MOCK_MOVIES = [
  { id: 1, title: 'Film A', poster_path: '/a.jpg', internalId: 'uuid-a' },
  { id: 2, title: 'Film B', poster_path: '/b.jpg', internalId: 'uuid-b' },
  { id: 3, title: 'Film C', poster_path: '/c.jpg', internalId: 'uuid-c' },
  { id: 4, title: 'Film D', poster_path: '/d.jpg', internalId: 'uuid-d' },
  { id: 5, title: 'Film E', poster_path: '/e.jpg', internalId: 'uuid-e' },
]

describe('completeOnboarding — service writes', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Default supabase chain returns existing movie to skip insert
    const chainMock = {
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockResolvedValue({ error: null }),
      upsert: vi.fn().mockResolvedValue({ error: null }),
      delete: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      not: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: [] }),
      maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'internal-uuid' } }),
      single: vi.fn().mockResolvedValue({ data: { id: 'internal-uuid' }, error: null }),
    }
    supabase.from.mockReturnValue(chainMock)
  })

  it('calls computeUserProfileV3 with forceRefresh', async () => {
    await completeOnboarding({
      session: MOCK_SESSION,
      selectedGenres: [28, 18, 53],
      favoriteMovies: MOCK_MOVIES,
      ratings: { 1: 9 },
    })

    expect(computeUserProfileV3).toHaveBeenCalledWith('user-123', { forceRefresh: true })
  })

  it('calls auth.updateUser to mark onboarding complete', async () => {
    await completeOnboarding({
      session: MOCK_SESSION,
      selectedGenres: [28],
      favoriteMovies: MOCK_MOVIES,
      ratings: {},
    })

    expect(supabase.auth.updateUser).toHaveBeenCalledWith({
      data: { onboarding_complete: true, has_onboarded: true },
    })
  })

  it('tracks onboarding_completed with correct properties when films are rated', async () => {
    await completeOnboarding({
      session: MOCK_SESSION,
      selectedGenres: [28, 18, 53],
      favoriteMovies: MOCK_MOVIES,
      ratings: { 1: 9, 2: 7 },
    })

    expect(track).toHaveBeenCalledWith('onboarding_completed', expect.objectContaining({
      genre_count: 3,
      movie_count: 5,
      rating_count: 2,
    }))
  })

  it('tracks rating_count: 0 when no films are rated', async () => {
    await completeOnboarding({
      session: MOCK_SESSION,
      selectedGenres: [28],
      favoriteMovies: MOCK_MOVIES,
      ratings: {},
    })

    expect(track).toHaveBeenCalledWith('onboarding_completed', expect.objectContaining({
      rating_count: 0,
    }))
  })

  it('throws if no authenticated user', async () => {
    await expect(
      completeOnboarding({
        session: { user: null },
        selectedGenres: [],
        favoriteMovies: [],
        ratings: {},
      })
    ).rejects.toThrow('No authenticated user')
  })
})
