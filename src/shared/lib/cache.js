/**
 * Simple in-memory cache for recommendation data
 * Reduces redundant API calls across re-renders and navigation
 */

class RecommendationCache {
  constructor() {
    this.cache = new Map()
    this.inflight = new Map() // NEW: Track in-progress requests
    this.defaultTTL = 5 * 60 * 1000
  }

  /**
   * Generate cache key from parameters
   */
  key(type, userId, params = {}) {
    const sortedParams = Object.keys(params)
      .sort()
      .map(k => {
        const val = params[k]
        if (Array.isArray(val)) {
          return `${k}:${JSON.stringify(val.sort())}`
        }
        return `${k}:${JSON.stringify(val)}`
      })
      .join('|')
    
    const cacheKey = `${type}:${userId}:${sortedParams}`
    console.log('[Cache] Generated key:', cacheKey)
    return cacheKey
  }

  /**
   * Get cached data or in-flight promise
   */
  async getOrFetch(cacheKey, fetchFn) {
    // Check cache first
    const cached = this.get(cacheKey)
    if (cached) return cached

    // Check if request already in-flight
    if (this.inflight.has(cacheKey)) {
      console.log('[Cache] DEDUP - returning in-flight promise:', cacheKey)
      return this.inflight.get(cacheKey)
    }

    // Start new request
    console.log('[Cache] FETCH - starting new request:', cacheKey)
    const promise = fetchFn().then(result => {
      this.set(cacheKey, result)
      this.inflight.delete(cacheKey)
      return result
    }).catch(err => {
      this.inflight.delete(cacheKey)
      throw err
    })

    this.inflight.set(cacheKey, promise)
    return promise
  }

  get(cacheKey) {
    const entry = this.cache.get(cacheKey)
    if (!entry) {
      console.log('[Cache] MISS:', cacheKey)
      return null
    }

    const now = Date.now()
    if (now > entry.expiresAt) {
      this.cache.delete(cacheKey)
      console.log('[Cache] EXPIRED:', cacheKey)
      return null
    }

    console.log('[Cache] HIT:', cacheKey)
    return entry.data
  }

  set(cacheKey, data, ttl = this.defaultTTL) {
    this.cache.set(cacheKey, {
      data,
      expiresAt: Date.now() + ttl,
    })
    console.log('[Cache] SET:', cacheKey, '| expires in', Math.round(ttl / 1000), 's')
  }

  invalidate(cacheKey) {
    this.cache.delete(cacheKey)
    this.inflight.delete(cacheKey) // NEW: Also clear in-flight
  }

  invalidateUser(userId) {
    for (const key of this.cache.keys()) {
      if (key.includes(userId)) {
        this.cache.delete(key)
      }
    }
    for (const key of this.inflight.keys()) {
      if (key.includes(userId)) {
        this.inflight.delete(key)
      }
    }
  }

  clear() {
    this.cache.clear()
    this.inflight.clear()
  }

  stats() {
    return {
      cached: this.cache.size,
      inflight: this.inflight.size,
      keys: Array.from(this.cache.keys()),
    }
  }
}

export const recommendationCache = new RecommendationCache()

// At bottom of file, after export
if (typeof window !== 'undefined') {
  window.recommendationCache = recommendationCache
}