import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import * as data from '../data'
import { DEFAULT_DRAFT } from '../derive/preferencePresentation'

vi.mock('@/shared/hooks/usePageMeta', () => ({ usePageMeta: () => {} }))

let mockCtx
vi.mock('../usePreferencesData', () => ({
  PreferencesDataProvider: ({ children }) => children,
  usePreferencesData: () => mockCtx,
}))

import Preferences from '../Preferences'

const CATALOGS = { MOODS: data.MOODS, GENRES: data.GENRES, BOUNDARIES: data.BOUNDARIES, LANGUAGES: data.LANGUAGES, SUBTITLE_MODES: data.SUBTITLE_MODES, SPOILER_TIERS: data.SPOILER_TIERS, STREAMERS: data.STREAMERS }
function ctx(over = {}) {
  return {
    status: 'ready', saveStatus: 'idle', saveError: '', savedAt: null, updatedAt: 'T1',
    conflict: false, saving: false, dirty: false, liveMessage: '',
    draft: JSON.parse(JSON.stringify(DEFAULT_DRAFT)), baseline: JSON.parse(JSON.stringify(DEFAULT_DRAFT)),
    directorSuggestions: [], suggestionsUnavailable: false,
    catalogs: CATALOGS, announce: vi.fn(),
    setMoodBand: vi.fn(), addDrawnGenre: vi.fn(), removeDrawnGenre: vi.fn(), addAvoidGenre: vi.fn(), removeAvoidGenre: vi.fn(),
    addTrustedDirector: vi.fn(), removeTrustedDirector: vi.fn(), addMutedDirector: vi.fn(), removeMutedDirector: vi.fn(),
    setRuntimeFloor: vi.fn(), setRuntimeCap: vi.fn(), toggleBoundary: vi.fn(), setSubtitles: vi.fn(), setSpoilerTier: vi.fn(),
    addLanguage: vi.fn(), removeLanguage: vi.fn(),
    save: vi.fn(), discard: vi.fn(), retry: vi.fn(), reloadLatest: vi.fn(), keepEditing: vi.fn(),
    ...over,
  }
}
const renderPrefs = () => render(<RouterProvider router={createMemoryRouter([{ path: '/', element: <Preferences /> }])} />)

beforeEach(() => { mockCtx = ctx() })
afterEach(() => { cleanup(); vi.clearAllMocks() })

