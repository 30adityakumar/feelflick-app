import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

// Mock CarouselRow to avoid complex carousel setup
vi.mock('@/components/carousel/Row', () => ({
  default: ({ title, items, loading }) => (
    <div data-testid="carousel-row">
      <div data-testid="row-title">{title}</div>
      <div data-testid="row-count">{items?.length ?? 0}</div>
      <div data-testid="row-loading">{String(loading)}</div>
    </div>
  ),
}))

import TopOfYourTasteRow from '../TopOfYourTasteRow'
import CriticsSwoonedRow from '../CriticsSwoonedRow'
import Under90MinutesRow from '../Under90MinutesRow'
import StillInOrbitRow from '../StillInOrbitRow'
import MoodRow from '../MoodRow'
import WatchlistRow from '../WatchlistRow'
import SignatureDirectorRow from '../SignatureDirectorRow'

// Helper: generate N mock films
function mockFilms(n) {
  return Array.from({ length: n }, (_, i) => ({
    id: i + 1, tmdb_id: i + 1, poster_path: '/p.jpg',
  }))
}

// ── Auto-hide: all rows hide when < 6 films ──

describe('Row auto-hide (< 6 films)', () => {
  it('TopOfYourTasteRow hides with 5 films', () => {
    const { container } = render(<TopOfYourTasteRow data={mockFilms(5)} loading={false} />)
    expect(container.innerHTML).toBe('')
  })

  it('CriticsSwoonedRow hides with 5 films', () => {
    const { container } = render(<CriticsSwoonedRow data={mockFilms(5)} loading={false} />)
    expect(container.innerHTML).toBe('')
  })

  it('Under90MinutesRow hides with 5 films', () => {
    const { container } = render(<Under90MinutesRow data={mockFilms(5)} loading={false} />)
    expect(container.innerHTML).toBe('')
  })

  it('StillInOrbitRow hides with 5 films', () => {
    const { container } = render(
      <StillInOrbitRow data={{ films: mockFilms(5), seed: { title: 'Arrival' } }} loading={false} />,
    )
    expect(container.innerHTML).toBe('')
  })

  it('MoodRow hides with 5 films', () => {
    const { container } = render(
      <MoodRow data={{ films: mockFilms(5), dominantMood: 'tense' }} loading={false} />,
    )
    expect(container.innerHTML).toBe('')
  })

  it('WatchlistRow hides with 5 films', () => {
    const { container } = render(
      <WatchlistRow data={{ films: mockFilms(5) }} loading={false} />,
    )
    expect(container.innerHTML).toBe('')
  })

  it('SignatureDirectorRow hides with 5 films', () => {
    const { container } = render(
      <SignatureDirectorRow data={{ films: mockFilms(5), director: 'Nolan' }} loading={false} />,
    )
    expect(container.innerHTML).toBe('')
  })
})

// ── Renders when >= 6 films ──

describe('StillInOrbitRow', () => {
  it('hides when no seed and not loading', () => {
    const { container } = render(
      <StillInOrbitRow data={{ films: [], seed: null }} loading={false} />,
    )
    expect(container.innerHTML).toBe('')
  })

  it('renders with seed title when >= 6 films', () => {
    render(
      <StillInOrbitRow
        data={{ films: mockFilms(8), seed: { title: 'Arrival' } }}
        loading={false}
      />,
    )
    expect(screen.getByText(/Arrival/)).toBeTruthy()
  })
})

describe('MoodRow', () => {
  it('hides when no dominant mood and not loading', () => {
    const { container } = render(
      <MoodRow data={{ films: [], dominantMood: null }} loading={false} />,
    )
    expect(container.innerHTML).toBe('')
  })

  it('renders with dominant mood in title when >= 6 films', () => {
    render(
      <MoodRow
        data={{ films: mockFilms(8), dominantMood: 'contemplative' }}
        loading={false}
      />,
    )
    expect(screen.getByText(/contemplative/)).toBeTruthy()
  })
})

describe('WatchlistRow', () => {
  it('hides when films array is empty', () => {
    const { container } = render(
      <WatchlistRow data={{ films: [] }} loading={false} />,
    )
    expect(container.innerHTML).toBe('')
  })

  it('renders when >= 6 films', () => {
    render(
      <WatchlistRow
        data={{ films: mockFilms(8) }}
        loading={false}
      />,
    )
    expect(screen.getByText(/watchlist/i)).toBeTruthy()
  })
})

describe('SignatureDirectorRow', () => {
  it('hides when no director and not loading', () => {
    const { container } = render(
      <SignatureDirectorRow data={{ films: [], director: null }} loading={false} />,
    )
    expect(container.innerHTML).toBe('')
  })

  it('renders with director name when >= 6 films', () => {
    render(
      <SignatureDirectorRow
        data={{ films: mockFilms(8), director: 'Denis Villeneuve' }}
        loading={false}
      />,
    )
    expect(screen.getByText(/Denis Villeneuve/)).toBeTruthy()
  })
})

describe('TopOfYourTasteRow', () => {
  it('hides when empty', () => {
    const { container } = render(<TopOfYourTasteRow data={[]} loading={false} />)
    expect(container.innerHTML).toBe('')
  })

  it('renders when >= 6 films', () => {
    render(<TopOfYourTasteRow data={mockFilms(8)} loading={false} />)
    expect(screen.getByText(/top of your taste/i)).toBeTruthy()
  })
})

describe('CriticsSwoonedRow', () => {
  it('hides when empty', () => {
    const { container } = render(<CriticsSwoonedRow data={[]} loading={false} />)
    expect(container.innerHTML).toBe('')
  })

  it('renders when >= 6 films', () => {
    render(<CriticsSwoonedRow data={mockFilms(8)} loading={false} />)
    expect(screen.getByText(/critics swooned/i)).toBeTruthy()
  })
})

describe('Under90MinutesRow', () => {
  it('hides when empty', () => {
    const { container } = render(<Under90MinutesRow data={[]} loading={false} />)
    expect(container.innerHTML).toBe('')
  })

  it('renders when >= 6 films', () => {
    render(<Under90MinutesRow data={mockFilms(8)} loading={false} />)
    expect(screen.getByText(/under 90/i)).toBeTruthy()
  })
})
