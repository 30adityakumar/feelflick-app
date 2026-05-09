// src/features/onboarding-v2/data.js
// Mood definitions used by Step 1 (Mood baseline) and the ambient-glow.
// Keep RGB triplets — the glow composes them as `rgba(${rgb}, alpha)`.

export const MOODS = [
  { key: 'cozy',   label: 'Cozy',   desc: 'Warm, low-stakes, comfort food', rgb: '236, 72, 153' },
  { key: 'wired',  label: 'Wired',  desc: 'Cerebral, plot-y, reward focus', rgb: '168, 85, 247' },
  { key: 'tender', label: 'Tender', desc: 'Sad in a good way',              rgb: '192, 132, 252' },
  { key: 'fun',    label: 'Fun',    desc: 'Light, plot-driven, escapist',   rgb: '244, 114, 182' },
  { key: 'tense',  label: 'Tense',  desc: 'Thrillers, slow-burn dread',     rgb: '129, 140, 248' },
  { key: 'mythic', label: 'Mythic', desc: 'Epic, big-canvas, lyrical',      rgb: '251, 191, 36' },
]

export const MIN_MOODS = 2
export const MAX_MOODS = 3

// Local-storage key — consumed downstream by the home page if you wire it up.
export const MOODS_LS_KEY = 'ff_onboarding_v2_moods'

// === GENRES (Step 2) =======================================================
// TMDb genre IDs paired with the dbName that matches movies.primary_genre in
// Supabase. Used by GenresStepV2 (selection UI) + MoviesStepV2 (genre filter
// for the Supabase pool fetch).
export const GENRES = [
  { id: 28,    name: 'Action',      dbName: 'Action'           },
  { id: 12,    name: 'Adventure',   dbName: 'Adventure'        },
  { id: 16,    name: 'Animation',   dbName: 'Animation'        },
  { id: 35,    name: 'Comedy',      dbName: 'Comedy'           },
  { id: 80,    name: 'Crime',       dbName: 'Crime'            },
  { id: 99,    name: 'Documentary', dbName: 'Documentary'      },
  { id: 18,    name: 'Drama',       dbName: 'Drama'            },
  { id: 10751, name: 'Family',      dbName: 'Family'           },
  { id: 14,    name: 'Fantasy',     dbName: 'Fantasy'          },
  { id: 36,    name: 'History',     dbName: 'History'          },
  { id: 27,    name: 'Horror',      dbName: 'Horror'           },
  { id: 10402, name: 'Music',       dbName: 'Music'            },
  { id: 9648,  name: 'Mystery',     dbName: 'Mystery'          },
  { id: 10749, name: 'Romance',     dbName: 'Romance'          },
  { id: 878,   name: 'Sci-Fi',      dbName: 'Science Fiction'  },
  { id: 53,    name: 'Thriller',    dbName: 'Thriller'         },
]

// === RATINGS (Step 4) ======================================================
// Sentiment → numeric rating mapping. Stored in user_ratings.rating during
// completeOnboarding. The numeric scale lets later behavioral signals decay
// or amplify these onboarding ratings consistently with in-app ratings.
export const SENTIMENT_RATINGS = {
  loved: 9,
  liked: 7,
  okay:  5,
}
