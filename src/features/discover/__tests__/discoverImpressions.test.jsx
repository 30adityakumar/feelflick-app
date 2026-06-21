import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'

vi.mock('@/shared/services/recommendations', () => ({ logSurfaceImpressions: vi.fn(() => Promise.resolve()) }))
vi.mock('@/shared/services/interactions', () => ({ trackInteraction: vi.fn(() => Promise.resolve()) }))
vi.mock('@/shared/services/betaEvents', () => ({ trackEvent: vi.fn(), EVENTS: { recommendation_shown: 'recommendation_shown' } }))

import { logSurfaceImpressions } from '@/shared/services/recommendations'
import { trackInteraction } from '@/shared/services/interactions'
import { useDiscoverImpressions } from '../hooks/useDiscoverImpressions'

const film = (id, placement, direction) => ({ id, _placement: placement, _direction: direction, match: 80, title: `F${id}` })
const ctx = { selected: ['slow'], intention: 'move', energy: 'steady', who: 'alone', isFallback: false, cName: 'The Long Take' }
const setup = (context = ctx) => renderHook(() => useDiscoverImpressions({ userId: 'u1', sessionKey: 'k1', context }))

beforeEach(() => vi.clearAllMocks())

describe('useDiscoverImpressions — genuine exposure', () => {
  it('logs a (film, placement) exactly once; a repeat (focus switch) logs nothing new', () => {
    const { result } = setup()
    result.current.logExposure(film(1, 'discover_lead', 'closest'))
    result.current.logExposure(film(1, 'discover_lead', 'closest'))
    expect(logSurfaceImpressions).toHaveBeenCalledTimes(1)
    expect(trackInteraction).toHaveBeenCalledTimes(1)
    expect(logSurfaceImpressions.mock.calls[0][0].placement).toBe('discover_lead')
    expect(trackInteraction.mock.calls[0][1].metadata).toMatchObject({ direction: 'closest', placement: 'discover_lead', action: 'expose' })
  })

  it('a promotion (same film, NEW placement) is a fresh exposure', () => {
    const { result } = setup()
    result.current.logExposure(film(1, 'discover_lead', 'closest'))
    result.current.logExposure(film(1, 'discover_promoted_lead', 'closest'))
    expect(logSurfaceImpressions).toHaveBeenCalledTimes(2)
    expect(logSurfaceImpressions.mock.calls[1][0].placement).toBe('discover_promoted_lead')
  })

  it('logs nothing in fallback (example) mode', () => {
    const { result } = setup({ ...ctx, isFallback: true })
    result.current.logExposure(film(1, 'discover_lead', 'closest'))
    expect(logSurfaceImpressions).not.toHaveBeenCalled()
    expect(trackInteraction).not.toHaveBeenCalled()
  })
})

describe('useDiscoverImpressions — viewport (IntersectionObserver) gating', () => {
  let cbs
  beforeEach(() => {
    cbs = []
    globalThis.IntersectionObserver = class {
      constructor(cb) { this.cb = cb; cbs.push(cb) }
      observe() {}
      disconnect() {}
    }
  })
  afterEach(() => { delete globalThis.IntersectionObserver })

  it('an offscreen card does NOT log until it becomes meaningfully visible', () => {
    const { result } = setup()
    const refCb = result.current.observe(film(2, 'discover_bolder', 'bolder'))
    refCb(document.createElement('div')) // mounted but not yet intersecting
    expect(logSurfaceImpressions).not.toHaveBeenCalled()
    cbs[0]([{ isIntersecting: true, intersectionRatio: 0.6 }]) // scrolled into view
    expect(logSurfaceImpressions).toHaveBeenCalledTimes(1)
    expect(logSurfaceImpressions.mock.calls[0][0].placement).toBe('discover_bolder')
  })

  it('a barely-visible card (below threshold) does not log', () => {
    const { result } = setup()
    const refCb = result.current.observe(film(3, 'discover_gentler', 'gentler'))
    refCb(document.createElement('div'))
    cbs[0]([{ isIntersecting: true, intersectionRatio: 0.2 }])
    expect(logSurfaceImpressions).not.toHaveBeenCalled()
  })
})
