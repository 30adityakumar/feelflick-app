/**
 * TMDb API wrapper for FeelFlick
 * Centralizes fetching, caching, and image helpers.
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
  // Fail loudly in dev; show safe warning in prod
  console.warn(
    '[TMDb] Missing VITE_TMDB_API_KEY. Add it to your .env[.local] and rebuild.'
  )
}

/** Simple in-memory response cache with TTLs (per-tab). */
const cache = new Map()        // key: url, value: { ts: number, data: any, ttl: number }
const inflight = new Map()     // key: url, value: Promise<any>

/** Default TTLs (ms). Tune per endpoint. */
const TTL = {
  FAST:   60_000,      // 1m for highly dynamic endpoints (search)
  NORMAL: 5 * 60_000,  // 5m for discover & lists
  SLOW:   12 * 60 * 60_000, // 12h for details/credits (stable)
}

/**
 * Core fetch with caching + abort support.
 * - Adds `api_key` automatically
 * - Dedupes concurrent identical requests via `inflight`
 * - Caches successful JSON responses for `ttl` ms
 */
export async function fetchJson(path, {
  params = {},
  method = 'GET',
  signal,
  ttl = TTL.NORMAL,
  language = 'en-US'
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

  const controller = new AbortController()
  const linkedSignal = linkSignals(signal, controller.signal)

  const p = (async () => {
    try {
      const res = await fetch(key, {
        method,
        headers: { Accept: 'application/json' },
        signal: linkedSignal,
      })
      if (!res.ok) {
        const errBody = await safeJson(res)
        const err = new TMDBError(`TMDb ${res.status} ${res.statusText}`, res.status, errBody)
        throw err
      }
      const data = await res.json()
      cache.set(key, { ts: now, data, ttl })
      return data
    } finally {
      inflight.delete(key)
    }
  })()

  inflight.set(key, p)
  return p
}

/** Link an optional caller signal with our internal controller. */
function linkSignals(userSignal, internalSignal) {
  if (!userSignal) return internalSignal
  if (userSignal.aborted) return AbortSignal.abort('aborted')
  const ctrl = new AbortController()
  const onAbort = () => ctrl.abort(userSignal.reason)
  userSignal.addEventListener('abort', onAbort, { once: true })
  internalSignal.addEventListener('abort', onAbort, { once: true })
  return ctrl.signal
}

async function safeJson(res) {
  try { return await res.json() } catch { return null }
}

export class TMDBError extends Error {
  constructor(message, status, body) {
    super(message)
    this.name = 'TMDBError'
    this.status = status
    this.body = body
  }
}

/* ----------------------------- High-level APIs ----------------------------- */

/** Search movies by text query. */
export function searchMovies(query, { page = 1, includeAdult = false, signal } = {}) {
  return fetchJson('/search/movie', {
    params: { query, page, include_adult: includeAdult },
    ttl: TTL.FAST,
    signal,
  })
}

/** Discover movies (filters: genres, sort_by, year, etc.). */
export function discoverMovies({
  page = 1,
  sortBy = 'popularity.desc',
  genreIds,             // number[] | string (comma-separated)
  year,
  includeAdult = false,
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
    },
    ttl: TTL.NORMAL,
    signal,
  })
}

/** Get detailed movie info (append videos/images if desired). */
export function getMovieDetails(id, { append = 'videos,images,recommendations', signal } = {}) {
  return fetchJson(`/movie/${id}`, {
    params: { append_to_response: append },
    ttl: TTL.SLOW,
    signal,
  })
}

/** Get credits (cast & crew). */
export function getMovieCredits(id, { signal } = {}) {
  return fetchJson(`/movie/${id}/credits`, {
    ttl: TTL.SLOW,
    signal,
  })
}

/** Get similar movies. */
export function getSimilarMovies(id, { page = 1, signal } = {}) {
  return fetchJson(`/movie/${id}/similar`, {
    params: { page },
    ttl: TTL.NORMAL,
    signal,
  })
}

/** Trending (daily/weekly). */
export function getTrending(type = 'movie', window = 'week', { page = 1, signal } = {}) {
  return fetchJson(`/trending/${type}/${window}`, {
    params: { page },
    ttl: TTL.NORMAL,
    signal,
  })
}

/* ------------------------------ Image helpers ------------------------------ */

/** 1×1 transparent PNG data URI for safe fallbacks. */
const TRANSPARENT_PX =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg=='

/**
 * Build a TMDb image URL or return a tiny transparent pixel if path is falsy.
 * Common sizes:
 *  Posters:  w92, w154, w185, w342, w500, w780, original
 *  Backdrops: w300, w780, w1280, original
 */
export function tmdbImg(path, size = 'w342') {
  if (!path) return TRANSPARENT_PX
  return `${IMG_BASE}/${size}${path}`
}

/**
 * Build a srcset string for responsive posters.
 * Example: posterSrcSet('/abc.jpg') → "…/w154/abc.jpg 154w, …/w342/abc.jpg 342w, …/w500/abc.jpg 500w"
 */
export function posterSrcSet(path, sizes = ['w154', 'w342', 'w500']) {
  if (!path) return ''
  return sizes.map(s => `${IMG_BASE}/${s}${path} ${Number(s.replace('w',''))}w`).join(', ')
}

/** Backdrop helper with sane default. */
export function backdropImg(path, size = 'w780') {
  return tmdbImg(path, size)
}