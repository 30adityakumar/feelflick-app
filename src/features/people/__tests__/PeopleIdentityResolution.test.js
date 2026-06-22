import { describe, it, expect } from 'vitest'
import { mergeSimilarity, compareCandidates, deriveDiscovery, deriveSuggestedFOF, deriveBio } from '../derive/peopleDiscovery'

// Pure discovery derivation: consent gate (opt-in projection is authoritative), deterministic order,
// Strongest = qualified-only, More = qualified + cautious, Suggested = FOF-only with genuine "via",
// truthful bio (never films-in-common as a watched total), and no generated handles.

const sim = (id, s, inCommon) => ({ user_b_id: id, overall_similarity: s, movies_in_common: inCommon })
const ident = (id, name = id.toUpperCase()) => [id, { id, name, avatar_url: null }]

describe('mergeSimilarity — normalize, dedupe, deterministic order', () => {
  it('merges both directions, drops self, sorts sim→inCommon→id', () => {
    const out = mergeSimilarity({
      simAsA: [sim('a', 0.9, 18), sim('self', 1, 1)],
      simAsB: [{ user_a_id: 'b', overall_similarity: 0.9, movies_in_common: 4 }, { user_a_id: 'c', overall_similarity: 0.5, movies_in_common: 9 }],
      selfId: 'self',
    })
    expect(out.map((r) => r.id)).toEqual(['a', 'b', 'c']) // a,b tie at 90% → a wins on inCommon(18>4); c last
    expect(out.find((r) => r.id === 'self')).toBeUndefined()
    expect(out[0].match).toBe(90)
  })
  it('dedupes a counterpart appearing in both directions (keeps highest similarity)', () => {
    const out = mergeSimilarity({ simAsA: [sim('a', 0.6, 5)], simAsB: [{ user_a_id: 'a', overall_similarity: 0.8, movies_in_common: 5 }], selfId: 'me' })
    expect(out).toHaveLength(1)
    expect(out[0].match).toBe(80)
  })
  it('compareCandidates breaks exact ties by id ascending', () => {
    expect(compareCandidates({ match: 70, inCommon: 5, id: 'z' }, { match: 70, inCommon: 5, id: 'a' })).toBeGreaterThan(0)
  })
})

describe('deriveDiscovery — consent gate + Strongest/More', () => {
  const merged = mergeSimilarity({
    simAsA: [sim('opt1', 0.92, 18), sim('opt2', 0.6, 8), sim('optOutNoId', 0.8, 10), sim('optForming', 0.9, 6), sim('noIdentity', 0.7, 9), sim('insuff', 0.95, 2)],
    simAsB: [], selfId: 'me',
  })
  // opt-in projection (authoritative): opt1, opt2, optForming, insuff, noIdentity are opted in; optOutNoId is NOT.
  const fingerprintByUser = new Map([
    ['opt1', { total: 40 }], ['opt2', { total: 22 }], ['optForming', { total: 3 }], ['insuff', { total: 50 }], ['noIdentity', { total: 12 }],
  ])
  const discoverableTasteIds = new Set(fingerprintByUser.keys())
  const usersById = new Map([ident('opt1', 'Ana'), ident('opt2', 'Bo'), ident('optForming', 'Cy'), ident('insuff', 'Di'), ident('optOutNoId', 'Zed')])
  const { strongest, more } = deriveDiscovery({ mergedSimilarity: merged, discoverableTasteIds, usersById, fingerprintByUser })

  it('an opted-OUT candidate never appears (not in the taste projection) even with high similarity', () => {
    const ids = [...strongest, ...more].map((c) => c.id)
    expect(ids).not.toContain('optOutNoId')
  })
  it('an opted-in candidate with no resolved identity is dropped (no Anonymous card)', () => {
    expect([...strongest, ...more].map((c) => c.id)).not.toContain('noIdentity')
  })
  it('Strongest contains ONLY evidence-qualified candidates', () => {
    expect(strongest.every((c) => c.matchPresentation.qualified)).toBe(true)
    expect(strongest.map((c) => c.id)).toContain('opt1') // 92% / 18 in common → qualified
    expect(strongest.map((c) => c.id)).not.toContain('optForming') // total 3 < 5 → forming, not strongest
    expect(strongest.map((c) => c.id)).not.toContain('insuff')     // 2 in common < 3 → insufficient
  })
  it('More carries the cautious (forming/insufficient) candidates with no band', () => {
    const forming = more.find((c) => c.id === 'optForming')
    const insuff = more.find((c) => c.id === 'insuff')
    expect(forming).toBeTruthy(); expect(forming.matchPresentation.qualified).toBe(false)
    expect(insuff).toBeTruthy(); expect(insuff.matchPresentation.qualified).toBe(false)
  })
})

