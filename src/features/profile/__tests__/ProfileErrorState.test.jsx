import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'

// F7.3 — the Profile route error state must render fixed, safe copy off the stable
// `load_error` classification, with role="alert", a real retry, and a safe exit — and must
// NEVER surface raw backend text.

const retrySpy = vi.fn()
vi.mock('../useProfileData', () => ({
  useProfileDataFetch: () => ({ error: 'load_error', retry: retrySpy }),
  ProfileDataProvider: ({ children }) => children,
  useProfileData: () => ({}),
}))
vi.mock('@/shared/hooks/useAuthSession', () => ({ useAuthSession: () => ({ user: { id: 'self-1' } }) }))
vi.mock('@/shared/hooks/usePageMeta', () => ({ usePageMeta: () => {} }))

import TasteProfile from '../TasteProfile'

const renderSelf = () => render(
  <MemoryRouter initialEntries={['/profile']}>
    <Routes><Route path="/profile" element={<TasteProfile />} /></Routes>
  </MemoryRouter>
)

describe('Profile error state — F7.3 sanitized', () => {
  it('renders fixed safe copy with role=alert; the raw classification is never shown', () => {
    renderSelf()
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/couldn.t load your cinematic dna/i)
    expect(screen.getByText(/try refreshing in a moment/i)).toBeInTheDocument()
    expect(screen.queryByText(/load_error/i)).not.toBeInTheDocument()   // classification not surfaced
    expect(screen.getByRole('link', { name: /go to home/i })).toBeInTheDocument()
  })

  it('"Try again" invokes the real retry path', () => {
    renderSelf()
    fireEvent.click(screen.getByRole('button', { name: /try again/i }))
    expect(retrySpy).toHaveBeenCalledTimes(1)
  })
})
