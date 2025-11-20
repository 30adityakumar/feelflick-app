// src/features/landing/sections/HeroSection.jsx
import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/shared/lib/supabase/client'
import { Sparkles, PlayCircle } from 'lucide-react'
import googleSvg from '@/assets/icons/google.svg'
import { useMousePosition } from '@/features/landing/utils/useMousePosition'

// 🎬 Curated high-quality posters (TMDB paths) - More added for variety
const POSTER_ROWS = [
  // Row 1
  [
    '/q6y0Go1rZgVoTFZYpK391L0imU.jpg', // Pulp Fiction
    '/gEU2QniL6E77NI6lCU6MxlNBvIx.jpg', // Interstellar
    '/rCzpDGLbOoPwLjy3OAm5NUPOTrC.jpg', // LOTR
    '/sF1U4EUQS8YCl0MAlNqVZy7BWW2.jpg', // Blade Runner 2049
    '/3bhkrj58Vtu7enYsRolD1fZdja1.jpg', // Godfather
    '/qJ2tW6WMUDux911r6m7haRef0WH.jpg', // Dark Knight
    '/8kSerJrhr6s0CnjLk8QXX397003.jpg', // Fight Club
    '/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg', // The Prestige
  ],
  // Row 2
  [
    '/saHP97rTPS5eLmrLQEcANmKrsFl.jpg', // Forrest Gump
    '/d5NXSklXo0qyIYkgV94XAgMIckC.jpg', // Mad Max
    '/arw2vcBveWOVZr6pxd9XTd1TdQa.jpg', // Amelie
    '/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg', // Parasite
    '/6oom5QYQ2yQTMJIbnvbkBL9cHo6.jpg', // Spirited Away
    '/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg', // The Prestige
    '/vVpEOvSeCgKzLdfXqLq3mfgd3j.jpg',   // La La Land
    '/nxxnSo2ga2TzFj2i6R9LPgD5gC.jpg',   // Everything Everywhere
  ],
]

function PosterCard({ path }) {
  return (
    <div className="poster-card relative w-48 h-72 shrink-0 rounded-xl overflow-hidden shadow-2xl border border-white/10 transition-transform duration-500 ease-out">
      <img
        src={`https://image.tmdb.org/t/p/w500${path}`}
        className="absolute inset-0 w-full h-full object-cover"
        alt=""
        loading="lazy"
      />
      <div className="poster-glow absolute inset-0 z-10" />
    </div>
  )
}

function Aurora() {
  return (
    <div className="aurora absolute inset-0 z-0 overflow-hidden">
      <div className="aurora-a" />
      <div className="aurora-b" />
      <div className="aurora-c" />
    </div>
  )
}

export default function HeroSection() {
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const [isTouchDevice, setIsTouchDevice] = useState(false)
  const heroRef = useRef(null)
  
  // Only use mouse position if it's not a touch device
  const mousePosition = !isTouchDevice ? useMousePosition() : { x: 0, y: 0 }

  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0)
  }, [])
  
  useEffect(() => {
    if (heroRef.current && !isTouchDevice) {
      heroRef.current.style.setProperty('--mouse-x', mousePosition.x)
      heroRef.current.style.setProperty('--mouse-y', mousePosition.y)
    }
  }, [mousePosition, isTouchDevice])

  async function handleGoogleSignIn() {
    setIsAuthenticating(true)
    // ... (rest of function is the same)
  }

  const scrollToHowItWorks = () => {
    // ... (function is the same)
  }

  return (
    <section 
      ref={heroRef}
      className="hero-section relative min-h-screen flex items-center justify-center overflow-hidden bg-black pt-20"
    >
      <Aurora />

      {/* 🎬 Animated Poster Wall */}
      <div className="poster-wall absolute inset-0 z-10 opacity-30 select-none pointer-events-none">
        <div className="absolute inset-0 z-10 bg-gradient-to-b from-black via-transparent to-black" />
        <div className="absolute inset-0 z-10 bg-black/40" />
        <div className="flex flex-col justify-center h-full gap-6 scale-110 rotate-[-3deg] origin-center">
          <div className="flex gap-6 animate-scroll-left w-max">
            {[...POSTER_ROWS[0], ...POSTER_ROWS[0]].map((path, i) => <PosterCard key={`r1-${i}`} path={path} />)}
          </div>
          <div className="flex gap-6 animate-scroll-right w-max">
            {[...POSTER_ROWS[1], ...POSTER_ROWS[1]].map((path, i) => <PosterCard key={`r2-${i}`} path={path} />)}
          </div>
        </div>
      </div>

      {/* 📝 Content Layer */}
      <div className="relative z-20 max-w-5xl mx-auto px-4 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-8 hover:bg-white/10 transition-colors cursor-default">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span className="text-sm font-medium text-amber-100/90">Find movies that match your mood</span>
        </div>

        <h1 className="text-5xl sm:text-7xl md:text-8xl font-black tracking-tight mb-8 leading-tight">
          <span className="block text-white drop-shadow-2xl">Stop Scrolling.</span>
          <span className="block bg-gradient-to-r from-purple-400 via-pink-500 to-amber-500 bg-clip-text text-transparent drop-shadow-2xl pb-2">Start Feeling.</span>
        </h1>

        <p className="text-lg sm:text-2xl text-white/70 max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
          Like Spotify for movies. Discover films based on your{' '}
          <span className="text-white font-bold">vibe, emotion, and taste</span>
          —not just what's trending.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
          <button onClick={handleGoogleSignIn} disabled={isAuthenticating} className="...">
            {/* ... button content ... */}
          </button>
          <button onClick={scrollToHowItWorks} className="...">
            {/* ... button content ... */}
          </button>
        </div>

        {/* Updated Trust Signals */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-sm text-white/50 font-medium">
          <span>✓ Always Free</span>
          <span>✓ No Ads</span>
          <span>✓ Privacy First</span>
        </div>
      </div>
    </section>
  )
}

