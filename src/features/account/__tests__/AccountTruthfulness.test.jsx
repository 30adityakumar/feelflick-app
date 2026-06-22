import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

// Truthfulness + reliability of the rendered panes: honest plan, supported-only notifications,
// real provider, current-session-only security, read-only email, unavailable avatar, and name
// validation. Data + supabase are mocked.

const h = vi.hoisted(() => ({ onClose: () => {}, refresh: () => {}, updateErr: false }))

const ctx = {
  loading: false, error: null,
  authUser: { id: 'SELF', email: 'mira.sen@example.test', app_metadata: { provider: 'google' }, user_metadata: { name: 'Mira Sen' }, created_at: '2025-04-01T00:00:00Z' },
  profile: { id: 'SELF', name: 'Mira Sen', email: 'mira.sen@example.test', avatar_url: null, joined_at: '2025-04-01T00:00:00Z' },
  provider: 'google',
  serverSettings: { notifications: [{ id: 'daily', label: 'Daily Briefing', desc: 'A daily email with tonight’s picks.', enabled: true, badge: 'Recommended' }], privacy: { showOnLeaderboards: false, analytics: true }, prefs: {} },
  pendingDeletion: null, saveStatus: {},
  refresh: () => h.refresh(), updateNotifications: vi.fn(), updatePrivacy: vi.fn(), retrySection: vi.fn(), requestDeletion: vi.fn(), cancelDeletion: vi.fn(),
}
vi.mock('../useAccountData', () => ({ AccountDataProvider: ({ children }) => children, useAccountData: () => ctx }))
vi.mock('@/shared/lib/supabase/client', () => ({
  supabase: {
    from: () => ({ update: () => ({ eq: async () => ({ error: h.updateErr ? { message: 'x' } : null }) }) }),
    auth: { updateUser: async () => ({ error: null }), signOut: async () => ({ error: null }) },
  },
}))

const { default: AccountSummary } = await import('../components/AccountSummary')
const { default: NotificationsPane } = await import('../panes/NotificationsPane')
const { default: ConnectionsPane } = await import('../panes/ConnectionsPane')
const { default: SecurityPane } = await import('../panes/SecurityPane')
const { default: PersonalInformationPane } = await import('../panes/PersonalInformationPane')
const { default: EditNameDialog } = await import('../dialogs/EditNameDialog')

const wrap = (ui) => render(<MemoryRouter>{ui}</MemoryRouter>)
beforeEach(() => { h.updateErr = false; h.refresh = vi.fn() })

describe('Plan is honest', () => {
  it('shows "Free plan" and never "Founding Member" / "locked in"', () => {
    wrap(<AccountSummary />)
    expect(screen.getByText('Free plan')).toBeInTheDocument()
    expect(screen.queryByText(/Founding Member/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/locked in/i)).not.toBeInTheDocument()
  })
  it('does not surface Films / Hours / DNA% stats', () => {
    wrap(<AccountSummary />)
    expect(screen.queryByText(/films logged/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/hours watched/i)).not.toBeInTheDocument()
  })
})

describe('Notifications are supported-only + generically worded', () => {
  it('renders Daily Briefing without unverified "6 PM" / "three picks" claims', () => {
    wrap(<NotificationsPane />)
    expect(screen.getByText('Daily Briefing')).toBeInTheDocument()
    expect(screen.getByText(/a daily email with tonight’s picks/i)).toBeInTheDocument()
    expect(screen.queryByText(/6 ?PM/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/three picks/i)).not.toBeInTheDocument()
  })
})

describe('Connections are truthful', () => {
  it('shows the real Google provider as Connected and one non-actionable imports row', () => {
    wrap(<ConnectionsPane />)
    expect(screen.getByText('Google')).toBeInTheDocument()
    expect(screen.getByText('Connected')).toBeInTheDocument()
    expect(screen.getByText(/not available yet/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /connect/i })).not.toBeInTheDocument()
  })
})

describe('Security is current-session only', () => {
  it('shows this device, no "Active now", and a global sign-out that includes this device', () => {
    wrap(<SecurityPane />)
    expect(screen.getByText('This device')).toBeInTheDocument()
    expect(screen.queryByText(/active now/i)).not.toBeInTheDocument()
    expect(screen.getByText(/including this device/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign out everywhere/i })).toBeInTheDocument()
  })
})

describe('Personal information', () => {
  it('email is presented as provider-managed / read-only and photo change is unavailable', () => {
    wrap(<PersonalInformationPane />)
    expect(screen.getByText('mira.sen@example.test')).toBeInTheDocument()
    expect(screen.getByText(/can’t be changed here/i)).toBeInTheDocument()
    expect(screen.getByText(/temporarily unavailable/i)).toBeInTheDocument()
    expect(screen.queryByText(/change photo/i)).not.toBeInTheDocument()
  })
})

describe('Edit name validation', () => {
  it('rejects an empty name and does not close', () => {
    const onClose = vi.fn()
    wrap(<EditNameDialog onClose={onClose} />)
    const input = screen.getByLabelText(/display name/i)
    fireEvent.change(input, { target: { value: '   ' } })
    fireEvent.click(screen.getByRole('button', { name: /save name/i }))
    expect(screen.getByRole('alert')).toHaveTextContent(/enter a name/i)
    expect(onClose).not.toHaveBeenCalled()
  })
  it('rejects a name over 80 code points', () => {
    const onClose = vi.fn()
    wrap(<EditNameDialog onClose={onClose} />)
    fireEvent.change(screen.getByLabelText(/display name/i), { target: { value: 'x'.repeat(81) } })
    fireEvent.click(screen.getByRole('button', { name: /save name/i }))
    expect(screen.getByRole('alert')).toHaveTextContent(/80 characters/i)
    expect(onClose).not.toHaveBeenCalled()
  })
  it('saves a valid name (refreshes context, closes) and keeps focus management', async () => {
    const onClose = vi.fn()
    wrap(<EditNameDialog onClose={onClose} />)
    fireEvent.change(screen.getByLabelText(/display name/i), { target: { value: 'Mira S.' } })
    fireEvent.click(screen.getByRole('button', { name: /save name/i }))
    await waitFor(() => expect(onClose).toHaveBeenCalled())
    expect(h.refresh).toHaveBeenCalled()
  })
  it('keeps the dialog open + shows a persistent error when the write fails', async () => {
    h.updateErr = true
    const onClose = vi.fn()
    wrap(<EditNameDialog onClose={onClose} />)
    fireEvent.change(screen.getByLabelText(/display name/i), { target: { value: 'Mira S.' } })
    fireEvent.click(screen.getByRole('button', { name: /save name/i }))
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/couldn’t save/i))
    expect(onClose).not.toHaveBeenCalled()
  })
})
