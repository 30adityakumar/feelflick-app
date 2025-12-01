// src/app/homepage/components/HeroTopPick.jsx
import { Loader2, AlertCircle, Info } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { tmdbImg } from '@/shared/api/tmdb'
import { useTopPick } from '@/shared/hooks/useRecommendations'

export default function HeroTopPick() {
  const { data: movie, loading, error } = useTopPick()
  const navigate = useNavigate()

  if (loading) {
    return (
      <section className="px-4 sm:px-6 lg:px-8 mt-10">
        <div className="flex items-center gap-3 mb-4">
          <Loader2 className="h-6 w-6 text-[#667eea] animate-spin" />
          <span className="text-white/70 text-sm">Finding tonight&apos;s top pick…</span>
        </div>
      </section>
    )
  }

  if (error || !movie) {
    return null
  }

  const handleClick = () => {
    navigate(`/movie/${movie.id}`)
  }

  return (
    <section className="px-4 sm:px-6 lg:px-8 mt-10">
      <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-stretch">
        {/* Poster */}
        <button
          onClick={handleClick}
          className="relative w-full md:w-1/3 max-w-sm rounded-xl overflow-hidden group focus:outline-none focus:ring-2 focus:ring-[#667eea]"
        >
          <div className="aspect-[2/3] bg-gray-900">
            <img
              src={tmdbImg(movie.poster_path || movie.backdrop_path, 'w500')}
              alt={movie.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        </button>

        {/* Text */}
        <div className="flex-1 flex flex-col justify-center">
          <p className="text-xs uppercase tracking-[0.2em] text-[#9f7aea] mb-2">
            Tonight&apos;s top pick for you
          </p>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white mb-3">
            {movie.title}
          </h1>
          <div className="flex items-center gap-3 text-sm text-white/70 mb-4">
            {movie.release_date && (
              <span>{new Date(movie.release_date).getFullYear()}</span>
            )}
            {movie.vote_average > 0 && (
              <span className="flex items-center gap-1">
                <span className="text-yellow-400">★</span>
                {movie.vote_average.toFixed(1)}
              </span>
            )}
          </div>
          {movie.overview && (
            <p className="text-sm md:text-base text-white/80 mb-4 line-clamp-4">
              {movie.overview}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleClick}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-white text-black font-semibold text-sm hover:bg-gray-100 transition-colors"
            >
              <span>View details</span>
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-2 text-xs text-white/70"
            >
              <Info className="h-4 w-4" />
              <span>Why this pick?</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
