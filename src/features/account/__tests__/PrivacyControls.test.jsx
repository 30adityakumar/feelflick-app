import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

// F7.2 privacy containment: the "Public profile" / "Public diary" toggles were never
// enforced by any read path or RLS policy (cosmetic) — they must NOT be rendered as
// functional-looking controls. Enforced controls (taste-match surfacing, analytics) stay.

const updatePrivacy = vi.fn()
const retrySection = vi.fn()
vi.mock('../useAccountData', () => ({
  useAccountData: () => ({
    serverSettings: { privacy: { showOnLeaderboards: true, analytics: true } },
    updatePrivacy,
    retrySection,
    saveStatus: {},
  }),
}))
vi.mock('@/shared/services/analytics', () => ({ setAnalyticsOptOut: vi.fn() }))

import PrivacyPane from '../panes/PrivacyPane'
const Privacy = PrivacyPane

describe('Account Privacy — F7.2 honest controls', () => {
  it('does NOT render the unenforced "Public profile" / "Public diary" controls', () => {
    render(<Privacy />)
    expect(screen.queryByText('Public profile')).not.toBeInTheDocument()
    expect(screen.queryByText('Public diary')).not.toBeInTheDocument()
    // no switch/control carrying those labels either
    expect(screen.queryByLabelText(/public profile/i)).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/public diary/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/anyone with the link can view your dna/i)).not.toBeInTheDocument()
  })

  it('keeps the enforced controls (taste-match discovery + analytics)', () => {
    render(<Privacy />)
    expect(screen.getByText('Appear in taste-match discovery')).toBeInTheDocument()
    expect(screen.getByText('Product analytics')).toBeInTheDocument()
  })

  it('F8.2: discovery copy enumerates the exposed fields AND what stays private', () => {
    render(<Privacy />)
    // exposed fields named
    expect(screen.getByText(/name, avatar, your top film-taste tags and film count/i)).toBeInTheDocument()
    // explicitly states the private data is NOT included
    expect(screen.getByText(/watched films, Diary, ratings, reviews and Cinematic DNA reflection stay private/i)).toBeInTheDocument()
    // not called a leaderboard
    expect(screen.queryByText(/leaderboard/i)).not.toBeInTheDocument()
  })

  it('states honestly what stays private and what is visible to followers', () => {
    render(<Privacy />)
    // DNA, Diary, and ratings remain always-private
    expect(screen.getByText(/Cinematic DNA, Diary, and ratings stay private/i)).toBeInTheDocument()
    // History and watchlist are now public-by-default with opt-out
    expect(screen.getByText(/visible to your followers by default/i)).toBeInTheDocument()
  })
})
