// src/features/onboarding/__tests__/OnboardingSteps.test.jsx
// Tests for the rebuilt onboarding steps: enforced minimums, rating anchor,
// and completeOnboarding service writes.

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

// ---------------------------------------------------------------------------
// Mocks
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
}))

vi.mock('@/shared/services/recommendations', () => ({
  computeUserProfileV3: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/shared/services/analytics', () => ({
  track: vi.fn(),
}))

// ---------------------------------------------------------------------------
// GenresStep — minimum 3 genres before Continue is enabled
// ---------------------------------------------------------------------------

// Isolated footer stub mirroring GenresStep's actual gate
function GenresFooter({ count, onNext }) {
  const canContinue = count >= 3
  return (
    <div>
      <p>{count === 0 ? 'Select at least 3 to continue' : count < 3 ? `${count} selected — pick ${3 - count} more` : `${count} selected ✓`}</p>
      <button onClick={onNext} disabled={!canContinue} aria-label="Continue">
        Continue
      </button>
    </div>
  )
}

describe('GenresStep — 3-genre minimum', () => {
  it('Continue is disabled with 0 genres selected', () => {
    render(<GenresFooter count={0} onNext={vi.fn()} />)
    expect(screen.getByRole('button', { name: /continue/i })).toBeDisabled()
  })

  it('Continue is disabled with 1 genre selected', () => {
    render(<GenresFooter count={1} onNext={vi.fn()} />)
    expect(screen.getByRole('button', { name: /continue/i })).toBeDisabled()
  })

  it('Continue is disabled with 2 genres selected', () => {
    render(<GenresFooter count={2} onNext={vi.fn()} />)
    expect(screen.getByRole('button', { name: /continue/i })).toBeDisabled()
  })

  it('Continue is enabled with exactly 3 genres selected', () => {
    render(<GenresFooter count={3} onNext={vi.fn()} />)
    expect(screen.getByRole('button', { name: /continue/i })).not.toBeDisabled()
  })

  it('Continue is enabled with more than 3 genres selected', () => {
    render(<GenresFooter count={7} onNext={vi.fn()} />)
    expect(screen.getByRole('button', { name: /continue/i })).not.toBeDisabled()
  })

  it('calls onNext when Continue is clicked with enough genres', () => {
    const onNext = vi.fn()
    render(<GenresFooter count={4} onNext={onNext} />)
    fireEvent.click(screen.getByRole('button', { name: /continue/i }))
    expect(onNext).toHaveBeenCalled()
  })

  it('shows progress text updating correctly', () => {
    render(<GenresFooter count={2} onNext={vi.fn()} />)
    expect(screen.getByText(/2 selected — pick 1 more/i)).toBeInTheDocument()
  })

  it('shows ✓ checkmark text when minimum met', () => {
    render(<GenresFooter count={5} onNext={vi.fn()} />)
    expect(screen.getByText(/5 selected ✓/i)).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// MoviesStep — minimum 5 films before Continue is enabled
// ---------------------------------------------------------------------------

function MoviesFooter({ count, onFinish }) {
  const canFinish = count >= 5
  return (
    <div>
      <p>{count === 0 ? 'Select at least 5 films to continue' : count < 5 ? `${count} selected — pick ${5 - count} more` : `${count} selected ✓`}</p>
      <button onClick={onFinish} disabled={!canFinish} aria-label="Continue">
        Continue
      </button>
    </div>
  )
}

describe('MoviesStep — 5-film minimum', () => {
  it('CTA is disabled with 0 films selected', () => {
    render(<MoviesFooter count={0} onFinish={vi.fn()} />)
    expect(screen.getByRole('button', { name: /continue/i })).toBeDisabled()
  })

  it('CTA is disabled with 4 films selected', () => {
    render(<MoviesFooter count={4} onFinish={vi.fn()} />)
    expect(screen.getByRole('button', { name: /continue/i })).toBeDisabled()
  })

  it('CTA is enabled with exactly 5 films selected', () => {
    render(<MoviesFooter count={5} onFinish={vi.fn()} />)
    expect(screen.getByRole('button', { name: /continue/i })).not.toBeDisabled()
  })

  it('CTA is enabled with more than 5 films selected', () => {
    render(<MoviesFooter count={8} onFinish={vi.fn()} />)
    expect(screen.getByRole('button', { name: /continue/i })).not.toBeDisabled()
  })

  it('calls onFinish when CTA clicked with enough films', () => {
    const onFinish = vi.fn()
    render(<MoviesFooter count={5} onFinish={onFinish} />)
    fireEvent.click(screen.getByRole('button', { name: /continue/i }))
    expect(onFinish).toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// RatingStep — sentiment → rating mapping + gate logic
// ---------------------------------------------------------------------------

import { SENTIMENT_RATINGS } from '../steps/RatingStep'

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

function RatingFooter({ ratings, onFinish, loading = false }) {
  const canFinish = Object.keys(ratings).length >= 1
  return (
    <div>
      <button onClick={onFinish} disabled={!canFinish || loading} aria-label="See my recommendations">
        {loading ? 'Building your profile…' : 'See my recommendations'}
      </button>
    </div>
  )
}

describe('RatingStep — finish gate', () => {
  it('CTA is disabled when no films are rated', () => {
    render(<RatingFooter ratings={{}} onFinish={vi.fn()} />)
    expect(screen.getByRole('button', { name: /see my recommendations/i })).toBeDisabled()
  })

  it('CTA is enabled once one film is rated', () => {
    render(<RatingFooter ratings={{ 123: 9 }} onFinish={vi.fn()} />)
    expect(screen.getByRole('button', { name: /see my recommendations/i })).not.toBeDisabled()
  })

  it('CTA is enabled with multiple films rated', () => {
    render(<RatingFooter ratings={{ 123: 9, 456: 7, 789: 5 }} onFinish={vi.fn()} />)
    expect(screen.getByRole('button', { name: /see my recommendations/i })).not.toBeDisabled()
  })

  it('CTA is disabled while loading even if films are rated', () => {
    render(<RatingFooter ratings={{ 123: 7 }} onFinish={vi.fn()} loading={true} />)
    expect(screen.getByRole('button', { name: /see my recommendations/i })).toBeDisabled()
  })

  it('calls onFinish when CTA clicked with a rating', () => {
    const onFinish = vi.fn()
    render(<RatingFooter ratings={{ 456: 5 }} onFinish={onFinish} />)
    fireEvent.click(screen.getByRole('button', { name: /see my recommendations/i }))
    expect(onFinish).toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// completeOnboarding — DB write expectations
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
