// Shared utilities for MovieDetail sub-components

export const IMG = {
  backdrop: (p) => (p ? `https://image.tmdb.org/t/p/original${p}` : ''),
  poster:   (p) => (p ? `https://image.tmdb.org/t/p/w780${p}` : ''),
  profile:  (p) => (p ? `https://image.tmdb.org/t/p/w185${p}` : ''),
  logo:     (p) => (p ? `https://image.tmdb.org/t/p/w92${p}` : ''),
  still:    (p) => (p ? `https://image.tmdb.org/t/p/w500${p}` : ''),
}

export const TMDB = {
  base: 'https://api.themoviedb.org/3',
  key:  import.meta.env.VITE_TMDB_API_KEY,
}

export function formatRuntime(mins) {
  if (!mins) return ''
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return h ? `${h}h ${m}m` : `${m}m`
}

export const yearOf = (d) => d?.slice?.(0, 4)
