import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

// Mock dependencies before importing component
vi.mock('@/shared/hooks/useAuthSession', () => ({
  useAuthSession: () => ({ userId: 'test-user' }),
}))
vi.mock('@/shared/services/watchlist', () => ({
  addToWatchlist: vi.fn(),
}))
vi.mock('@/shared/services/feedback', () => ({
  submitRecommendationFeedback: vi.fn(),
}))
vi.mock('@/shared/api/tmdb', () => ({
  tmdbImg: (path, size) => path ? `https://image.tmdb.org/t/p/${size}${path}` : '',
}))

import ResultsList from '../ResultsList'

const FILMS = [
  { movie_id: 1, title: 'Film A', match_percentage: 85, poster_path: null, mood_tags: [], tone_tags: [] },
  { movie_id: 2, title: 'Film B', match_percentage: 92, poster_path: null, mood_tags: [], tone_tags: [] },
  { movie_id: 3, title: 'Film C', match_percentage: 78, poster_path: null, mood_tags: [], tone_tags: [] },
]

describe('ResultsList', () => {
  it('renders top pick as the highest-scoring film', () => {
    render(
      <ResultsList films={FILMS} onOpenDetail={() => {}} />,
    )

    // Top pick should be Film B (92%)
    const topPicks = screen.getAllByText('Top Pick')
    expect(topPicks).toHaveLength(1)

    // Film B title should appear (as h2 in TopPickCard)
    expect(screen.getByText('Film B')).toBeTruthy()
  })

  it('renders match percentage for top pick', () => {
    render(
      <ResultsList films={FILMS} onOpenDetail={() => {}} />,
    )

    expect(screen.getByText('92')).toBeTruthy()
  })

  it('renders alternate cards for remaining films', () => {
    render(
      <ResultsList films={FILMS} onOpenDetail={() => {}} />,
    )

    // Film A and Film C should appear as alternates
    expect(screen.getByText('Film A')).toBeTruthy()
    expect(screen.getByText('Film C')).toBeTruthy()
  })

  it('renders section header for alternates', () => {
    render(
      <ResultsList films={FILMS} onOpenDetail={() => {}} />,
    )

    expect(screen.getByText('Also great for this brief')).toBeTruthy()
  })

  it('renders watchlist actions', () => {
    render(
      <ResultsList films={FILMS} onOpenDetail={() => {}} />,
    )

    // TopPickCard has "Watchlist", AlternateCards have "Save"
    const watchlistBtns = screen.getAllByText('Watchlist')
    const saveBtns = screen.getAllByText('Save')
    expect(watchlistBtns.length).toBeGreaterThanOrEqual(1) // top pick
    expect(saveBtns.length).toBe(2) // 2 alternates
  })

  it('returns null when no films', () => {
    const { container } = render(
      <ResultsList films={[]} onOpenDetail={() => {}} />,
    )

    expect(container.innerHTML).toBe('')
  })
})
