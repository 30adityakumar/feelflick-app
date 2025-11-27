/**
 * TMDb API wrapper for FeelFlick
 * Enterprise-grade with:
 * - Smart caching with TTLs
 * - Request deduplication
 * - Rate limiting
 * - Request batching
 * - Comprehensive error handling
 * - Retry logic with exponential backoff
 * - Performance monitoring hooks
 *
 * Usage:
 *   import * as tmdb from '@shared/api/tmdb'
 *   const { results } = await tmdb.searchMovies('dune')
 *   const details = await tmdb.getMovieDetails(693134)
 */

const TMDB_BASE = 'https://api.themoviedb.org/3'
const IMG_BASE  = 'https://image.tmdb.org/t/p'
const API_KEY   = import.meta.env.VITE_TMDB_API_KEY

if (!API_KEY) {
  console.warn(
    '[TMDb] Missing VITE_TMDB_API_KEY. Add it to your .env[.local] and rebuild.'
  )
}

/** Simple in-memory response cache with TTLs (per-tab). */
const cache = new Map()        // key: url, value: { ts: number, data: any, ttl: number }
const inflight = new Map()     // key: url, value: Promise<any>

/** Rate limiting state */
const rateLimiter = {
  requests: [],
  maxRequests: 40,        // TMDb allows 40 requests per 10 seconds
  windowMs: 10000,        // 10 second window
}

/** Default TTLs (ms). Tune per endpoint. */
const TTL = {
  FAST:   60_000,              // 1m for highly dynamic endpoints (search)
  NORMAL: 5 * 60_000,          // 5m for discover & lists
  SLOW:   12 * 60 * 60_000,    // 12h for details/credits (stable)
}

/** Retry configuration */
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 1000,            // 1 second base delay
  maxDelay: 8000,             // Max 8 seconds between retries
  retryableStatuses: [408, 429, 500, 502, 503, 504],
}

/**
 * Core fetch with caching, deduplication, rate limiting, and retry logic
 */
export async function fetchJson(path, {
  params = {},
  method = 'GET',
  signal,
  ttl = TTL.NORMAL,
  language = 'en-US',
  retry = true,
  retryCount = 0,
} = {}) {
  const url = new URL(TMDB_BASE + (path.startsWith('/') ? path : `/${path}`))

  // Standard params
  url.searchParams.set('api_key', API_KEY || '')
  url.searchParams.set('language', language)

  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') {
      url.searchParams.set(k, String(v))
    }
  }

  const key = url.toString()

  // Serve from cache if fresh
  const now = Date.now()
  const hit = cache.get(key)
  if (hit && (now - hit.ts) < hit.ttl) {
    return hit.data
  }

  // Deduplicate concurrent requests
  if (inflight.has(key)) {
    return inflight.get(key)
  }

  // Rate limiting check
  await checkRateLimit()

  const controller = new AbortController()
  const linkedSignal = linkSignals(signal, controller.signal)

  const p = (async () => {
    try {
      // Track request timing for monitoring
      const startTime = performance.now()
      
      const res = await fetch(key, {
        method,
        headers: { Accept: 'application/json' },
        signal: linkedSignal,
      })
      
      const endTime = performance.now()
      const duration = endTime - startTime
      
      // Log slow requests in development
      if (import.meta.env.DEV && duration > 2000) {
        console.warn(`[TMDb] Slow request (${duration.toFixed(0)}ms):`, path)
      }
      
      // Track request for rate limiting
      trackRequest()
      
      if (!res.ok) {
        const errBody = await safeJson(res)
        
        // Retry logic for transient errors
        if (
          retry &&
          retryCount < RETRY_CONFIG.maxRetries &&
          RETRY_CONFIG.retryableStatuses.includes(res.status)
        ) {
          const delay = calculateRetryDelay(retryCount)
          console.warn(`[TMDb] Request failed (${res.status}), retrying in ${delay}ms... (attempt ${retryCount + 1}/${RETRY_CONFIG.maxRetries})`)
          
          await sleep(delay)
          
          // Retry with incremented count
          return fetchJson(path, {
            params,
            method,
            signal,
            ttl,
            language,
            retry: true,
            retryCount: retryCount + 1,
          })
        }
        
        // No more retries, throw error
        const err = new TMDBError(
          `TMDb ${res.status} ${res.statusText}`,
          res.status,
          errBody
        )
        throw err
      }
      
      const data = await res.json()
      
      // Cache successful response
      cache.set(key, { ts: now, data, ttl })
      
      return data
    } catch (error) {
      // Handle network errors (not HTTP errors)
      if (error.name === 'AbortError') {
        throw error
      }
      
      if (error instanceof TMDBError) {
        throw error
      }
      
      // Network error, retry if allowed
      if (retry && retryCount < RETRY_CONFIG.maxRetries) {
        const delay = calculateRetryDelay(retryCount)
        console.warn(`[TMDb] Network error, retrying in ${delay}ms... (attempt ${retryCount + 1}/${RETRY_CONFIG.maxRetries})`)
        
        await sleep(delay)
        
        return fetchJson(path, {
          params,
          method,
          signal,
          ttl,
          language,
          retry: true,
          retryCount: retryCount + 1,
        })
      }
      
      throw error
    } finally {
      inflight.delete(key)
    }
  })()

  inflight.set(key, p)
  return p
}

