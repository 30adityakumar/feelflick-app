import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('framer-motion', () => ({ useReducedMotion: () => false }))
// Stub the rating hook so the watched form renders without supabase.
vi.mock('../hooks/useUserRating', () => ({
  useUserRating: () => ({ stars: 0, reviewText: '', reaction: '', setStars: vi.fn(), setReviewText: vi.fn(), setReaction: vi.fn(), saveStatus: 'idle', hydrated: true }),
  REACTION_TO_SENTIMENT: { 'Loved it': 'loved' },
}))
vi.mock('../useMovieData', () => ({ useMovieData: () => ({ mv: { id: 1, title: 'Parasite' } }) }))

import { YourTake } from '../sections-bottom'

beforeAll(() => { vi.stubGlobal('IntersectionObserver', class { observe() {} unobserve() {} disconnect() {} }) })
afterAll(() => { vi.unstubAllGlobals() })

describe('YourTake — compact until watched (F5.5)', () => {
  it('41/42/43. unwatched: compact prompt, no rating controls, honest watched-first copy', () => {
    const { container } = render(<YourTake isWatched={false} userId="u1" internalId={7} onSaved={() => {}} onError={() => {}} />)
    expect(screen.getByText('After watching')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Your take' })).toBeInTheDocument()
    expect(screen.getByText(/Mark this film watched above to rate it/i)).toBeInTheDocument()
    // no expanded rating controls
    expect(container.querySelector('[role="radiogroup"]')).toBeNull()
    expect(screen.queryByLabelText(/star rating/i)).not.toBeInTheDocument()
    expect(container.querySelector('textarea')).toBeNull()
    // it occupies the compact section, not the large reflection card
    expect(container.querySelector('.ff-movie-your-take-compact')).toBeTruthy()
  })

  it('44. watched: renders the full reflection controls (stars + reactions)', () => {
    const { container } = render(<YourTake isWatched userId="u1" internalId={7} onSaved={() => {}} onError={() => {}} />)
    expect(container.querySelectorAll('[role="radiogroup"]').length).toBeGreaterThanOrEqual(1) // stars + reactions
    expect(screen.getByLabelText(/star rating/i)).toBeInTheDocument()
    expect(screen.queryByText('After watching')).not.toBeInTheDocument()
  })

  it('49/50. compact unwatched adds NO Submit CTA and NO duplicate Mark Watched action', () => {
    render(<YourTake isWatched={false} userId="u1" internalId={7} onSaved={() => {}} onError={() => {}} />)
    expect(screen.queryByRole('button', { name: /submit|save take|mark watched/i })).not.toBeInTheDocument()
  })

  it('does not imply a rating already exists when unwatched', () => {
    const { container } = render(<YourTake isWatched={false} userId="u1" internalId={7} onSaved={() => {}} onError={() => {}} />)
    expect(container.textContent).not.toMatch(/Saved ✓|★|you rated/)
  })
})
