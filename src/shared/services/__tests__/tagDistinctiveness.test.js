import { describe, expect, it } from 'vitest'

import { tagIdf, distinctivenessScore, rankByDistinctiveness } from '../tagDistinctiveness'

describe('tagIdf', () => {
  it('gives near-universal tags a low IDF and rare tags a high IDF', () => {
    expect(tagIdf('tone', 'earnest')).toBeLessThan(tagIdf('tone', 'poetic'))
    expect(tagIdf('tone', 'poetic')).toBeLessThan(tagIdf('tone', 'operatic'))
    expect(tagIdf('mood', 'tense')).toBeLessThan(tagIdf('mood', 'melancholic'))
    expect(tagIdf('fit', 'genre_popcorn')).toBeLessThan(tagIdf('fit', 'arthouse'))
  })

  it('falls back to a moderate IDF for an unknown tag (neither buried nor dominant)', () => {
    const unknown = tagIdf('tone', 'totally-made-up')
    expect(unknown).toBeGreaterThan(tagIdf('tone', 'earnest'))   // > most-common
    expect(unknown).toBeLessThan(tagIdf('tone', 'operatic'))     // < rarest
  })

  it('clamps ultra-rare tags to a saturated IDF so rarity cannot run away', () => {
    // euphoric 0.3% and operatic 0.9% both sit below the 5% prevalence floor → same IDF.
    expect(tagIdf('mood', 'euphoric')).toBeCloseTo(tagIdf('tone', 'operatic'), 5)
    // and that saturated value is ln(100/5) ≈ 3.0 — not the un-clamped ln(100/0.3) ≈ 5.8.
    expect(tagIdf('mood', 'euphoric')).toBeCloseTo(Math.log(20), 5)
  })
})

describe('rankByDistinctiveness', () => {
  it('demotes a high-count generic tag below a distinctive one (TF-IDF), keeping the set', () => {
    // earnest is the strongest by raw count but the most generic; grandiose/cold are rarer.
    const tones = [
      { tag: 'earnest', count: 5 },
      { tag: 'grandiose', count: 4 },
      { tag: 'cold', count: 4 },
    ]
    const ranked = rankByDistinctiveness(tones, 'tone')
    expect(ranked.map(t => t.tag)).toEqual(['grandiose', 'cold', 'earnest'])
    // Same set, just reordered — nothing added or dropped.
    expect(ranked.map(t => t.tag).sort()).toEqual(['cold', 'earnest', 'grandiose'])
  })

  it('does not let a single loved film headline over genuinely dominant taste', () => {
    // A loved film (rating 9-10) maps to weight ~5, so one loved film gives count≈5.
    // An ultra-rare tag from ONE loved film must NOT outrank a moderately-distinctive tag
    // backed by many films — √support + IDF clamp keep the well-supported signal on top.
    const moods = [
      { tag: 'melancholic', count: 16 }, // ~8 films
      { tag: 'euphoric', count: 5 },      // ONE loved film, ultra-rare (0.3%)
    ]
    expect(rankByDistinctiveness(moods, 'mood').map(m => m.tag)).toEqual(['melancholic', 'euphoric'])
  })

  it('is stable for equal scores and tolerates short/empty input', () => {
    expect(rankByDistinctiveness([], 'tone')).toEqual([])
    expect(rankByDistinctiveness([{ tag: 'warm', count: 3 }], 'tone')).toEqual([{ tag: 'warm', count: 3 }])
    expect(rankByDistinctiveness(null, 'tone')).toEqual([])
  })
})

describe('distinctivenessScore', () => {
  it('accepts fit entries via .profile and weights by support', () => {
    // challenging_art (3.1%) vs prestige_drama (17.6%), tied by count → challenging_art wins on IDF.
    const a = distinctivenessScore('fit', { profile: 'challenging_art', count: 2 })
    const b = distinctivenessScore('fit', { profile: 'prestige_drama', count: 2 })
    expect(a).toBeGreaterThan(b)
  })
})
