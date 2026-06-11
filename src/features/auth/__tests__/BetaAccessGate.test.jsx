import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'

// Mock Supabase: getUser + a spy-able from('beta_members').select().eq().maybeSingle().
const state = vi.hoisted(() => ({ user: { id: 'me' }, row: null, error: null }))
const fromSpy = vi.hoisted(() => vi.fn())
vi.mock('@/shared/lib/supabase/client', () => ({
  supabase: {
    auth: { getUser: async () => ({ data: { user: state.user } }) },
    from: fromSpy,
  },
}))
// BrandSplash pulls app chrome; stub it to a marker so the loading branch is observable.
vi.mock('@/shared/ui/BrandSplash', () => ({ default: () => <div>brand-splash</div> }))

import { useBetaAccess } from '../useBetaAccess'
import BetaAccessGate from '../BetaAccessGate'

beforeEach(() => {
  state.user = { id: 'me' }; state.row = null; state.error = null
  fromSpy.mockReset()
  fromSpy.mockReturnValue({
    select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: state.row, error: state.error }) }) }),
  })
})
afterEach(() => vi.unstubAllEnvs())

describe('useBetaAccess — gate OFF by default (no behavior change)', () => {
  it('returns allowed immediately and never queries beta_members', () => {
    const { result } = renderHook(() => useBetaAccess())
    expect(result.current).toBe('allowed')
    expect(fromSpy).not.toHaveBeenCalled()
  })
})

describe('useBetaAccess — gate ON', () => {
  beforeEach(() => vi.stubEnv('VITE_ENABLE_BETA_GATE', 'true'))

  it('active member → allowed (and reads beta_members)', async () => {
    state.row = { status: 'active' }
    const { result } = renderHook(() => useBetaAccess())
    expect(result.current).toBe('loading')
    await waitFor(() => expect(result.current).toBe('allowed'))
    expect(fromSpy).toHaveBeenCalledWith('beta_members')
  })

  it('non-member (no row) → denied', async () => {
    state.row = null
    const { result } = renderHook(() => useBetaAccess())
    await waitFor(() => expect(result.current).toBe('denied'))
  })

  it('revoked member → denied', async () => {
    state.row = { status: 'revoked' }
    const { result } = renderHook(() => useBetaAccess())
    await waitFor(() => expect(result.current).toBe('denied'))
  })

  it('membership query error → safe error state (no throw)', async () => {
    state.error = { message: 'boom' }
    const { result } = renderHook(() => useBetaAccess())
    await waitFor(() => expect(result.current).toBe('error'))
  })

  it('no session → denied (does not reveal anything)', async () => {
    state.user = null
    const { result } = renderHook(() => useBetaAccess())
    await waitFor(() => expect(result.current).toBe('denied'))
  })
})

const renderGate = (entry = '/x') =>
  render(
    <MemoryRouter initialEntries={[entry]}>
      <Routes>
        <Route element={<BetaAccessGate />}>
          <Route path="x" element={<div>protected content</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )

describe('BetaAccessGate — render behavior', () => {
  it('gate OFF → renders the protected child (transparent pass-through)', () => {
    renderGate()
    expect(screen.getByText('protected content')).toBeInTheDocument()
  })

  it('gate ON + non-member → shows "Private beta access required", hides the child', async () => {
    vi.stubEnv('VITE_ENABLE_BETA_GATE', 'true')
    state.row = null
    renderGate()
    await waitFor(() => expect(screen.getByText(/Private beta access required/i)).toBeInTheDocument())
    expect(screen.queryByText('protected content')).not.toBeInTheDocument()
  })

  it('gate ON + active member → renders the protected child', async () => {
    vi.stubEnv('VITE_ENABLE_BETA_GATE', 'true')
    state.row = { status: 'active' }
    renderGate()
    await waitFor(() => expect(screen.getByText('protected content')).toBeInTheDocument())
  })
})
