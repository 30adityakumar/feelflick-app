import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

// --- data hooks (controlled per test) ---------------------------------------
let homeData
let rows
vi.mock('../useHomeData', () => ({
  HomeDataProvider: ({ children }) => <div>{children}</div>,
  useHomeData: () => homeData,
}))
vi.mock('@/shared/hooks/useHomepageRows', () => ({ useHomepageRows: () => rows }))
vi.mock('@/shared/hooks/useAuthSession', () => ({ useAuthSession: () => ({ user: { id: 'u1' } }) }))
vi.mock('@/shared/hooks/usePageMeta', () => ({ usePageMeta: () => {} }))
vi.mock('@/shared/services/betaEvents', () => ({ trackEvent: vi.fn(), EVENTS: { home_opened: 'home_opened' } }))
vi.mock('@/shared/ui/thoughtful-seatmate', () => ({
  ThoughtfulRoot: ({ children }) => <div>{children}</div>,
  PageDepth: ({ children }) => <div>{children}</div>,
}))

// --- stub the heavy children so the integration test focuses on Home wiring --
vi.mock('../components/HomeHero', () => ({ default: ({ films }) => <div data-testid="hero">{films.map(f => f.id).join(',')}</div> }))
vi.mock('../components/HomeShortcutStrip', () => ({ default: () => <nav aria-label="Quick actions" /> }))
vi.mock('../components/HomeDnaStrip', () => ({ default: () => <div data-testid="dna" /> }))
vi.mock('../components/HomeRecommendationSection', () => ({
  default: ({ rowKey, title, films }) => <section data-testid={`row-${rowKey}`} aria-label={title}>{films.map(f => f.id).join(',')}</section>,
}))

import Home from '../Home'

const row = (data, loading = false) => ({ data, loading, error: null })
const renderHome = () => render(<MemoryRouter><Home /></MemoryRouter>)

function fullRows(over = {}) {
  return {
    tier: 'engaged', rotationVariant: 'A', profileReady: true, profileError: false,
    topOfTaste: row({ films: [
      { id: 1, _reason: { type: 'director', text: 'r1' } },   // grounded → hero
      { id: 2, _reason: { type: 'generic', text: 'Picked for you' } }, // generic → NOT hero
      { id: 3, _reason: { type: 'mood', text: 'r3' } },        // grounded → hero
      { id: 4, _reason: { type: 'quality', text: 'r4' } },
      { id: 5, _reason: { type: 'fit', text: 'r5' } },
    ], subtitle: 'sub' }),
    orbit: row({ films: [{ id: 10 }, { id: 11 }], seed: { id: 99, title: 'Seed Film' } }),
    mood: row({ films: [{ id: 20 }, { id: 21 }], title: 'Films that feel tender', subtitle: 's' }),
    director: row({ films: [{ id: 30 }, { id: 31 }], director: { name: 'Dir X' }, subtitle: null }),
    watchlist: row({ films: [{ id: 40 }, { id: 41 }] }),
    criticSplit: row([{ id: 50 }, { id: 51 }]),
    under90: row([{ id: 60 }, { id: 61 }]),
    ...over,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  homeData = { dna: { motifs: ['Earnest'], topMoods: null, topFit: null, filmsToNext: 0 }, user: { name: 'A', watched: 30 }, loading: false, error: null }
  rows = fullRows()
})

describe('Home — state machine', () => {
  it('shows a content-shaped skeleton while the profile is not ready', () => {
    rows = fullRows({ profileReady: false })
    homeData = { ...homeData, loading: true }
    renderHome()
    expect(screen.getByRole('status', { name: /Preparing your home/i })).toBeInTheDocument()
    expect(screen.queryByTestId('hero')).not.toBeInTheDocument()
  })

  it('shows an honest error (not an empty grid) when the provider read fails', () => {
    homeData = { ...homeData, error: 'boom' }
    renderHome()
    expect(screen.getByRole('alert')).toHaveTextContent('We couldn’t load your home.')
    expect(screen.queryByTestId('hero')).not.toBeInTheDocument()
  })

  it('shows an honest error when the profile/scoring context fails to build', () => {
    homeData = { dna: null, user: { name: 'A', watched: 0 }, loading: false, error: null }
    rows = fullRows({ profileError: true })
    renderHome()
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.queryByTestId('hero')).not.toBeInTheDocument()
  })

  it('shows an honest cold/empty state (still with shortcuts + DNA) when there is no content', () => {
    rows = {
      tier: 'cold', rotationVariant: 'A', profileReady: true, profileError: false,
      topOfTaste: row({ films: [], subtitle: null }),
      orbit: row({ films: [], seed: null }), mood: row({ films: [], title: null }),
      director: row({ films: [], director: null }), watchlist: row({ films: [] }),
      criticSplit: row([]), under90: row([]),
    }
    renderHome()
    expect(screen.getByText(/recommendations are still warming up/i)).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Quick actions' })).toBeInTheDocument()
    expect(screen.getByTestId('dna')).toBeInTheDocument()
    expect(screen.queryByTestId('hero')).not.toBeInTheDocument()
  })
})

describe('Home — hero + rows', () => {
  it('builds the hero only from grounded standouts (generic excluded)', () => {
    renderHome()
    // grounded ids = 1,3,4,5 (2 is generic); hero takes the first 3 = 1,3,4.
    expect(screen.getByTestId('hero').textContent).toBe('1,3,4')
    expect(screen.getByTestId('hero').textContent).not.toMatch(/\b2\b/)
  })

  it('removes hero films from the rows (no immediate repetition)', () => {
    renderHome()
    const top = screen.getByTestId('row-top_of_taste')
    // ids 1,3,4 were lifted into the hero; 2 (generic) + 5 remain in the row.
    expect(top.textContent).toBe('2,5')
  })

  it('orders personal rows before broad/editorial fallbacks', () => {
    const { container } = renderHome()
    const order = [...container.querySelectorAll('[data-testid^="row-"]')].map(n => n.getAttribute('data-testid'))
    expect(order).toEqual([
      'row-top_of_taste',
      'row-still_in_orbit',
      'row-mood_row',
      'row-signature_director',
      'row-watchlist',
      'row-critics_swooned',
      'row-under_90',
    ])
  })

  it('titles the orbit row from the seed and the director row from the filmmaker', () => {
    renderHome()
    expect(screen.getByLabelText('Because you loved Seed Film')).toBeInTheDocument()
    expect(screen.getByLabelText('More from Dir X')).toBeInTheDocument()
  })

  it('does not render its own app navigation (chrome is owned by AppShell)', () => {
    renderHome()
    // The only navigation Home owns is the shortcut strip.
    const navs = screen.getAllByRole('navigation')
    expect(navs).toHaveLength(1)
    expect(navs[0]).toHaveAccessibleName('Quick actions')
  })
})
