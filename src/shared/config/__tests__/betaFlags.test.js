import { describe, it, expect, vi, afterEach } from 'vitest'
import { isEnabled, isBetaGateEnabled, isUserInProfileAutoGenRollout, FLAG_KEYS } from '../betaFlags'

describe('betaFlags — kill switches default safe', () => {
  afterEach(() => vi.unstubAllEnvs())

  it('every flag defaults to ENABLED when its env var is unset (current behavior)', () => {
    for (const key of FLAG_KEYS) expect(isEnabled(key)).toBe(true)
  })

  it('disables on "false" / "0" / "off"', () => {
    for (const v of ['false', 'FALSE', '0', 'off']) {
      vi.stubEnv('VITE_ENABLE_PEOPLE', v)
      expect(isEnabled('people')).toBe(false)
    }
  })

  it('stays enabled for "true" / "1" / any other value', () => {
    for (const v of ['true', '1', 'yes', 'on']) {
      vi.stubEnv('VITE_ENABLE_PROFILE_REFRESH', v)
      expect(isEnabled('profileRefresh')).toBe(true)
    }
  })

  it('an unknown flag never gates (returns true)', () => {
    expect(isEnabled('nope')).toBe(true)
  })
})

describe('betaFlags — first-gen rollout dial defaults OFF, deterministic per user', () => {
  afterEach(() => vi.unstubAllEnvs())

  it('defaults to 0% (off) when unset', () => {
    expect(isUserInProfileAutoGenRollout('user-a')).toBe(false)
  })

  it('stays off for 0, negative, non-numeric, or empty values', () => {
    for (const v of ['0', '-5', 'nope', '']) {
      vi.stubEnv('VITE_PROFILE_AUTO_GEN_ROLLOUT_PCT', v)
      expect(isUserInProfileAutoGenRollout('user-a')).toBe(false)
    }
  })

  it('100% (or above) always includes every user', () => {
    vi.stubEnv('VITE_PROFILE_AUTO_GEN_ROLLOUT_PCT', '100')
    for (const id of ['user-a', 'user-b', 'some-uuid-1234', 'zzz']) {
      expect(isUserInProfileAutoGenRollout(id)).toBe(true)
    }
    vi.stubEnv('VITE_PROFILE_AUTO_GEN_ROLLOUT_PCT', '250')
    expect(isUserInProfileAutoGenRollout('user-a')).toBe(true)
  })

  it('a given user always lands in the same bucket (deterministic, not random)', () => {
    vi.stubEnv('VITE_PROFILE_AUTO_GEN_ROLLOUT_PCT', '50')
    const first = isUserInProfileAutoGenRollout('stable-user-id')
    for (let i = 0; i < 5; i++) expect(isUserInProfileAutoGenRollout('stable-user-id')).toBe(first)
  })

  it('a mid-range percentage includes some users and excludes others (not all-or-nothing)', () => {
    vi.stubEnv('VITE_PROFILE_AUTO_GEN_ROLLOUT_PCT', '50')
    const ids = Array.from({ length: 40 }, (_, i) => `user-${i}`)
    const included = ids.filter((id) => isUserInProfileAutoGenRollout(id))
    expect(included.length).toBeGreaterThan(0)
    expect(included.length).toBeLessThan(ids.length)
  })

  it('with no userId, always returns false regardless of percentage', () => {
    vi.stubEnv('VITE_PROFILE_AUTO_GEN_ROLLOUT_PCT', '100')
    expect(isUserInProfileAutoGenRollout(null)).toBe(false)
    expect(isUserInProfileAutoGenRollout(undefined)).toBe(false)
    expect(isUserInProfileAutoGenRollout('')).toBe(false)
  })
})

describe('betaFlags — private-beta gate defaults OFF (inverse of kill-switches)', () => {
  afterEach(() => vi.unstubAllEnvs())

  it('is disabled by default (no env)', () => {
    expect(isBetaGateEnabled()).toBe(false)
  })

  it('enables ONLY on true / 1 / on', () => {
    for (const v of ['true', 'TRUE', '1', 'on']) {
      vi.stubEnv('VITE_ENABLE_BETA_GATE', v)
      expect(isBetaGateEnabled()).toBe(true)
    }
  })

  it('stays OFF for false / 0 / empty / anything else', () => {
    for (const v of ['false', '0', '', 'nope']) {
      vi.stubEnv('VITE_ENABLE_BETA_GATE', v)
      expect(isBetaGateEnabled()).toBe(false)
    }
  })
})
