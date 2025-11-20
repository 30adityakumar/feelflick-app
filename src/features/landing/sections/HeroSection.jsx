// src/features/landing/sections/HeroSection.jsx
import { useEffect, useState } from 'react'
import { Sparkles, PlayCircle } from 'lucide-react'
import { useScrollAnimation } from '@/features/landing/utils/scrollAnimations'

/**
 * 🎬 HERO SECTION
 * 
 * P0 IMPROVEMENTS:
 * - Added movie poster carousel background
 * - Single primary CTA (removed "Learn More")
 * - Changed badge from "Early Access" to "Join 10,000+ Movie Lovers"
 * - Improved subhead with benefit reinforcement
 */

// Curated movie poster URLs (mix of popular + indie for broad appeal)
const MOVIE_POSTERS = [
  'https://image.tmdb.org/t/p/w500/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg', // The Shawshank Redemption
  'https://image.tmdb.org/t/p/w500/3bhkrj58Vtu7enYsRolD1fZdja1.jpg', // The Godfather
  'https://image.tmdb.org/t/p/w500/rCzpDGLbOoPwLjy3OAm5NUPOTrC.jpg', // The Lord of the Rings
  'https://image.tmdb.org/t/p/w500/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg', // Parasite
  'https://image.tmdb.org/t/p/w500/xBHYBT4p3vSNTj7iAKlPVOQYXpw.jpg', // Interstellar
  'https://image.tmdb.org/t/p/w500/cezWGskPY5x7GaglTTRN4Fugfb8.jpg', // The Matrix
  'https://image.tmdb.org/t/p/w500/9O7gLzmreU0nGkIB6K3BsJbzvNv.jpg', // Blade Runner 2049
  'https://image.tmdb.org/t/p/w500/wHa6KOJAoNTFLFtp7wguUJKSnju.jpg', // Whiplash
  'https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg', // Mad Max: Fury Road
  'https://image.tmdb.org/t/p/w500/ym1dxyOk4jFcSl4Q2zmRrA5BEEN.jpg', // Dune
  'https://image.tmdb.org/t/p/w500/pxUG5nwwYeVYr6HxUGKTLVYX24m.jpg', // Everything Everywhere All at Once
  'https://image.tmdb.org/t/p/w500/5KCVkau1HEl7ZzfPsKAPM0sMiKc.jpg', // La La Land
  'https://image.tmdb.org/t/p/w500/9Rq14Eyrf7Tu1xk0Pl7VcNbNh1n.jpg', // Spider-Man: Into the Spider-Verse
  'https://image.tmdb.org/t/p/w500/kqjL17yufvn9OVLyXYpvtyrFfak.jpg', // Inception
  'https://image.tmdb.org/t/p/w500/zzWGRw277MNoCs3zhyG3YmYQsXv.jpg', // The Handmaiden
  'https://image.tmdb.org/t/p/w500/6jjJzYLqGNPmDdpMdaLcQp9XfLp.jpg', // Get Out
  'https://image.tmdb.org/t/p/w500/2CAL2433ZeIihfX1Hb2139CX0pW.jpg', // Arrival
  'https://image.tmdb.org/t/p/w500/yFuKvT4Vm3sKHdFY4eG6I4ldAnn.jpg', // Moonlight
  'https://image.tmdb.org/t/p/w500/suaEOtk1N1sgg2MTM7oZd2cfVp3.jpg', // Oppenheimer
  'https://image.tmdb.org/t/p/w500/vZloFAK7NmvMGKE7VkF5UHaz0I.jpg', // Barbie
  'https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg', // Oppenheimer
  'https://image.tmdb.org/t/p/w500/mBaXZ95R2OxueZhvQbcEWy2DqyO.jpg', // Poor Things
  'https://image.tmdb.org/t/p/w500/fiVW06jE7z9YnO4trhaMEdclSiC.jpg', // Dune: Part Two
  'https://image.tmdb.org/t/p/w500/3V4kLQg0kSqPLctI5ziYWabAZYF.jpg', // Past Lives
]

