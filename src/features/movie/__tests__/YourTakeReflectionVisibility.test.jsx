import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'

vi.mock('framer-motion', () => ({ useReducedMotion: () => false }))

// Configurable rating-hook stub so we can simulate "user already has a reflection".
let ratingState
vi.mock('../hooks/useUserRating', () => ({
  useUserRating: () => ratingState,
  REACTION_TO_SENTIMENT: { 'Loved it': 'loved' },
}))
vi.mock('../useMovieData', () => ({ useMovieData: () => ({ mv: { id: 1, title: 'Parasite' } }) }))

import { YourTake } from '../sections-bottom'

beforeAll(() => { vi.stubGlobal('IntersectionObserver', class { observe() {} unobserve() {} disconnect() {} }) })
afterAll(() => { vi.unstubAllGlobals() })
beforeEach(() => { cleanup(); ratingState = { stars: 0, reviewText: '', reaction: '', setStars: vi.fn(), setReviewText: vi.fn(), setReaction: vi.fn(), saveStatus: 'idle', hydrated: true } })

const renderTake = (isWatched) => render(<YourTake isWatched={isWatched} userId="u1" internalId={7} onSaved={() => {}} onError={() => {}} />)
const isEditable = (container) => container.querySelector('[role="radiogroup"][aria-label="Your star rating"]') !== null
const isLocked = (container) => container.querySelector('.ff-movie-your-take-compact') !== null

describe('Your Take — existing reflection stays accessible after Diary removal (F6.5)', () => {
  it('40/45. unwatched + NO existing reflection stays locked — no new unwatched rating', () => {
    ratingState = { ...ratingState, stars: 0, reviewText: '', reaction: '' }
    const { container } = renderTake(false)
    expect(isLocked(container)).toBe(true)
    expect(isEditable(container)).toBe(false)
    expect(screen.getByText(/Mark this film watched above to rate it/i)).toBeInTheDocument()
  })

  it('41. watched + no reflection can create one (editable controls render)', () => {
    const { container } = renderTake(true)
    expect(isEditable(container)).toBe(true)
    expect(isLocked(container)).toBe(false)
  })

  it('42. unwatched + existing RATING displays the editable Your Take', () => {
    ratingState = { ...ratingState, stars: 4 }
    const { container } = renderTake(false)
    expect(isEditable(container)).toBe(true)
    expect(isLocked(container)).toBe(false)
  })

  it('43. unwatched + existing REVIEW displays the editable Your Take', () => {
    ratingState = { ...ratingState, reviewText: 'Stayed with me.' }
    const { container } = renderTake(false)
    expect(isEditable(container)).toBe(true)
  })

  it('43b. unwatched + existing REACTION displays the editable Your Take', () => {
    ratingState = { ...ratingState, reaction: 'Loved it' }
    const { container } = renderTake(false)
    expect(isEditable(container)).toBe(true)
  })

  it('44/46. the surfaced reflection is editable on the UNCHANGED 1–5 star scale (5 radios), not a new control', () => {
    ratingState = { ...ratingState, stars: 3 }
    renderTake(false)
    const stars = screen.getAllByRole('radio', { name: /star/i })
    expect(stars).toHaveLength(5) // display scale unchanged
    expect(screen.getByPlaceholderText(/one sentence on what stuck/i)).toBeEnabled()
  })

  it('47. hierarchy unchanged — the editable card still uses the "Unlocked · How did it land?" eyebrow', () => {
    ratingState = { ...ratingState, stars: 5 }
    renderTake(false)
    expect(screen.getByText(/Unlocked · How did it land\?/i)).toBeInTheDocument()
  })

  it('does not flash the editable form before hydration settles (unwatched + not yet hydrated → locked)', () => {
    ratingState = { ...ratingState, stars: 4, hydrated: false }
    const { container } = renderTake(false)
    expect(isLocked(container)).toBe(true)
  })
})
