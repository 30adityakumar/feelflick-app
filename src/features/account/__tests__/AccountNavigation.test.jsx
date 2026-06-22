import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'

// URL ?section= routing (desktop + mobile) + page structure (one h1, no nested main, sidebar
// aria-current, invalid-section fallback). Data layer is mocked to a ready state.

const flags = vi.hoisted(() => ({ mobile: false }))

const ctx = {
  loading: false, error: null,
  authUser: { id: 'SELF', email: 'mira.sen@example.test', app_metadata: { provider: 'google' }, user_metadata: { name: 'Mira Sen' }, created_at: '2025-04-01T00:00:00Z' },
  profile: { id: 'SELF', name: 'Mira Sen', email: 'mira.sen@example.test', avatar_url: null, joined_at: '2025-04-01T00:00:00Z' },
  provider: 'google',
  serverSettings: { notifications: [{ id: 'daily', label: 'Daily Briefing', desc: 'A daily email with tonight’s picks.', enabled: true, badge: 'Recommended' }], privacy: { showOnLeaderboards: false, analytics: true }, prefs: {} },
  pendingDeletion: null, saveStatus: {},
  refresh: vi.fn(), updateNotifications: vi.fn(), updatePrivacy: vi.fn(), retrySection: vi.fn(), requestDeletion: vi.fn(), cancelDeletion: vi.fn(),
}

vi.mock('../useAccountData', () => ({
  AccountDataProvider: ({ children }) => children,
  useAccountData: () => ctx,
}))

const { default: Account } = await import('../Account')

function mountAt(url) {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route path="/account" element={<Account />} />
        <Route path="/preferences" element={<div>dials</div>} />
        <Route path="/profile" element={<div>dna</div>} />
        <Route path="/" element={<div>home</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  flags.mobile = false
  window.matchMedia = (q) => ({ matches: flags.mobile && /max-width/.test(q), media: q, addEventListener: () => {}, removeEventListener: () => {}, addListener: () => {}, removeListener: () => {} })
})

describe('Account structure + desktop navigation', () => {
  it('renders exactly one <h1> and no nested <main>', () => {
    const { container } = mountAt('/account')
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(container.querySelector('main')).toBeNull()
  })

  it('defaults to Overview and marks it aria-current', () => {
    mountAt('/account')
    expect(screen.getByRole('heading', { level: 2, name: 'Overview' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Overview/ })).toHaveAttribute('aria-current', 'true')
  })

  it('a valid ?section= renders that pane + marks its nav item current', () => {
    mountAt('/account?section=privacy')
    expect(screen.getByRole('heading', { level: 2, name: 'Privacy' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Privacy/ })).toHaveAttribute('aria-current', 'true')
  })

  it('exposes a semantic settings navigation with all seven sections', () => {
    mountAt('/account?section=security')
    const nav = screen.getByRole('navigation', { name: /account settings/i })
    expect(nav).toBeInTheDocument()
    for (const label of ['Overview', 'Personal Information', 'Privacy', 'Notifications', 'Connections', 'Sign-In & Security', 'Data & Deletion']) {
      expect(screen.getByRole('link', { name: new RegExp(label) })).toBeInTheDocument()
    }
  })

  it('an invalid ?section= falls back safely to Overview', () => {
    mountAt('/account?section=not-a-section')
    expect(screen.getByRole('heading', { level: 2, name: 'Overview' })).toBeInTheDocument()
  })
})

describe('Account mobile navigation', () => {
  it('shows the settings index with a Recommendations link and no open detail by default', () => {
    flags.mobile = true
    mountAt('/account')
    expect(screen.getByRole('link', { name: /Recommendation settings/ })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /back to settings/i })).not.toBeInTheDocument()
  })

  it('opens a push-in detail screen with a Back control when a section is active', () => {
    flags.mobile = true
    mountAt('/account?section=data')
    expect(screen.getByRole('button', { name: /back to settings/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Data & Deletion' })).toBeInTheDocument()
  })
})