export default function HeroSection({ showInlineAuth, onAuthOpen, onAuthClose }) {
  const { ref, isVisible } = useScrollAnimation()
  const [scrollY, setScrollY] = useState(0)

  // Parallax effect
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <section
      ref={ref}
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black"
    >
      {/* 🎬 MOVIE POSTER CAROUSEL BACKGROUND */}
      <MoviePosterCarousel scrollY={scrollY} />

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/80 to-black z-10" />

      {/* Content */}
      <div className="relative z-20 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-32 text-center">
        
        {/* P1: Updated Badge - Social Proof */}
        <div
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm mb-6 sm:mb-8 transition-all duration-1000 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span className="text-sm text-white/90 font-medium">
            Join 10,000+ Movie Lovers
          </span>
        </div>

        {/* Headline */}
        <h1
          className={`text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight leading-tight mb-6 transition-all duration-1000 delay-100 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <span className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
            Stop Scrolling.
          </span>
          <br />
          <span className="text-white">Start Watching.</span>
        </h1>

        {/* P0: Improved Subhead */}
        <p
          className={`text-lg sm:text-xl md:text-2xl text-white/80 max-w-3xl mx-auto mb-8 sm:mb-10 leading-relaxed transition-all duration-1000 delay-200 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          Get personalized movie recommendations in{' '}
          <span className="text-purple-400 font-bold">60 seconds</span>.
          <br className="hidden sm:block" />
          No credit card. No browsing fatigue. Just movies you'll love.
        </p>

        {/* P0: Single Primary CTA */}
        <div
          className={`flex flex-col sm:flex-row items-center justify-center gap-4 mb-8 transition-all duration-1000 delay-300 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <button
            onClick={onAuthOpen}
            className="group inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white text-lg font-bold shadow-lg shadow-purple-500/50 hover:shadow-xl hover:shadow-purple-500/60 transition-all duration-300 hover:scale-105 active:scale-95 w-full sm:w-auto"
          >
            <PlayCircle className="w-5 h-5" />
            <span>Get Started Free</span>
          </button>
        </div>

        {/* Trust Bullets */}
        <div
          className={`flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-sm text-white/60 transition-all duration-1000 delay-400 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckIcon />
            <span>Free forever</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckIcon />
            <span>No credit card required</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckIcon />
            <span>Privacy-first</span>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 animate-bounce">
        <div className="w-6 h-10 rounded-full border-2 border-white/30 flex items-start justify-center p-2">
          <div className="w-1 h-3 rounded-full bg-white/60" />
        </div>
      </div>
    </section>
  )
}

/**
 * 🎬 Movie Poster Carousel Component
 */
function MoviePosterCarousel({ scrollY }) {
  const [scrollOffset, setScrollOffset] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setScrollOffset(prev => prev + 0.5)
    }, 50)
    return () => clearInterval(interval)
  }, [])

  const parallaxOffset = scrollY * 0.3

  return (
    <div className="absolute inset-0 overflow-hidden opacity-25">
      {/* Column 1 */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1/6 flex flex-col gap-4"
        style={{ transform: `translateY(-${(scrollOffset + parallaxOffset) % 2000}px)` }}
      >
        {[...MOVIE_POSTERS, ...MOVIE_POSTERS].map((poster, i) => (
          <img
            key={`col1-${i}`}
            src={poster}
            alt=""
            className="w-full rounded-lg blur-sm"
            loading="lazy"
          />
        ))}
      </div>

      {/* Column 2 */}
      <div
        className="absolute left-[16.66%] top-0 bottom-0 w-1/6 flex flex-col gap-4"
        style={{ transform: `translateY(-${(scrollOffset * 1.2 + parallaxOffset) % 2000}px)` }}
      >
        {[...MOVIE_POSTERS, ...MOVIE_POSTERS].slice(4).map((poster, i) => (
          <img
            key={`col2-${i}`}
            src={poster}
            alt=""
            className="w-full rounded-lg blur-sm"
            loading="lazy"
          />
        ))}
      </div>

      {/* Column 3 */}
      <div
        className="absolute left-[33.33%] top-0 bottom-0 w-1/6 flex flex-col gap-4"
        style={{ transform: `translateY(-${(scrollOffset * 0.8 + parallaxOffset) % 2000}px)` }}
      >
        {[...MOVIE_POSTERS, ...MOVIE_POSTERS].slice(8).map((poster, i) => (
          <img
            key={`col3-${i}`}
            src={poster}
            alt=""
            className="w-full rounded-lg blur-sm"
            loading="lazy"
          />
        ))}
      </div>

      {/* Column 4 */}
      <div
        className="absolute left-[50%] top-0 bottom-0 w-1/6 flex flex-col gap-4"
        style={{ transform: `translateY(-${(scrollOffset * 1.1 + parallaxOffset) % 2000}px)` }}
      >
        {[...MOVIE_POSTERS, ...MOVIE_POSTERS].slice(12).map((poster, i) => (
          <img
            key={`col4-${i}`}
            src={poster}
            alt=""
            className="w-full rounded-lg blur-sm"
            loading="lazy"
          />
        ))}
      </div>

      {/* Column 5 */}
      <div
        className="absolute left-[66.66%] top-0 bottom-0 w-1/6 flex flex-col gap-4"
        style={{ transform: `translateY(-${(scrollOffset * 0.9 + parallaxOffset) % 2000}px)` }}
      >
        {[...MOVIE_POSTERS, ...MOVIE_POSTERS].slice(16).map((poster, i) => (
          <img
            key={`col5-${i}`}
            src={poster}
            alt=""
            className="w-full rounded-lg blur-sm"
            loading="lazy"
          />
        ))}
      </div>

      {/* Column 6 */}
      <div
        className="absolute left-[83.33%] top-0 bottom-0 w-1/6 flex flex-col gap-4"
        style={{ transform: `translateY(-${(scrollOffset * 1.3 + parallaxOffset) % 2000}px)` }}
      >
        {[...MOVIE_POSTERS, ...MOVIE_POSTERS].slice(20).map((poster, i) => (
          <img
            key={`col6-${i}`}
            src={poster}
            alt=""
            className="w-full rounded-lg blur-sm"
            loading="lazy"
          />
        ))}
      </div>
    </div>
  )
}

/**
 * Check Icon Component
 */
function CheckIcon() {
  return (
    <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  )
}
