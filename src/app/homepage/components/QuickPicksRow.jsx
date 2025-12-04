// src/app/homepage/components/QuickPicksRow.jsx
import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { 
  Sparkles, 
  Loader2, 
  AlertCircle,
  Play,
  Plus,
  Check,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  ChevronDown
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { tmdbImg } from '@/shared/api/tmdb'
import { useQuickPicks, useTopPick } from '@/shared/hooks/useRecommendations'
import { supabase } from '@/shared/lib/supabase/client'
import { useUserMovieStatus } from '@/shared/hooks/useUserMovieStatus'

// ============================================================================
// CONSTANTS
// ============================================================================
const HOVER_DELAY = 450
const COLLAPSE_DELAY = 100

// ============================================================================
// ACTION BUTTON
// ============================================================================
function ActionBtn({ onClick, active, activeColor, icon: Icon, activeIcon: ActiveIcon, label, loading }) {
  const colors = {
    purple: { active: 'bg-purple-500/50 border-purple-400 text-purple-200' },
    emerald: { active: 'bg-emerald-500/50 border-emerald-400 text-emerald-200' }
  }
  const c = colors[activeColor] || colors.purple

  return (
    <button
      onClick={onClick}
      disabled={loading}
      title={label}
      className={`h-9 w-9 rounded-full border-2 transition-all duration-200 flex items-center justify-center focus:outline-none disabled:opacity-50 hover:scale-110 active:scale-95 ${
        active ? c.active : 'bg-neutral-800/90 hover:bg-neutral-700 border-white/30 hover:border-white/50 text-white'
      }`}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 
       active && ActiveIcon ? <ActiveIcon className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
    </button>
  )
}

// ============================================================================
// MOVIE CARD
// ============================================================================
function MovieCard({ movie, isExpanded, onHover, onLeave }) {
  const navigate = useNavigate()
  const cardRef = useRef(null)
  const hoverTimer = useRef(null)
  const leaveTimer = useRef(null)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [user, setUser] = useState(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user: u } }) => setUser(u))
  }, [])

  const {
    isInWatchlist,
    isWatched,
    loading: actionLoading,
    toggleWatchlist,
    toggleWatched
  } = useUserMovieStatus({ user, movie, source: 'quick_picks' })

  useEffect(() => {
    return () => {
      clearTimeout(hoverTimer.current)
      clearTimeout(leaveTimer.current)
    }
  }, [])

  const handleMouseEnter = () => {
    clearTimeout(leaveTimer.current)
    hoverTimer.current = setTimeout(() => onHover(movie.id), HOVER_DELAY)
  }

  const handleMouseLeave = () => {
    clearTimeout(hoverTimer.current)
    leaveTimer.current = setTimeout(() => onLeave(), COLLAPSE_DELAY)
  }

  const goToMovie = () => navigate(`/movie/${movie.id}`)

  const rating = movie.vote_average > 0 ? movie.vote_average.toFixed(1) : null
  const year = movie.release_date ? new Date(movie.release_date).getFullYear() : null
  const matchPercent = movie.vote_average > 0 ? Math.round(movie.vote_average * 10) : null
  
  // Use tagline if available, otherwise first sentence of overview
  const shortDesc = movie.tagline || (movie.overview ? movie.overview.split('.')[0] + '.' : null)

  return (
    <div
      ref={cardRef}
      className="relative flex-none snap-start"
      style={{ width: 'var(--card-width)' }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Expanded glow effect */}
      {isExpanded && (
        <div className="absolute -inset-3 bg-purple-500/10 rounded-2xl blur-xl transition-opacity duration-300" />
      )}

      {/* Card */}
      <div
        className={`relative rounded-xl overflow-hidden transition-all ease-out cursor-pointer ${
          isExpanded 
            ? 'duration-300 scale-105 sm:scale-110 z-50 shadow-2xl shadow-black ring-1 ring-white/20' 
            : 'duration-200 scale-100 hover:scale-[1.02] z-10 shadow-xl shadow-black/50'
        }`}
        onClick={goToMovie}
      >
        <div className="bg-neutral-900 rounded-xl overflow-hidden">
          {/* Poster */}
          <div className="relative aspect-[2/3] bg-neutral-800">
            {/* Blur-up placeholder */}
            <div
              className={`absolute inset-0 transition-opacity duration-500 ${imageLoaded ? 'opacity-0' : 'opacity-100'}`}
              style={{
                backgroundImage: movie.poster_path ? `url(${tmdbImg(movie.poster_path, 'w92')})` : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                filter: 'blur(12px) saturate(1.2)',
                transform: 'scale(1.1)'
              }}
            />
            
            <img
              src={tmdbImg(movie.poster_path, 'w500')}
              alt={movie.title}
              loading="lazy"
              onLoad={() => setImageLoaded(true)}
              className={`w-full h-full object-cover transition-opacity duration-500 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
            />

            {/* Rating badge */}
            {rating && !isExpanded && (
              <div className="absolute top-2.5 right-2.5 flex items-center gap-1 px-2 py-1 rounded-md bg-black/80 backdrop-blur-sm text-xs font-bold text-white shadow-lg">
                <span className="text-yellow-400">★</span>
                {rating}
              </div>
            )}

            {/* Bottom gradient for expanded state */}
            {isExpanded && (
              <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-neutral-900 via-neutral-900/80 to-transparent" />
            )}
          </div>

          {/* Expanded content */}
          <div 
            className={`overflow-hidden transition-all ease-out ${
              isExpanded ? 'max-h-[220px] opacity-100 duration-300' : 'max-h-0 opacity-0 duration-200'
            }`}
          >
            <div className="p-4 pt-2">
              {/* Title */}
              <h3 className="text-base font-bold text-white leading-tight mb-3 line-clamp-1">
                {movie.title}
              </h3>

              {/* Action buttons */}
              <div className="flex items-center gap-2 mb-3">
                {/* Play button */}
                <button
                  onClick={(e) => { 
                    e.stopPropagation()
                    movie.trailer_url ? window.open(movie.trailer_url, '_blank') : goToMovie()
                  }}
                  className="h-9 w-9 rounded-full bg-white text-black flex items-center justify-center hover:bg-white/90 transition-transform hover:scale-110 active:scale-95 shadow-lg"
                  title="Play"
                >
                  <Play className="h-4 w-4 fill-current ml-0.5" />
                </button>

                {user && (
                  <>
                    <ActionBtn
                      onClick={(e) => { e.stopPropagation(); toggleWatchlist() }}
                      active={isInWatchlist}
                      activeIcon={Check}
                      icon={Plus}
                      activeColor="purple"
                      label={isInWatchlist ? 'In Watchlist' : 'Add to Watchlist'}
                      loading={actionLoading.watchlist}
                    />
                    <ActionBtn
                      onClick={(e) => { e.stopPropagation(); toggleWatched() }}
                      active={isWatched}
                      activeIcon={Eye}
                      icon={EyeOff}
                      activeColor="emerald"
                      label={isWatched ? 'Watched' : 'Mark Watched'}
                      loading={actionLoading.watched}
                    />
                  </>
                )}

                {/* More info */}
                <button
                  onClick={(e) => { e.stopPropagation(); goToMovie() }}
                  className="ml-auto h-9 w-9 rounded-full border-2 border-white/30 hover:border-white/60 bg-transparent hover:bg-white/10 text-white flex items-center justify-center transition-all hover:scale-110 active:scale-95"
                  title="More Info"
                >
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>

              {/* Metadata */}
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                {matchPercent && (
                  <span className="text-emerald-400 font-bold text-sm">{matchPercent}%</span>
                )}
                {movie.certification && (
                  <span className="px-1.5 py-0.5 border border-white/40 text-[10px] font-bold text-white/80 rounded">
                    {movie.certification}
                  </span>
                )}
                {year && <span className="text-white/50 text-xs">{year}</span>}
                {movie.runtime > 0 && (
                  <span className="text-white/50 text-xs">
                    {Math.floor(movie.runtime / 60)}h {movie.runtime % 60}m
                  </span>
                )}
              </div>

              {/* Genres */}
              {movie.genres?.length > 0 && (
                <div className="flex items-center gap-1.5 mb-2">
                  {movie.genres.slice(0, 3).map((g, i) => (
                    <span key={g.id || i} className="text-[11px] text-white/60">
                      {i > 0 && <span className="mr-1.5 text-white/30">•</span>}
                      {g.name || g}
                    </span>
                  ))}
                </div>
              )}

              {/* Description (tagline or first sentence) */}
              {shortDesc && (
                <p className="text-[11px] text-white/40 leading-relaxed line-clamp-2">
                  {shortDesc}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile title */}
      {!isExpanded && (
        <div className="mt-2.5 sm:hidden px-0.5">
          <h3 className="text-xs font-medium text-white/60 line-clamp-1">{movie.title}</h3>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// NAV ARROW
// ============================================================================
function NavArrow({ direction, onClick, visible }) {
  const Icon = direction === 'left' ? ChevronLeft : ChevronRight
  const pos = direction === 'left' ? 'left-2 sm:left-4' : 'right-2 sm:right-4'
  
  return (
    <button
      onClick={onClick}
      className={`absolute ${pos} top-1/2 -translate-y-1/2 z-40 transition-all duration-200 ${
        visible ? 'opacity-100 translate-x-0' : `opacity-0 ${direction === 'left' ? '-translate-x-4' : 'translate-x-4'} pointer-events-none`
      }`}
      aria-label={`Scroll ${direction}`}
    >
      <div className="h-11 w-11 sm:h-12 sm:w-12 rounded-full bg-black/90 hover:bg-black border border-white/20 hover:border-white/40 flex items-center justify-center transition-all hover:scale-110 shadow-2xl shadow-black">
        <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
      </div>
    </button>
  )
}

// ============================================================================
// MAIN
// ============================================================================
export default function QuickPicksRow() {
  const { data: topPick } = useTopPick()
  const excludeTmdbId = topPick?.id || null
  const { data: movies, loading, error } = useQuickPicks({ limit: 20, excludeTmdbId })
  
  const scrollRef = useRef(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const [expandedId, setExpandedId] = useState(null)

  const validMovies = useMemo(() => (movies || []).filter(m => m?.poster_path), [movies])

  const updateScrollState = useCallback(() => {
    if (!scrollRef.current) return
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
    setCanScrollLeft(scrollLeft > 10)
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10)
  }, [])

  // Collapse on scroll
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    const handleScroll = () => {
      updateScrollState()
      setExpandedId(null)
    }

    el.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', updateScrollState)
    updateScrollState()

    return () => {
      el.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', updateScrollState)
    }
  }, [updateScrollState])

  const scroll = (dir) => {
    if (!scrollRef.current) return
    setExpandedId(null)
    scrollRef.current.scrollBy({
      left: dir === 'left' ? -scrollRef.current.clientWidth * 0.8 : scrollRef.current.clientWidth * 0.8,
      behavior: 'smooth'
    })
  }

  const handleHover = useCallback((id) => setExpandedId(id), [])
  const handleLeave = useCallback(() => setExpandedId(null), [])

  // Loading
  if (loading) {
    return (
      <section className="relative py-6 sm:py-8">
        <div className="px-8 sm:px-12 lg:px-20 mb-5">
          <div className="flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-purple-400" />
            <h2 className="text-xl sm:text-2xl font-bold text-white">Quick picks for tonight</h2>
          </div>
        </div>
        <div className="px-8 sm:px-12 lg:px-20">
          <div className="flex gap-4 sm:gap-5">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex-none w-[160px] sm:w-[200px] lg:w-[220px] xl:w-[240px]">
                <div className="aspect-[2/3] rounded-xl bg-white/5 animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="relative py-6 sm:py-8">
        <div className="px-8 sm:px-12 lg:px-20">
          <div className="flex items-center gap-3 mb-4">
            <Sparkles className="h-5 w-5 text-purple-400" />
            <h2 className="text-xl sm:text-2xl font-bold text-white">Quick picks for tonight</h2>
          </div>
          <div className="flex items-center gap-2 py-8 text-white/40">
            <AlertCircle className="h-5 w-5" />
            <span>Couldn't load recommendations</span>
          </div>
        </div>
      </section>
    )
  }

  if (validMovies.length === 0) return null

  return (
    <section className="relative py-6 sm:py-8 overflow-visible">
      <style>{`
        .qp-row {
          --card-width: 160px;
          --card-gap: 16px;
        }
        @media (min-width: 640px) {
          .qp-row { --card-width: 200px; --card-gap: 20px; }
        }
        @media (min-width: 1024px) {
          .qp-row { --card-width: 220px; }
        }
        @media (min-width: 1280px) {
          .qp-row { --card-width: 240px; }
        }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { scrollbar-width: none; -ms-overflow-style: none; }
      `}</style>

      {/* Header */}
      <div className="px-8 sm:px-12 lg:px-20 mb-5">
        <div className="flex items-center gap-3">
          <Sparkles className="h-5 w-5 text-purple-400" />
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Quick picks for tonight
          </h2>
        </div>
      </div>

      {/* Carousel */}
      <div className="relative qp-row">
        <NavArrow direction="left" onClick={() => scroll('left')} visible={canScrollLeft} />
        <NavArrow direction="right" onClick={() => scroll('right')} visible={canScrollRight} />

        <div
          ref={scrollRef}
          className="flex gap-[var(--card-gap)] overflow-x-auto overflow-y-visible px-8 sm:px-12 lg:px-20 py-6 snap-x snap-mandatory hide-scrollbar scroll-smooth"
        >
          {validMovies.map((movie) => (
            <MovieCard
              key={movie.id}
              movie={movie}
              isExpanded={expandedId === movie.id}
              onHover={handleHover}
              onLeave={handleLeave}
            />
          ))}
          
          {/* End spacer for edge cards */}
          <div className="flex-none w-8 sm:w-12 lg:w-20" aria-hidden="true" />
        </div>
      </div>
    </section>
  )
}