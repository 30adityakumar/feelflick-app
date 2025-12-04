// src/app/homepage/components/HeroTopPick.jsx
import { useEffect, useState, useCallback } from 'react'
import {
  Loader2,
  Info,
  Play,
  Sparkles,
  Plus,
  Check,
  Eye,
  EyeOff,
  List,
  Heart,
  Bookmark
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { tmdbImg } from '@/shared/api/tmdb'
import { useTopPick } from '@/shared/hooks/useRecommendations'
import { supabase } from '@/shared/lib/supabase/client'
import { useUserMovieStatus } from '@/shared/hooks/useUserMovieStatus'

export default function HeroTopPick() {
  const { data: movie, loading, error } = useTopPick()
  const navigate = useNavigate()
  const [imageLoaded, setImageLoaded] = useState(false)
  const [user, setUser] = useState(null)

  // Fetch current user
  useEffect(() => {
    let mounted = true

    ;(async () => {
      try {
        const {
          data: { user: currentUser }
        } = await supabase.auth.getUser()
        if (mounted) setUser(currentUser)
      } catch (err) {
        console.error('[HeroTopPick] User fetch error:', err)
      }
    })()

    return () => {
      mounted = false
    }
  }, [])

  // Reset image loading state when movie changes
  useEffect(() => {
    setImageLoaded(false)
  }, [movie?.id])

  // Shared watchlist / watched logic (backed by movies, user_watchlist, user_history)
  const {
    isInWatchlist,
    isWatched,
    loading: actionLoading,
    toggleWatchlist,
    toggleWatched
  } = useUserMovieStatus({ user, movie, source: 'hero_top_pick' })

  const handleClick = useCallback(() => {
    if (!movie?.id) return
    navigate(`/movie/${movie.id}`)
  }, [movie?.id, navigate])

  if (loading) {
    return (
      <section className="relative px-4 sm:px-6 lg:px-12 mt-12 mb-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <Loader2 className="h-5 w-5 text-purple-400 animate-spin" />
            <span className="text-white/60 text-sm font-medium">
              Finding your perfect match...
            </span>
          </div>
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-10">
            <div className="w-full max-w-[280px] sm:max-w-[320px] lg:w-[320px] aspect-[2/3] bg-white/5 rounded-lg animate-pulse" />
            <div className="flex-1 space-y-4">
              <div className="h-8 w-48 bg-white/5 rounded animate-pulse" />
              <div className="h-12 w-3/4 bg-white/5 rounded animate-pulse" />
              <div className="h-20 w-full bg-white/5 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </section>
    )
  }

  if (error || !movie) return null

  const year = movie.release_date
    ? new Date(movie.release_date).getFullYear()
    : null
  const rating = movie.vote_average > 0 ? movie.vote_average : 0
  const ratingPercent = Math.round(rating * 10)
  const circumference = 2 * Math.PI * 24

  return (
    <section className="relative px-4 sm:px-6 lg:px-12 mt-12 mb-8 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/10 via-transparent to-pink-900/10 pointer-events-none" />

      <div className="relative max-w-7xl mx-auto">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-4 w-4 text-purple-400" />
          <span className="text-xs font-bold uppercase tracking-widest text-purple-400">
            Tonight&apos;s Top Pick For You
          </span>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-10">
          <div className="flex flex-col">
            <button
              onClick={handleClick}
              className="group relative w-full max-w-[280px] sm:max-w-[320px] lg:w-[320px] flex-shrink-0 rounded-lg overflow-hidden focus:outline-none focus:ring-4 focus:ring-purple-500/50 transition-all mb-4"
              aria-label={`View details for ${movie.title}`}
            >
              <div className="aspect-[2/3] bg-neutral-900 relative">
                {!imageLoaded && (
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 to-pink-900/20 animate-pulse" />
                )}
                <img
                  src={tmdbImg(movie.poster_path || movie.backdrop_path, 'w500')}
                  alt={movie.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="eager"
                  onLoad={() => setImageLoaded(true)}
                  style={{ opacity: imageLoaded ? 1 : 0 }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="h-16 w-16 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center">
                    <Info className="h-7 w-7 text-black" />
                  </div>
                </div>
              </div>
            </button>

            {movie.providers?.flatrate?.[0] && (
              <div className="w-full max-w-[280px] sm:max-w-[320px] lg:w-[320px] flex items-center gap-3 px-4 py-3 rounded-lg bg-[#1a2332] border border-white/10">
                <img
                  src={`https://image.tmdb.org/t/p/w92${movie.providers.flatrate[0].logo_path}`}
                  alt={movie.providers.flatrate[0].provider_name}
                  className="h-10 w-10 rounded object-cover"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-white/50 font-medium mb-0.5">
                    Now Streaming
                  </p>
                  <p className="text-sm text-white font-bold">Watch Now</p>
                </div>
              </div>
            )}
          </div>

          <div className="flex-1 flex flex-col justify-center min-w-0">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-3 leading-[1.1]">
              {movie.title}
            </h1>

            <div className="flex flex-wrap items-center gap-2 text-sm text-white/70 mb-5">
              {movie.certification && (
                <span className="px-2 py-0.5 rounded border border-white/30 text-xs font-bold text-white/90">
                  {movie.certification}
                </span>
              )}
              {year && <span className="font-medium">{year}</span>}
              {movie.genres?.slice(0, 3).map((genre, idx) => (
                <span key={genre.id} className="flex items-center gap-2">
                  {idx > 0 && <span className="text-white/40">•</span>}
                  <span>{genre.name}</span>
                </span>
              ))}
              {movie.runtime && (
                <>
                  <span className="text-white/40">•</span>
                  <span>
                    {Math.floor(movie.runtime / 60)}h {movie.runtime % 60}m
                  </span>
                </>
              )}
            </div>

            <div className="flex items-center gap-6 mb-5">
              <div className="flex items-center gap-3">
                <div className="relative w-16 h-16">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="32"
                      cy="32"
                      r="24"
                      stroke="currentColor"
                      strokeWidth="3"
                      fill="none"
                      className="text-white/10"
                    />
                    <circle
                      cx="32"
                      cy="32"
                      r="24"
                      stroke="currentColor"
                      strokeWidth="3"
                      fill="none"
                      strokeDasharray={circumference}
                      strokeDashoffset={circumference * (1 - rating / 10)}
                      className="text-emerald-400 transition-all duration-1000"
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-white font-bold text-base">
                      {ratingPercent}
                      <sup className="text-[10px]">%</sup>
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-white text-xs font-bold leading-tight">
                    User
                  </p>
                  <p className="text-white text-xs font-bold leading-tight">
                    Score
                  </p>
                </div>
              </div>

              {movie.mood_emojis && (
                <div className="flex items-center gap-1">
                  {movie.mood_emojis.split('').map((emoji, i) => (
                    <span key={i} className="text-2xl">
                      {emoji}
                    </span>
                  ))}
                </div>
              )}

              {movie.mood_match_percent && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/20 border border-emerald-400/30">
                  <div>
                    <p className="text-xs text-white/70 leading-tight">
                      Your Vibe
                    </p>
                    <p className="text-sm font-black text-emerald-400">
                      {movie.mood_match_percent}%
                    </p>
                  </div>
                </div>
              )}
            </div>

            {user && (
              <div className="flex items-center gap-3 mb-5">
                <button
                  onClick={handleClick}
                  className="h-12 w-12 rounded-full bg-[#1a2332] hover:bg-[#243142] border border-white/10 flex items-center justify-center transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-white/20"
                  aria-label="Add to list"
                >
                  <List className="h-5 w-5 text-white" />
                </button>
                <button
                  onClick={handleClick}
                  className="h-12 w-12 rounded-full bg-[#1a2332] hover:bg-[#243142] border border-white/10 flex items-center justify-center transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-white/20"
                  aria-label="Add to favorites"
                >
                  <Heart className="h-5 w-5 text-white" />
                </button>
                <button
                  onClick={toggleWatchlist}
                  disabled={actionLoading.watchlist}
                  className={`h-12 w-12 rounded-full border transition-all hover:scale-110 focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center ${
                    isInWatchlist
                      ? 'bg-purple-500/30 border-purple-400 focus:ring-purple-300'
                      : 'bg-[#1a2332] hover:bg-[#243142] border-white/10 focus:ring-white/20'
                  }`}
                  aria-label={
                    isInWatchlist ? 'Remove from watchlist' : 'Add to watchlist'
                  }
                >
                  {actionLoading.watchlist ? (
                    <Loader2 className="h-5 w-5 text-white animate-spin" />
                  ) : isInWatchlist ? (
                    <Check className="h-5 w-5 text-purple-300" />
                  ) : (
                    <Bookmark className="h-5 w-5 text-white" />
                  )}
                </button>
                <button
                  onClick={toggleWatched}
                  disabled={actionLoading.watched}
                  className={`h-12 w-12 rounded-full border transition-all hover:scale-110 focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center ${
                    isWatched
                      ? 'bg-emerald-500/30 border-emerald-400 focus:ring-emerald-300'
                      : 'bg-[#1a2332] hover:bg-[#243142] border-white/10 focus:ring-white/20'
                  }`}
                  aria-label={isWatched ? 'Mark as unwatched' : 'Mark as watched'}
                >
                  {actionLoading.watched ? (
                    <Loader2 className="h-5 w-5 text-white animate-spin" />
                  ) : isWatched ? (
                    <Eye className="h-5 w-5 text-emerald-300" />
                  ) : (
                    <EyeOff className="h-5 w-5 text-white" />
                  )}
                </button>
                {movie.trailer_url && (
                  <button
                    onClick={() => window.open(movie.trailer_url, '_blank')}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#1a2332] hover:bg-[#243142] border border-white/10 text-white font-semibold text-sm transition-all focus:outline-none focus:ring-2 focus:ring-white/20"
                  >
                    <Play className="h-4 w-4" />
                    <span>Play Trailer</span>
                  </button>
                )}
              </div>
            )}

            {movie.tagline && (
              <p className="text-white/50 italic text-sm mb-5 font-medium">
                {movie.tagline}
              </p>
            )}

            <div className="mb-5">
              <h2 className="text-white font-bold text-lg mb-2">Overview</h2>
              {movie.overview && (
                <p className="text-base text-white/80 leading-relaxed">
                  {movie.overview}
                </p>
              )}
            </div>

            {movie.director && (
              <div>
                <h3 className="text-white font-bold text-base">
                  {movie.director.name}
                </h3>
                <p className="text-white/60 text-sm">
                  Director
                  {movie.director.roles?.includes('Writer') ? ', Writer' : ''}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
