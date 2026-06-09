import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

// F7.2 privacy containment: the "Public profile" / "Public diary" toggles were never
// enforced by any read path or RLS policy (cosmetic) — they must NOT be rendered as
// functional-looking controls. Enforced controls (taste-match surfacing, analytics) stay.

const updatePrivacy = vi.fn()
vi.mock('../useAccountData', () => ({
  useAccountData: () => ({
    serverSettings: { privacy: { showOnLeaderboards: true, analytics: true } },
    updatePrivacy,
  }),
}))
vi.mock('@/shared/services/analytics', () => ({ setAnalyticsOptOut: vi.fn() }))

import { Privacy } from '../sections-bottom'

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

  it('keeps the enforced controls (taste-match surfacing + analytics)', () => {
    render(<Privacy />)
    expect(screen.getByText('Show on taste-match')).toBeInTheDocument()
    expect(screen.getByText('Product analytics')).toBeInTheDocument()
  })

  it('states honestly that Cinematic DNA / history / ratings are private', () => {
    render(<Privacy />)
    expect(screen.getByText(/visible only to you/i)).toBeInTheDocument()
  })
})
