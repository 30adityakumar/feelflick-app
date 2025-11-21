// src/app/homepage/components/HeroSliderSection.jsx
import { Info, Play } from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"

const tmdbImg = (p, s = "original") =>
  p ? `https://image.tmdb.org/t/p/${s}${p}` : ""

export default function HeroSliderSection({ className = "" }) {
  const [slides, setSlides] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const nav = useNavigate()
  const timerRef = useRef(null)

  useEffect(() => {
    fetch(`https://api.themoviedb.org/3/trending/movie/week?api_key=${import.meta.env.VITE_TMDB_API_KEY}&language=en-US`)
      .then(r => r.json())
      .then(j => setSlides(j?.results?.slice(0, 6) ?? []))
      .catch(() => setSlides([]))
  }, [])

  useEffect(() => {
    if (!slides.length || isPaused) return
    clearInterval(timerRef.current)
    timerRef.current = setInterval(() => nextSlide(), 7500)
    return () => clearInterval(timerRef.current)
  }, [slides, currentIndex, isPaused])

  function nextSlide() {
    setIsTransitioning(true)
    setCurrentIndex(i => (i + 1) % slides.length)
    setTimeout(() => setIsTransitioning(false), 900)
  }
  function prevSlide() {
    setIsTransitioning(true)
    setCurrentIndex(i => (i - 1 + slides.length) % slides.length)
    setTimeout(() => setIsTransitioning(false), 900)
  }
  function goToSlide(idx) {
    if (!isTransitioning && idx !== currentIndex) {
      setIsTransitioning(true)
      setCurrentIndex(idx)
      setTimeout(() => setIsTransitioning(false), 700)
    }
  }
  // TOUCH
  const touchX = useRef(0)
  function handleTouchStart(e) {
    touchX.current = e.touches[0].clientX
  }
  function handleTouchEnd(e) {
    const delta = touchX.current - e.changedTouches[0].clientX
    if (Math.abs(delta) > 60) {
      if (delta > 0) nextSlide()
      else prevSlide()
    }
    touchX.current = 0
  }

  const current = slides[currentIndex]
  // --- MAIN RENDER ---
  return (
    <section
      className={`relative w-full min-h-[65vh] bg-black overflow-hidden ${className}`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      style={{marginTop: "2rem"}}
    >
      {/* Horizontal backdrop */}
      <img
        src={tmdbImg(current?.backdrop_path || current?.poster_path)}
        alt={current?.title || ""}
        className="absolute inset-0 w-full h-full object-cover z-0 transition-opacity duration-800"
        style={{
          opacity: 1,
          filter: "brightness(0.75)",
        }}
      />
      {/* Layered gradients for readability */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        {/* Heavy left fade for info card */}
        <div className="absolute inset-y-0 left-0 w-full md:w-2/3 bg-gradient-to-r from-black via-black/80 to-transparent" />
        {/* Bottom fade */}
        <div className="absolute bottom-0 w-full h-1/2 bg-gradient-to-t from-black via-black/80 to-transparent" />
      </div>
      {/* Movie Info Card */}
      <div className="relative z-20 flex flex-col items-start justify-end md:justify-center h-full px-6 md:px-16 py-10 md:py-16 max-w-2xl">
        <div className="mb-3">
          <h1 className="text-3xl md:text-5xl font-black tracking-tight bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent drop-shadow-xl max-w-xl line-clamp-2">
            {current?.title}
          </h1>
        </div>
        <div className="flex items-center gap-2 mb-4">
          {current?.vote_average > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-300 font-bold text-sm shadow">
              ★ {current.vote_average.toFixed(1)}
            </span>
          )}
          {current?.release_date && (
            <span className="px-2 py-0.5 rounded bg-white/10 text-white font-semibold text-xs shadow backdrop-blur-md">
              {new Date(current.release_date).getFullYear()}
            </span>
          )}
          <span className="px-2 py-0.5 rounded bg-white/20 text-white/70 text-xs font-semibold shadow-md backdrop-blur-md">
            HD
          </span>
        </div>
        <p className="hidden md:block text-white/90 text-base font-medium mb-6 line-clamp-3">
          {current?.overview}
        </p>
        <div className="flex gap-4">
          <button
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white inline-flex items-center gap-2 font-bold rounded-xl px-5 py-3 shadow-lg shadow-purple-800/30 text-lg hover:scale-105 active:scale-95 focus:ring-2 focus:ring-purple-500 transition-all"
            onClick={() => current?.id && nav(`/movie/${current.id}`)}
          >
            <Play className="h-5 w-5" />
            <span>Play</span>
          </button>
          <button
            className="inline-flex items-center gap-1.5 rounded-xl px-5 py-3 text-lg font-bold text-white bg-white/10 border border-white/20 shadow focus:ring-2 focus:ring-purple-500 transition-all hover:bg-white/20"
            onClick={() => current?.id && nav(`/movie/${current.id}`)}
          >
            <Info className="h-5 w-5" />
            <span>More Info</span>
          </button>
        </div>
      </div>
      {/* Controls and Dots */}
      <button
        onClick={prevSlide}
        aria-label="Previous Slide"
        disabled={isTransitioning}
        className="absolute left-2 top-1/2 -translate-y-1/2 z-40 h-9 w-9 rounded-full bg-black/60 text-white flex items-center justify-center opacity-80 hover:bg-black/80 transition-all group"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} fill="none">
          <path d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <button
        onClick={nextSlide}
        aria-label="Next Slide"
        disabled={isTransitioning}
        className="absolute right-2 top-1/2 -translate-y-1/2 z-40 h-9 w-9 rounded-full bg-black/60 text-white flex items-center justify-center opacity-80 hover:bg-black/80 transition-all group"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} fill="none">
          <path d="M9 5l7 7-7 7" />
        </svg>
      </button>
      <div className="absolute bottom-6 left-6 z-40 flex items-center gap-2">
        {slides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => goToSlide(idx)}
            aria-label={`Go to slide ${idx + 1}`}
            className={`h-2 rounded-full transition-all ${
              idx === currentIndex
                ? "w-8 bg-gradient-to-r from-purple-500 to-pink-500 shadow shadow-pink-800/20"
                : "w-2 bg-white/40"
            }`}
          />
        ))}
      </div>
    </section>
  )
}
