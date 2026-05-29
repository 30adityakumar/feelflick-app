// FeelFlick — Home v2 static design tokens.
// All runtime data (films, moods.pool, recent, DNA, friends, lists, user counts)
// now lives in useHomeData.jsx. This file only owns visual tokens + the static
// MOOD metadata (id/label/hex/tint).

const TMDB_BASE = 'https://image.tmdb.org/t/p'
export const TMDB = (path, size = 'w500') => path ? `${TMDB_BASE}/${size}${path}` : null
export const POSTER = (path) => TMDB(path)

export const HP = {
  bg: '#000000', bgDeep: '#06060a',
  panel: 'rgba(255,255,255,0.04)',
  border: 'rgba(255,255,255,0.08)', borderStrong: 'rgba(255,255,255,0.14)',
  text: '#FAFAFA', textSoft: 'rgba(250,250,250,0.72)', textMuted: 'rgba(250,250,250,0.45)', textFaint: 'rgba(250,250,250,0.28)',
  purple: '#A78BFA', purpleDeep: '#7C3AED', pink: '#EC4899', amber: '#F59E0B',
}
export const HP_GRAD = 'linear-gradient(135deg, #9333ea 0%, #ec4899 100%)'

// Mood UI metadata only. Pool + rationale come from useHomeData.
export const MOOD_META = [
  { id: 'tender',     label: 'Tender',     hex: '#F59FA8', tint: 'pink' },
  { id: 'thrilled',   label: 'Thrilled',   hex: '#EF4444', tint: 'pink' },
  { id: 'curious',    label: 'Curious',    hex: '#A78BFA', tint: 'purple' },
  { id: 'cozy',       label: 'Cozy',       hex: '#FBBF24', tint: 'amber' },
  { id: 'melancholy', label: 'Melancholy', hex: '#7DD3FC', tint: 'indigo' },
  { id: 'witty',      label: 'Witty',      hex: '#34D399', tint: 'purple' },
]


// Deterministic poster fallback gradient (hashed off the film's internal id
// so the same film always lands on the same gradient).
const FILM_GRADIENTS = [
  ['#7C3AED', '#1e1b4b'], ['#EC4899', '#831843'], ['#F59E0B', '#451a03'], ['#10B981', '#064e3b'],
  ['#3B82F6', '#1e3a8a'], ['#EF4444', '#7f1d1d'], ['#A78BFA', '#312e81'], ['#06B6D4', '#164e63'],
  ['#F472B6', '#500724'], ['#FBBF24', '#78350f'], ['#34D399', '#14532d'], ['#60A5FA', '#172554'],
]
export const gradForId = (id = 0) => FILM_GRADIENTS[Math.abs(Number(id) || 0) % FILM_GRADIENTS.length]
