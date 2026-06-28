import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

vi.mock('@/shared/hooks/useAuthSession', () => ({ useAuthSession: () => ({ user: { id: 'u1' } }) }))
const logSurfaceImpressions = vi.fn(() => Promise.resolve())
vi.mock('@/shared/services/recommendations', () => ({ logSurfaceImpressions: (...a) => logSurfaceImpressions(...a) }))
vi.mock('../components/HomeMovieCard', () => ({ default: ({ film }) => <div data-testid="card">{film.title}</div> }))

import HomeRecommendationSection from '../components/HomeRecommendationSection'

const mk = (n) => Array.from({ length: n }, (_, i) => ({ id: i + 1, title: `F${i + 1}` }))
const renderSection = (props = {}) => render(
  <HomeRecommendationSection rowKey="top_of_taste" title="Your taste, distilled" subtitle="Leaning into prestige dramas" note="How this was determined." films={mk(5)} {...props} />,
)

beforeEach(() => vi.clearAllMocks())

describe('HomeRecommendationSection', () => {
  it('renders the title, subtitle and a card per film', () => {
    renderSection()
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Your taste, distilled')
    expect(screen.getByText('Leaning into prestige dramas')).toBeInTheDocument()
    expect(screen.getAllByTestId('card')).toHaveLength(5)
  })

  it('caps the row at 5 films even when more candidates are supplied', () => {
    renderSection({ films: mk(8) })
    expect(screen.getAllByTestId('card')).toHaveLength(5)
  })

  it('renders nothing when there are no films', () => {
    const { container } = renderSection({ films: [] })
    expect(container).toBeEmptyDOMElement()
  })

  it('the info disclosure is collapsed by default and expands on click', () => {
    renderSection()
    const btn = screen.getByRole('button', { name: /How .* was determined/i })
    expect(btn).toHaveAttribute('aria-expanded', 'false')
    // The note stays in the DOM (so aria-controls stays valid) but is hidden.
    expect(screen.getByText('How this was determined.')).not.toBeVisible()
    fireEvent.click(btn)
    expect(btn).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText('How this was determined.')).toBeVisible()
  })

  it('logs a carousel impression for the visible films with the row key', async () => {
    renderSection()
    await waitFor(() => expect(logSurfaceImpressions).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'u1', placement: 'carousel', pickReasonType: 'top_of_taste' }),
    ))
  })
})
