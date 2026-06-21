import { describe, it, expect } from 'vitest'
import { deriveRatingLanguage, MIN_RATINGS_FOR_LANGUAGE } from '../ratingLanguage'
import { deriveTasteJourney, MIN_FILMS_FOR_JOURNEY } from '../tasteJourney'
import { deriveDnaBarcode, barcodeSeed } from '../dnaBarcode'

const r = (rating) => ({ rating })

describe('deriveRatingLanguage — half-star-capable 1–10 contract', () => {
  it('returns null with no valid ratings', () => {
    expect(deriveRatingLanguage({ ratings: [] })).toBeNull()
    expect(deriveRatingLanguage({ ratings: [r(0), r(11), r(null), r(3.5)] })).toBeNull()
  })

  it('buckets stored 1–10 into ten 0.5★ buckets; ignores invalid', () => {
    const out = deriveRatingLanguage({ ratings: [r(1), r(2), r(10), r(10), r(7), r(0), r(99), r(undefined)] })
    expect(out.count).toBe(5)
    expect(out.buckets).toHaveLength(10)
    expect(out.buckets[0]).toMatchObject({ rating: 1, stars: 0.5, count: 1 }) // a half-star IS representable
    expect(out.buckets[9]).toMatchObject({ rating: 10, stars: 5, count: 2 })
    expect(out.buckets[6]).toMatchObject({ rating: 7, stars: 3.5, count: 1 })
  })

  it('computes average (stars), mode (high-tie-break), five-star count', () => {
    const out = deriveRatingLanguage({ ratings: [r(8), r(8), r(10), r(10), r(6)] })
    expect(out.averageStars).toBeCloseTo(((8 + 8 + 10 + 10 + 6) / 5) / 2, 5) // 4.2
    expect(out.fiveStarCount).toBe(2)
    // tie between rating 8 (x2) and rating 10 (x2) → deterministic high wins → mode rating 10
    expect(out.mode).toBe(10)
    expect(out.modeStars).toBe(5)
  })

  it('suppresses interpretation below the minimum sample (calibrating)', () => {
    const few = Array.from({ length: MIN_RATINGS_FOR_LANGUAGE - 1 }, () => r(10))
    const out = deriveRatingLanguage({ ratings: few })
    expect(out.eligible).toBe(false)
    expect(out.languageKey).toBe('calibrating')
  })

  it('maps distribution to language using more than the average (warm-selective vs generous)', () => {
    // High average but FEW five-stars → warm-selective (selective at the top)
    const selective = [...Array(10).fill(r(8)), ...Array(4).fill(r(9)), r(10)] // avg 4.05★, 5★ share ~1/15
    const a = deriveRatingLanguage({ ratings: selective })
    expect(a.eligible).toBe(true)
    expect(a.languageKey).toBe('warm-selective')
    // High average WITH many five-stars → generous
    const generous = [...Array(8).fill(r(10)), ...Array(6).fill(r(8))] // avg ~4.57★, 5★ share 8/14
    const b = deriveRatingLanguage({ ratings: generous })
    expect(b.languageKey).toBe('generous')
    // Low average → demanding
    const demanding = Array.from({ length: 12 }, () => r(4)) // 2.0★
    expect(deriveRatingLanguage({ ratings: demanding }).languageKey).toBe('demanding')
  })

  it('is order-independent (deterministic)', () => {
    const set = [r(8), r(6), r(10), r(4), r(8), r(10), r(2), r(8)]
    const a = deriveRatingLanguage({ ratings: set })
    const b = deriveRatingLanguage({ ratings: [...set].reverse() })
    expect(a).toEqual(b)
  })
})

// ── Journey ──────────────────────────────────────────────────────────────────
const film = (iso, ...moods) => ({ watched_at: iso, movies: { mood_tags: moods } })
// N films spread one per month starting at startYM, cycling the given mood per segment.
function spread(n, startYear, moodCycle) {
  const out = []
  for (let i = 0; i < n; i++) {
    const month = i % 12
    const year = startYear + Math.floor(i / 12)
    const mood = moodCycle(i, n)
    out.push(film(`${year}-${String(month + 1).padStart(2, '0')}-15T12:00:00Z`, mood, 'cinematic'))
  }
  return out
}

