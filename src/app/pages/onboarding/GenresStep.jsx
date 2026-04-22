// src/app/pages/onboarding/GenresStep.jsx
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronRight } from 'lucide-react'

import { supabase } from '@/shared/lib/supabase/client'
import { tmdbImg } from '@/shared/api/tmdb'
import Button from '@/shared/ui/Button'

// === GENRE DEFINITIONS ===

// Maps TMDB genre IDs to display name + DB primary_genre name.
// "Sci-Fi" displays as "Sci-Fi" but is stored as "Science Fiction" in movies.primary_genre.
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

const MIN_GENRES = 3

// === MODULE-LEVEL POSTER CACHE ===
// Key: dbName, Value: string[] (poster_path)
const _posterCache = new Map()
let _posterFetchPromise = null

async function fetchAllGenrePosters() {
  if (_posterFetchPromise) return _posterFetchPromise
  if (_posterCache.size > 0) return

  _posterFetchPromise = (async () => {
    const dbNames = GENRES.map(g => g.dbName)
    const { data } = await supabase
      .from('movies')
      .select('poster_path, primary_genre')
      .in('primary_genre', dbNames)
      .not('ff_audience_rating', 'is', null)
      .not('poster_path', 'is', null)
      .order('ff_audience_rating', { ascending: false })
      .limit(200)

    if (!data) return

    // Group into cache: top 3 per genre
    for (const genre of GENRES) {
      const posters = data
        .filter(m => m.primary_genre === genre.dbName && m.poster_path)
        .map(m => m.poster_path)
        .slice(0, 3)
      _posterCache.set(genre.dbName, posters)
    }
  })()

  return _posterFetchPromise
}

// === GENRE CARD ===

function GenreCard({ genre, isSelected, onClick, posters, animDelay }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, delay: animDelay }}
      whileTap={{ scale: 0.95 }}
      aria-pressed={isSelected}
      aria-label={genre.name}
      className={`relative overflow-hidden rounded-2xl aspect-[3/2] w-full cursor-pointer select-none transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black ${
        isSelected
          ? 'ring-2 ring-purple-400 scale-[1.03] shadow-lg shadow-purple-500/25'
          : 'ring-1 ring-white/10 hover:ring-white/25 hover:scale-[1.01]'
      }`}
    >
      {/* Poster stack background */}
      <div className="absolute inset-0 bg-neutral-900">
        {posters.length > 0 && (
          <>
            {posters[2] && (
              <img
                src={tmdbImg(posters[2], 'w154')}
                alt=""
                aria-hidden="true"
                className="absolute top-0 right-[-18%] h-full w-[48%] object-cover opacity-40 rotate-6 scale-110"
              />
            )}
            {posters[1] && (
              <img
                src={tmdbImg(posters[1], 'w154')}
                alt=""
                aria-hidden="true"
                className="absolute top-0 right-[14%] h-full w-[48%] object-cover opacity-60 rotate-2 scale-105"
              />
            )}
            {posters[0] && (
              <img
                src={tmdbImg(posters[0], 'w154')}
                alt=""
                aria-hidden="true"
                className="absolute top-0 left-0 h-full w-[55%] object-cover"
              />
            )}
          </>
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/65 to-black/30" />
        {/* Selected overlay */}
        {isSelected && (
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600/30 to-pink-600/20" />
        )}
      </div>

      {/* Genre label */}
      <div className="relative z-10 flex h-full flex-col justify-end p-3">
        <span className="text-sm font-bold text-white leading-tight tracking-tight">
          {genre.name}
        </span>
      </div>

      {/* Selected checkmark */}
      {isSelected && (
        <div className="absolute top-2 right-2 z-20 h-5 w-5 rounded-full bg-purple-500 flex items-center justify-center shadow">
          <svg viewBox="0 0 10 8" className="h-2.5 w-2.5 fill-none stroke-white stroke-2 stroke-linecap-round stroke-linejoin-round">
            <path d="M1 4l2.5 2.5L9 1" />
          </svg>
        </div>
      )}
    </motion.button>
  )
}

// === MAIN COMPONENT ===

/**
 * Onboarding step 1: genre selection.
 * Minimum 3 genres required before Continue is enabled.
 *
 * @param {{
 *   selectedGenres: number[],
 *   toggleGenre: (id: number) => void,
 *   onNext: () => void,
 *   firstName: string | null,
 * }} props
 */
export default function GenresStep({ selectedGenres, toggleGenre, onNext, firstName }) {
  const [posters, setPosters] = useState({})

  useEffect(() => {
    fetchAllGenrePosters().then(() => {
      const snapshot = {}
      for (const g of GENRES) {
        snapshot[g.dbName] = _posterCache.get(g.dbName) || []
      }
      setPosters(snapshot)
    })
  }, [])

  const count = selectedGenres.length
  const canContinue = count >= MIN_GENRES

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-none text-center px-6 pt-8 pb-5">
        {firstName && (
          <p className="text-sm font-medium text-white/40 mb-1">Hey {firstName} —</p>
        )}
        <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight">
          What kind of films draw you in?
        </h2>
        <p className="text-sm text-white/40 mt-2">
          Pick at least 3 — we use these to seed your first recommendations.
        </p>
      </div>

      {/* Genre grid */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 py-2">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto pb-4">
          {GENRES.map((g, idx) => (
            <GenreCard
              key={g.id}
              genre={g}
              isSelected={selectedGenres.includes(g.id)}
              onClick={() => toggleGenre(g.id)}
              posters={posters[g.dbName] || []}
              animDelay={idx * 0.03}
            />
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="flex-none px-6 pb-8 pt-4 border-t border-white/[0.06]">
        <div className="max-w-sm mx-auto flex flex-col items-center gap-3">
          <p className={`text-xs font-medium transition-colors duration-200 ${
            canContinue ? 'text-purple-400' : 'text-white/30'
          }`}>
            {count === 0
              ? `Select at least ${MIN_GENRES} to continue`
              : count < MIN_GENRES
              ? `${count} selected — pick ${MIN_GENRES - count} more`
              : `${count} selected ✓`}
          </p>
          <Button
            variant="primary"
            size="lg"
            onClick={onNext}
            disabled={!canContinue}
            fullWidth
          >
            Continue
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
