import { describe, it, expect } from 'vitest'
import { isTruthyFlag, deriveOnboardingStatus } from '../onboardingStatus'

describe('isTruthyFlag', () => {
  it('accepts boolean, string, and numeric truthy forms', () => {
    expect(isTruthyFlag(true)).toBe(true)
    expect(isTruthyFlag('true')).toBe(true)
    expect(isTruthyFlag(1)).toBe(true)
    expect(isTruthyFlag('1')).toBe(true)
  })

  it('rejects everything else', () => {
    expect(isTruthyFlag(false)).toBe(false)
    expect(isTruthyFlag('false')).toBe(false)
    expect(isTruthyFlag(0)).toBe(false)
    expect(isTruthyFlag(undefined)).toBe(false)
    expect(isTruthyFlag(null)).toBe(false)
    expect(isTruthyFlag('yes')).toBe(false)
  })
})

describe('deriveOnboardingStatus', () => {
  it('handles a missing user', () => {
    expect(deriveOnboardingStatus(null)).toEqual({ hasAny: false, isComplete: false })
    expect(deriveOnboardingStatus(undefined)).toEqual({ hasAny: false, isComplete: false })
  })

  it('reads onboarding_complete from user_metadata', () => {
    const user = { user_metadata: { onboarding_complete: true } }
    expect(deriveOnboardingStatus(user)).toEqual({ hasAny: true, isComplete: true })
  })

  it('reads flags from app_metadata too', () => {
    const user = { app_metadata: { onboarded: '1' } }
    expect(deriveOnboardingStatus(user)).toEqual({ hasAny: true, isComplete: true })
  })

  // The bug the consolidation fixes: the callback used to miss camelCase, so a
  // user with onboardingComplete would be sent to /onboarding then bounced back.
  it('recognises the camelCase variant (the redirect-flicker bug)', () => {
    const user = { user_metadata: { onboardingComplete: true } }
    expect(deriveOnboardingStatus(user)).toEqual({ hasAny: true, isComplete: true })
  })

  it('treats a present-but-falsey flag as incomplete (hasAny true)', () => {
    const user = { user_metadata: { onboarding_complete: false } }
    expect(deriveOnboardingStatus(user)).toEqual({ hasAny: true, isComplete: false })
  })

  it('treats a timestamp key as "metadata present" without marking complete', () => {
    const user = { user_metadata: { onboarding_completed_at: '2026-05-30T00:00:00Z' } }
    expect(deriveOnboardingStatus(user)).toEqual({ hasAny: true, isComplete: false })
  })

  it('user_metadata wins over app_metadata on key overlap', () => {
    const user = {
      app_metadata: { onboarding_complete: false },
      user_metadata: { onboarding_complete: true },
    }
    expect(deriveOnboardingStatus(user).isComplete).toBe(true)
  })
})
