// src/features/onboarding/__tests__/draft.test.js
// F2.23 — user-scoped onboarding draft: cross-account isolation, same-user restore,
// clear (scoped + legacy), the one-time legacy-global migration, and safe parsing.
// Plus wiring assertions that Header (sign-out) + Onboarding clear the draft.

import { describe, it, expect, beforeEach } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { draftKey, loadDraft, saveDraft, clearDraft, LEGACY_DRAFT_KEY } from '../draft'

beforeEach(() => { localStorage.clear() })

describe('onboarding draft — user scoping', () => {
  it('keys are per-user', () => {
    expect(draftKey('A')).toBe('ff_onboarding_draft_v1_A')
    expect(draftKey('A')).not.toBe(draftKey('B'))
  })

  it('User A draft is NOT loaded for User B', () => {
    saveDraft('A', { step: 3, moods: ['cozy'], selectedGenres: [18], favoriteMovies: [{ id: 1 }], ratings: { 1: 9 } })
    expect(loadDraft('B')).toBeNull()
    expect(loadDraft('A')).toMatchObject({ step: 3, moods: ['cozy'] })
  })

  it('same user restores their scoped draft (with version stamp)', () => {
    saveDraft('A', { step: 2, moods: ['wired'], selectedGenres: [], favoriteMovies: [], ratings: {} })
    const d = loadDraft('A')
    expect(d.step).toBe(2)
    expect(d.moods).toEqual(['wired'])
    expect(d.version).toBe(1)
  })

  it('clearDraft removes the user scoped key AND the legacy global key', () => {
    saveDraft('A', { step: 1 })
    localStorage.setItem(LEGACY_DRAFT_KEY, JSON.stringify({ step: 9 }))
    clearDraft('A')
    expect(loadDraft('A')).toBeNull()
    expect(localStorage.getItem(LEGACY_DRAFT_KEY)).toBeNull()
  })

  it('null/undefined userId is a no-op (no crash, never a global default)', () => {
    expect(loadDraft(null)).toBeNull()
    expect(loadDraft(undefined)).toBeNull()
    expect(() => saveDraft(null, { step: 1 })).not.toThrow()
    expect(() => clearDraft(null)).not.toThrow()
  })
})

describe('onboarding draft — legacy global-key migration', () => {
  it('adopts the legacy global draft ONCE for the first user, then deletes the global key', () => {
    localStorage.setItem(LEGACY_DRAFT_KEY, JSON.stringify({ step: 4, moods: ['mythic'] }))
    const adopted = loadDraft('A')
    expect(adopted).toMatchObject({ step: 4, moods: ['mythic'] })
    expect(localStorage.getItem(draftKey('A'))).not.toBeNull() // copied to A's scoped key
    expect(localStorage.getItem(LEGACY_DRAFT_KEY)).toBeNull()   // global key deleted
    expect(loadDraft('B')).toBeNull()                           // no future user can read it
  })

  it('a user with their own scoped draft ignores the legacy key', () => {
    saveDraft('A', { step: 2 })
    localStorage.setItem(LEGACY_DRAFT_KEY, JSON.stringify({ step: 9 }))
    expect(loadDraft('A').step).toBe(2)
  })
})

describe('onboarding draft — safe parsing', () => {
  it('invalid scoped draft JSON returns null (no crash)', () => {
    localStorage.setItem(draftKey('A'), '{not valid json')
    expect(loadDraft('A')).toBeNull()
  })
  it('non-object JSON returns null', () => {
    localStorage.setItem(draftKey('A'), '42')
    expect(loadDraft('A')).toBeNull()
  })
})

describe('onboarding draft — wiring', () => {
  const read = (p) => readFileSync(resolve(import.meta.dirname, p), 'utf8')

  it('Header sign-out clears this user’s draft (scoped + legacy)', () => {
    const header = read('../../../app/header/Header.jsx')
    expect(header).toMatch(/import \{ clearDraft \} from '@\/features\/onboarding\/draft'/)
    expect(header).toMatch(/clearDraft\(user\?\.id\)/)
  })

  it('Onboarding uses the scoped helper (no global key) and clears on redirect + completion', () => {
    const ob = read('../Onboarding.jsx')
    expect(ob).not.toMatch(/ONBOARDING_DRAFT_KEY/)        // global key removed
    expect(ob).toMatch(/from '\.\/draft'/)
    expect((ob.match(/clearDraft\(/g) || []).length).toBeGreaterThanOrEqual(2) // gate(s) + completion
  })
})