/**
 * Calculate exponential backoff delay with jitter
 */
function calculateRetryDelay(retryCount) {
  const exponentialDelay = RETRY_CONFIG.baseDelay * Math.pow(2, retryCount)
  const jitter = Math.random() * 200 // Add 0-200ms jitter
  return Math.min(exponentialDelay + jitter, RETRY_CONFIG.maxDelay)
}

/**
 * Rate limiting: ensure we don't exceed TMDb's 40 requests / 10 seconds
 */
async function checkRateLimit() {
  const now = Date.now()
  
  // Clean old requests outside the window
  rateLimiter.requests = rateLimiter.requests.filter(
    timestamp => now - timestamp < rateLimiter.windowMs
  )
  
  // If we're at the limit, wait until the oldest request expires
  if (rateLimiter.requests.length >= rateLimiter.maxRequests) {
    const oldestRequest = rateLimiter.requests[0]
    const waitTime = rateLimiter.windowMs - (now - oldestRequest) + 100 // Add 100ms buffer
    
    if (waitTime > 0) {
      console.warn(`[TMDb] Rate limit reached, waiting ${waitTime}ms...`)
      await sleep(waitTime)
      return checkRateLimit() // Recursive check after waiting
    }
  }
}

/**
 * Track request timestamp for rate limiting
 */
function trackRequest() {
  rateLimiter.requests.push(Date.now())
}

/**
 * Sleep utility for delays
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Link an optional caller signal with our internal controller
 */
function linkSignals(userSignal, internalSignal) {
  if (!userSignal) return internalSignal
  if (userSignal.aborted) return AbortSignal.abort('aborted')
  
  const ctrl = new AbortController()
  const onAbort = () => ctrl.abort(userSignal.reason)
  userSignal.addEventListener('abort', onAbort, { once: true })
  internalSignal.addEventListener('abort', onAbort, { once: true })
  
  return ctrl.signal
}

/**
 * Safely parse JSON response
 */
async function safeJson(res) {
  try { 
    return await res.json() 
  } catch { 
    return null 
  }
}

/**
 * Custom TMDb error class
 */
export class TMDBError extends Error {
  constructor(message, status, body) {
    super(message)
    this.name = 'TMDBError'
    this.status = status
    this.body = body
  }
}

/* ----------------------------- High-level APIs ----------------------------- */

/**
 * Search movies by text query
 */
export function searchMovies(query, { page = 1, includeAdult = false, signal } = {}) {
  return fetchJson('/search/movie', {
    params: { query, page, include_adult: includeAdult },
    ttl: TTL.FAST,
    signal,
  })
}

/**
 * Discover movies (filters: genres, sort_by, year, etc.)
 */
export function discoverMovies({
  page = 1,
  sortBy = 'popularity.desc',
  genreIds,
  year,
  includeAdult = false,
  withCast,
  withCrew,
  withKeywords,
  voteAverageGte,
  voteAverageLte,
  signal,
} = {}) {
  const with_genres = Array.isArray(genreIds) ? genreIds.join(',') : genreIds
  
  return fetchJson('/discover/movie', {
    params: {
      page,
      sort_by: sortBy,
      with_genres,
      year,
      include_adult: includeAdult,
      with_cast: withCast,
      with_crew: withCrew,
      with_keywords: withKeywords,
      'vote_average.gte': voteAverageGte,
      'vote_average.lte': voteAverageLte,
    },
    ttl: TTL.NORMAL,
    signal,
  })
}

/**
 * Get detailed movie info (append videos/images if desired)
 */
export function getMovieDetails(id, { append = 'videos,images,recommendations,credits,keywords', signal } = {}) {
  return fetchJson(`/movie/${id}`, {
    params: { append_to_response: append },
    ttl: TTL.SLOW,
    signal,
  })
}

/**
 * Get credits (cast & crew)
 */
export function getMovieCredits(id, { signal } = {}) {
  return fetchJson(`/movie/${id}/credits`, {
    ttl: TTL.SLOW,
    signal,
  })
}

/**
 * Get similar movies
 */
export function getSimilarMovies(id, { page = 1, signal } = {}) {
  return fetchJson(`/movie/${id}/similar`, {
    params: { page },
    ttl: TTL.NORMAL,
    signal,
  })
}

/**
 * Get movie recommendations
 */
export function getMovieRecommendations(id, { page = 1, signal } = {}) {
  return fetchJson(`/movie/${id}/recommendations`, {
    params: { page },
    ttl: TTL.NORMAL,
    signal,
  })
}

