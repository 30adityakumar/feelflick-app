import { describe, it, expect } from 'vitest'
import { PROFILE_EVIDENCE_VERSION, isFingerprintVersionCurrent, isEditorialVersionCurrent } from '../profileEvidenceVersion'

// F7.6 — a cache hit is valid only when its stored evidence version matches the current one.
describe('PROFILE_EVIDENCE_VERSION cache validity', () => {
  const V = PROFILE_EVIDENCE_VERSION
  it('is a number ≥ 2 (F7.3 canonical evidence)', () => {
    expect(typeof V).toBe('number')
    expect(V).toBeGreaterThanOrEqual(2)
  })
  it('fingerprint: current version valid; unversioned/previous/malformed/missing are stale', () => {
    expect(isFingerprintVersionCurrent({ topMoodTags: [], evidenceVersion: V })).toBe(true)
    expect(isFingerprintVersionCurrent({ topMoodTags: [] })).toBe(false)          // pre-F7.3 unversioned
    expect(isFingerprintVersionCurrent({ evidenceVersion: V - 1 })).toBe(false)   // previous version
    expect(isFingerprintVersionCurrent({ evidenceVersion: '2' })).toBe(false)     // malformed (string)
    expect(isFingerprintVersionCurrent(null)).toBe(false)
    expect(isFingerprintVersionCurrent(undefined)).toBe(false)
  })
  it('editorial: current editorialVersion valid; a versioned fingerprint alone is NOT a valid editorial', () => {
    expect(isEditorialVersionCurrent({ editorialVersion: V })).toBe(true)
    expect(isEditorialVersionCurrent({ evidenceVersion: V })).toBe(false)         // fingerprint versioned, editorial not
    expect(isEditorialVersionCurrent({ editorialVersion: V - 1 })).toBe(false)
    expect(isEditorialVersionCurrent({})).toBe(false)
    expect(isEditorialVersionCurrent(null)).toBe(false)
  })
})
