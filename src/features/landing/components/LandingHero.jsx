// src/features/landing/components/LandingHero.jsx
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

export default function LandingHero({ embedded = false }) {
  return (
    <section
      className="relative overflow-hidden"
      style={embedded ? undefined : { marginTop: 'var(--topnav-h, var(--nav-h, 72px))' }}
    >
      <div className="feelflick-landing-bg" aria-hidden="true" />

      {/* Logo-inspired ambient bg */}
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
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-0 opacity-60"
        style={{
          background:
            'radial-gradient(700px 300px at 20% 15%, rgba(254,146,69,.25) 0%, transparent 60%)',
        }}
      />

      {/* Content + Posters */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 md:px-6" style={{ ['--nav-h']: '72px' }}>
        <div
          className={`grid min-h-[calc(100svh-var(--topnav-h,72px)-var(--footer-h,0px))] place-items-center md:grid-cols-12 gap-y-6 md:gap-y-0 gap-x-6 md:gap-x-8`}
        >
          {/* Posters — right on desktop, top on mobile */}
          <div className="order-1 md:order-2 md:col-span-6 w-full flex justify-center md:justify-end pr-6">
            <MovieStack />
          </div>

          {/* Copy — left on desktop, bottom on mobile */}
          <div className="order-2 md:order-1 md:col-span-6 w-full md:max-w-xl text-center md:text-left pl-6">
            <h1 className="text-balance text-[clamp(1.85rem,6vw,3.5rem)] font-black leading-[1.05] tracking-tight text-white">
              Movies that match your <span className="text-brand-100">mood</span>
            </h1>

            <p className="mx-auto md:mx-0 mt-3 max-w-xl text-[clamp(.9rem,1.7vw,.98rem)] leading-relaxed text-white/85">
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
    return () => { abort = true }
  }, [TMDB_KEY, fallbacks])

  return (
    <div
      className="relative w-[min(90vw,460px)] md:w-[460px] aspect-[5/4] md:aspect-[4/3] select-none"
      aria-hidden
    >
      {/* Back card — peek more on the left */}
      <PosterCard
        title={items[2]?.title}
        src={items[2]?.poster_path ? `${imgBase}${items[2].poster_path}` : null}
        className="absolute left-1/2 top-1/2 w-[34%] -translate-x-[115%] -translate-y-[60%] rotate-[-15deg] opacity-[.98]"
      />

      {/* Middle card — peek more on the right */}
      <PosterCard
        title={items[1]?.title}
        src={items[1]?.poster_path ? `${imgBase}${items[1].poster_path}` : null}
        className="absolute left-1/2 top-1/2 w-[38%] translate-x-[22%] -translate-y-[58%] rotate-[12deg] opacity-[.98]"
      />

      {/* Front card */}
      <PosterCard
        title={items[0]?.title}
        src={items[0]?.poster_path ? `${imgBase}${items[0].poster_path}` : null}
        className="absolute left-1/2 top-1/2 w-[48%] -translate-x-[42%] -translate-y-[50%] rotate-[-5deg] shadow-2xl"
        glow
      />

      {/* Badges */}
      <div className="absolute -left-1 top-[22%] hidden md:block">
        <FancyBadge variant="heart" />
      </div>
      <div className="absolute right-[1%] top-[16%] hidden md:block">
        <FancyBadge variant="star" />
      </div>
      <div className="absolute right-[8%] bottom-[9%] hidden md:block">
        <FancyBadge variant="bookmark" />
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

/* --------------------------- Fancy badges --------------------------- */

function FancyBadge({ variant = 'heart' }) {
  const ring =
    'conic-gradient(from 180deg at 50% 50%, #fe9245, #eb423b, #2D77FF, #00D1FF, #fe9245)'
  const innerBg =
    variant === 'star'
      ? 'radial-gradient(60% 60% at 35% 30%, rgba(255,255,255,.22) 0%, rgba(255,255,255,0) 60%), linear-gradient(140deg,#20c997,#198754)'
      : variant === 'bookmark'
      ? 'radial-gradient(60% 60% at 35% 30%, rgba(255,255,255,.22) 0%, rgba(255,255,255,0) 60%), linear-gradient(135deg,#2D77FF,#00D1FF)'
      : 'radial-gradient(60% 60% at 35% 30%, rgba(255,255,255,.22) 0%, rgba(255,255,255,0) 60%), linear-gradient(135deg,#fe9245,#eb423b)'

  return (
    <div className="relative h-9 w-9 rounded-full p-[2px] shadow-[0_10px_30px_rgba(0,0,0,.35)]" style={{ background: ring }}>
      <div className="relative grid h-full w-full place-items-center rounded-full text-white backdrop-blur-[2px]" style={{ background: innerBg }}>
        <div className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(55%_40%_at_35%_28%,rgba(255,255,255,.35),rgba(255,255,255,0)_70%)]" />
        {variant === 'star' ? <IconStar /> : variant === 'bookmark' ? <IconBookmark /> : <IconHeart />}
      </div>
    </div>
  )
}

function IconHeart() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden>
      <path d="M12 21s-7-4.35-9.33-8.09A5.5 5.5 0 0 1 12 6.2a5.5 5.5 0 0 1 9.33 6.71C19 16.65 12 21 12 21Z" fill="currentColor" />
    </svg>
  )
}
function IconStar() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden>
      <path d="m12 2 2.7 6.2 6.8.6-5.1 4.4 1.6 6.8-6-3.5-6 3.5 1.6-6.8-5.1-4.4 6.8-.6L12 2Z" fill="currentColor" />
    </svg>
  )
}
function IconBookmark() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden>
      <path d="M6 2h12a1 1 0 0 1 1 1v18l-7-4-7 4V3a1 1 0 0 1 1-1Z" fill="currentColor" />
    </svg>
  )
}