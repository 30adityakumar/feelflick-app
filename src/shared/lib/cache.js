/**
 * Simple in-memory cache for recommendation data
 * Reduces redundant API calls across re-renders and navigation
 */

class RecommendationCache {
  constructor() {
    this.cache = new Map()
    this.defaultTTL = 5 * 60 * 1000 // 5 minutes
  }

  /**
   * Generate cache key from parameters
   */
  key(type, userId, params = {}) {
    const sortedParams = Object.keys(params)
      .sort()
      .map(k => `${k}:${JSON.stringify(params[k])}`)
      .join('|')
    return `${type}:${userId}:${sortedParams}`
  }

  /**
   * Get cached data if fresh
   */
  get(cacheKey) {
    const entry = this.cache.get(cacheKey)
    if (!entry) return null

    const now = Date.now()
    if (now > entry.expiresAt) {
      this.cache.delete(cacheKey)
      return null
    }

    return entry.data
  }

  /**
   * Store data with expiration
   */
  set(cacheKey, data, ttl = this.defaultTTL) {
    this.cache.set(cacheKey, {
      data,
      expiresAt: Date.now() + ttl,
    })
  }

  /**
   * Invalidate specific cache entries
   */
  invalidate(cacheKey) {
    this.cache.delete(cacheKey)
  }

  /**
   * Invalidate all cache entries for a user
   */
  invalidateUser(userId) {
    for (const key of this.cache.keys()) {
      if (key.includes(userId)) {
        this.cache.delete(key)
      }
    }
  }

  /**
   * Clear entire cache
   */
  clear() {
    this.cache.clear()
  }

  /**
   * Get cache stats (for debugging)
   */
  stats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    }
  }
}

export const recommendationCache = new RecommendationCache()