import { describe, it, expect } from 'vitest'

import {
  outcomeRates,
  conversionFunnel,
  captureByPlacement,
  repeatedPickFatigue,
  intraListDiversity,
  languageMix,
  reasonCoverage,
  scoreExplanation,
  explanationQuality,
  coldWarmSegmentation,
  tierForFilms,
  summarizeEvaluation,
  REASON_VERDICT,
} from '../recommendationEval'
import {
  SAMPLE_IMPRESSIONS,
  SAMPLE_RESULT_SET,
  SAMPLE_REASONS,
  SAMPLE_USER_STATS,
  SAMPLE_DATASET,
} from '../fixtures'

// F8A: these are EVALUATION utilities — they must never change the engine, only
// measure its output. The contracts below lock the metric definitions so a
// future tuning phase can trust "the number moved" rather than "the metric did."

describe('outcomeRates', () => {
  it('reports rates + the all-important outcome-capture rate', () => {
    const r = outcomeRates(SAMPLE_IMPRESSIONS)
    expect(r.total).toBe(SAMPLE_IMPRESSIONS.length)
    expect(r.skipRate).toBeGreaterThan(0)
    // capture rate = any single outcome fired; between 0 and 1
    expect(r.outcomeCaptureRate).toBeGreaterThan(0)
    expect(r.outcomeCaptureRate).toBeLessThanOrEqual(1)
  })

  it('is null-safe on empty / garbage input', () => {
    expect(outcomeRates([]).total).toBe(0)
    expect(outcomeRates(null).outcomeCaptureRate).toBe(0)
    expect(outcomeRates([{}]).skipRate).toBe(0)
  })
})

// F8B: the conversion funnel + per-placement capture make the repaired outcome
// fields legible (the F8A baseline showed near-zero everywhere).
describe('conversionFunnel (F8B)', () => {
  it('computes shown→outcome and clicked→saved/watched conversions', () => {
    const f = conversionFunnel(SAMPLE_IMPRESSIONS)
    expect(f.shown).toBe(SAMPLE_IMPRESSIONS.length)
    expect(f.clicked).toBe(2)              // films 101 + 202
    expect(f.clickedToWatched).toBe(1)     // 101 was clicked AND watched
    expect(f.clickedToWatchedRate).toBe(0.5)
    expect(f.shownToOutcomeRate).toBeGreaterThan(0)
    expect(f.shownToOutcomeRate).toBeLessThanOrEqual(1)
  })

  it('is null-safe', () => {
    expect(conversionFunnel([]).shown).toBe(0)
    expect(conversionFunnel(null).clickedToSavedRate).toBe(0)
  })
})

describe('captureByPlacement (F8B)', () => {
  it('reports capture per placement, busiest first', () => {
    const rows = captureByPlacement(SAMPLE_IMPRESSIONS)
    const hero = rows.find(r => r.placement === 'hero')
    const byl = rows.find(r => r.placement === 'because_you_loved')
    expect(hero.impressions).toBe(6)
    expect(hero.anyOutcomeRate).toBeGreaterThan(0)
    expect(byl.anyOutcomeRate).toBe(0) // fixture: no outcomes on that row
    expect(rows[0].impressions).toBeGreaterThanOrEqual(rows[rows.length - 1].impressions)
  })
})

describe('repeatedPickFatigue', () => {
  it('detects a planted back-to-back hero repeat (déjà vu)', () => {
    const r = repeatedPickFatigue(SAMPLE_IMPRESSIONS, { placement: 'hero' })
    expect(r.surface).toBe('hero')
    expect(r.maxStreak).toBe(2) // user A repeats movie 102 on consecutive days
    expect(r.consecutiveRepeatRate).toBeGreaterThan(0)
    expect(r.distinctRatio).toBeLessThan(1) // not all distinct → there IS a repeat
  })

  it('reports perfect distinctRatio when nothing repeats', () => {
    const rows = [
      { userId: 'X', movieId: 1, placement: 'hero', shownDate: '2026-05-01' },
      { userId: 'X', movieId: 2, placement: 'hero', shownDate: '2026-05-02' },
    ]
    const r = repeatedPickFatigue(rows)
    expect(r.distinctRatio).toBe(1)
    expect(r.consecutiveRepeatRate).toBe(0)
    expect(r.maxStreak).toBe(0)
  })
})

describe('intraListDiversity', () => {
  it('scores a clustered result set below 1 on every axis', () => {
    const d = intraListDiversity(SAMPLE_RESULT_SET)
    expect(d.n).toBe(SAMPLE_RESULT_SET.length)
    expect(d.directorDiversity).toBeLessThan(1) // 3× Villeneuve
    expect(d.genreDiversity).toBeLessThan(1)
    expect(d.composite).toBeGreaterThan(0)
    expect(d.composite).toBeLessThan(1)
  })

  it('returns zeros for an empty set', () => {
    expect(intraListDiversity([]).composite).toBe(0)
  })
})

