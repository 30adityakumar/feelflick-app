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
vi.mock('@/shared/services/whyThis', () => ({
  buildWhyThis: () => 'A warm pick for tonight.',
}))

import ResultsList from '../ResultsList'

const FILMS = [
  { movie_id: 1, title: 'Film A', match_percentage: 85, poster_path: null },
  { movie_id: 2, title: 'Film B', match_percentage: 92, poster_path: null },
  { movie_id: 3, title: 'Film C', match_percentage: 78, poster_path: null },
]

const brief = { answers: { feeling: 1 } }

describe('ResultsList', () => {
  it('sorts films by match_percentage descending', () => {
    render(
      <ResultsList films={FILMS} brief={brief} onOpenDetail={() => {}} />,
    )

    const titles = screen.getAllByRole('heading', { level: 3 })
    expect(titles[0].textContent).toBe('Film B')
    expect(titles[1].textContent).toBe('Film A')
    expect(titles[2].textContent).toBe('Film C')
  })

  it('shows "Top Pick" eyebrow only on first item', () => {
    render(
      <ResultsList films={FILMS} brief={brief} onOpenDetail={() => {}} />,
    )

    const topPicks = screen.getAllByText('Top Pick')
    expect(topPicks).toHaveLength(1)
  })

  it('renders match percentage for each film', () => {
    render(
      <ResultsList films={FILMS} brief={brief} onOpenDetail={() => {}} />,
    )

    expect(screen.getByText('92')).toBeTruthy()
    expect(screen.getByText('85')).toBeTruthy()
    expect(screen.getByText('78')).toBeTruthy()
  })

  it('renders action buttons for each film', () => {
    render(
      <ResultsList films={FILMS} brief={brief} onOpenDetail={() => {}} />,
    )

    // 3 films × 3 actions = 9 buttons (plus poster/title buttons)
    const watchlistBtns = screen.getAllByText('Watchlist')
    const seenBtns = screen.getAllByText('Seen it')
    const dismissBtns = screen.getAllByText('Not tonight')

    expect(watchlistBtns).toHaveLength(3)
    expect(seenBtns).toHaveLength(3)
    expect(dismissBtns).toHaveLength(3)
  })

  it('renders why-this explanation for each film', () => {
    render(
      <ResultsList films={FILMS} brief={brief} onOpenDetail={() => {}} />,
    )

    const explanations = screen.getAllByText('A warm pick for tonight.')
    expect(explanations).toHaveLength(3)
  })
})
