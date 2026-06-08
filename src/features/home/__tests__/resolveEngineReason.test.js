import { describe, it, expect } from 'vitest'
import { resolveEngineReason } from '../useHomeData'

// resolveEngineReason maps the engine's pickReason fields to the hero's displayed
// "Why this pick" caption. F4.6 — Home NEVER fabricates the user's current mood:
// genuine seed/personalized reasons show; generic/missing/unknown → null (no panel),
// and there is NO "For your … night" fallback. See useHomeData.jsx.
describe('resolveEngineReason', () => {
  it('renders a real seed match as "Because you loved X"', () => {
    expect(resolveEngineReason({ reasonType: 'seed_embedding', seedTitle: 'Parasite' }))
      .toBe('Because you loved Parasite')
    expect(resolveEngineReason({ reasonType: 'seed_similar', seedTitle: 'Parasite' }))
      .toBe('Because you loved Parasite')
  })

  it('passes through a genuine non-generic personalized reason verbatim', () => {
    expect(resolveEngineReason({ reason: 'Matches your taste', reasonType: 'genre_match' }))
      .toBe('Matches your taste')
    expect(resolveEngineReason({ reason: 'From a director you love', reasonType: 'director' }))
      .toBe('From a director you love')
    expect(resolveEngineReason({ reason: 'A hidden gem for you', reasonType: 'hidden_gem' }))
      .toBe('A hidden gem for you')
  })

  it('returns null for every GENERIC reason type (no fabricated caption)', () => {
    for (const reasonType of ['quality', 'recency', 'default', 'content_match']) {
      expect(resolveEngineReason({ reason: 'Critically acclaimed', reasonType })).toBeNull()
    }
  })

  it('returns null when the reason is missing or the reasonType is absent', () => {
    expect(resolveEngineReason({ reason: null, reasonType: null, seedTitle: null })).toBeNull()
    expect(resolveEngineReason({})).toBeNull()
    expect(resolveEngineReason({ reason: 'Critically acclaimed', reasonType: null })).toBeNull()
    // A seed type with no seedTitle cannot form a grounded reason → null.
    expect(resolveEngineReason({ reasonType: 'seed_embedding', seedTitle: null })).toBeNull()
  })

  it('shows a non-generic reason verbatim but returns null when it is empty', () => {
    expect(resolveEngineReason({ reason: 'Something specific', reasonType: 'unknown_type' }))
      .toBe('Something specific')
    expect(resolveEngineReason({ reason: null, reasonType: 'unknown_type' })).toBeNull()
  })

  it('NEVER emits a "For your … night" mood-state sentence', () => {
    const inputs = [
      { reason: 'Critically acclaimed', reasonType: 'quality' },
      { reason: null, reasonType: 'default' },
      { reason: 'Trending now', reasonType: 'recency' },
      {},
    ]
    for (const pick of inputs) {
      const out = resolveEngineReason(pick)
      expect(out === null || !/for your .* night/i.test(out)).toBe(true)
    }
  })
})
