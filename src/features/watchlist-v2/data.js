// /watchlist v2 — brand tokens + mood-color map + image helper.
//
// USER + ITEMS are now derived live in useWatchlistData.jsx from
// user_watchlist (joined with movies) + the user's taste_fingerprint.

export const HP = {
  bgDeep:'#06060a',
  border:'rgba(255,255,255,0.08)', borderStrong:'rgba(255,255,255,0.14)',
  text:'#FAFAFA', textSoft:'rgba(250,250,250,0.72)', textMuted:'rgba(250,250,250,0.45)', textFaint:'rgba(250,250,250,0.28)',
  purple:'#A78BFA', purpleDeep:'#7C3AED', pink:'#EC4899', amber:'#F59E0B', red:'#EF4444', green:'#34D399',
};
export const HP_GRAD = 'linear-gradient(135deg, #A78BFA 0%, #EC4899 100%)';

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
