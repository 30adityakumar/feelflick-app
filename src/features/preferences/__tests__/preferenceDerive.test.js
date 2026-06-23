import { describe, it, expect } from 'vitest'
import { validateDraft, clampRuntimeFloor, clampRuntimeCap } from '../derive/preferenceValidation'
import { deriveSummary, deriveMoodSummary, deriveGenreSummary, deriveToldUs } from '../derive/preferenceSummary'
import { buildInitialDraft, buildSavePayload, stableStringify, isDirty, DEFAULT_DRAFT } from '../derive/preferencePresentation'

const base = () => JSON.parse(JSON.stringify(DEFAULT_DRAFT))

describe('preferenceValidation', () => {
  it('accepts the default draft', () => { expect(validateDraft(DEFAULT_DRAFT).ok).toBe(true) })
  it('rejects genre overlap', () => {
    const d = base(); d.drawnGenreIds = [18]; d.avoidGenreIds = [18]
    expect(validateDraft(d).ok).toBe(false)
  })
  it('rejects an out-of-range mood value', () => {
    const d = base(); d.moodWeights.tender = 1.5
    expect(validateDraft(d).ok).toBe(false)
  })
  it('rejects a runtime gap < 5', () => {
    const d = base(); d.runtimeFloor = 120; d.runtimeCap = 123
    expect(validateDraft(d).ok).toBe(false)
  })
  it('rejects trusted/muted director overlap (case-insensitive)', () => {
    const d = base(); d.trustedDirectors = ['Bong Joon-ho']; d.mutedDirectors = ['bong joon-ho']
    expect(validateDraft(d).ok).toBe(false)
  })
  it('rejects an unknown language', () => {
    const d = base(); d.languages = ['Klingon']
    expect(validateDraft(d).ok).toBe(false)
  })
  it('clamps runtime floor below cap by the 5-min gap, and cap above floor', () => {
    expect(clampRuntimeFloor(200, 160)).toBe(155)
    expect(clampRuntimeCap(100, 120)).toBe(125)
    expect(clampRuntimeFloor(10, 180)).toBe(60)
    expect(clampRuntimeCap(999, 90)).toBe(240)
  })
})

describe('preferenceSummary (derived, never hard-coded)', () => {
  it('mood summary lists emphasized moods, else balanced', () => {
    const d = base()
    expect(deriveMoodSummary(d)).toBe('Balanced across moods')
    d.moodWeights.tender = 0.75; d.moodWeights['slow-burn'] = 0.75
    expect(deriveMoodSummary(d)).toBe('More Tender · Slow-burn')
  })
  it('genre summary counts preferred/avoided', () => {
    const d = base(); d.drawnGenreIds = [18, 9648]; d.avoidGenreIds = [27]
    expect(deriveGenreSummary(d)).toBe('2 preferred · 1 avoided')
    expect(deriveGenreSummary(base())).toBe('No direct genre rules')
  })
  it('summary includes a read-only learning cell (behaviour, not a toggle)', () => {
    expect(deriveSummary(base()).learning).toBe('Watched · Ratings · Saves · Skips')
  })
  it('toldUs is derived from explicit settings only', () => {
    const d = base(); d.drawnGenreIds = [18]; d.trustedDirectors = ['Bong Joon-ho']
    const items = deriveToldUs(d)
    expect(items.find((i) => i.key === 'drawn')).toBeTruthy()
    expect(items.find((i) => i.key === 'trusted').value).toBe('Bong Joon-ho')
  })
})

describe('preferencePresentation', () => {
  it('buildInitialDraft keeps raw mood weights (no snapping on load)', () => {
    const d = buildInitialDraft({ moodWeights: { tender: 0.85 } }, [])
    expect(d.moodWeights.tender).toBe(0.85) // untouched value preserved
  })
  it('buildInitialDraft splits drawn vs legacy excluded rows and de-dupes', () => {
    const d = buildInitialDraft({ avoidGenres: ['Horror'] }, [{ genre_id: 18, excluded: false }, { genre_id: 99, excluded: true }])
    expect(d.drawnGenreIds).toContain(18)
    expect(d.avoidGenreIds).toContain(27) // Horror label -> id
    expect(d.avoidGenreIds).toContain(99) // legacy excluded row unioned in
  })
  it('buildSavePayload emits genreIds + only allowed prefs keys (avoid as labels)', () => {
    const d = base(); d.drawnGenreIds = [18]; d.avoidGenreIds = [27]
    const { genreIds, patch } = buildSavePayload(d)
    expect(genreIds).toEqual([18])
    expect(patch.avoidGenres).toEqual(['Horror'])
    expect(Object.keys(patch).sort()).toEqual([
      'avoidGenres', 'boundaries', 'languages', 'moodWeights', 'mutedDirectors',
      'runtimeCap', 'runtimeFloor', 'spoilerTier', 'subtitles', 'trustedDirectors',
    ])
    // never leaks daypart / subscriptions (preserved server-side instead)
    expect(patch).not.toHaveProperty('daypart')
    expect(patch).not.toHaveProperty('subscriptions')
  })
  it('stableStringify is order-insensitive; isDirty detects real change only', () => {
    const a = { x: [1, 2], y: { b: 1, a: 2 } }
    const b = { y: { a: 2, b: 1 }, x: [1, 2] }
    expect(stableStringify(a)).toBe(stableStringify(b))
    expect(isDirty(a, b)).toBe(false)
    expect(isDirty({ x: 1 }, { x: 2 })).toBe(true)
  })
})
