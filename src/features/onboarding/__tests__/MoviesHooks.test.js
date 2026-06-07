// src/features/onboarding/__tests__/MoviesHooks.test.js
// F2.13 — the new error/retry state in the MoviesStep hooks (logic-level), with
// the underlying fetchers mocked. No engine/query/ranking change is exercised.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'

vi.mock('../suggestionPool', () => ({ fetchSuggestionPool: vi.fn() }))
vi.mock('@/shared/api/tmdb', () => ({ searchMovies: vi.fn() }))

import { fetchSuggestionPool } from '../suggestionPool'
import { searchMovies } from '@/shared/api/tmdb'
import { useSuggestionPool } from '../hooks/useSuggestionPool'
import { useMovieSearch } from '../hooks/useMovieSearch'

describe('useSuggestionPool — error + retry (mount-once preserved)', () => {
  beforeEach(() => vi.clearAllMocks())

  it('flips poolError when the fetch rejects, non-throwing', async () => {
    fetchSuggestionPool.mockRejectedValueOnce(new Error('boom'))
    const { result } = renderHook(() => useSuggestionPool([28], ['cozy']))
    await waitFor(() => expect(result.current.poolError).toBe(true))
    expect(result.current.poolLoading).toBe(false)
    expect(result.current.pool).toEqual([])
  })

  it('resolves with the pool and no error on success', async () => {
    fetchSuggestionPool.mockResolvedValueOnce([{ id: 1 }])
    const { result } = renderHook(() => useSuggestionPool([28], ['cozy']))
    await waitFor(() => expect(result.current.poolLoading).toBe(false))
    expect(result.current.poolError).toBe(false)
    expect(result.current.pool).toEqual([{ id: 1 }])
  })

  it('retry re-fetches the SAME mount-captured picks and clears the error', async () => {
    fetchSuggestionPool.mockRejectedValueOnce(new Error('boom'))
    const { result } = renderHook(() => useSuggestionPool([28], ['cozy']))
    await waitFor(() => expect(result.current.poolError).toBe(true))

    fetchSuggestionPool.mockResolvedValueOnce([{ id: 7 }])
    act(() => { result.current.retry() })
    await waitFor(() => expect(result.current.poolError).toBe(false))
    expect(result.current.pool).toEqual([{ id: 7 }])
    expect(fetchSuggestionPool).toHaveBeenLastCalledWith([28], ['cozy'])
  })

  it('fetches once on mount and does NOT re-fetch when args change', async () => {
    fetchSuggestionPool.mockResolvedValue([])
    const { rerender } = renderHook(({ g, m }) => useSuggestionPool(g, m), {
      initialProps: { g: [28], m: ['cozy'] },
    })
    await waitFor(() => expect(fetchSuggestionPool).toHaveBeenCalledTimes(1))
    rerender({ g: [35], m: ['wired'] })
    expect(fetchSuggestionPool).toHaveBeenCalledTimes(1)
  })
})

describe('useMovieSearch — search error (debounce/ranking untouched)', () => {
  beforeEach(() => { vi.clearAllMocks(); vi.useFakeTimers() })
  afterEach(() => vi.useRealTimers())

  it('flips searchError when the search rejects (not a benign empty)', async () => {
    searchMovies.mockRejectedValueOnce(new Error('tmdb down'))
    const { result } = renderHook(() => useMovieSearch())
    act(() => { result.current.setQuery('inception') })
    await act(async () => { await vi.advanceTimersByTimeAsync(350) })
    expect(result.current.searchError).toBe(true)
    expect(result.current.results).toEqual([])
  })

  it('clears searchError at the start of the next search and can recover', async () => {
    searchMovies
      .mockRejectedValueOnce(new Error('down'))
      .mockResolvedValueOnce({ results: [{ id: 1, poster_path: '/a.jpg', popularity: 5 }] })
    const { result } = renderHook(() => useMovieSearch())
    act(() => { result.current.setQuery('a') })
    await act(async () => { await vi.advanceTimersByTimeAsync(350) })
    expect(result.current.searchError).toBe(true)

    act(() => { result.current.setQuery('ab') }) // new search start clears the error
    expect(result.current.searchError).toBe(false)
    await act(async () => { await vi.advanceTimersByTimeAsync(350) })
    expect(result.current.searchError).toBe(false)
    expect(result.current.results.length).toBe(1)
  })
})
