import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

vi.mock('@/shared/hooks/usePageMeta', () => ({ usePageMeta: () => {} }))
vi.mock('@/shared/hooks/useAuthSession', () => ({ useAuthSession: () => ({ user: { id: 'me' } }) }))
vi.mock('@/shared/services/betaEvents', async (orig) => ({ ...(await orig()), trackEvent: () => {} }))

let mockCtx
vi.mock('../usePeopleData', () => ({
  PeopleDataProvider: ({ children }) => children,
  usePeopleData: () => mockCtx,
}))
let mockSearch
vi.mock('../hooks/usePeopleSearch', () => ({ usePeopleSearch: () => mockSearch }))

import People from '../People'

const qualified = (band = 'Very close taste') => ({ qualified: true, band, evidence: 'Based on 18 films in common', caption: band })
const card = (id, over = {}) => ({ id, name: over.name || id, initial: 'A', avatarBg: '#888', avatarUrl: null, bio: over.bio || 'Tender + Reflective films · 40 watched', matchPresentation: over.mp || qualified(), viaFriend: over.viaFriend || null, ...over })

function baseCtx(over = {}) {
  return {
    status: 'ready', loading: false,
    user: { name: 'Mira', following: 2, followers: 7, followersUnavailable: false },
    strongest: [], more: [], suggested: [],
    followingIds: new Set(), relStatus: '',
    announce: vi.fn(), retry: vi.fn(),
    follow: vi.fn(), unfollow: vi.fn(), isPending: () => false, isErrored: () => false,
    hide: vi.fn(), undo: vi.fn(), clearUndo: vi.fn(), isHidden: () => false, lastHidden: null,
    ...over,
  }
}
const idle = { query: '', setQuery: vi.fn(), clear: vi.fn(), phase: 'idle', results: [], active: false }
const renderPeople = () => render(<MemoryRouter><People /></MemoryRouter>)

beforeEach(() => { mockSearch = idle })
afterEach(() => { cleanup(); vi.clearAllMocks() })

describe('People — composition + landmarks', () => {
  it('one visible h1, no nested <main>, masthead + search render', () => {
    mockCtx = baseCtx({ strongest: [card('a', { name: 'Ana' })] })
    const { container } = renderPeople()
    expect(container.querySelectorAll('h1')).toHaveLength(1)
    expect(screen.getByRole('heading', { level: 1, name: 'Your taste matches.' })).toBeInTheDocument()
    expect(container.querySelector('main')).toBeNull()
    expect(screen.getByText('People')).toBeInTheDocument()
    expect(screen.getByLabelText('Search people by name')).toBeInTheDocument()
  })

  it('Strongest qualified card: band + evidence, name, bio; no @handle, no % in the DOM', () => {
    mockCtx = baseCtx({ strongest: [card('a', { name: 'Ana' })] })
    const { container } = renderPeople()
    expect(screen.getByRole('heading', { level: 2, name: 'People who get it.' })).toBeInTheDocument()
    expect(screen.getByText('Very close taste')).toBeInTheDocument()
    expect(screen.getByText('Based on 18 films in common')).toBeInTheDocument()
    expect(screen.getByText('Ana')).toBeInTheDocument()
    expect(container.textContent).not.toMatch(/@[a-z0-9]/i) // no generated handle
    expect(container.textContent).not.toMatch(/\d%/)        // no exact percentage
  })

  it('one relationship live region (role=status, polite, atomic)', () => {
    mockCtx = baseCtx({ strongest: [card('a')] })
    const { container } = renderPeople()
    expect(container.querySelectorAll('[role="status"][aria-live="polite"][aria-atomic="true"]')).toHaveLength(1)
  })
})

