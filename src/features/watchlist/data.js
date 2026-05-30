// /watchlist v2 — brand tokens + mood-color map + image helper.
//
// USER + ITEMS are now derived live in useWatchlistData.jsx from
// user_watchlist (joined with movies) + the user's taste_fingerprint.

export { HP, HP_GRAD } from '@/shared/lib/tokens'

const TMDB_IMG = 'https://image.tmdb.org/t/p';
export const tmdbImg = (path, size = 'w500') =>
  path ? `${TMDB_IMG}/${size}${path}` : null;

// Mood → accent color. Case-insensitive lookup happens in useWatchlistData.
// Falls back to brand purple when a tag isn't in the table.
export const MOOD_HEX = {
  Tense:        '#EF4444',
  Tender:       '#F472B6',
  'Slow-burn':  '#A78BFA',
  Slow:         '#A78BFA',
  Bittersweet:  '#F472B6',
  Cerebral:     '#7DD3FC',
  'Dark-comic': '#FBBF24',
  Hopeful:      '#34D399',
  Joyful:       '#FBBF24',
  Mysterious:   '#A78BFA',
  Haunting:     '#7B2A1F',
  Romantic:     '#F472B6',
  Devastating:  '#EF4444',
  Thrilling:    '#EF4444',
  Unsettling:   '#FBBF24',
  Earnest:      '#34D399',
  Sentimental:  '#F472B6',
  Melancholic:  '#7DD3FC',
  Somber:       '#7DD3FC',
  Dreamy:       '#A78BFA',
  Uplifting:    '#34D399',
  Heartwarming: '#34D399',
};
