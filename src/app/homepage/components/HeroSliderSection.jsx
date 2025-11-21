// src/app/homepage/components/HeroSliderSection.jsx

import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Info, Plus, Check } from "lucide-react"
import { supabase } from "@/shared/lib/supabase/client"

const tmdbImg = (p, s = "original") =>
  p ? `https://image.tmdb.org/t/p/${s}${p}` : ""

export default function HeroSliderSection({ className = "" }) {
  const [slides, setSlides] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [watchlistIds, setWatchlistIds] = useState(new Set())
  const [watchlistBusy, setWatchlistBusy] = useState(false)

  const nav = useNavigate()
  const timerRef = useRef(null)
  const touchStartX = useRef(0)
  const touchEndX = useRef(0)

  // Get user + watchlist
  useEffect(() => {
    ;(async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user ?? null)

      if (user) {
        const { data } = await supabase
          .from("user_watchlist")
          .select("movie_id")
          .eq("user_id", user.id)

        if (data) {
          setWatchlistIds(new Set(data.map((item) => item.movie_id)))
        }
      }
    })()
  }, [])

  // Fetch trending movies
  useEffect(() => {
    setLoading(true)
    fetch(
      `https://api.themoviedb.org/3/trending/movie/week?api_key=${
        import.meta.env.VITE_TMDB_API_KEY
      }&language=en-US`,
    )
      .then((r) => r.json())
      .then((j) => {
        const movies = j?.results?.slice(0, 6) ?? []
        setSlides(movies)
        setLoading(false)
      })
      .catch(() => {
        setSlides([])
        setLoading(false)
      })
  }, [])

  // Auto-advance
  useEffect(() => {
    if (!slides.length || isPaused) return
    clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      nextSlide()
    }, 8000)
    return () => clearInterval(timerRef.current)
  }, [slides.length, currentIndex, isPaused])

  const nextSlide = () => {
    if (isTransitioning || !slides.length) return
    setIsTransitioning(true)
    setCurrentIndex((prev) => (prev + 1) % slides.length)
    setTimeout(() => setIsTransitioning(false), 600)
  }

  const prevSlide = () => {
    if (isTransitioning || !slides.length) return
    setIsTransitioning(true)
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length)
    setTimeout(() => setIsTransitioning(false), 600)
  }

  const goToSlide = (index) => {
    if (isTransitioning || index === currentIndex) return
    setIsTransitioning(true)
    setCurrentIndex(index)
    setTimeout(() => setIsTransitioning(false), 400)
  }

  // Touch gestures
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX
    touchEndX.current = e.touches[0].clientX
  }

  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX
  }

  const handleTouchEnd = () => {
    const diffX = touchStartX.current - touchEndX.current
    const minSwipeDistance = 50
    if (Math.abs(diffX) > minSwipeDistance) {
      if (diffX > 0) nextSlide()
      else prevSlide()
    }
    touchStartX.current = 0
    touchEndX.current = 0
  }

  const currentMovie = slides[currentIndex] || {}
  const inWatchlist = currentMovie.id && watchlistIds.has(currentMovie.id)

  const viewDetails = () =>
    currentMovie?.id && nav(`/movie/${currentMovie.id}`)

  async function toggleWatchlist() {
    if (!user || !currentMovie?.id || watchlistBusy) return
    setWatchlistBusy(true)
    const movieId = currentMovie.id

    try {
      if (watchlistIds.has(movieId)) {
        // Remove
        await supabase
          .from("user_watchlist")
          .delete()
          .eq("user_id", user.id)
          .eq("movie_id", movieId)

        setWatchlistIds((prev) => {
          const next = new Set(prev)
          next.delete(movieId)
          return next
        })
      } else {
        // Add
        await supabase.from("user_watchlist").upsert(
          {
            user_id: user.id,
            movie_id: movieId,
          },
          { onConflict: "user_id,movie_id" },
        )

        setWatchlistIds((prev) => {
          const next = new Set(prev)
          next.add(movieId)
          return next
        })
      }
    } finally {
      setWatchlistBusy(false)
    }
  }

  if (loading) {
    return (
      <section
        className={`relative w-full bg-black ${className}`}
        aria-label="Featured movies"
      >
        <div className="h-[70vh] md:h-[78vh] bg-neutral-900 animate-pulse" />
      </section>
    )
  }

  if (!slides.length) return null

  return (
    <section
      className={`relative w-full overflow-hidden bg-black ${className}`}
      aria-label="Featured movies"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Background layer */}
      <div className="relative w-full h-[72vh] md:h-[80vh]">
        {slides.map((movie, idx) => {
          const bg = tmdbImg(movie.backdrop_path || movie.poster_path, "original")
          return (
            <div
              key={movie.id ?? idx}
              className={`absolute inset-0 transition-opacity duration-700 ease-out ${
                idx === currentIndex ? "opacity-100 z-10" : "opacity-0 z-0"
              }`}
            >
              {bg && (
                <img
                  src={bg}
                  alt={movie.title}
                  className="absolute inset-0 h-full w-full object-cover"
                  loading={idx === 0 ? "eager" : "lazy"}
                />
              )}
            </div>
          )
        })}

        {/* Strong gradients for readability */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 md:h-28 bg-gradient-to-b from-black via-black/80 to-transparent z-20" />
        <div className="pointer-events-none absolute inset-y-0 left-0 w-3/5 md:w-1/2 bg-gradient-to-r from-black via-black/80 to-transparent z-20" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black via-black/90 to-transparent z-20" />

        {/* Main content panel */}
        <div className="absolute inset-0 z-30 flex items-end pb-8 md:pb-12 lg:pb-16">
          <div className="w-full px-4 sm:px-6 md:px-10 lg:px-16">
            <div className="max-w-xl md:max-w-2xl space-y-3 md:space-y-4">
              {/* Pill / tag row */}
              <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em]">
                <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-[10px] text-white/70 backdrop-blur">
                  <span className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-purple-400 to-pink-400" />
                  Top pick for you
                </span>
                {currentMovie.vote_average > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/15 border border-purple-500/40 px-2 py-0.5 text-[10px] text-purple-200">
                    ★ {currentMovie.vote_average.toFixed(1)} TMDb
                  </span>
                )}
              </div>

              {/* Title */}
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black tracking-tight leading-tight text-white drop-shadow-[0_8px_35px_rgba(0,0,0,0.9)] line-clamp-2">
                {currentMovie.title || "Featured"}
              </h1>

              {/* Meta row */}
              <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-white/75">
                {currentMovie.release_date && (
                  <span className="font-semibold">
                    {new Date(currentMovie.release_date).getFullYear()}
                  </span>
                )}
                {currentMovie.original_language && (
                  <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] uppercase">
                    {currentMovie.original_language}
                  </span>
                )}
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px]">
                  HD
                </span>
              </div>

              {/* Overview */}
              {currentMovie.overview && (
                <p className="hidden sm:block text-sm md:text-[15px] text-white/85 leading-relaxed max-w-xl line-clamp-3">
                  {currentMovie.overview}
                </p>
              )}

              {/* CTA row */}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={viewDetails}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-5 md:px-6 py-2.5 text-sm md:text-[15px] font-bold text-white shadow-lg shadow-purple-900/30 transition-all hover:scale-[1.03] active:scale-95 focus:outline-none focus:ring-4 focus:ring-purple-500/30"
                >
                  <Info className="h-4 w-4" />
                  <span>More info</span>
                </button>

                <button
                  type="button"
                  onClick={toggleWatchlist}
                  disabled={watchlistBusy || !user}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-black/40 px-4 md:px-5 py-2.5 text-xs md:text-sm font-semibold text-white/85 shadow-[0_0_25px_rgba(0,0,0,0.8)] backdrop-blur-md transition-all hover:bg-white/10 hover:border-purple-400/60 hover:text-purple-100 active:scale-95 disabled:opacity-60"
                >
                  {inWatchlist ? (
                    <>
                      <Check className="h-4 w-4 text-emerald-400" />
                      <span>In Watchlist</span>
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      <span>Add to Watchlist</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mini-poster rail (Prime/Crave style) */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-40 pb-3 md:pb-4">
          <div className="flex justify-center md:justify-end px-4 sm:px-6 md:px-10 lg:px-16">
            <div className="pointer-events-auto flex gap-2 rounded-2xl bg-black/60 backdrop-blur-md px-3 py-2 border border-white/10 shadow-[0_18px_45px_rgba(0,0,0,0.9)]">
              {slides.map((movie, idx) => {
                const poster = tmdbImg(
                  movie.backdrop_path || movie.poster_path,
                  "w300",
                )
                const active = idx === currentIndex

                return (
                  <button
                    key={movie.id ?? idx}
                    type="button"
                    onClick={() => goToSlide(idx)}
                    className={`relative h-14 w-24 overflow-hidden rounded-xl border transition-all duration-300 ${
                      active
                        ? "border-purple-400 shadow-lg shadow-purple-900/50 scale-100"
                        : "border-white/10 opacity-60 hover:opacity-100 hover:scale-95"
                    }`}
                    aria-label={`Show ${movie.title}`}
                  >
                    {poster ? (
                      <img
                        src={poster}
                        alt={movie.title}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-white/5 text-[10px] text-white/40">
                        No Image
                      </div>
                    )}
                    {active && (
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/0 to-black/40" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Simple dot indicators for mobile (optional) */}
        <div className="absolute bottom-3 left-1/2 z-40 flex -translate-x-1/2 gap-1.5 md:hidden">
          {slides.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => goToSlide(idx)}
              className={`h-1.5 rounded-full transition-all ${
                idx === currentIndex
                  ? "w-5 bg-gradient-to-r from-purple-500 to-pink-500"
                  : "w-1.5 bg-white/40"
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
