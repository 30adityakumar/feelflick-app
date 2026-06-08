// src/features/discover/__tests__/useDiscoverData.test.jsx
// F3.10 — the honest data-source classifier + a light DiscoverDataProvider
// integration (no user, universal Supabase mock) confirming the fallback reason
// is wired from the live fetch outcome. Mocks only — no live Supabase, no writes,
// no ranking/scoring assertions changed.

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'

const h = vi.hoisted(() => ({ user: null, queryError: false }))

// Universal chainable Supabase mock: any builder method returns the chain; awaiting
// it resolves to { data: [] } (or rejects when h.queryError is set).
function makeChain() {
  return new Proxy({}, {
    get(_t, prop) {
      if (prop === 'then') return (onF, onR) => (h.queryError ? Promise.reject(new Error('boom')) : Promise.resolve({ data: [], error: null })).then(onF, onR)
      if (prop === 'catch') return (onR) => (h.queryError ? Promise.reject(new Error('boom')) : Promise.resolve({ data: [], error: null })).catch(onR)
      if (prop === 'finally') return (cb) => Promise.resolve().finally(cb)
      return () => makeChain()
    },
  })
}

vi.mock('@/shared/hooks/useAuthSession', () => ({ useAuthSession: () => ({ user: h.user }) }))
vi.mock('@/shared/lib/supabase/client', () => ({ supabase: { from: () => makeChain() } }))
vi.mock('@/shared/services/recommendations', () => ({ computeUserProfile: vi.fn(() => Promise.resolve(null)), RECOMMENDATION_CONSTANTS: { GENRE_NAME_TO_ID: {} } }))
vi.mock('@/shared/services/exclusions', () => ({ filterExclusionsClientSide: (rows) => rows }))

import { classifyDiscoverDataSource, DiscoverDataProvider, useDiscoverData } from '../useDiscoverData'

beforeEach(() => { h.user = null; h.queryError = false; vi.clearAllMocks() })

// ── pure classifier ───────────────────────────────────────────────────────────
describe('classifyDiscoverDataSource', () => {
  it('live success with films → live / live_ok', () => {
    expect(classifyDiscoverDataSource({ filmCount: 5, candidateCount: 12 })).toEqual({ movies: 'live', reason: 'live_ok' })
  })
  it('live query empty (no candidates) → fallback / live_empty', () => {
    expect(classifyDiscoverDataSource({ filmCount: 0, candidateCount: 0 })).toEqual({ movies: 'fallback', reason: 'live_empty' })
  })
  it('candidates filtered out → fallback / filtered_empty', () => {
    expect(classifyDiscoverDataSource({ filmCount: 0, candidateCount: 8 })).toEqual({ movies: 'fallback', reason: 'filtered_empty' })
  })
  it('fetch error → fallback / live_error with a safe message (error wins over counts)', () => {
    const ds = classifyDiscoverDataSource({ errored: true, filmCount: 5, candidateCount: 9 })
    expect(ds.movies).toBe('fallback')
    expect(ds.reason).toBe('live_error')
    expect(ds.errorMessage).toBe('Live recommendations could not be reached.')
  })
  it('the error message exposes no raw details (no supabase/query/stack/secrets)', () => {
    const { errorMessage } = classifyDiscoverDataSource({ errored: true })
    expect(errorMessage).not.toMatch(/supabase|postgres|query|select|column|relation|permission|stack|at \w|Error:|https?:|key|token/i)
  })
  it('defaults to live_empty when called with no args', () => {
    expect(classifyDiscoverDataSource()).toEqual({ movies: 'fallback', reason: 'live_empty' })
  })
})

// ── provider integration (no user, universal mock) ────────────────────────────
function Probe() {
  const { loading, dataSource, films, profile, error } = useDiscoverData()
  return (
    <div data-testid="probe" data-loading={String(loading)} data-reason={dataSource?.reason}
         data-movies={dataSource?.movies} data-films={films.length} data-profile={String(profile)} data-error={String(error)} />
  )
}
const probe = () => screen.getByTestId('probe')

describe('DiscoverDataProvider — data-source wiring', () => {
  it('a live query that returns no candidates → fallback / live_empty (films stay an array)', async () => {
    render(<DiscoverDataProvider><Probe /></DiscoverDataProvider>)
    await waitFor(() => expect(probe()).toHaveAttribute('data-loading', 'false'))
    expect(probe()).toHaveAttribute('data-movies', 'fallback')
    expect(probe()).toHaveAttribute('data-reason', 'live_empty')
    expect(probe()).toHaveAttribute('data-films', '0') // empty array, not undefined
    expect(probe()).toHaveAttribute('data-error', 'null')
  })
  it('a failed live query → fallback / live_error (no raw error reaches dataSource)', async () => {
    h.queryError = true
    render(<DiscoverDataProvider><Probe /></DiscoverDataProvider>)
    await waitFor(() => expect(probe()).toHaveAttribute('data-loading', 'false'))
    expect(probe()).toHaveAttribute('data-movies', 'fallback')
    expect(probe()).toHaveAttribute('data-reason', 'live_error')
    expect(probe()).toHaveAttribute('data-films', '0')
  })
  it('profile fetch behavior is unchanged with no user (profile stays null)', async () => {
    render(<DiscoverDataProvider><Probe /></DiscoverDataProvider>)
    await waitFor(() => expect(probe()).toHaveAttribute('data-loading', 'false'))
    expect(probe()).toHaveAttribute('data-profile', 'null')
  })
})
