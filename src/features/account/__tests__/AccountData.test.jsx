import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

// Data layer: defaults, prefs preservation through read-modify-write, optimistic save + rollback
// on failure, and analytics runtime coordination. Supabase + auth + analytics are mocked.

const h = vi.hoisted(() => ({ settings: null, upsertCalls: [], failNextUpsert: false, optOutCalls: [] }))

const STABLE_USER = { id: 'SELF', email: 'ada@example.test', app_metadata: { provider: 'google' }, user_metadata: { name: 'Ada' }, created_at: '2025-04-01T00:00:00Z' }
vi.mock('@/shared/hooks/useAuthSession', () => ({ useAuthSession: () => ({ user: STABLE_USER }) }))
vi.mock('@/shared/services/analytics', () => ({ setAnalyticsOptOut: (v) => h.optOutCalls.push(v) }))
vi.mock('@/shared/lib/supabase/client', () => {
  const make = (table) => {
    const b = {
      select: () => b, eq: () => b, is: () => b, update: () => b, delete: () => b,
      maybeSingle: async () => {
        if (table === 'users') return { data: { id: 'SELF', name: 'Ada', email: 'ada@example.test', joined_at: '2025-04-01T00:00:00Z', avatar_url: null }, error: null }
        if (table === 'user_settings') return { data: { settings: h.settings }, error: null }
        return { data: null, error: null }
      },
      upsert: async (arg) => {
        h.upsertCalls.push(arg)
        if (h.failNextUpsert) { h.failNextUpsert = false; return { error: { message: 'boom' } } }
        h.settings = arg.settings
        return { error: null }
      },
    }
    return b
  }
  return { supabase: { from: make, rpc: vi.fn(async () => ({ data: { scheduled_for: 'x', requested_at: 'y' }, error: null })), auth: { updateUser: vi.fn(async () => ({ error: null })), signOut: vi.fn(async () => ({ error: null })) } } }
})

const { AccountDataProvider, useAccountData, mergeWithDefaults } = await import('../useAccountData')

function Probe() {
  const { loading, serverSettings, saveStatus, updatePrivacy, updateNotifications } = useAccountData()
  if (loading) return <div>loading</div>
  return (
    <div>
      <span data-testid="discovery">{String(serverSettings.privacy.showOnLeaderboards)}</span>
      <span data-testid="analytics">{String(serverSettings.privacy.analytics)}</span>
      <span data-testid="daily">{String(serverSettings.notifications.find((n) => n.id === 'daily')?.enabled)}</span>
      <span data-testid="status">{saveStatus.privacy || 'idle'}</span>
      <span data-testid="prefs">{JSON.stringify(serverSettings.prefs)}</span>
      <button onClick={() => updatePrivacy({ showOnLeaderboards: true })}>disc</button>
      <button onClick={() => updatePrivacy({ analytics: false })}>ana</button>
      <button onClick={() => updateNotifications(serverSettings.notifications.map((n) => ({ ...n, enabled: false })))}>notif</button>
    </div>
  )
}

const renderProbe = () => render(<AccountDataProvider><Probe /></AccountDataProvider>)

beforeEach(() => { h.settings = { prefs: { foo: 1 } }; h.upsertCalls = []; h.failNextUpsert = false; h.optOutCalls = [] })

describe('mergeWithDefaults', () => {
  it('applies defaults, preserves prefs + unknown top-level keys', () => {
    const merged = mergeWithDefaults({ prefs: { a: 1 }, somethingNew: { b: 2 } })
    expect(merged.privacy.showOnLeaderboards).toBe(false) // explicit opt-in default
    expect(merged.privacy.analytics).toBe(true)
    expect(merged.prefs).toEqual({ a: 1 })
    expect(merged.somethingNew).toEqual({ b: 2 })
    expect(merged.notifications.find((n) => n.id === 'daily')).toBeTruthy()
  })
})

describe('AccountData persistence', () => {
  it('hydrates with defaults when the row has no privacy/notifications', async () => {
    renderProbe()
    await waitFor(() => expect(screen.getByTestId('discovery')).toHaveTextContent('false'))
    expect(screen.getByTestId('analytics')).toHaveTextContent('true')
    expect(screen.getByTestId('prefs')).toHaveTextContent('{"foo":1}')
  })

  it('saving a privacy toggle preserves the prefs branch (read-modify-write)', async () => {
    renderProbe()
    await waitFor(() => expect(screen.getByTestId('discovery')).toHaveTextContent('false'))
    fireEvent.click(screen.getByText('disc'))
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('saved'))
    const last = h.upsertCalls.at(-1)
    expect(last.settings.privacy.showOnLeaderboards).toBe(true)
    expect(last.settings.prefs).toEqual({ foo: 1 }) // /preferences data untouched
  })

  it('rolls back + surfaces error when the write fails', async () => {
    renderProbe()
    await waitFor(() => expect(screen.getByTestId('discovery')).toHaveTextContent('false'))
    h.failNextUpsert = true
    fireEvent.click(screen.getByText('disc'))
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('error'))
    expect(screen.getByTestId('discovery')).toHaveTextContent('false') // reverted, not stuck "on"
  })

  it('analytics opt-out applies immediately and is confirmed on success', async () => {
    renderProbe()
    await waitFor(() => expect(screen.getByTestId('analytics')).toHaveTextContent('true'))
    fireEvent.click(screen.getByText('ana'))
    expect(h.optOutCalls[0]).toBe(true) // stops capture immediately
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('saved'))
    expect(screen.getByTestId('analytics')).toHaveTextContent('false')
  })

  it('analytics: a failed save restores BOTH the UI and the runtime opt-out', async () => {
    renderProbe()
    await waitFor(() => expect(screen.getByTestId('analytics')).toHaveTextContent('true'))
    h.failNextUpsert = true
    fireEvent.click(screen.getByText('ana'))
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('error'))
    expect(screen.getByTestId('analytics')).toHaveTextContent('true') // UI restored
    expect(h.optOutCalls.at(-1)).toBe(false) // runtime opted back in
  })

  it('saving notifications preserves prefs too', async () => {
    renderProbe()
    await waitFor(() => expect(screen.getByTestId('daily')).toHaveTextContent('true'))
    fireEvent.click(screen.getByText('notif'))
    await waitFor(() => expect(screen.getByTestId('daily')).toHaveTextContent('false'))
    expect(h.upsertCalls.at(-1).settings.prefs).toEqual({ foo: 1 })
  })
})
