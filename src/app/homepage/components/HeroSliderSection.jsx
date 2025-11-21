// src/app/homepage/components/HeroSliderSection.jsx
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Play, Info } from 'lucide-react'

const tmdbImg = (p) => p ? `https://image.tmdb.org/t/p/original${p}` : ""

export default function HeroSliderSection({ className = '' }) {
  const [slides, setSlides] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const nav = useNavigate()
  const timerRef = useRef(null)

  useEffect(() => {
    fetch(`https://api.themoviedb.org/3/trending/movie/week?api_key=${import.meta.env.VITE_TMDB_API_KEY}&language=en-US`)
      .then(r => r.json())
      .then(j => setSlides(j?.results?.slice(0, 6) || []))
  }, [])

  useEffect(() => {
    if (!slides.length || isPaused) return;
    timerRef.current = setInterval(() => setCurrentIndex(i => (i + 1) % slides.length), 8000)
    return () => clearInterval(timerRef.current)
  }, [slides.length, isPaused])

  if (!slides.length) return <div className="h-[56vw] min-h-[400px] bg-neutral-900 animate-pulse" />

  return (
    <section
      className={`relative w-full overflow-x-clip bg-black ${className}`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Slides track */}
      <div className="relative h-[56vw] min-h-[400px] flex items-center transition-all duration-700 ease-in-out"
        style={{
          transform: `translateX(calc(50vw - 48% - ${currentIndex * 60}vw))`
        }}>
        {slides.map((movie, idx) => (
          <div
            key={movie.id}
            className={`
              group relative mx-2 shadow-lg shadow-black/60 rounded-3xl overflow-hidden
              border-2 transition-all duration-500
              ${idx === currentIndex ? 'border-gradient-to-r from-purple-500 to-pink-500 scale-105 z-20' : 'border-transparent scale-95 opacity-70 z-10'}
              `}
            style={{
              width: '56vw',       // 16:9 ratio
              minWidth: '340px',
              maxWidth: '900px',
              height: '32vw',
              minHeight: '200px'
            }}
          >
            {/* Backdrop Image */}
            <img
              src={tmdbImg(movie.backdrop_path)}
              alt={movie.title}
              className="w-full h-full object-cover"
              draggable={false}
            />
            {/* Top Gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent z-10" />
            {/* Side & Bottom Brand Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/50 to-purple-900/70 z-10" />

            {/* Content Panel */}
            {idx === currentIndex && (
              <div className="absolute bottom-0 left-0 px-8 pb-8 pt-10 md:pt-20 max-w-[90%] z-20">
                <h1 className="text-3xl md:text-5xl font-black mb-3 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent drop-shadow-2xl">
                  {movie.title}
                </h1>
                {/* Example genre chips */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {movie.genre_ids?.slice(0, 2).map(id => (
                    <span key={id} className="px-3 py-1 rounded-full bg-purple-700/30 text-xs text-purple-100 font-bold border-2 border-purple-700/50">Genre</span>
                  ))}
                  {movie.adult && <span className="px-2 py-1 rounded-full bg-rose-800/40 text-xs font-bold text-white border border-rose-400">18+</span>}
                </div>
                <p className="hidden md:block text-white/90 text-base mb-6 max-w-2xl line-clamp-3">{movie.overview}</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => nav(`/movie/${movie.id}`)}
                    className="inline-flex items-center px-6 py-2.5 text-lg rounded-full font-bold bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:scale-105 active:scale-97 focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-xl shadow-purple-700/20 transition">
                    <Play className="h-5 w-5 mr-2" /> Watch Now
                  </button>
                  <button
                    onClick={() => nav(`/movie/${movie.id}`)}
                    className="inline-flex items-center px-6 py-2.5 text-lg rounded-full font-bold border-2 border-purple-500 text-white bg-black/60 hover:bg-purple-500/10 hover:text-pink-300 active:scale-97 focus:outline-none transition">
                    <Info className="h-5 w-5 mr-2" /> More Info
                  </button>
                </div>
              </div>
            )}

            {/* Meta tag - Top left */}
            {idx === currentIndex && (
              <div className="absolute top-6 left-8 flex gap-2 items-center text-white z-30">
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-bold bg-purple-500/30 border border-pink-400/40 shadow-lg">
                  ★ {movie.vote_average?.toFixed(1)}
                </span>
                {movie.release_date && (
                  <span className="px-2 py-0.5 rounded-md bg-white/10 text-xs font-semibold">{new Date(movie.release_date).getFullYear()}</span>
                )}
                <span className="px-2 py-0.5 rounded-md bg-white/10 text-xs font-semibold">HD</span>
              </div>
            )}
          </div>
        ))}
      </div>
      {/* Slide Indicators */}
      <div className="absolute bottom-7 left-0 right-0 flex justify-center z-40 gap-2">
        {slides.map((_, i) => (
          <button key={i}
            onClick={() => setCurrentIndex(i)}
            aria-label={'Go to slide ' + (i + 1)}
            className={`h-1 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500/40 ${
              i === currentIndex
                ? "w-8 bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg shadow-pink-500/40"
                : "w-2 bg-white/30 hover:bg-white/70 transition-all"
            }`}
          />
        ))}
      </div>
      {/* Optional: Slide arrows as in Prime, but styled minimally */}
      <button onClick={() => setCurrentIndex(currentIndex ? currentIndex - 1 : slides.length - 1)}
        className="absolute left-2 top-1/2 -translate-y-1/2 h-12 w-12 flex items-center justify-center rounded-full bg-black/30 text-white/50 hover:bg-black/50 hover:text-white backdrop-blur focus:outline-none"
        aria-label="Prev Slide"
      >
        <svg className="h-6 w-6" viewBox="0 0 24 24" stroke="currentColor" fill="none"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7"/></svg>
      </button>
      <button onClick={() => setCurrentIndex((currentIndex + 1) % slides.length)}
        className="absolute right-2 top-1/2 -translate-y-1/2 h-12 w-12 flex items-center justify-center rounded-full bg-black/30 text-white/50 hover:bg-black/50 hover:text-white backdrop-blur focus:outline-none"
        aria-label="Next Slide"
      >
        <svg className="h-6 w-6" viewBox="0 0 24 24" stroke="currentColor" fill="none"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7"/></svg>
      </button>
    </section>
  )
}
