// src/features/landing/components/LandingHero.jsx
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

export default function LandingHero({ embedded = false }) {
  return (
    <section
      className="relative overflow-hidden"
      style={embedded ? undefined : { marginTop: 'var(--topnav-h, var(--nav-h, 72px))' }}
    >
      {/* Optional collage layer */}
      <div className="feelflick-landing-bg" aria-hidden="true" />

      {/* MULTI-COLOR ABSTRACT BACKGROUND (logo-inspired) */}
      <div aria-hidden className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[linear-gradient(120deg,#0a121a_0%,#0d1722_50%,#0c1017_100%)]" />
        <div className="pointer-events-none absolute -top-40 -left-40 h-[65vmin] w-[65vmin] rounded-full blur-3xl opacity-60 bg-[radial-gradient(closest-side,rgba(254,146,69,0.45),rgba(254,146,69,0)_70%)]" />
        <div className="pointer-events-none absolute -bottom-44 -right-44 h-[70vmin] w-[70vmin] rounded-full blur-3xl opacity-55 bg-[radial-gradient(closest-side,rgba(235,66,59,0.38),rgba(235,66,59,0)_70%)]" />
        <div className="pointer-events-none absolute top-1/2 left-1/2 h-[80vmin] w-[80vmin] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl opacity-45 bg-[radial-gradient(closest-side,rgba(45,119,255,0.35),rgba(45,119,255,0)_70%)]" />
        <div className="pointer-events-none absolute -top-24 right-[15%] h-[45vmin] w-[45vmin] rounded-full blur-3xl opacity-45 bg-[radial-gradient(closest-side,rgba(255,99,196,0.35),rgba(255,99,196,0)_70%)]" />
        <div className="pointer-events-none absolute bottom-[8%] left-[12%] h-[50vmin] w-[50vmin] rounded-full blur-3xl opacity-40 bg-[radial-gradient(closest-side,rgba(124,58,237,0.30),rgba(124,58,237,0)_70%)]" />
        <div className="pointer-events-none absolute inset-0 opacity-35 mix-blend-screen">
          <div className="absolute left-1/2 top-1/2 h-[140vmin] w-[140vmin] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[conic-gradient(from_220deg_at_50%_50%,rgba(255,255,255,0.08),rgba(255,255,255,0)_65%)] motion-safe:md:animate-[spin_48s_linear_infinite]" />
        </div>
        <div className="absolute inset-0 bg-[radial-gradient(100%_80%_at_50%_0%,rgba(255,255,255,0.06),rgba(255,255,255,0)_60%)]" />
      </div>

      {/* Soft radial highlight */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-0 opacity-60"
        style={{
          background:
            'radial-gradient(700px 300px at 20% 15%, rgba(254,146,69,.25) 0%, transparent 60%)',
        }}
      />

      {/* Content + Stack */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 md:px-6" style={{ ['--nav-h']: '72px' }}>
        <div
          className={`grid items-center gap-8 md:grid-cols-12 ${embedded ? 'py-6 sm:py-8' : 'py-6 sm:py-8'}`}
          style={
            embedded
              ? undefined
              : { height: 'calc(100svh - var(--topnav-h, var(--nav-h, 72px)) - var(--footer-h, 0px))' }
          }
        >
          {/* Posters — top on mobile, right on desktop */}
          <div className="order-1 md:order-2 md:col-span-6 w-full flex justify-center md:justify-end pt-2">
            <MovieStack />
          </div>

          {/* Copy + CTA — bottom on mobile, left on desktop */}
          <div className="order-2 md:order-1 md:col-span-6 mx-auto w-full max-w-3xl text-center md:text-left md:max-w-xl md:pl-4 lg:pl-8">
            <h1 className="text-balance text-[clamp(1.9rem,6.1vw,3.9rem)] font-black leading-[1.05] tracking-tight text-white">
              Movies that match your <span className="text-brand-100">mood</span>
            </h1>

            <p className="mx-auto md:mx-0 mt-3 max-w-xl text-[clamp(.95rem,2.4vw,1.12rem)] leading-relaxed text-white/85">
              Get the perfect movie recommendation based on your taste and how you feel — fast,
              private, and always free.
            </p>

            <div className="mt-6 flex justify-center md:justify-start">
              <Link
                to="/auth/sign-up"
                className="inline-flex h-11 items-center justify-center rounded-full px-8 sm:px-9 text-[0.95rem] font-semibold text-white shadow-lift transition-transform hover:scale-[1.02] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/60 active:scale-[.98] bg-gradient-to-r from-[#fe9245] to-[#eb423b]"
              >
                Get started
              </Link>
            </div>

            {!embedded && (
              <p className="mt-3 text-sm text-white/65">Free to start. Your mood, your movie.</p>
            )}
          </div>
        </div>
      </div>
    </section>
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
        const r = await fetch(
          `https://api.themoviedb.org/3/trending/movie/week?api_key=${TMDB_KEY}`
        )
        const j = await r.json()
        const top = (j?.results || [])
          .filter(m => m.poster_path)
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
    <div
      className="relative w-[min(92vw,520px)] md:w-[520px] aspect-[5/4] md:aspect-[4/3] select-none"
      aria-hidden
    >
      {/* Back card — smaller & farther left for a clearer peek */}
      <PosterCard
        title={items[2]?.title}
        src={items[2]?.poster_path ? `${imgBase}${items[2].poster_path}` : null}
        className="absolute left-1/2 top-1/2 w-[44%] -translate-x-[98%] -translate-y-[62%] rotate-[-15deg] opacity-95"
      />

      {/* Middle card — smaller & nudged right */}
      <PosterCard
        title={items[1]?.title}
        src={items[1]?.poster_path ? `${imgBase}${items[1].poster_path}` : null}
        className="absolute left-1/2 top-1/2 w-[48%] translate-x-[12%] -translate-y-[58%] rotate-[12deg]"
      />

      {/* Front/primary card — a bit smaller too */}
      <PosterCard
        title={items[0]?.title}
        src={items[0]?.poster_path ? `${imgBase}${items[0].poster_path}` : null}
        className="absolute left-1/2 top-1/2 w-[58%] -translate-x-[38%] -translate-y-[50%] rotate-[-4deg] shadow-2xl"
        glow
      />

      {/* Brand-colored icon badges (no text) */}
      <div className="absolute -left-2 top-[22%] hidden md:block">
        <BadgeHeart />
      </div>
      <div className="absolute right-[2%] top-[18%] hidden md:block">
        <BadgeStar />
      </div>
      <div className="absolute right-[8%] bottom-[10%] hidden md:block">
        <BadgeBookmark />
      </div>
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

/* --------------------------- Badges (icon-only) --------------------------- */

function BadgeHeart() {
  return (
    <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-[#fe9245] to-[#eb423b] text-white shadow-xl shadow-orange-500/25">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M12 21s-7-4.35-9.33-8.09A5.5 5.5 0 0 1 12 6.2a5.5 5.5 0 0 1 9.33 6.71C19 16.65 12 21 12 21Z" />
      </svg>
    </div>
  )
}

function BadgeStar() {
  return (
    <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/95 text-white shadow-xl shadow-emerald-500/25">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="m12 2 2.79 6.58 7.21.62-5.45 4.65 1.65 7.15L12 17.77 5.8 21 .46 13.85l7.21-.65L10.43 2H12Z" />
      </svg>
    </div>
  )
}

function BadgeBookmark() {
  return (
    <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[linear-gradient(90deg,#2D77FF,#00D1FF)] text-white shadow-xl shadow-blue-500/25">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M6 2h12a1 1 0 0 1 1 1v18l-7-4-7 4V3a1 1 0 0 1 1-1Z" />
      </svg>
    </div>
  )
}