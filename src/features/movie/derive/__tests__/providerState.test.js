import { describe, it, expect } from 'vitest'

import { classifyMovieProviderState } from '../providerState'

const P = (over = {}) => ({ flatrate: [], rent: [], buy: [], link: '', ...over })

describe('classifyMovieProviderState — F5.7 provider truth', () => {
  it('1. idle when no request has started (providers absent)', () => {
    expect(classifyMovieProviderState({}).status).toBe('idle')
    expect(classifyMovieProviderState({ providers: null }).status).toBe('idle')
  })

  it('2. loading while pending', () => {
    expect(classifyMovieProviderState({ loading: true }).status).toBe('loading')
  })

  it('3/4/5. found when any flatrate / rent / buy offer exists', () => {
    expect(classifyMovieProviderState({ providers: P({ flatrate: [{ id: 8 }] }) }).status).toBe('found')
    expect(classifyMovieProviderState({ providers: P({ rent: [{ id: 2 }] }) }).status).toBe('found')
    expect(classifyMovieProviderState({ providers: P({ buy: [{ id: 3 }] }) }).status).toBe('found')
  })

  it('6. empty for a successful zero-provider response', () => {
    expect(classifyMovieProviderState({ providers: P() }).status).toBe('empty')
    expect(classifyMovieProviderState({ providers: P() }).hasAny).toBe(false)
  })

  it('7. error wins over empty arrays', () => {
    expect(classifyMovieProviderState({ failed: true, providers: P() }).status).toBe('error')
    expect(classifyMovieProviderState({ failed: true, providers: P({ flatrate: [{ id: 8 }] }) }).status).toBe('error')
  })

  it('8. malformed provider shape is safe', () => {
    expect(classifyMovieProviderState({ providers: { flatrate: 'nope' } }).status).toBe('empty')
    expect(classifyMovieProviderState({ providers: {} }).status).toBe('empty')
    expect(() => classifyMovieProviderState({ providers: { flatrate: null, rent: undefined } })).not.toThrow()
  })

  it('9. does not mutate the providers object', () => {
    const providers = P({ flatrate: [{ id: 8 }] })
    const snap = JSON.stringify(providers)
    classifyMovieProviderState({ providers })
    expect(JSON.stringify(providers)).toBe(snap)
  })

  it('10. a link-only result is empty, not found', () => {
    expect(classifyMovieProviderState({ providers: P({ link: 'https://justwatch.com' }) }).status).toBe('empty')
  })
})