describe('Preferences — landmarks + composition', () => {
  it('exactly one h1, no nested <main>, no copied app chrome', () => {
    const { container } = renderPrefs()
    expect(container.querySelectorAll('h1')).toHaveLength(1)
    expect(screen.getByRole('heading', { level: 1, name: /Your taste, clearly/ })).toBeInTheDocument()
    expect(container.querySelector('main')).toBeNull()
    expect(container.querySelector('nav')).toBeNull()
  })

  it('summary is derived from draft (not hard-coded)', () => {
    const draft = JSON.parse(JSON.stringify(DEFAULT_DRAFT))
    draft.drawnGenreIds = [18, 9648]; draft.avoidGenreIds = [27]; draft.runtimeFloor = 95; draft.runtimeCap = 150
    mockCtx = ctx({ draft })
    renderPrefs()
    expect(screen.getByText('2 preferred · 1 avoided')).toBeInTheDocument()
    expect(screen.getByText('95–150 min')).toBeInTheDocument()
    expect(screen.getByText('Watched · Ratings · Saves · Skips')).toBeInTheDocument()
  })

  it('loading + load_error states render their own single h1', () => {
    mockCtx = ctx({ status: 'load_error' })
    const { container } = renderPrefs()
    expect(container.querySelectorAll('h1')).toHaveLength(1)
    expect(screen.getByText(/could not load your preferences/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument()
  })
})

describe('Preferences — a11y semantics', () => {
  it('boundaries use real switch semantics with 44px targets', () => {
    const { container } = renderPrefs()
    const switches = container.querySelectorAll('[role="switch"]')
    expect(switches.length).toBe(data.BOUNDARIES.length)
    switches.forEach((s) => expect(['true', 'false']).toContain(s.getAttribute('aria-checked')))
  })
  it('mood + subtitle controls are radiogroups', () => {
    const { container } = renderPrefs()
    expect(container.querySelectorAll('[role="radiogroup"]').length).toBeGreaterThanOrEqual(data.MOODS.length)
    expect(container.querySelectorAll('[role="radio"]').length).toBeGreaterThan(0)
  })
  it('one polite status live region (single announce authority)', () => {
    const { container } = renderPrefs()
    expect(container.querySelectorAll('[role="status"][aria-live="polite"][aria-atomic="true"]')).toHaveLength(1)
  })
})

describe('Preferences — truthful scope (approval "does not approve" list)', () => {
  it('omits every unsupported control', () => {
    const { container } = renderPrefs()
    const t = container.textContent
    for (const banned of [
      'Push my taste', 'Stay close', 'ambiguous endings', 'How emotionally heavy', 'What pacing',
      'Rewatch', 'Franchis', 'Black-and-white', 'Silent film', 'Experimental', 'Korean cinema',
      'Usually watching', 'Audio description', 'Closed captions', 'Too slow', 'Good film, wrong moment',
      'Reset learned taste', 'Reduce influence', 'Stop using', 'Streaming region', 'No rentals', 'Prioritize services',
    ]) {
      expect(t).not.toMatch(new RegExp(banned, 'i'))
    }
  })
  it('uses truthful verbs, not overstated ones', () => {
    const { container } = renderPrefs()
    const t = container.textContent
    expect(t).toMatch(/Down-ranked directors/)
    expect(t).toMatch(/not guaranteed to disappear/)
    expect(t).not.toMatch(/recomputes nightly/i)
    expect(t).not.toMatch(/filtered out entirely/i)
    expect(t).not.toMatch(/quiet boost/i)
    expect(t).not.toMatch(/Save and retune/i)
  })
  it('streaming is a disabled coming-soon panel (no active controls)', () => {
    const { container } = renderPrefs()
    expect(container.textContent).toMatch(/coming later/i)
    expect(container.textContent).toMatch(/Coming soon/i)
  })
  it('languages copy makes no ranking claim', () => {
    const { container } = renderPrefs()
    expect(container.textContent).toMatch(/does not change recommendation ranking/i)
  })
})

describe('Preferences — recommendation-data dialog is read-only', () => {
  it('opens a labelled modal with no per-signal actions / reset', () => {
    mockCtx = ctx({ draft: { ...JSON.parse(JSON.stringify(DEFAULT_DRAFT)), drawnGenreIds: [18] } })
    renderPrefs()
    fireEvent.click(screen.getByRole('button', { name: 'Review' }))
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByText('What shapes your recommendations')).toBeInTheDocument()
    expect(within(dialog).getByText('You told us')).toBeInTheDocument()
    expect(within(dialog).getByText(/cannot yet be disabled individually/i)).toBeInTheDocument()
    for (const banned of ['Correct', 'Reduce influence', 'Stop using', 'Remove signal', 'Reset']) {
      expect(within(dialog).queryByRole('button', { name: new RegExp(banned, 'i') })).toBeNull()
    }
    expect(within(dialog).getByRole('button', { name: /close recommendation data/i })).toBeInTheDocument()
  })
})

describe('Preferences — save dock + conflict', () => {
  it('dock appears only when dirty, with Save + Discard', () => {
    mockCtx = ctx({ dirty: false })
    const { rerender, container } = renderPrefs()
    expect(screen.queryByRole('region', { name: /unsaved preference changes/i })).toBeNull()
    mockCtx = ctx({ dirty: true })
    rerender(<RouterProvider router={createMemoryRouter([{ path: '/', element: <Preferences /> }])} />)
    const dock = screen.getByRole('region', { name: /unsaved preference changes/i })
    expect(within(dock).getByRole('button', { name: 'Save' })).toBeInTheDocument()
    expect(within(dock).getByRole('button', { name: 'Discard' })).toBeInTheDocument()
    void container
  })
  it('save error shows persistently in the dock (not just a toast)', () => {
    mockCtx = ctx({ dirty: true, saveStatus: 'save_error', saveError: 'Could not save your preferences. Try again.' })
    renderPrefs()
    expect(screen.getByText('Could not save your preferences. Try again.')).toBeInTheDocument()
  })
  it('conflict shows the reload/keep-editing banner', () => {
    mockCtx = ctx({ conflict: true })
    renderPrefs()
    expect(screen.getByText(/changed in another tab or session/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reload latest' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Keep editing' })).toBeInTheDocument()
  })
})
