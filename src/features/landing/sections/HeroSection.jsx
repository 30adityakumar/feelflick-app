// src/features/landing/sections/HeroSection.jsx
import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/shared/lib/supabase/client'
import { Sparkles, PlayCircle } from 'lucide-react'
import googleSvg from '@/assets/icons/google.svg'

// More diverse and visually interesting posters
const POSTER_ROWS = [
  // ... (keep your existing poster rows, they are good)
  [
    '/q6y0Go1rZgVoTFZYpK391L0imU.jpg', // Pulp Fiction
    '/gEU2QniL6E77NI6lCU6MxlNBvIx.jpg', // Interstellar
    '/rCzpDGLbOoPwLjy3OAm5NUPOTrC.jpg', // LOTR
    '/kwB7d51AIcyzPOB0Mq5aJEGM4q0.jpg', // Goodfellas
    '/3bhkrj58Vtu7enYsRolD1fZdja1.jpg', // Godfather
    '/qJ2tW6WMUDux911r6m7haRef0WH.jpg', // Dark Knight
    '/8kSerJrhr6s0CnjLk8QXX397003.jpg', // Fight Club
  ],
  [
    '/saHP97rTPS5eLmrLQEcANmKrsFl.jpg', // Forrest Gump
    '/sM33SANp9z6rXW8Itn7NnG1CXEs.jpg', // Zootopia
    '/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg', // Fight Club (Alt)
    '/arw2vcBveWOVZr6pxd9XTd1TdQa.jpg', // Amelie
    '/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg', // Parasite
    '/6oom5QYQ2yQTMJIbnvbkBL9cHo6.jpg', // Spirited Away
    '/q719jXXEzOoYaps6babgKnONONX.jpg', // Your Name
  ],
]

// The new PosterWall component
function PosterWall() {
  return (
    <div className="flex flex-col justify-center h-full gap-6 scale-110 rotate-[-3deg] origin-center">
      {[...POSTER_ROWS, ...POSTER_ROWS.slice(0, 1)].map((row, rowIndex) => (
        <div
          key={rowIndex}
          className={`flex gap-6 w-[300%] ${
            rowIndex % 2 === 0 ? 'animate-scroll-left' : 'animate-scroll-right'
          }`}
        >
          {[...row, ...row, ...row].map((path, i) => (
            <div
              key={`${rowIndex}-${i}`}
              className="relative w-48 h-72 shrink-0 rounded-lg overflow-hidden shadow-2xl border border-white/5"
            >
              <img
                src={`https://image.tmdb.org/t/p/w500${path}`}
                className="w-full h-full object-cover"
                alt=""
                loading="lazy"
              />
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

export default function HeroSection() {
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const spotlightRef = useRef(null)

  // Mouse tracking for the spotlight effect
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (spotlightRef.current) {
        spotlightRef.current.style.background = `radial-gradient(circle at ${e.clientX}px ${e.clientY}px, transparent 10%, rgba(0,0,0,0.95) 20%)`
      }
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  async function handleGoogleSignIn() {
    // ... (keep existing Google sign-in logic)
    setIsAuthenticating(true)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/onboarding` },
      })
      if (error) throw error
    } catch (error) {
      console.error('Auth error:', error)
    } finally {
      setIsAuthenticating(false)
    }
  }

  const scrollToHowItWorks = () => {
    // ... (keep existing scroll logic)
    const element = document.getElementById('how-it-works')
    if (element) {
      const headerOffset = 80
      const elementPosition = element.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' })
    }
  }

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black">
      {/* 🎬 INTERACTIVE DISCOVERY WALL */}
      <div className="absolute inset-0 z-0 select-none pointer-events-none">
        {/* The desaturated, base layer */}
        <div className="absolute inset-0 filter grayscale-[80%] opacity-20">
          <PosterWall />
        </div>
        {/* The full-color layer, revealed by the mask */}
        <div
          className="absolute inset-0"
          style={{
            maskImage: 'radial-gradient(circle 300px at center, black, transparent)',
            WebkitMaskImage: 'radial-gradient(circle 300px at center, black, transparent)',
            maskPosition: '0 0',
            WebkitMaskPosition: '0 0',
          }}
          ref={(el) => {
            if (!el) return
            const handleMouseMove = (e) => {
              el.style.setProperty('--mask-x', `${e.clientX}px`)
              el.style.setProperty('--mask-y', `${e.clientY}px`)
            }
            window.addEventListener('mousemove', handleMouseMove)
          }}
        >
          <PosterWall />
        </div>
      </div>

      {/* 📝 "GLASS" CONTENT CARD */}
      <div className="relative z-20 max-w-2xl mx-auto px-4 text-center">
        <div className="bg-black/40 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 sm:p-12 shadow-2xl shadow-black/50">
          
          <h1 className="text-5xl sm:text-6xl font-black tracking-tighter mb-6 leading-tight">
            <span className="block text-white drop-shadow-lg">
              Find Your Next
            </span>
            <span className="block bg-gradient-to-r from-purple-400 via-pink-500 to-amber-500 bg-clip-text text-transparent drop-shadow-lg pb-1">
              Favorite Movie
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-white/70 max-w-xl mx-auto mb-10 leading-relaxed font-medium">
            Like Spotify for movies. Discover hidden gems based on your{' '}
            <span className="text-white">vibe and taste</span>, not just what's trending.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={handleGoogleSignIn}
              disabled={isAuthenticating}
              className="group relative w-full sm:w-auto px-8 py-4 rounded-xl bg-white text-black font-bold text-lg shadow-[0_0_40px_-15px_rgba(255,255,255,0.4)] hover:shadow-[0_0_60px_-15px_rgba(255,255,255,0.6)] transition-all duration-300 hover:scale-[1.03] active:scale-95"
            >
              {isAuthenticating ? 'Signing In...' : 'Get Started — It\'s Free'}
            </button>
          </div>

          <div className="mt-10 text-sm text-white/50">
            ✓ Always Free ✓ No Ads ✓ 100+ Services Indexed
          </div>
        </div>
      </div>
    </section>
  )
}
