// src/features/landing/components/LandingHero.jsx
import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/shared/lib/supabase/client'
import googleSvg from '@/assets/icons/google.svg'

export default function LandingHero({ embedded = false, showInlineAuth = false, onAuthOpen, onAuthClose }) {
  return (
    <section
      className="relative h-full overflow-hidden"
      style={embedded ? undefined : { marginTop: 'var(--topnav-h, var(--nav-h, 72px))' }}
    >
      {/* Background - Optimized */}
      <div aria-hidden className="fixed inset-0 z-0">
        {/* Base gradient */}
        <div className="absolute inset-0 bg-[linear-gradient(120deg,#0a121a_0%,#0d1722_50%,#0c1017_100%)]" />
        
        {/* Color orbs - Balanced opacity */}
        <div className="pointer-events-none absolute -top-40 -left-40 h-[65vmin] w-[65vmin] rounded-full blur-3xl opacity-50 bg-[radial-gradient(closest-side,rgba(254,146,69,0.45),rgba(254,146,69,0)_70%)]" />
        <div className="pointer-events-none absolute -bottom-44 -right-44 h-[70vmin] w-[70vmin] rounded-full blur-3xl opacity-60 bg-[radial-gradient(closest-side,rgba(235,66,59,0.38),rgba(235,66,59,0)_70%)]" />
        <div className="pointer-events-none absolute top-1/2 left-1/2 h-[80vmin] w-[80vmin] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl opacity-45 bg-[radial-gradient(closest-side,rgba(139,92,246,0.35),rgba(139,92,246,0)_70%)]" />
        <div className="pointer-events-none absolute -top-24 right-[15%] h-[45vmin] w-[45vmin] rounded-full blur-3xl opacity-45 bg-[radial-gradient(closest-side,rgba(255,99,196,0.35),rgba(255,99,196,0)_70%)]" />
        
        {/* Spinning overlay - Desktop only for performance */}
        <div className="pointer-events-none absolute inset-0 opacity-35 mix-blend-screen">
          <div className="absolute left-1/2 top-1/2 h-[140vmin] w-[140vmin] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[conic-gradient(from_220deg_at_50%_50%,rgba(255,255,255,0.08),rgba(255,255,255,0)_65%)] motion-safe:lg:animate-[spin_48s_linear_infinite]" />
        </div>
        
        {/* Top radial light - Enhanced depth */}
        <div className="absolute inset-0 bg-[radial-gradient(100%_80%_at_50%_0%,rgba(255,255,255,0.08),rgba(255,255,255,0)_60%)]" />
      </div>

      {/* Content */}
      <div
        className="relative z-10 mx-auto h-full w-full max-w-7xl px-7 md:px-6"
        style={{ ['--nav-h']: '72px' }}
      >
        <div
          className="
            grid h-full place-content-center place-items-center
            gap-y-6 md:gap-y-0 md:gap-x-6
            md:[grid-template-columns:max-content_minmax(0,560px)]
          "
          style={
            embedded
              ? undefined
              : {
                  height:
                    'calc(100svh - var(--topnav-h, var(--nav-h,72px)) - var(--footer-h,0px))',
                  /* 👇 bias the block slightly DOWN to increase top space */
                  transform: 'translateY(5vh)',
                }
          }
        >
          {/* Posters */}
          <div className="order-1 md:order-2 md:col-start-2 w-full flex justify-center md:justify-start md:pr-6">
            <MovieStack />
          </div>

          {/* Copy */}
          <div className="order-2 md:order-1 md:col-start-1 mx-auto w-full max-w-3xl md:max-w-[620px] text-center md:text-left md:pl-10">
            <h1 className="text-balance text-[clamp(2.1rem,6.5vw,3.9rem)] font-black leading-[1.05] tracking-tight text-white">
              Movies that match your <span className="text-brand-100">mood</span>
            </h1>

            {showInlineAuth ? (
              <p className="mx-auto md:mx-0 mt-2 max-w-xl text-[clamp(.95rem,2vw,1.1rem)] leading-relaxed text-white/85">
                We're piloting FeelFlick — explore and help us shape mood-based movie recommendation
                platform.
              </p>
            ) : (
              <p className="mx-auto md:mx-0 mt-2 max-w-xl text-[clamp(.95rem,2vw,1.1rem)] leading-relaxed text-white/85">
                Get the perfect movie recommendation based on your taste and how you feel — fast,
                private, and always free.
              </p>
            )}

            <div className="mt-4 flex flex-col items-center gap-3 md:items-start">
              {showInlineAuth ? (
                <GoogleButton />
              ) : (
                <button
                  onClick={onAuthOpen}
                  className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-[#FF9245] to-[#EB423B] px-8 py-3 text-base font-bold text-white shadow-xl transition-all hover:from-[#FF9245] hover:to-[#E03C9E] hover:shadow-2xl active:scale-95 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                >
                  Get started
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* --------------------------- GoogleButton --------------------------- */
function GoogleButton() {
  const [submitting, setSubmitting] = useState(false)

  async function handleGoogle() {
    try {
      setSubmitting(true)
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/home',
          queryParams: { prompt: 'select_account' },
        },
      })
    } catch {
      setSubmitting(false)
    }
  }

  return (
    <button
      type="button"
      disabled={submitting}
      onClick={handleGoogle}
      className="
        group inline-flex items-center justify-center gap-3
        rounded-full border border-white/12 bg-white/[.06]
        py-3 px-5 text-[0.95rem] font-semibold text-white/95
        hover:bg-white/10 active:scale-[.99] focus:outline-none disabled:opacity-60
      "
      aria-label="Continue with Google"
    >
      <img
        src={googleSvg}
        width="18"
        height="18"
        alt=""
        aria-hidden="true"
        className="opacity-95"
      />
      <span>Continue with Google</span>
    </button>
  )
}

/* --------------------------- MovieStack --------------------------- */
function MovieStack() {
  const TMDB_KEY = import.meta.env.VITE_TMDB_API_KEY
  const [items, setItems] = useState([])
  const imgBase = 'https://image.tmdb.org/t/p/w500'

  const fallbacks = useMemo(
    () => [
      { id: 'a', title: 'Top pick', poster_path: '' },
      { id: 'b', title: 'Critics love it', poster_path: '' },
      { id: 'c', title: 'Fan favorite', poster_path: '' },
    ],
    []
  )

  useEffect(() => {
    let abort = false
    async function load() {
      try {
        if (!TMDB_KEY) return setItems(fallbacks)
        const r = await fetch(`https://api.themoviedb.org/3/trending/movie/week?api_key=${TMDB_KEY}`)
        const j = await r.json()
        const top = (j?.results || [])
          .filter((m) => m.poster_path)
          .sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0))
          .slice(0, 3)
        if (!abort) setItems(top.length ? top : fallbacks)
      } catch {
        if (!abort) setItems(fallbacks)
      }
    }
    load()
    return () => {
      abort = true
    }
  }, [TMDB_KEY, fallbacks])

  return (
    <div className="relative w-[min(90vw,520px)] md:w-[540px] aspect-[5/4] md:aspect-[4/3] select-none" aria-hidden>
      <PosterCard
        title={items[2]?.title}
        src={items[2]?.poster_path ? `${imgBase}${items[2].poster_path}` : null}
        className="absolute left-1/2 top-1/2 w-[38%] -translate-x-[110%] -translate-y-[62%] rotate-[-16deg] opacity-95"
      />
      <PosterCard
        title={items[1]?.title}
        src={items[1]?.poster_path ? `${imgBase}${items[1].poster_path}` : null}
        className="absolute left-1/2 top-1/2 w-[42%] translate-x-[10%] -translate-y-[60%] rotate-[13deg] opacity-95"
      />
      <PosterCard
        title={items[0]?.title}
        src={items[0]?.poster_path ? `${imgBase}${items[0].poster_path}` : null}
        className="absolute left-1/2 top-1/2 w-[52%] -translate-x-[44%] -translate-y-[51%] rotate-[-5deg] shadow-2xl"
        glow
      />
    </div>
  )
}

function PosterCard({ src, title, className = '', glow = false }) {
  return (
    <div
      className={`group rounded-3xl overflow-hidden ring-1 ring-white/10 bg-white/5 backdrop-blur-sm ${className}`}
      style={{ boxShadow: glow ? '0 30px 70px rgba(0,0,0,.45)' : undefined }}
      title={title || 'Movie poster'}
    >
      {src ? (
        <img
          src={src}
          alt={title || 'Movie poster'}
          className="h-full w-full object-cover"
          loading="eager"
          decoding="async"
        />
      ) : (
        <div className="h-full w-full bg-[linear-gradient(135deg,#111827_0%,#0b1220_100%)]" />
      )}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/60 to-transparent" />
    </div>
  )
}