describe('deriveTasteJourney — never forces three, never fabricates', () => {
  it('returns [] below the film/spread floor', () => {
    expect(deriveTasteJourney({ history: [] })).toEqual([])
    expect(deriveTasteJourney({ history: spread(MIN_FILMS_FOR_JOURNEY - 1, 2024, () => 'tender') })).toEqual([])
    // enough films but all in one month (no span)
    const sameMonth = Array.from({ length: 14 }, () => film('2025-03-10T12:00:00Z', 'tender'))
    expect(deriveTasteJourney({ history: sameMonth })).toEqual([])
  })

  it('produces two chapters for a medium span', () => {
    const h = spread(16, 2024, (i, n) => (i < n / 2 ? 'tender' : 'tense')) // 16 films over 16 months
    const out = deriveTasteJourney({ history: h })
    expect(out).toHaveLength(2)
    expect(out[0].fromYear).toBe(2024)
    expect(out[0].tags.length).toBeGreaterThan(0)
    // each chapter has a real date range and ≥ MIN_PER_CHAPTER films
    for (const c of out) expect(c.count).toBeGreaterThanOrEqual(4)
    // distinct differentiators
    expect(out[0].title).not.toBe(out[1].title)
  })

  it('produces three chapters only for a larger span', () => {
    const h = spread(30, 2023, (i, n) => (i < n / 3 ? 'tender' : i < (2 * n) / 3 ? 'tense' : 'mythic'))
    const out = deriveTasteJourney({ history: h })
    expect(out).toHaveLength(3)
    expect(out.map((c) => c.fromYear)).toEqual([...out.map((c) => c.fromYear)].sort((a, b) => a - b)) // chronological
  })

  it('never claims a trait from a single film (mood support floor)', () => {
    // 16 films: each chapter has its mood in many films + a one-off 'noir' that must NOT headline
    const h = spread(16, 2024, (i, n) => (i < n / 2 ? 'tender' : 'tense'))
    h[3].movies.mood_tags = ['noir'] // single-film mood
    const out = deriveTasteJourney({ history: h })
    expect(out.every((c) => c.tags.every((t) => t !== 'Noir'))).toBe(true)
  })
})

// ── Barcode (privacy-safe) ─────────────────────────────────────────────────────
describe('deriveDnaBarcode — deterministic + privacy-safe', () => {
  const base = { evidenceVersion: 2, archetype: ['The Tender', 'The Auteurist', 'The Patient'], tags: ['Tender', 'Patient', 'Designed', 'Open'] }
  it('same safe input → identical barcode', () => {
    expect(deriveDnaBarcode(base)).toEqual(deriveDnaBarcode({ ...base }))
  })
  it('tag ORDER does not change it (sorted seed)', () => {
    const reordered = { ...base, tags: ['Open', 'Designed', 'Tender', 'Patient'] }
    expect(deriveDnaBarcode(reordered)).toEqual(deriveDnaBarcode(base))
    expect(barcodeSeed(reordered)).toBe(barcodeSeed(base))
  })
  it('changing an allowed DNA input changes it', () => {
    const changed = { ...base, tags: [...base.tags.slice(0, 3), 'Mythic'] }
    expect(deriveDnaBarcode(changed)).not.toEqual(deriveDnaBarcode(base))
  })
  it('seed never includes a user id / raw values (only version+archetype+tags participate)', () => {
    const seed = barcodeSeed(base)
    expect(seed).toMatch(/^v2::/)
    expect(seed).not.toMatch(/SELF|@|[0-9a-f]{8}-[0-9a-f]{4}/i) // no uuid/email
    // passing an extraneous userId is ignored by the seed
    expect(barcodeSeed({ ...base, userId: 'SELF-UUID', films: [1, 2, 3] })).toBe(seed)
  })
  it('produces purely visual bars (no data values)', () => {
    const bars = deriveDnaBarcode({ ...base, bars: 12 })
    expect(bars).toHaveLength(12)
    for (const b of bars) expect(Object.keys(b).sort()).toEqual(['color', 'opacity', 'scale', 'weight'])
  })
})
