// src/app/homepage/components/PersonalizedCarouselRow.jsx
/**
 * Personalized carousel row component
 * Displays recommendations with loading and error states
 */

import { useMemo } from 'react'
import { Sparkles, Loader2, AlertCircle } from 'lucide-react'
import { tmdbImg } from '@/shared/api/tmdb'
import { useNavigate } from 'react-router-dom'

export default function PersonalizedCarouselRow({ 
  title, 
  movies = [], 
  loading = false, 
  error = null,
  icon: Icon = Sparkles,
  rowId = 'personalized'
}) {
  const navigate = useNavigate()

  const validMovies = useMemo(() => {
    return movies.filter(m => m && m.poster_path)
  }, [movies])

  if (loading) {
    return (
      <section className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 mb-4">
          <Icon className="h-5 w-5 text-[#667eea]" />
          <h2 className="text-xl sm:text-2xl font-bold text-white">{title}</h2>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 text-[#667eea] animate-spin" />
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 mb-4">
          <Icon className="h-5 w-5 text-[#667eea]" />
          <h2 className="text-xl sm:text-2xl font-bold text-white">{title}</h2>
        </div>
        <div className="flex items-center gap-3 py-8 text-red-400">
          <AlertCircle className="h-5 w-5" />
          <span className="text-sm">Failed to load recommendations</span>
        </div>
      </section>
    )
  }

  if (validMovies.length === 0) {
    return null // Don't render empty sections
  }

  return (
    <section className="px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <Icon className="h-5 w-5 text-[#667eea]" />
        <h2 className="text-xl sm:text-2xl font-bold text-white">{title}</h2>
      </div>

      {/* Scrollable Row */}
      <div className="relative -mx-4 sm:-mx-6 lg:-mx-8">
        <div 
          className="flex gap-3 sm:gap-4 overflow-x-auto px-4 sm:px-6 lg:px-8 pb-4 snap-x snap-mandatory scrollbar-hide"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          {validMovies.map((movie, idx) => (
            <MovieCard
              key={`${rowId}-${movie.id}-${idx}`}
              movie={movie}
              onClick={() => navigate(`/movie/${movie.id}`)}
            />
          ))}
        </div>
      </div>

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </section>
  )
}

/**
 * Individual movie card component
 */
function MovieCard({ movie, onClick }) {
  return (
    <button
      onClick={onClick}
      className="group relative flex-none w-36 sm:w-44 md:w-52 snap-start focus:outline-none focus:ring-2 focus:ring-[#667eea] rounded-lg transition-transform hover:scale-105"
    >
      {/* Poster */}
      <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-gray-800 shadow-lg ring-1 ring-white/10">
        <img
          src={tmdbImg(movie.poster_path, 'w342')}
          alt={movie.title}
          loading="lazy"
          className="w-full h-full object-cover"
        />
        
        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="absolute bottom-0 left-0 right-0 p-3">
            <h3 className="text-sm font-semibold text-white line-clamp-2 mb-1">
              {movie.title}
            </h3>
            {movie.release_date && (
              <p className="text-xs text-white/70">
                {new Date(movie.release_date).getFullYear()}
              </p>
            )}
            {movie.vote_average > 0 && (
              <div className="flex items-center gap-1 mt-1">
                <span className="text-yellow-400 text-xs">★</span>
                <span className="text-xs text-white/80">
                  {movie.vote_average.toFixed(1)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Title (always visible on mobile) */}
      <div className="mt-2 sm:hidden">
        <h3 className="text-sm font-medium text-white line-clamp-2">
          {movie.title}
        </h3>
      </div>
    </button>
  )
}
