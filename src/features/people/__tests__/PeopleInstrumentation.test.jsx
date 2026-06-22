import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

// Spy trackEvent but keep EVENTS/errorKind real, so we assert the exact event + that NO target
// id/name ever appears in a People analytics payload.
const trackEventMock = vi.hoisted(() => vi.fn())
vi.mock('@/shared/services/betaEvents', async (orig) => ({ ...(await orig()), trackEvent: trackEventMock }))

const supa = vi.hoisted(() => ({ insertError: null, deleteError: null, rpc: vi.fn(async () => ({ data: [], error: null })) }))
vi.mock('@/shared/lib/supabase/client', () => ({
  supabase: {
    rpc: supa.rpc,
    from: () => ({
      insert: async () => ({ error: supa.insertError }),
      delete: () => ({ eq: () => ({ eq: async () => ({ error: supa.deleteError }) }) }),
    }),
  },
}))

import { usePeopleFollowActions } from '../hooks/usePeopleFollowActions'
import { usePeopleHideActions } from '../hooks/usePeopleHideActions'
import People from '../People'
import { EVENTS } from '@/shared/services/betaEvents'

const setupFollow = (followingIds = new Set()) =>
  renderHook(() => usePeopleFollowActions({ userId: 'me', followingIds, applyFollowState: () => {}, announce: () => {} }))

describe('People instrumentation — safe events, never a target id/name', () => {
  beforeEach(() => { trackEventMock.mockClear(); supa.insertError = null; supa.deleteError = null })

  const noTargetLeak = () => {
    for (const [, payload] of trackEventMock.mock.calls) {
      const s = JSON.stringify(payload || {})
      expect(s).not.toContain('target-123')
      expect(s).not.toContain('Ana')
    }
  }

  it('follow success → people_follow_succeeded (surface only)', async () => {
    const { result } = setupFollow()
    await act(async () => { await result.current.follow('target-123', 'Ana Okafor') })
    expect(trackEventMock).toHaveBeenCalledWith(EVENTS.people_follow_succeeded, { surface: 'people' })
    noTargetLeak()
  })

  it('follow failure → people_follow_failed with an error_kind bucket', async () => {
    supa.insertError = { code: '42501', message: 'permission denied' }
    const { result } = setupFollow()
    await act(async () => { await result.current.follow('target-123', 'Ana Okafor') })
    const call = trackEventMock.mock.calls.find((c) => c[0] === EVENTS.people_follow_failed)
    expect(call).toBeTruthy()
    expect(call[1]).toEqual({ surface: 'people', error_kind: 'permission_denied' })
    noTargetLeak()
  })

  it('unfollow success → people_unfollow_succeeded', async () => {
    const { result } = setupFollow(new Set(['target-123']))
    await act(async () => { await result.current.unfollow('target-123', 'Ana Okafor') })
    expect(trackEventMock).toHaveBeenCalledWith(EVENTS.people_unfollow_succeeded, { surface: 'people' })
    noTargetLeak()
  })

  it('hide suggestion → people_hide_suggestion (no id/name)', () => {
    const { result } = renderHook(() => usePeopleHideActions({ announce: () => {} }))
    act(() => { result.current.hide('target-123', 'Ana Okafor') })
    expect(trackEventMock).toHaveBeenCalledWith(EVENTS.people_hide_suggestion, { surface: 'people' })
    for (const [, payload] of trackEventMock.mock.calls) {
      const s = JSON.stringify(payload || {})
      expect(s).not.toContain('target-123'); expect(s).not.toContain('Ana')
    }
  })
})

describe('People kill-switch — disabled flow shows fallback, loads no data', () => {
  afterEach(() => vi.unstubAllEnvs())

  it('VITE_ENABLE_PEOPLE=false → fallback copy, no nested <main>, and no People RPC is called', () => {
    vi.stubEnv('VITE_ENABLE_PEOPLE', 'false')
    supa.rpc.mockClear()
    const { container } = render(<MemoryRouter><People /></MemoryRouter>)
    expect(screen.getByText(/People is taking a short break/i)).toBeInTheDocument()
    expect(container.querySelector('main')).toBeNull() // AppShell owns <main>; disabled state must not nest one
    expect(supa.rpc).not.toHaveBeenCalled()
  })
})
