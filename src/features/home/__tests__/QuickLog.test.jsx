// src/features/home/__tests__/QuickLog.test.jsx
// F4.6 — QuickLog write reliability + a11y. Everything mocked; the supabase insert
// is a test-controlled deferred so busy/pressed/announce/removal timing can be
// asserted deterministically. No live Supabase/TMDB/impression writes.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'

const h = vi.hoisted(() => ({
  user: { id: 'u1' }, seen: [], insertResult: { error: null }, insertDeferred: null,
  lastTable: null, lastInsert: null, impressionReject: false,
}))

vi.mock('@/shared/hooks/useAuthSession', () => ({ useAuthSession: () => ({ user: h.user }) }))
vi.mock('../useHomeData', () => ({ useHomeData: () => ({ seenCandidates: h.seen }) }))
vi.mock('@/shared/api/tmdb', async (orig) => ({ ...(await orig()), tmdbImg: (p) => `https://image.tmdb.org/img${p}` }))
vi.mock('@/shared/services/recommendations', () => ({
  logSurfaceImpressions: vi.fn(() => (h.impressionReject ? Promise.reject(new Error('imp fail')) : Promise.resolve())),
}))
vi.mock('@/shared/lib/supabase/client', () => ({
  supabase: { from: (table) => ({ insert: (row) => {
    h.lastTable = table; h.lastInsert = row
    let resolve; const promise = new Promise(r => { resolve = r })
    h.insertDeferred = { promise, resolve: () => resolve(h.insertResult) }
    return promise
  } }) },
}))

import { QuickLog } from '../sections-bottom'
import { logSurfaceImpressions } from '@/shared/services/recommendations'

const film = (id, over = {}) => ({ id, title: `Movie ${id}`, poster_path: `/p${id}.jpg`, release_year: 2010 + id, primary_genre: 'Drama', ...over })
const live = () => document.querySelector('[role="status"][aria-live="polite"]')
const tileBtn = (title) => screen.getByRole('button', { name: `Mark ${title} as watched` })

beforeEach(() => {
  h.user = { id: 'u1' }; h.seen = [film(1), film(2)]; h.insertResult = { error: null }; h.insertDeferred = null
  h.lastTable = null; h.lastInsert = null; h.impressionReject = false
  vi.clearAllMocks()
})
afterEach(() => { vi.useRealTimers() })

describe('QuickLog — impression', () => {
  it('logs the candidate impression once with the unchanged payload', async () => {
    render(<QuickLog onLog={vi.fn()} />)
    await waitFor(() => expect(logSurfaceImpressions).toHaveBeenCalledTimes(1))
    expect(logSurfaceImpressions.mock.calls[0][0]).toEqual({
      userId: 'u1', films: h.seen, placement: 'quick_picks',
      pickReasonType: 'seen_candidates', pickReasonLabel: 'Engine guess: probably seen',
    })
  })

  it('contains a rejected candidate impression (no crash, still interactive)', async () => {
    h.impressionReject = true
    render(<QuickLog onLog={vi.fn()} />)
    await waitFor(() => expect(logSurfaceImpressions).toHaveBeenCalled())
    expect(tileBtn('Movie 1')).toBeTruthy() // still rendered + usable
  })
})

describe('QuickLog — SeenTile semantics + write', () => {
  it('gives each tile an accessible watched-action name + poster alt', () => {
    render(<QuickLog onLog={vi.fn()} />)
    expect(tileBtn('Movie 1')).toBeTruthy()
    expect(screen.getByAltText('Movie 1 poster')).toBeTruthy()
  })

  it('exposes a busy state while the write is in flight', async () => {
    render(<QuickLog onLog={vi.fn()} />)
    fireEvent.click(tileBtn('Movie 1'))
    await waitFor(() => expect(tileBtn('Movie 1').getAttribute('aria-busy')).toBe('true'))
    expect(tileBtn('Movie 1')).toBeDisabled()
  })

  it('writes the byte-equivalent user_history payload', async () => {
    render(<QuickLog onLog={vi.fn()} />)
    fireEvent.click(tileBtn('Movie 1'))
    await waitFor(() => expect(h.lastInsert).toBeTruthy())
    expect(h.lastTable).toBe('user_history')
    expect(h.lastInsert).toMatchObject({
      user_id: 'u1', movie_id: 1, source: 'home_quicklog',
      watch_duration_minutes: null, mood_session_id: null,
    })
    expect(typeof h.lastInsert.watched_at).toBe('string')
    expect(Object.keys(h.lastInsert).sort()).toEqual(
      ['mood_session_id', 'movie_id', 'source', 'user_id', 'watch_duration_minutes', 'watched_at'])
  })

  it('announces success, exposes pressed, then removes the tile after 650ms', async () => {
    vi.useFakeTimers()
    render(<QuickLog onLog={vi.fn()} />)
    fireEvent.click(tileBtn('Movie 1'))
    await act(async () => { h.insertDeferred.resolve(); await Promise.resolve(); await Promise.resolve() })
    expect(live().textContent).toBe('Logged Movie 1 as watched.')
    expect(tileBtn('Movie 1').getAttribute('aria-pressed')).toBe('true') // pressed before removal
    await act(async () => { vi.advanceTimersByTime(700); await Promise.resolve() })
    expect(screen.queryByRole('button', { name: 'Mark Movie 1 as watched' })).toBeNull() // removed
  })

  it('announces a retry on failure and keeps the tile', async () => {
    h.insertResult = { error: { message: 'db down' } }
    render(<QuickLog onLog={vi.fn()} />)
    fireEvent.click(tileBtn('Movie 1'))
    await act(async () => { h.insertDeferred.resolve(); await Promise.resolve(); await Promise.resolve() })
    expect(live().textContent).toBe('Could not log Movie 1. Try again.')
    expect(screen.getByRole('button', { name: 'Mark Movie 1 as watched' })).toBeTruthy() // not removed
  })

  it('cleans up the removal timer on unmount (no post-unmount state update)', async () => {
    vi.useFakeTimers()
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { unmount } = render(<QuickLog onLog={vi.fn()} />)
    fireEvent.click(tileBtn('Movie 1'))
    await act(async () => { h.insertDeferred.resolve(); await Promise.resolve(); await Promise.resolve() })
    unmount()
    await act(async () => { vi.advanceTimersByTime(1000); await Promise.resolve() })
    expect(errSpy.mock.calls.flat().join(' ')).not.toMatch(/unmounted|memory leak/i)
    errSpy.mockRestore()
  })
})

describe('QuickLog — Open Browse', () => {
  it('retains the callback and the 44px / focus contract', () => {
    const onLog = vi.fn()
    render(<QuickLog onLog={onLog} />)
    const btn = screen.getByRole('button', { name: /Open Browse/i })
    expect(btn.className).toMatch(/min-h-\[44px\]/)
    expect(btn.className).toMatch(/focus-visible:ring/)
    fireEvent.click(btn)
    expect(onLog).toHaveBeenCalledTimes(1)
  })
})
