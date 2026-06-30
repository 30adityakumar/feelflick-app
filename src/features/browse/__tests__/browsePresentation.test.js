import { describe, it, expect } from 'vitest'
import { cardEvidence, cardBadge, rankingCopy, sortSummary, PRIMARY_SORTS } from '../browsePresentation'

// Honesty contract for /browse cards + ordering copy: objective catalogue facts
// only — no match %, no "Best fit", no fabricated personal reason, and nothing
// claimed for text-search (TMDB) rows that lack engine metadata.

const sb = { id: 5, title: 'Sample', ff: 86, critic: 94, criticConfidence: 82, audience: 84, cult: 80, hidden: 74, exceptional: true }
const tmdb = { id: -123, title: 'TMDB Row', ff: 78, critic: 0, criticConfidence: 0, cult: 0, hidden: 0, exceptional: false }

describe('cardEvidence', () => {
  it('FeelFlick-rating sort shows the overall rating, not a personal claim', () => {
    const e = cardEvidence(sb, 'ff_rating.desc')
    expect(e.lead).toBe('FeelFlick 86')
    expect(e.detail).toMatch(/overall rating/i)
    expect(JSON.stringify(e)).not.toMatch(/%|match|for you|best fit/i)
  })

  it('Critics sort omits a critic number when confidence is too low', () => {
    const lowConf = cardEvidence({ ...sb, critic: 90, criticConfidence: 20 }, 'ff_critic_rating.desc')
    expect(lowConf.lead).toMatch(/not established/i)
    const ok = cardEvidence(sb, 'ff_critic_rating.desc')
    expect(ok.lead).toBe('Critics 94')
  })

  it('returns null for TMDB-only rows (no engine metadata to claim)', () => {
    expect(cardEvidence(tmdb, 'ff_rating.desc')).toBeNull()
    expect(cardEvidence(tmdb, 'ff_critic_rating.desc')).toBeNull()
  })

  it('newest sort adds no evidence (year already shown)', () => {
    expect(cardEvidence(sb, 'release_date.desc')).toBeNull()
  })
})

describe('cardBadge', () => {
  it('is null for TMDB-only rows', () => {
    expect(cardBadge(tmdb, 'ff_rating.desc')).toBeNull()
  })
  it('prefers the badge matching the active sort', () => {
    expect(cardBadge(sb, 'discovery_potential.desc')).toBe('Hidden gem')
    expect(cardBadge(sb, 'ff_critic_rating.desc')).toBe("Critics' pick")
  })
  it('returns at most one badge and only above thresholds', () => {
    const plain = { id: 1, critic: 50, criticConfidence: 90, cult: 10, hidden: 10, exceptional: false }
    expect(cardBadge(plain, 'ff_rating.desc')).toBeNull()
  })
})

describe('ranking copy honesty', () => {
  it('default copy explains territory + overall rating, never "for you"/match %', () => {
    const c = rankingCopy('ff_rating.desc')
    expect(c).toMatch(/you chose the territory/i)
    expect(c).toMatch(/overall rating/i)
    expect(c).not.toMatch(/%|made for you|best fit/i)
  })
  it('non-personal sorts state personal taste does not determine order', () => {
    for (const s of ['discovery_potential.desc', 'ff_critic_rating.desc', 'release_date.desc']) {
      expect(rankingCopy(s)).toMatch(/personal taste does not/i)
    }
  })
})

describe('sort tabs', () => {
  it('uses the honest default label "FeelFlick rating" (not "For you")', () => {
    expect(PRIMARY_SORTS[0]).toEqual({ value: 'ff_rating.desc', label: 'FeelFlick rating' })
    expect(PRIMARY_SORTS.map(s => s.label)).not.toContain('For you')
  })
  it('exposes the three primary sorts (Hidden gems moved to filter)', () => {
    expect(PRIMARY_SORTS.map(s => s.value)).toEqual([
      'ff_rating.desc', 'ff_critic_rating.desc', 'release_date.desc',
    ])
    expect(PRIMARY_SORTS.map(s => s.value)).not.toContain('discovery_potential.desc')
    expect(sortSummary('ff_critic_rating.desc')).toMatch(/critic/i)
  })
})
