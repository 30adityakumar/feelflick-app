// /history v2 — brand tokens + mood-to-color map + image helper.
//
// USER + ENTRIES + HEATMAP + TIMELINE + MOOD_SHARE are now derived live in
// useHistoryData.jsx from user_history × movies × user_ratings.

export { HP, HP_GRAD } from '@/shared/lib/tokens'

const TMDB_IMG = 'https://image.tmdb.org/t/p';
export const tmdbImg = (path, size = 'w500') =>
  path ? `${TMDB_IMG}/${size}${path}` : null;

// Mood → accent color. Case-insensitive lookup happens in useHistoryData.
export const MOOD_HEX = {
  Tense:        '#EF4444',
  Tender:       '#F472B6',
  'Slow-burn':  '#A78BFA',
  Slow:         '#A78BFA',
  Bittersweet:  '#F472B6',
  Cerebral:     '#7DD3FC',
  'Dark-comic': '#34D399',
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
  Melancholy:   '#0EA5E9',
  Melancholic:  '#7DD3FC',
  Somber:       '#7DD3FC',
  Dreamy:       '#A78BFA',
  Uplifting:    '#34D399',
  Heartwarming: '#34D399',
  Cozy:         '#FBBF24',
};
