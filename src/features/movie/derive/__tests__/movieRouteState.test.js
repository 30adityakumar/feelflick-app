import { describe, it, expect } from 'vitest'

import { classifyMovieRouteState } from '../movieRouteState'

describe('classifyMovieRouteState — F5.7 safe route errors', () => {
  it('31/32. malformed / zero / negative id → invalid', () => {
    expect(classifyMovieRouteState({ routeId: 'abc', hasMovie: false, error: { kind: 'not_found' } }).kind).toBe('invalid')
    expect(classifyMovieRouteState({ routeId: '0', hasMovie: false, error: null }).kind).toBe('invalid')
    expect(classifyMovieRouteState({ routeId: '-5', hasMovie: false, error: null }).kind).toBe('invalid')
    expect(classifyMovieRouteState({ routeId: '', hasMovie: false, error: null }).kind).toBe('invalid')
    expect(classifyMovieRouteState({ routeId: null, hasMovie: false, error: null }).kind).toBe('invalid')
    expect(classifyMovieRouteState({ routeId: '12.5', hasMovie: false, error: null }).kind).toBe('invalid')
  })

  it('33. a known not-found result (valid id) → not_found', () => {
    expect(classifyMovieRouteState({ routeId: '496243', hasMovie: false, error: { kind: 'not_found' } }).kind).toBe('not_found')
  })

  it('34. network/unknown error (valid id) → load_error', () => {
    expect(classifyMovieRouteState({ routeId: '496243', hasMovie: false, error: { kind: 'load_error' } }).kind).toBe('load_error')
    expect(classifyMovieRouteState({ routeId: '496243', hasMovie: false, error: {} }).kind).toBe('load_error')
  })

  it('35. valid movie + no error → null', () => {
    expect(classifyMovieRouteState({ routeId: '496243', hasMovie: true, error: null }).kind).toBeNull()
  })

  it('36/37. returned copy contains no raw error text; raw message never propagates', () => {
    const r = classifyMovieRouteState({ routeId: '496243', hasMovie: false, error: { kind: 'load_error', raw: 'PGRST: relation movies does not exist' } })
    const all = `${r.eyebrow} ${r.title} ${r.message}`
    expect(all).not.toMatch(/PGRST|relation|movies does not exist|TMDB|supabase|500|status/i)
  })

  it('exposes safe copy per kind', () => {
    expect(classifyMovieRouteState({ routeId: 'abc', hasMovie: false }).title).toMatch(/isn’t valid/)
    expect(classifyMovieRouteState({ routeId: '1', hasMovie: false, error: { kind: 'not_found' } }).eyebrow).toMatch(/404 · Film File Not Found/)
    expect(classifyMovieRouteState({ routeId: '1', hasMovie: false, error: { kind: 'load_error' } }).title).toMatch(/We couldn’t open this Film File/)
  })
})
