import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  clearOAuthCallbackNonce,
  consumeOAuthCallbackNonce,
  issueOAuthCallbackNonce,
  OAUTH_NONCE_QUERY_PARAM,
  OAUTH_NONCE_TTL_MS,
  readOAuthNonceFromUrl,
} from '../oauthNonce'

describe('oauthNonce', () => {
  beforeEach(() => {
    sessionStorage.clear()
    vi.restoreAllMocks()
  })

  it('issues and consumes a valid nonce once', () => {
    const nonce = issueOAuthCallbackNonce({ now: 1_000 })
    expect(typeof nonce).toBe('string')
    expect(nonce.length).toBeGreaterThan(0)

    const firstConsume = consumeOAuthCallbackNonce(nonce, { now: 2_000 })
    const secondConsume = consumeOAuthCallbackNonce(nonce, { now: 2_100 })

    expect(firstConsume).toBe(true)
    expect(secondConsume).toBe(false)
  })

  it('rejects expired nonce', () => {
    const nonce = issueOAuthCallbackNonce({ now: 1_000 })
    const valid = consumeOAuthCallbackNonce(nonce, {
      now: 1_000 + OAUTH_NONCE_TTL_MS + 1,
    })
    expect(valid).toBe(false)
  })

  it('rejects tampered nonce value', () => {
    const nonce = issueOAuthCallbackNonce({ now: 1_000 })
    const tampered = `${nonce}-tampered`
    const valid = consumeOAuthCallbackNonce(tampered, { now: 1_500 })
    expect(valid).toBe(false)
  })

  it('rejects malformed stored payload', () => {
    sessionStorage.setItem('ff_oauth_nonce_v1', '{"invalid":true}')
    const valid = consumeOAuthCallbackNonce('anything', { now: 1_500 })
    expect(valid).toBe(false)
  })

  it('reads nonce from url query param', () => {
    const url = `https://example.com/auth/callback?${OAUTH_NONCE_QUERY_PARAM}=abc123`
    expect(readOAuthNonceFromUrl(url)).toBe('abc123')
  })

  it('returns null when nonce query param is missing', () => {
    expect(readOAuthNonceFromUrl('https://example.com/auth/callback')).toBeNull()
  })

  it('can clear stored nonce', () => {
    const nonce = issueOAuthCallbackNonce({ now: 500 })
    expect(consumeOAuthCallbackNonce(nonce, { now: 600 })).toBe(true)
    issueOAuthCallbackNonce({ now: 700 })
    clearOAuthCallbackNonce()
    expect(sessionStorage.getItem('ff_oauth_nonce_v1')).toBeNull()
  })
})

