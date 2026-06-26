import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'

// AppShell now owns only the app-frame concerns: the shared header host, the
// authenticated-only BottomNav, content padding, analytics, and route loading. The
// anonymous mobile bottom bar is gone. Search + Sign in live in the shared header
// host (covered by Header.test / SiteHeaderHost.test).

let authState
vi.mock('@/shared/hooks/useAuthSession', () => ({ useAuthSession: () => authState }))
vi.mock('@/shared/hooks/usePendingDeletion', () => ({ usePendingDeletion: () => ({ pendingDeletion: null, cancel: vi.fn() }) }))
vi.mock('@/shared/services/analytics', () => ({ identify: vi.fn(), resetAnalytics: vi.fn(), track: vi.fn() }))
vi.mock('@/shared/services/betaEvents', () => ({ redactPath: (p) => p }))
vi.mock('@/app/header/SiteHeaderHost', () => ({ default: ({ tone = 'default' }) => <div data-testid="site-header-host" data-tone={tone} /> }))
vi.mock('@/app/header/components/BottomNav', () => ({ default: () => <nav data-testid="bottom-nav" aria-label="Primary" /> }))

import AppShell from '../AppShell'

function renderShell() {
  const router = createMemoryRouter(
    [{ path: '/', element: <AppShell />, children: [{ index: true, element: <div data-testid="page">page</div> }] }],
    { initialEntries: ['/'] }
  )
  return render(<RouterProvider router={router} />)
}

beforeEach(() => {
  authState = { user: null, isAuthenticated: false }
  window.scrollTo = vi.fn()
})
afterEach(() => cleanup())

describe('AppShell — shared header + bottom-nav ownership', () => {
  it('always mounts the shared header host with the default (app) tone', () => {
    renderShell()
    const host = screen.getByTestId('site-header-host')
    expect(host).toBeInTheDocument()
    // App routes keep the default header treatment; only Landing requests quiet.
    expect(host).toHaveAttribute('data-tone', 'default')
  })

  it('anonymous: renders no bottom navigation and reserves no mobile bottom-bar padding', () => {
    const { container } = renderShell()
    expect(screen.queryByTestId('bottom-nav')).toBeNull()
    const main = container.querySelector('main')
    expect(main.className).not.toContain('pb-28')
    expect(main.className).not.toContain('pb-20')
  })

  it('authenticated: renders BottomNav and reserves mobile bottom clearance', () => {
    authState = { user: { id: 'u1' }, isAuthenticated: true }
    const { container } = renderShell()
    expect(screen.getByTestId('bottom-nav')).toBeInTheDocument()
    const main = container.querySelector('main')
    expect(main.className).toContain('pb-28')
    expect(main.className).toContain('md:pb-0')
  })
})
