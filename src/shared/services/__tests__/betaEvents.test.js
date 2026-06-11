import { describe, it, expect, vi, beforeEach } from 'vitest'

// betaEvents delegates to analytics.track (which owns opt-out). Mock it to inspect what — if
// anything — actually reaches the analytics layer after the fail-closed sanitiser runs.
const analyticsTrack = vi.hoisted(() => vi.fn())
vi.mock('../analytics', () => ({ track: analyticsTrack }))

import {
  trackEvent, EVENTS, isUnsafeValue, errorKind, countBucket, latencyBucket, queryLengthBucket, redactPath,
} from '../betaEvents'

describe('betaEvents — fail-closed event contract', () => {
  beforeEach(() => analyticsTrack.mockClear())

  it('drops un-allow-listed event names (nothing reaches analytics)', () => {
    trackEvent('totally_made_up_event', { surface: 'x' })
    expect(analyticsTrack).not.toHaveBeenCalled()
  })

  it('emits an allow-listed event through analytics.track', () => {
    trackEvent(EVENTS.people_opened, { surface: 'people' })
    expect(analyticsTrack).toHaveBeenCalledWith('people_opened', { surface: 'people' })
  })

  it('drops disallowed payload keys (email/name/query/review/diary/token)', () => {
    trackEvent(EVENTS.people_search_used, {
      result_count: 3, email: 'a@b.com', query: 'jaws', review: 'loved it', name: 'Bob', token: 'xyz',
    })
    expect(analyticsTrack).toHaveBeenCalledWith('people_search_used', { result_count: 3 })
  })

  it('drops PII-shaped values even on an allowed key', () => {
    trackEvent(EVENTS.route_error, { error_kind: 'someone@example.com' })
    expect(analyticsTrack).toHaveBeenCalledWith('route_error', {})
  })

  it('never sends a raw Error object or any nested object', () => {
    trackEvent(EVENTS.people_follow_failed, { error_kind: new Error('boom'), surface: 'people' })
    expect(analyticsTrack).toHaveBeenCalledWith('people_follow_failed', { surface: 'people' })
  })

  it('allows movie_id (catalog-safe) and strips null/undefined', () => {
    trackEvent(EVENTS.recommendation_shown, { movie_id: 12345, source: null, result_count: undefined })
    expect(analyticsTrack).toHaveBeenCalledWith('recommendation_shown', { movie_id: 12345 })
  })

  it('allows the B1.4b onboarding + Discover funnel events (bucketed/safe payloads)', () => {
    trackEvent(EVENTS.onboarding_started, { surface: 'onboarding' })
    trackEvent(EVENTS.onboarding_step_completed, { surface: 'onboarding', step_key: 'mood' })
    trackEvent(EVENTS.onboarding_completed, { surface: 'onboarding', genre_count_bucket: '3-5', rating_count_bucket: '1-2' })
    trackEvent(EVENTS.recommendation_requested, { surface: 'discover' })
    trackEvent(EVENTS.recommendation_shown, { surface: 'discover', result_count: 3, from_cache: false })
    trackEvent(EVENTS.edge_function_error, { surface: 'profile', error_kind: 'edge_error' })
    expect(analyticsTrack).toHaveBeenCalledTimes(6)
  })

  it('drops raw context / title / genre text from Discover & onboarding events', () => {
    trackEvent(EVENTS.recommendation_shown, {
      surface: 'discover', context: 'cozy rainy night', movie_title: 'Jaws', genre: 'horror', prompt: 'find me something',
    })
    expect(analyticsTrack).toHaveBeenCalledWith('recommendation_shown', { surface: 'discover' })
  })
})

describe('betaEvents — helpers never leak raw text', () => {
  it('errorKind maps to stable buckets, never raw error text', () => {
    expect(errorKind(new Error('JWT expired'))).toBe('auth')
    expect(errorKind({ code: '42501' })).toBe('permission_denied')
    expect(errorKind(new Error('Failed to fetch'))).toBe('network')
    expect(errorKind(new Error('request timed out'))).toBe('timeout')
    expect(errorKind('a weird thing happened with secret token abc')).toBe('unknown')
    // returns one of a fixed set — never the input string
    expect(['auth', 'permission_denied', 'timeout', 'network', 'edge_error', 'supabase_error', 'unknown'])
      .toContain(errorKind('anything'))
  })

  it('buckets are coarse and non-identifying', () => {
    expect(countBucket(0)).toBe('0')
    expect(countBucket(4)).toBe('3-5')
    expect(countBucket(50)).toBe('11+')
    expect(queryLengthBucket(1)).toBe('1-2')
    expect(latencyBucket(50)).toBe('<200')
    expect(latencyBucket(5000)).toBe('3s+')
  })

  it('isUnsafeValue flags emails/JWT/URL/long-text/objects, not enums/numbers/bools', () => {
    expect(isUnsafeValue('a@b.com')).toBe(true)
    expect(isUnsafeValue('eyJabcdef.payload')).toBe(true)
    expect(isUnsafeValue('https://x.com?q=secret')).toBe(true)
    expect(isUnsafeValue('x'.repeat(80))).toBe(true)
    expect(isUnsafeValue({})).toBe(true)
    expect(isUnsafeValue(['a'])).toBe(true)
    expect(isUnsafeValue('people')).toBe(false)
    expect(isUnsafeValue('permission_denied')).toBe(false)
    expect(isUnsafeValue(42)).toBe(false)
    expect(isUnsafeValue(true)).toBe(false)
  })
})

describe('redactPath — no dynamic id/slug ever reaches the page path', () => {
  it('replaces dynamic segments with a stable route pattern', () => {
    expect(redactPath('/profile/9f1c-uuid')).toBe('/profile/:id')
    expect(redactPath('/movie/550')).toBe('/movie/:id')
    expect(redactPath('/lists/abc-123')).toBe('/lists/:id')
    expect(redactPath('/lists/curated/best-of-2024')).toBe('/lists/curated/:slug')
    expect(redactPath('/lists/personal/watchlist')).toBe('/lists/personal/:type')
    expect(redactPath('/collection/99')).toBe('/collection/:id')
    expect(redactPath('/mood/cozy')).toBe('/mood/:tag')
    expect(redactPath('/tone/wistful')).toBe('/tone/:tag')
    expect(redactPath('/browse/fit/slow-burn')).toBe('/browse/fit/:profile')
  })

  it('keeps static paths and strips any query/hash', () => {
    expect(redactPath('/home')).toBe('/home')
    expect(redactPath('/people')).toBe('/people')
    expect(redactPath('/browse')).toBe('/browse')
    expect(redactPath('/movie/5?ref=home#cast')).toBe('/movie/:id')
    expect(redactPath('')).toBe('/')
    expect(redactPath(null)).toBe('/')
  })
})
