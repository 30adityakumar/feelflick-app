import { describe, it, expect } from 'vitest'
import {
  classifySocialEvidence, SOCIAL_EVIDENCE, tasteBand, TASTE_BANDS,
  formatTasteEvidence, deriveTasteMatchPresentation, deriveRelationshipLabel, formatFollowCount,
  MIN_IN_COMMON, STRONG_IN_COMMON, MIN_WATCHED,
} from '../peoplePresentation'

describe('F8.3 classifySocialEvidence — evidence floor + forming gate', () => {
  it('insufficient shared films (null / below floor) → INSUFFICIENT', () => {
    expect(classifySocialEvidence({ moviesInCommon: null, total: 40 })).toBe(SOCIAL_EVIDENCE.INSUFFICIENT)
    expect(classifySocialEvidence({ moviesInCommon: 0, total: 40 })).toBe(SOCIAL_EVIDENCE.INSUFFICIENT)
    expect(classifySocialEvidence({ moviesInCommon: MIN_IN_COMMON - 1, total: 40 })).toBe(SOCIAL_EVIDENCE.INSUFFICIENT)
  })
  it('enough overlap but a tiny counterpart profile → FORMING', () => {
    expect(classifySocialEvidence({ moviesInCommon: 5, total: MIN_WATCHED - 1 })).toBe(SOCIAL_EVIDENCE.FORMING)
  })
  it('strong overlap OR mature profile → ESTABLISHED', () => {
    expect(classifySocialEvidence({ moviesInCommon: STRONG_IN_COMMON, total: null })).toBe(SOCIAL_EVIDENCE.ESTABLISHED)
    expect(classifySocialEvidence({ moviesInCommon: 4, total: 30 })).toBe(SOCIAL_EVIDENCE.ESTABLISHED)
  })
  it('moderate overlap, unknown/medium profile → EMERGING', () => {
    expect(classifySocialEvidence({ moviesInCommon: 4, total: null })).toBe(SOCIAL_EVIDENCE.EMERGING)
    expect(classifySocialEvidence({ moviesInCommon: 6, total: 10 })).toBe(SOCIAL_EVIDENCE.EMERGING)
  })
})

describe('F8.3 tasteBand — conservative qualitative bands (no exact %)', () => {
  it('threshold boundaries', () => {
    expect(tasteBand(75)).toBe(TASTE_BANDS.VERY_CLOSE)
    expect(tasteBand(74)).toBe(TASTE_BANDS.STRONG)
    expect(tasteBand(55)).toBe(TASTE_BANDS.STRONG)
    expect(tasteBand(54)).toBe(TASTE_BANDS.SOME)
    expect(tasteBand(0)).toBe(TASTE_BANDS.SOME)
  })
  it('null / undefined / NaN → null; out-of-range clamped', () => {
    expect(tasteBand(null)).toBeNull()
    expect(tasteBand(undefined)).toBeNull()
    expect(tasteBand(NaN)).toBeNull()
    expect(tasteBand(200)).toBe(TASTE_BANDS.VERY_CLOSE)   // clamped to 100
    expect(tasteBand(-5)).toBe(TASTE_BANDS.SOME)          // clamped to 0
  })
  it('no band string is a raw percentage / forbidden word', () => {
    for (const v of Object.values(TASTE_BANDS)) {
      expect(v).not.toMatch(/%|\d/)
      expect(v).not.toMatch(/perfect|soulmate|best friend|guaranteed|predict/i)
    }
  })
})

describe('F8.3 formatTasteEvidence — films-in-common grammar, never fabricated', () => {
  it('one / multiple films → singular/plural', () => {
    expect(formatTasteEvidence({ moviesInCommon: 1 })).toBe('Based on 1 film in common')
    expect(formatTasteEvidence({ moviesInCommon: 18 })).toBe('Based on 18 films in common')
  })
  it('zero / null / invalid → null (hidden, never fabricated)', () => {
    expect(formatTasteEvidence({ moviesInCommon: 0 })).toBeNull()
    expect(formatTasteEvidence({ moviesInCommon: null })).toBeNull()
    expect(formatTasteEvidence({})).toBeNull()
    expect(formatTasteEvidence({ moviesInCommon: NaN })).toBeNull()
  })
})

describe('F8.3 deriveTasteMatchPresentation — honest, evidence-qualified', () => {
  it('forming counterpart → NO percentage, NO band, cautious caption', () => {
    const p = deriveTasteMatchPresentation({ matchPct: 92, moviesInCommon: 4, total: 3 })
    expect(p.qualified).toBe(false)
    expect(p.band).toBeNull()
    expect(p.caption).toBe('Taste still forming')
    expect(JSON.stringify(p)).not.toMatch(/\d+%|92/)
  })
  it('insufficient overlap → NO claim even with a high match', () => {
    const p = deriveTasteMatchPresentation({ matchPct: 95, moviesInCommon: 1, total: 50 })
    expect(p.qualified).toBe(false)
    expect(p.band).toBeNull()
    expect(p.caption).toBe('Not enough shared evidence yet')
  })
  it('emerging → cautious band (never the top band) + evidence', () => {
    const p = deriveTasteMatchPresentation({ matchPct: 90, moviesInCommon: 5, total: 10 })
    expect(p.qualified).toBe(true)
    expect(p.band).toBe(TASTE_BANDS.STRONG)         // capped down from VERY_CLOSE
    expect(p.evidence).toBe('Based on 5 films in common')
  })
  it('established → strongest supported band + evidence', () => {
    const p = deriveTasteMatchPresentation({ matchPct: 88, moviesInCommon: 18, total: 40 })
    expect(p.qualified).toBe(true)
    expect(p.band).toBe(TASTE_BANDS.VERY_CLOSE)
    expect(p.evidence).toBe('Based on 18 films in common')
    expect(JSON.stringify(p)).not.toMatch(/88|%/)
  })
  it('invalid match degrades honestly (no band, evidence still shown when present)', () => {
    const p = deriveTasteMatchPresentation({ matchPct: NaN, moviesInCommon: 18, total: 40 })
    expect(p.band).toBeNull()
    expect(p.evidence).toBe('Based on 18 films in common')
  })
})

describe('F8.3 relationship terminology — never "friend"', () => {
  it('relationship label is only the one-way follow state', () => {
    expect(deriveRelationshipLabel({ following: false })).toBe('Follow')
    expect(deriveRelationshipLabel({ following: true })).toBe('Following')
    expect(deriveRelationshipLabel({ following: true })).not.toMatch(/friend/i)
  })
  it('follow count is "people you follow", never "friends"', () => {
    expect(formatFollowCount(1)).toBe('1 person you follow')
    expect(formatFollowCount(3)).toBe('3 people you follow')
    expect(formatFollowCount(0)).not.toMatch(/friend/i)
  })
})
