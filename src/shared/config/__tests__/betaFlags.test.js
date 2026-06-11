import { describe, it, expect, vi, afterEach } from 'vitest'
import { isEnabled, isBetaGateEnabled, FLAG_KEYS } from '../betaFlags'

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
