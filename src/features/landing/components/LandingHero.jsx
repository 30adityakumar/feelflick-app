// src/features/landing/components/LandingHero.jsx
import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/shared/lib/supabase/client'
import googleSvg from '@/assets/icons/google.svg'

export default function LandingHero({ embedded = false, showInlineAuth = false, onAuthOpen, onAuthClose }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  const fallbackData = useMemo(
    () => [
      { id: 1, poster_path: '/qNBAXBIQlnOThrVvA6mA2B5ggV6.jpg', title: 'The Marvels' },
      { id: 2, poster_path: '/t6HIqrRAclMCA60NsSmeqe9RmNV.jpg', title: 'Avatar: The Way of Water' },
      { id: 3, poster_path: '/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg', title: 'Oppenheimer' },
      { id: 4, poster_path: '/rktDFPbfHfUbArZ6OOOKsXcv0Bm.jpg', title: 'Barbie' },
    ],
    []
  )

  useEffect(() => {
    let active = true
    async function fetchMovies() {
      try {
        const apiKey = import.meta.env.VITE_TMDB_API_KEY
        if (!apiKey) throw new Error('no key')

        const res = await fetch(
          `https://api.themoviedb.org/3/movie/top_rated?api_key=${apiKey}&language=en-US&page=1`
        )
        if (!res.ok) throw new Error('fetch error')

        const json = await res.json()
        if (!active) return

        const picks = (json.results || []).slice(0, 4)
        setItems(picks.length > 0 ? picks : fallbackData)
      } catch {
        if (!active) return
        setItems(fallbackData)
      } finally {
        if (active) setLoading(false)
      }
    }
    fetchMovies()
    return () => { active = false }
  }, [fallbackData])

  const onGoogle = async () => {
    await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } })
  }

  return (
    <section
      className="relative h-full overflow-hidden"
      style={embedded ? undefined : { marginTop: 'var(--topnav-h, var(--nav-h, 72px))' }}
    >
      {/* Background - FeelFlick branded gradients */}
      <div className="feelflick-landing-bg" aria-hidden="true">
        <div aria-hidden className="fixed inset-0 z-0">
          <div className="absolute inset-0 bg-[linear-gradient(120deg,#0a121a_0%,#0d1722_50%,#0c1017_100%)]" />
          
          {/* FeelFlick Orange Gradient */}
          <div className="pointer-events-none absolute -top-40 -left-40 h-[65vmin] w-[65vmin] rounded-full blur-3xl opacity-60 bg-[radial-gradient(closest-side,rgba(255,146,69,0.5),rgba(255,146,69,0)_70%)]" />
          
          {/* FeelFlick Red Gradient */}
          <div className="pointer-events-none absolute -bottom-44 -right-44 h-[70vmin] w-[70vmin] rounded-full blur-3xl opacity-55 bg-[radial-gradient(closest-side,rgba(235,66,59,0.45),rgba(235,66,59,0)_70%)]" />
          
          {/* FeelFlick Pink Gradient */}
          <div className="pointer-events-none absolute top-1/3 left-1/3 h-[60vmin] w-[60vmin] rounded-full blur-3xl opacity-40 bg-[radial-gradient(closest-side,rgba(224,60,158,0.35),rgba(224,60,158,0)_70%)]" />
          
          {/* Animated conic gradient */}
          <div className="pointer-events-none absolute inset-0 opacity-35 mix-blend-screen">
            <div className="absolute left-1/2 top-1/2 h-[140vmin] w-[140vmin] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[conic-gradient(from_220deg_at_50%_50%,rgba(255,255,255,0.08),rgba(255,255,255,0)_65%)] motion-safe:md:animate-[spin_48s_linear_infinite]" />
          </div>
          
          <div className="absolute inset-0 bg-[radial-gradient(100%_80%_at_50%_0%,rgba(255,255,255,0.06),rgba(255,255,255,0)_60%)]" />
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 grid h-full place-items-center px-4 sm:px-6 md:px-8">
        <div
          className="grid w-full max-w-7xl grid-cols-1 items-center gap-6 md:grid-cols-2 md:gap-12"
          style={{ transform: 'translateY(5vh)' }}
        >
          {/* Left: Text */}
          <div className="space-y-6 text-center md:text-left">
            <h1 className="text-[2.25rem] sm:text-[2.75rem] md:text-[3.25rem] lg:text-[3.75rem] font-black leading-[1.1] tracking-tight text-white">
              Movies that match your{' '}
              <span className="bg-gradient-to-r from-[#FF9245] via-[#EB423B] to-[#E03C9E] bg-clip-text text-transparent">
                mood
              </span>
            </h1>

            <p className="text-base sm:text-lg text-white/85 leading-relaxed max-w-xl mx-auto md:mx-0">
              {showInlineAuth ? (
                <>
                  We're piloting FeelFlick — explore and help us shape mood-based movie recommendation platform.
                </>
              ) : (
                <>
                  Get the perfect movie recommendation based on your taste and how you feel — fast, private, and always free.
                </>
              )}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-3">
              {!showInlineAuth ? (
                <button
                  type="button"
                  onClick={() => onAuthOpen?.()}
                  className="group inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#FF9245] via-[#EB423B] to-[#E03C9E] px-8 py-3.5 text-base sm:text-lg font-bold text-white shadow-2xl transition-all hover:scale-105 hover:shadow-[0_0_40px_rgba(255,146,69,0.5)] active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#FF9245] focus:ring-offset-2 focus:ring-offset-black"
                >
                  Get started
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={onGoogle}
                    className="group inline-flex w-full sm:w-auto items-center justify-center gap-3 rounded-full border-2 border-white/10 bg-white/5 backdrop-blur-sm px-6 py-3 text-base font-semibold text-white transition-all hover:bg-white/10 hover:border-white/20 active:scale-95 focus:outline-none focus:ring-2 focus:ring-white/50"
                  >
                    <img src={googleSvg} alt="" className="h-5 w-5" />
                    Continue with Google
                  </button>
                  <button
                    type="button"
                    onClick={() => onAuthClose?.()}
                    className="text-sm font-medium text-white/70 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Right: Movie Posters */}
          <div className="relative hidden md:block">
            <div className="relative h-[400px] lg:h-[500px]">
              {!loading &&
                items.map((item, i) => (
                  <div
                    key={item.id}
                    className="absolute overflow-hidden rounded-2xl shadow-2xl ring-1 ring-white/10 transition-transform duration-300 hover:scale-105 hover:z-10"
                    style={{
                      width: '200px',
                      height: '300px',
                      top: `${i * 40}px`,
                      left: `${i * 60}px`,
                      transform: `rotate(${(i - 1.5) * 3}deg)`,
                      zIndex: items.length - i,
                    }}
                  >
                    <img
                      src={`https://image.tmdb.org/t/p/w500${item.poster_path}`}
                      alt={item.title || 'Movie poster'}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
