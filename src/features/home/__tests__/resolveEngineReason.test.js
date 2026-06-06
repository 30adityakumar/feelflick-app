import { describe, it, expect } from 'vitest'
import { resolveEngineReason } from '../useHomeData'

// resolveEngineReason maps the engine's pickReason fields to the hero's
// displayed "Why this pick" caption. See useHomeData.jsx.
describe('resolveEngineReason', () => {
  it('renders a real seed match as "Because you loved X" (any mood)', () => {
    expect(resolveEngineReason({ reasonType: 'seed_embedding', seedTitle: 'Parasite' }, 'tender'))
      .toBe('Because you loved Parasite')
    // Phrasing wins regardless of the pool mood.
    expect(resolveEngineReason({ reasonType: 'seed_similar', seedTitle: 'Parasite' }, 'cozy'))
      .toBe('Because you loved Parasite')
  })

  it('replaces a GENERIC quality label with the session-mood reason', () => {
    expect(resolveEngineReason({ reason: 'Critically acclaimed', reasonType: 'quality' }, 'thrilled'))
      .toBe('For your tense night')
  })

  it('passes through an honest personalized tier verbatim', () => {
    expect(resolveEngineReason({ reason: 'Matches your taste', reasonType: 'genre_match' }, 'thrilled'))
      .toBe('Matches your taste')
  })

  it('returns null when generic and the mood is unknown (no honest caption)', () => {
    expect(resolveEngineReason({ reason: 'Critically acclaimed', reasonType: 'quality' }, 'unknownmood'))
      .toBeNull()
  })
})