describe('truthful bio + no handles', () => {
  it('bio uses the candidate total (fingerprint.total), never films-in-common', () => {
    const merged = mergeSimilarity({ simAsA: [sim('a', 0.9, 18)], simAsB: [], selfId: 'me' })
    const fingerprintByUser = new Map([['a', { total: 40, topMoodTags: [{ key: 'tender' }], topToneTags: [{ key: 'reflective' }] }]])
    const { strongest } = deriveDiscovery({ mergedSimilarity: merged, discoverableTasteIds: new Set(['a']), usersById: new Map([ident('a', 'Ana')]), fingerprintByUser })
    expect(strongest[0].bio).toBe('Tender + Reflective films · 40 watched') // 40 = total, NOT 18 in common
    expect(strongest[0].bio).not.toContain('18')
  })
  it('omits the count when the candidate exposes no total (never substitutes films-in-common or 0)', () => {
    expect(deriveBio({ fingerprint: { topMoodTags: [{ key: 'tense' }], topToneTags: [{ key: 'earnest' }] } })).toBe('Tense + Earnest films')
    expect(deriveBio({ fingerprint: { total: 0 } })).toBe('Just getting started')
    expect(deriveBio({})).toBe('Just getting started')
  })
  it('candidate objects expose NO generated handle', () => {
    const merged = mergeSimilarity({ simAsA: [sim('a', 0.9, 18)], simAsB: [], selfId: 'me' })
    const { strongest } = deriveDiscovery({ mergedSimilarity: merged, discoverableTasteIds: new Set(['a']), usersById: new Map([ident('a', 'Ana')]), fingerprintByUser: new Map([['a', { total: 40 }]]) })
    expect(strongest[0]).not.toHaveProperty('handle')
  })
})

describe('deriveSuggestedFOF — FOF-only, opt-in gated, genuine via', () => {
  const usersById = new Map([ident('cand', 'Cand'), ident('viaFriend', 'Mira'), ident('shownAlready', 'Shown'), ident('notOptIn', 'NoOpt')])
  const discoverableTasteIds = new Set(['cand', 'shownAlready'])
  const viaNames = new Map([['viaFriend', 'Mira']])
  const base = { followingIds: new Set(['viaFriend']), selfId: 'me', usersById, fingerprintByUser: new Map(), discoverableTasteIds, shownIds: new Set(['shownAlready']), viaNames }

  it('returns an opted-in FOF candidate with a genuine via-friend', () => {
    const out = deriveSuggestedFOF({ ...base, fofRows: [{ suggested_user_id: 'cand', via_user_id: 'viaFriend' }] })
    expect(out).toHaveLength(1)
    expect(out[0]).toMatchObject({ id: 'cand', viaFriend: 'Mira' })
  })
  it('drops a candidate without a resolvable via name (never fabricates via)', () => {
    const out = deriveSuggestedFOF({ ...base, fofRows: [{ suggested_user_id: 'cand', via_user_id: 'unknownVia' }] })
    expect(out).toHaveLength(0)
  })
  it('drops an opted-OUT FOF candidate, an already-shown one, and self', () => {
    const out = deriveSuggestedFOF({ ...base, fofRows: [
      { suggested_user_id: 'notOptIn', via_user_id: 'viaFriend' },
      { suggested_user_id: 'shownAlready', via_user_id: 'viaFriend' },
      { suggested_user_id: 'me', via_user_id: 'viaFriend' },
    ] })
    expect(out).toHaveLength(0)
  })
})
