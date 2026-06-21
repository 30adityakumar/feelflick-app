import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'

const insert = vi.fn(() => Promise.resolve({ error: null }))
vi.mock('@/shared/lib/supabase/client', () => ({ supabase: { from: vi.fn(() => ({ insert })) } }))
vi.mock('@/shared/services/recommendations', () => ({ updateImpression: vi.fn(() => Promise.resolve()) }))
vi.mock('@/shared/services/interactions', () => ({ trackInteraction: vi.fn(() => Promise.resolve()) }))
vi.mock('@/shared/services/betaEvents', () => ({ trackEvent: vi.fn(), EVENTS: { recommendation_opened: 'recommendation_opened', recommendation_saved: 'recommendation_saved', recommendation_error: 'recommendation_error' }, errorKind: () => 'unknown' }))

import { updateImpression } from '@/shared/services/recommendations'
import { trackInteraction } from '@/shared/services/interactions'
import { useDiscoverResultActions } from '../hooks/useDiscoverResultActions'

const navigate = vi.fn()
const gentler = { id: 42, tmdbId: 9042, title: 'G', _direction: 'gentler', _placement: 'discover_gentler' }
const promoted = { id: 7, tmdbId: 9007, title: 'P', _direction: 'closest', _placement: 'discover_promoted_lead' }

function actionsFor(focused, { isFallback = false, onRemove = vi.fn() } = {}) {
  const r = renderHook(() => useDiscoverResultActions({
    focused, user: { id: 'u1' }, selected: ['slow'], intention: 'move', energy: 'steady', who: 'alone', onRemove, navigate, isFallback,
  }))
  return { ...r, onRemove }
}

beforeEach(() => vi.clearAllMocks())

describe('attribution carries the focused film’s placement + direction', () => {
  it('Save constrains the impression to the focused placement and records the direction', async () => {
    const { result } = actionsFor(gentler)
    await act(async () => { await result.current.handleSaveForLater() })
    expect(updateImpression).toHaveBeenCalledWith('u1', 42, 'saved', { placement: 'discover_gentler' })
    expect(trackInteraction).toHaveBeenCalledWith('save', expect.objectContaining({ movieId: 42, metadata: expect.objectContaining({ direction: 'gentler', placement: 'discover_gentler' }) }))
  })

  it('Not tonight records the skip against the focused placement, then removes it', () => {
    const onRemove = vi.fn()
    const { result } = actionsFor(gentler, { onRemove })
    act(() => result.current.handleSkip())
    expect(updateImpression).toHaveBeenCalledWith('u1', 42, 'skipped', { placement: 'discover_gentler' })
    expect(trackInteraction).toHaveBeenCalledWith('dismiss', expect.objectContaining({ metadata: expect.objectContaining({ direction: 'gentler', placement: 'discover_gentler' }) }))
    expect(onRemove).toHaveBeenCalledWith(42)
  })

  it('a PROMOTED lead attributes to discover_promoted_lead (not the original lead)', async () => {
    const { result } = actionsFor(promoted)
    await act(async () => { await result.current.handleSaveForLater() })
    expect(updateImpression).toHaveBeenCalledWith('u1', 7, 'saved', { placement: 'discover_promoted_lead' })
  })

  it('Open Film File clicks the focused placement then navigates', () => {
    const { result } = actionsFor(gentler)
    act(() => result.current.handleSeeMore())
    expect(updateImpression).toHaveBeenCalledWith('u1', 42, 'clicked', { placement: 'discover_gentler' })
    expect(navigate).toHaveBeenCalledWith('/movie/9042')
  })

  it('fallback mode performs NO recommendation/DB writes (only navigation works)', async () => {
    const onRemove = vi.fn()
    const { result } = actionsFor(gentler, { isFallback: true, onRemove })
    await act(async () => { await result.current.handleSaveForLater() })
    act(() => result.current.handleSeeMore())
    expect(insert).not.toHaveBeenCalled()
    expect(updateImpression).not.toHaveBeenCalled()
    expect(trackInteraction).not.toHaveBeenCalled()
    expect(navigate).toHaveBeenCalledWith('/movie/9042') // navigation still works
  })
})