describe('languageMix', () => {
  it('flags English dominance + counts distinct languages', () => {
    const l = languageMix(SAMPLE_RESULT_SET)
    expect(l.dominantLanguage).toBe('en')
    expect(l.dominantShare).toBeGreaterThan(0.5)
    expect(l.distinctLanguages).toBeGreaterThanOrEqual(2)
    expect(l.nonEnglishShare).toBeGreaterThan(0)
  })
})

describe('reasonCoverage', () => {
  it('separates grounded from generic reasons and counts seeds', () => {
    const c = reasonCoverage(SAMPLE_IMPRESSIONS)
    expect(c.groundedShare + c.genericShare).toBeCloseTo(1, 1)
    expect(c.genericShare).toBeGreaterThan(0) // fixture has one generic
    expect(c.seedShare).toBeGreaterThan(0)
    expect(c.distinctReasonTypes).toBeGreaterThan(1)
  })
})

describe('scoreExplanation — rubric verdicts', () => {
  it('GOOD: grounded + specific + safe', () => {
    const r = scoreExplanation({ text: 'Because you loved Parasite', type: 'seed_similar', seedTitle: 'Parasite' })
    expect(r.verdict).toBe(REASON_VERDICT.GOOD)
    expect(r.safe).toBe(true)
    expect(r.specific).toBe(true)
  })

  it('WEAK: safe + grounded but names nothing concrete', () => {
    const r = scoreExplanation({ text: 'Close to your taste profile', type: 'embedding_similarity' })
    expect(r.verdict).toBe(REASON_VERDICT.WEAK)
    expect(r.safe).toBe(true)
    expect(r.specific).toBe(false)
  })

  it('GENERIC: a known empty phrase', () => {
    expect(scoreExplanation({ text: 'Picked for you', type: 'generic' }).verdict)
      .toBe(REASON_VERDICT.GENERIC)
    expect(scoreExplanation({ text: 'Recommended for you', type: 'unknown' }).verdict)
      .toBe(REASON_VERDICT.GENERIC)
  })

  it('UNSAFE: any fabricated / unsupported claim is hard-failed with score 0', () => {
    const critics = scoreExplanation({ text: 'Critics agree this is the best film of the year', type: 'quality' })
    expect(critics.verdict).toBe(REASON_VERDICT.UNSAFE)
    expect(critics.safe).toBe(false)
    expect(critics.score).toBe(0)

    const streaming = scoreExplanation({ text: 'Award-winning and now streaming on Netflix', type: 'trending' })
    expect(streaming.verdict).toBe(REASON_VERDICT.UNSAFE)
  })

  it('handles empty text without throwing', () => {
    const r = scoreExplanation({ text: '', type: null })
    expect(r.words).toBe(0)
    expect(r.verdict).toBeDefined()
  })
})

describe('explanationQuality (aggregate)', () => {
  it('exercises all four verdicts across the sample corpus and surfaces unsafe count', () => {
    const q = explanationQuality(SAMPLE_REASONS)
    expect(q.total).toBe(SAMPLE_REASONS.length)
    expect(q.byVerdict.good).toBeGreaterThan(0)
    expect(q.byVerdict.weak).toBeGreaterThan(0)
    expect(q.byVerdict.generic).toBeGreaterThan(0)
    expect(q.byVerdict.unsafe).toBe(2)
    expect(q.unsafeShare).toBeGreaterThan(0) // trust gate: this must be 0 in prod
  })
})

describe('coldWarmSegmentation', () => {
  it('buckets users into cold / warming / warm', () => {
    const s = coldWarmSegmentation(SAMPLE_USER_STATS)
    expect(s.total).toBe(SAMPLE_USER_STATS.length)
    expect(s.cold).toBe(2)
    expect(s.warming).toBe(1)
    expect(s.warm).toBe(1)
  })

  it('tierForFilms boundaries', () => {
    expect(tierForFilms(0)).toBe('cold')
    expect(tierForFilms(4)).toBe('cold')
    expect(tierForFilms(5)).toBe('warming')
    expect(tierForFilms(19)).toBe('warming')
    expect(tierForFilms(20)).toBe('warm')
  })
})

describe('summarizeEvaluation', () => {
  it('composes a full report from the bundled dataset', () => {
    const report = summarizeEvaluation(SAMPLE_DATASET)
    expect(report.fitQuality).not.toBeNull()
    expect(report.repeatedPickFatigue.surface).toBe('hero')
    expect(report.diversity.n).toBeGreaterThan(0)
    expect(report.explanationQuality.byVerdict.unsafe).toBe(2)
    expect(report.coldWarm.total).toBe(SAMPLE_USER_STATS.length)
  })

  it('degrades gracefully to null sections when inputs are missing', () => {
    const report = summarizeEvaluation({})
    expect(report.fitQuality).toBeNull()
    expect(report.diversity).toBeNull()
    expect(report.explanationQuality).toBeNull()
  })
})
