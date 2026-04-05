const STORAGE_KEY = 'ff_oauth_nonce_v1'
export const OAUTH_NONCE_QUERY_PARAM = 'ff_oauth_nonce'
export const OAUTH_NONCE_TTL_MS = 10 * 60 * 1000 // 10 minutes

function getSessionStorageSafe() {
  if (typeof window === 'undefined') return null
  try {
    return window.sessionStorage
  } catch {
    return null
  }
}

function getCryptoSafe() {
  if (typeof window === 'undefined') return null
  return window.crypto || null
}

function createNonce() {
  const cryptoObj = getCryptoSafe()

  if (cryptoObj?.randomUUID) {
    return cryptoObj.randomUUID()
  }

  if (cryptoObj?.getRandomValues) {
    const bytes = new Uint8Array(16)
    cryptoObj.getRandomValues(bytes)
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
  }

  // Fallback for unusual runtime environments.
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 14)}`
}

function parseStoredNonce(raw) {
  if (!raw || typeof raw !== 'string') return null

  try {
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return null

    const nonce = typeof parsed.nonce === 'string' ? parsed.nonce : null
    const issuedAt =
      typeof parsed.issuedAt === 'number' && Number.isFinite(parsed.issuedAt)
        ? parsed.issuedAt
        : null

    if (!nonce || issuedAt === null) return null
    return { nonce, issuedAt }
  } catch {
    return null
  }
}

export function issueOAuthCallbackNonce({ now = Date.now() } = {}) {
  const storage = getSessionStorageSafe()
  if (!storage) return null

  const nonce = createNonce()
  storage.setItem(STORAGE_KEY, JSON.stringify({ nonce, issuedAt: now }))
  return nonce
}

export function clearOAuthCallbackNonce() {
  const storage = getSessionStorageSafe()
  if (!storage) return
  storage.removeItem(STORAGE_KEY)
}

export function readOAuthNonceFromUrl(url) {
  const rawUrl =
    url ?? (typeof window !== 'undefined' ? window.location.href : '')

  if (!rawUrl) return null

  try {
    const parsedUrl = new URL(
      rawUrl,
      typeof window !== 'undefined' ? window.location.origin : 'http://localhost'
    )
    const value = parsedUrl.searchParams.get(OAUTH_NONCE_QUERY_PARAM)
    return typeof value === 'string' && value.trim() ? value : null
  } catch {
    return null
  }
}

export function consumeOAuthCallbackNonce(
  expectedNonce,
  { now = Date.now(), ttlMs = OAUTH_NONCE_TTL_MS } = {}
) {
  if (typeof expectedNonce !== 'string' || !expectedNonce.trim()) return false

  const storage = getSessionStorageSafe()
  if (!storage) return false

  const parsed = parseStoredNonce(storage.getItem(STORAGE_KEY))
  if (!parsed) {
    clearOAuthCallbackNonce()
    return false
  }

  if (parsed.nonce !== expectedNonce) {
    return false
  }

  if (now - parsed.issuedAt > ttlMs) {
    clearOAuthCallbackNonce()
    return false
  }

  // Single-use: consume on success.
  clearOAuthCallbackNonce()
  return true
}

