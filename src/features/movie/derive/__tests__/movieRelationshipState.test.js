import { describe, it, expect } from 'vitest'
import { deriveRelationshipState, spoilerUnlocked, isSignedIn, REL } from '../movieRelationshipState'

describe('movieRelationshipState (§13)', () => {
  it('anonymous when not signed in (regardless of watched/error)', () => {
    expect(deriveRelationshipState({ signedIn: false, isWatched: false })).toBe(REL.ANON)
    expect(deriveRelationshipState({ signedIn: false, isWatched: true })).toBe(REL.ANON)
    expect(deriveRelationshipState({ signedIn: false, isWatched: true, ratingLoadError: true })).toBe(REL.ANON)
  })

  it('signed_in_pre_watch when signed in but not watched', () => {
    expect(deriveRelationshipState({ signedIn: true, isWatched: false })).toBe(REL.PRE)
  })

  it('signed_in_watched when signed in + watched + reflection loaded', () => {
    expect(deriveRelationshipState({ signedIn: true, isWatched: true })).toBe(REL.WATCHED)
  })

  it('watched_but_reflection_unavailable when watched but the reflection read failed', () => {
    expect(deriveRelationshipState({ signedIn: true, isWatched: true, ratingLoadError: true })).toBe(REL.REFLECTION_ERR)
  })

  it('spoilerUnlocked only for the two watched states', () => {
    expect(spoilerUnlocked(REL.ANON)).toBe(false)
    expect(spoilerUnlocked(REL.PRE)).toBe(false)
    expect(spoilerUnlocked(REL.WATCHED)).toBe(true)
    expect(spoilerUnlocked(REL.REFLECTION_ERR)).toBe(true)
  })

  it('isSignedIn true for every non-anonymous state', () => {
    expect(isSignedIn(REL.ANON)).toBe(false)
    expect(isSignedIn(REL.PRE)).toBe(true)
    expect(isSignedIn(REL.WATCHED)).toBe(true)
    expect(isSignedIn(REL.REFLECTION_ERR)).toBe(true)
  })
})