/**
 * Trending (daily/weekly)
 */
export function getTrending(type = 'movie', window = 'week', { page = 1, signal } = {}) {
  return fetchJson(`/trending/${type}/${window}`, {
    params: { page },
    ttl: TTL.NORMAL,
    signal,
  })
}

/**
 * Get movie genres list
 */
export function getGenres({ signal } = {}) {
  return fetchJson('/genre/movie/list', {
    ttl: TTL.SLOW, // Genres rarely change
    signal,
  })
}

/**
 * Get popular movies
 */
export function getPopularMovies({ page = 1, signal } = {}) {
  return fetchJson('/movie/popular', {
    params: { page },
    ttl: TTL.NORMAL,
    signal,
  })
}

/**
 * Get top rated movies
 */
export function getTopRatedMovies({ page = 1, signal } = {}) {
  return fetchJson('/movie/top_rated', {
    params: { page },
    ttl: TTL.NORMAL,
    signal,
  })
}

/**
 * Get now playing movies
 */
export function getNowPlayingMovies({ page = 1, signal } = {}) {
  return fetchJson('/movie/now_playing', {
    params: { page },
    ttl: TTL.FAST, // Current releases change frequently
    signal,
  })
}

/**
 * Get upcoming movies
 */
export function getUpcomingMovies({ page = 1, signal } = {}) {
  return fetchJson('/movie/upcoming', {
    params: { page },
    ttl: TTL.FAST,
    signal,
  })
}

/**
 * Batch fetch multiple movies by IDs
 * Useful for watchlist/history where you have TMDb IDs
 */
export async function batchGetMovies(ids, { signal } = {}) {
  const controller = new AbortController()
  const linkedSignal = linkSignals(signal, controller.signal)
  
  try {
    const promises = ids.map(id => 
      getMovieDetails(id, { signal: linkedSignal })
        .catch(err => {
          console.warn(`[TMDb] Failed to fetch movie ${id}:`, err)
          return null // Return null for failed requests
        })
    )
    
    const results = await Promise.all(promises)
    return results.filter(Boolean) // Filter out null results
  } catch (error) {
    console.error('[TMDb] Batch fetch error:', error)
    throw error
  }
}

/* ------------------------------ Image helpers ------------------------------ */

/**
 * 1×1 transparent PNG data URI for safe fallbacks
 */
const TRANSPARENT_PX =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg=='

/**
 * Build a TMDb image URL or return a tiny transparent pixel if path is falsy
 * Common sizes:
 *  Posters:  w92, w154, w185, w342, w500, w780, original
 *  Backdrops: w300, w780, w1280, original
 *  Profiles: w45, w185, h632, original
 */
export function tmdbImg(path, size = 'w342') {
  if (!path) return TRANSPARENT_PX
  return `${IMG_BASE}/${size}${path}`
}

/**
 * Build a srcset string for responsive posters
 * Example: posterSrcSet('/abc.jpg') → ".../w154/abc.jpg 154w, .../w342/abc.jpg 342w, .../w500/abc.jpg 500w"
 */
export function posterSrcSet(path, sizes = ['w154', 'w342', 'w500']) {
  if (!path) return ''
  return sizes
    .map(s => `${IMG_BASE}/${s}${path} ${Number(s.replace('w',''))}w`)
    .join(', ')
}

/**
 * Backdrop helper with sane default
 */
export function backdropImg(path, size = 'w1280') {
  return tmdbImg(path, size)
}

/**
 * Backdrop srcset for responsive backgrounds
 */
export function backdropSrcSet(path, sizes = ['w780', 'w1280', 'original']) {
  if (!path) return ''
  const widths = { w780: 780, w1280: 1280, original: 1920 }
  return sizes
    .map(s => `${IMG_BASE}/${s}${path} ${widths[s] || 1920}w`)
    .join(', ')
}

/**
 * Profile image helper
 */
export function profileImg(path, size = 'w185') {
  return tmdbImg(path, size)
}

/**
 * Clear cache (useful for debugging or forced refresh)
 */
export function clearCache() {
  cache.clear()
  console.log('[TMDb] Cache cleared')
}

/**
 * Get cache statistics (for monitoring)
 */
export function getCacheStats() {
  return {
    size: cache.size,
    inflight: inflight.size,
    rateLimit: {
      requests: rateLimiter.requests.length,
      maxRequests: rateLimiter.maxRequests,
      windowMs: rateLimiter.windowMs,
    },
  }
}

/* ------------------------------ Dev utilities ------------------------------ */

if (import.meta.env.DEV) {
  // Expose cache stats to console for debugging
  window.__tmdbCacheStats = getCacheStats
  window.__tmdbClearCache = clearCache
  
  console.log('[TMDb] Dev utilities available: window.__tmdbCacheStats(), window.__tmdbClearCache()')
}