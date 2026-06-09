// src/features/movie/derive/movieRouteState.js
// F5.7 — pure classifier for the Film File route-failure screen. It maps a normalized
// internal signal to SAFE, user-facing copy — it never returns raw backend/TMDB/
// Supabase error text, endpoints, status messages, or stack traces.
//
//   invalid    — the route id is malformed / non-positive / non-numeric
//   not_found  — a known "movie does not exist" result (TMDB success:false / 404 / 34)
//   load_error — a network/backend/unknown interruption
//   null       — the film loaded fine
//
// `error` is the normalized { kind } shape stored by useMovieData (never a raw
// string). The classifier may inspect a normalized kind but never displays it.

const COPY = {
  invalid: {
    eyebrow: 'Film File',
    title: 'That movie link isn’t valid.',
    message: 'Check the link or return to the previous page.',
  },
  not_found: {
    eyebrow: '404 · Film File Not Found',
    title: 'Couldn’t find that movie.',
    message: 'It may have been removed, or the movie identifier may be incorrect.',
  },
  load_error: {
    eyebrow: 'Film File unavailable',
    title: 'We couldn’t open this Film File.',
    message: 'Something interrupted the request. Try again in a moment.',
  },
}

function isValidId(routeId) {
  if (typeof routeId === 'number') return Number.isInteger(routeId) && routeId > 0
  if (typeof routeId === 'string') return /^\d+$/.test(routeId.trim()) && Number(routeId) > 0
  return false
}

/**
 * @param {object} args
 * @param {string|number|null|undefined} args.routeId  the :id route param
 * @param {boolean} args.hasMovie  whether a movie successfully loaded
 * @param {{ kind?: 'not_found'|'load_error' }|null} [args.error]  normalized error
 * @returns {{ kind: 'invalid'|'not_found'|'load_error'|null, eyebrow: string, title: string, message: string }}
 */
export function classifyMovieRouteState({ routeId, hasMovie, error = null }) {
  if (hasMovie && !error) return { kind: null, eyebrow: '', title: '', message: '' }

  let kind
  if (!isValidId(routeId)) kind = 'invalid'
  else if (error?.kind === 'not_found') kind = 'not_found'
  else kind = 'load_error' // network / backend / unknown — never echo the raw error

  return { kind, ...COPY[kind] }
}
