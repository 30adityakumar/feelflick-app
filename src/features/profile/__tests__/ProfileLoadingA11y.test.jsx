import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'

beforeEach(() => {
  vi.stubGlobal('IntersectionObserver', class { observe() {} disconnect() {} unobserve() {} })
})

// Control the provider state per test (loading vs loaded skip-target).
let fetchReturn
vi.mock('../useProfileData', () => ({
  useProfileDataFetch: () => fetchReturn,
  ProfileDataProvider: ({ children }) => children,
  useProfileData: () => ({ stats: { filmsLogged: 0, filmsRated: 0 }, moods: [], isSelf: true }),
}))
vi.mock('@/shared/hooks/useAuthSession', () => ({ useAuthSession: () => ({ user: { id: 'self-1' } }) }))
vi.mock('@/shared/hooks/usePageMeta', () => ({ usePageMeta: () => {} }))
// Section components read the (stubbed-empty) provider; they self-hide on empty data.
vi.mock('html-to-image', () => ({ toPng: vi.fn() }))

import TasteProfile from '../TasteProfile'

const renderSelf = () => render(
  <MemoryRouter initialEntries={['/DNA']}>
    <Routes><Route path="/DNA" element={<TasteProfile />} /></Routes>
  </MemoryRouter>
)

describe('Profile loading state — F7.5 honest status semantics', () => {
  it('one polite status with aria-busy + screen-reader text; skeleton geometry hidden; no fake progress', () => {
    fetchReturn = { loading: true, error: null }
    const { container } = renderSelf()
    const status = container.querySelector('[role="status"]')
    expect(status).toBeTruthy()
    expect(status).toHaveAttribute('aria-busy', 'true')
    expect(status).toHaveAttribute('aria-live', 'polite')
    expect(screen.getByText(/loading your cinematic dna/i)).toBeInTheDocument()
    expect(container.querySelector('[aria-hidden="true"]')).toBeTruthy()       // skeleton geometry hidden
    expect(screen.queryByText(/%/)).not.toBeInTheDocument()                    // no fake progress percentage
    expect(container.querySelectorAll('[role="status"]').length).toBe(1)       // single status region
  })
})

describe('Profile content region — F7.5 skip target + landmark', () => {
  it('the dossier is a focusable, labelled region (not a nested main)', () => {
    fetchReturn = { loading: false, error: null, stats: { filmsLogged: 0, filmsRated: 0 } }
    const { container } = renderSelf()
    const region = container.querySelector('#cinematic-dna-content')
    expect(region).toBeTruthy()
    expect(region).toHaveAttribute('tabIndex', '-1')                           // skip target
    expect(region).toHaveAttribute('role', 'region')
    expect(region).toHaveAttribute('aria-label', 'Cinematic DNA')
    expect(container.querySelector('main')).toBeNull()                         // AppShell owns main; no nested one
  })
})