describe('People — follow state is consistent across every rail (followingIds authority)', () => {
  it('a followed person shows "Following" in Suggested AND Search (the fixed defect)', () => {
    mockCtx = baseCtx({
      suggested: [card('s1', { name: 'Sose', viaFriend: 'Mira' })],
      followingIds: new Set(['s1', 'r1']),
    })
    renderPeople()
    const suggestedBtn = screen.getByRole('button', { name: 'Unfollow Sose' })
    expect(suggestedBtn).toHaveTextContent('Following')
  })

  it('search results derive Follow state from followingIds too', () => {
    mockSearch = { ...idle, phase: 'results', active: true, results: [{ id: 'x1', name: 'Hal', initial: 'H', avatarBg: '#888', avatarUrl: null }] }
    mockCtx = baseCtx({ followingIds: new Set(['x1']) })
    renderPeople()
    expect(screen.getByRole('button', { name: 'Unfollow Hal' })).toHaveTextContent('Following')
    // discovery rails are replaced by search
    expect(screen.queryByRole('heading', { name: 'People who get it.' })).toBeNull()
  })
})

describe('People — search states', () => {
  it('error phase shows an unavailable state, never "No people found"', () => {
    mockSearch = { ...idle, phase: 'error', active: true, results: [] }
    mockCtx = baseCtx()
    renderPeople()
    expect(screen.getByText('Search is unavailable right now.')).toBeInTheDocument()
    expect(screen.queryByText('No people found.')).toBeNull()
  })
  it('empty phase shows the privacy-safe no-results copy', () => {
    mockSearch = { ...idle, phase: 'empty', active: true, results: [] }
    mockCtx = baseCtx()
    renderPeople()
    expect(screen.getByText('No people found.')).toBeInTheDocument()
    expect(screen.getByText(/never looks through private film activity or reviews/i)).toBeInTheDocument()
  })
})

describe('People — Suggested via attribution', () => {
  it('every Suggested card shows a genuine "via {friend}"', () => {
    mockCtx = baseCtx({ suggested: [card('s1', { name: 'Sose', viaFriend: 'Mira' })] })
    renderPeople()
    const row = screen.getByText('Sose').closest('.ff-people-row')
    expect(within(row).getByText('Mira')).toBeInTheDocument()
    expect(within(row).getByText(/via/)).toBeInTheDocument()
  })
})

describe('People — Hide + Undo toast', () => {
  it('renders the Undo toast when a person was just hidden; Undo calls ctx.undo', () => {
    const undo = vi.fn()
    mockCtx = baseCtx({ strongest: [card('a')], lastHidden: { id: 'a', name: 'Ana' }, undo })
    renderPeople()
    expect(screen.getByText('Hidden Ana for this session.')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Undo hiding Ana' }))
    expect(undo).toHaveBeenCalledTimes(1)
  })
})

describe('People — matching explainer (one shared dialog, both triggers)', () => {
  it('both "How matching works" and the Strongest chip open the same dialog', () => {
    mockCtx = baseCtx({ strongest: [card('a')] })
    renderPeople()
    expect(screen.queryByRole('dialog')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: /How matching works/i }))
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(within(dialog).getByText(/Name search is separate/i)).toBeInTheDocument()
    fireEvent.click(within(dialog).getByRole('button', { name: /Close matching explanation/i }))
    expect(screen.queryByRole('dialog')).toBeNull()
    // the Strongest "No exact percentages" chip opens the same dialog
    fireEvent.click(screen.getByRole('button', { name: /No exact percentages/i }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })
})

describe('People — non-ready states', () => {
  it('cold/ready+empty → honest "no confident matches" copy', () => {
    mockCtx = baseCtx({ status: 'ready', strongest: [], more: [], suggested: [] })
    renderPeople()
    expect(screen.getByText('No confident taste matches yet.')).toBeInTheDocument()
    expect(screen.queryByText(/Rate a dozen films/i)).toBeNull()
  })
  it('discovery_unavailable → search still available + Retry; masthead present', () => {
    mockCtx = baseCtx({ status: 'discovery_unavailable' })
    renderPeople()
    expect(screen.getByText('Taste matches are unavailable right now.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument()
    expect(screen.getByLabelText('Search people by name')).toBeInTheDocument()
  })
  it('load_error → single h1 alert, Try again + Go to Home, no masthead', () => {
    mockCtx = baseCtx({ status: 'load_error' })
    const { container } = renderPeople()
    expect(container.querySelectorAll('h1')).toHaveLength(1)
    expect(screen.getByRole('alert')).toHaveTextContent('We couldn’t load People.')
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Go to Home' })).toBeInTheDocument()
    expect(screen.queryByText('Your taste matches.')).toBeNull()
  })
})
