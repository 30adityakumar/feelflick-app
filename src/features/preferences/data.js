// src/features/preferences/data.js
// Static catalogs + bounds for the Preferences redesign. Single source of truth
// shared by the provider, draft, derivation, validation, and components.

export const MOODS = [
  { id: 'tense',       label: 'Tense' },
  { id: 'tender',      label: 'Tender' },
  { id: 'slow-burn',   label: 'Slow-burn' },
  { id: 'cerebral',    label: 'Cerebral' },
  { id: 'bittersweet', label: 'Bittersweet' },
  { id: 'cozy',        label: 'Cozy' },
  { id: 'dark-comic',  label: 'Dark-comic' },
  { id: 'hopeful',     label: 'Hopeful' },
  { id: 'mythic',      label: 'Mythic' },
]
export const MOOD_IDS = MOODS.map((m) => m.id)

// TMDB genre catalog — IDs must match the engine + user_preferences.genre_id.
export const GENRES = [
  { id: 28, label: 'Action' }, { id: 12, label: 'Adventure' }, { id: 16, label: 'Animation' },
  { id: 35, label: 'Comedy' }, { id: 80, label: 'Crime' }, { id: 99, label: 'Documentary' },
  { id: 18, label: 'Drama' }, { id: 10751, label: 'Family' }, { id: 14, label: 'Fantasy' },
  { id: 36, label: 'History' }, { id: 27, label: 'Horror' }, { id: 10402, label: 'Music' },
  { id: 9648, label: 'Mystery' }, { id: 10749, label: 'Romance' }, { id: 878, label: 'Sci-Fi' },
  { id: 53, label: 'Thriller' },
]
const GENRE_LABEL_BY_ID = new Map(GENRES.map((g) => [g.id, g.label]))
const GENRE_ID_BY_LABEL = new Map(GENRES.map((g) => [g.label.toLowerCase(), g.id]))
export function genreLabelOf(id) { return GENRE_LABEL_BY_ID.get(id) || `Genre ${id}` }
export function genreIdOf(label) { return GENRE_ID_BY_LABEL.get((label || '').toLowerCase()) ?? null }

// Content boundaries grouped by ACTUAL engine behaviour (boundaries.js):
//  - 'exclude' boundaries (graphic, sexual) are hard-filtered when identified.
//  - 'caution' boundaries (animals, noise) only surface a heads-up where supported.
export const BOUNDARIES = [
  { id: 'graphic', label: 'Graphic violence',        desc: 'Excluded on supported surfaces when our data identifies it.', effect: 'exclude' },
  { id: 'sexual',  label: 'Explicit sexual content', desc: 'Excluded on supported surfaces when our data identifies it.', effect: 'exclude' },
  { id: 'animals', label: 'Harm to animals',         desc: 'Used as a caution flag on supported screens; not a guaranteed filter.', effect: 'caution' },
  { id: 'noise',   label: 'Sensory-heavy films',     desc: 'Flicker / strobe / jump-cuts — caution flag where supported.', effect: 'caution' },
]
export const BOUNDARY_IDS = BOUNDARIES.map((b) => b.id)

export const LANGUAGES = [
  'English', 'Korean', 'Japanese', 'French', 'Spanish', 'Italian', 'German', 'Mandarin',
  'Cantonese', 'Hindi', 'Portuguese', 'Russian', 'Arabic', 'Turkish', 'Persian', 'Swedish',
  'Danish', 'Norwegian', 'Polish', 'Dutch', 'Thai', 'Vietnamese',
]
export const SUBTITLE_MODES = [
  { v: 'never', l: 'Never' }, { v: 'sometimes', l: 'Sometimes' }, { v: 'always-welcome', l: 'Always welcome' },
]
export const SPOILER_TIERS = [
  { v: 'brief', l: 'Brief' }, { v: 'standard', l: 'Standard' }, { v: 'detailed', l: 'Detailed' },
]

// Display-only streamer logos for the disabled "coming soon" panel.
export const STREAMERS = [
  { id: 'netflix', name: 'Netflix' }, { id: 'max', name: 'Max' }, { id: 'hulu', name: 'Hulu' },
  { id: 'amazon', name: 'Prime Video' }, { id: 'apple', name: 'Apple TV+' }, { id: 'crite', name: 'Criterion' },
  { id: 'mubi', name: 'MUBI' }, { id: 'disney', name: 'Disney+' },
]

// Bounds + mood-band mapping (mirror the RPC validation exactly).
export const RUNTIME_MIN = 60
export const RUNTIME_MAX = 240
export const RUNTIME_GAP = 5
export const MAX_GENRES = 40
export const MAX_DIRECTORS = 50
export const MAX_DIRECTOR_LEN = 120
export const MAX_LANGUAGES = 30

// Three-state mood emphasis. We store a numeric weight (the engine reads 0..1),
// but the UI only ever shows / sets three honest bands.
export const MOOD_BAND_VALUE = { less: 0.25, balanced: 0.5, more: 0.75 }
export function moodBandOf(weight) {
  const w = typeof weight === 'number' ? weight : 0.5
  if (w < 0.4) return 'less'
  if (w > 0.6) return 'more'
  return 'balanced'
}
