import { describe, it, expect, vi, afterEach } from 'vitest'
import { isEnabled, FLAG_KEYS } from '../betaFlags'

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
