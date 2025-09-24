// src/features/landing/components/LandingHero.jsx
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

/* ------------------------------------------------------------- */
/* Brand tokens (logo-inspired)                                  */
/* ------------------------------------------------------------- */
const BRAND = {
  orange: '#fe9245',
  red:    '#eb423b',
  blue:   '#2D77FF',
  cyan:   '#00D1FF',
}

export default function LandingHero({ embedded = false }) {
  return (
    <section
      className="relative h-full overflow-hidden"
      style={embedded ? undefined : { marginTop: 'var(--topnav-h, var(--nav-h, 72px))' }}
    >
      <div className="feelflick-landing-bg" aria-hidden />

      {/* Background */}
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

      {/* Content */}
      <div className="relative z-10 mx-auto h-full w-full max-w-7xl px-3 md:px-6" style={{ ['--nav-h']: '72px' }}>
        <div
          className="
            grid h-full place-content-center place-items-center
            gap-y-6 md:gap-y-0 md:gap-x-6
            md:[grid-template-columns:max-content_minmax(0,560px)]
          "
          style={
            embedded
              ? undefined
              : { height: 'calc(100svh - var(--topnav-h, var(--nav-h,72px)) - var(--footer-h,0px))' }
          }
        >
          {/* Posters — pad right 6 on desktop */}
          <div className="order-1 md:order-2 md:col-start-2 w-full flex justify-center md:justify-start md:pr-6">
            <MovieStack />
          </div>

          {/* Copy — pad left 6 on desktop */}
          <div className="order-2 md:order-1 md:col-start-1 mx-auto w-full max-w-3xl md:max-w-[620px] text-center md:text-left md:pl-6">
            <h1 className="text-balance text-[clamp(1.9rem,6vw,3.7rem)] font-black leading-[1.05] tracking-tight text-white">
              Movies that match your <span className="text-brand-100">mood</span>
            </h1>

            <p className="mx-auto md:mx-0 mt-2 max-w-xl text-[clamp(.8rem,1.5vw,.95rem)] leading-relaxed text-white/85">
              Get the perfect movie recommendation based on your taste and how you feel — fast,
              private, and always free.
            </p>

            <div className="mt-4 flex justify-center md:justify-start">
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
        const r = await fetch(`https://api.themoviedb.org/3/trending/movie/week?api_key=${TMDB_KEY}`)
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
    <div className="relative w-[min(86vw,480px)] md:w-[500px] aspect-[5/4] md:aspect-[4/3] select-none" aria-hidden>
      {/* Back card */}
      <PosterCard
        title={items[2]?.title}
        src={items[2]?.poster_path ? `${imgBase}${items[2].poster_path}` : null}
        className="absolute left-1/2 top-1/2 w-[34%] -translate-x-[106%] -translate-y-[60%] rotate-[-16deg] opacity-95"
      >
        {/* keep inside for distant cards */}
        <BrandBadge variant="heart" placement="inside" className="left-2 top-2" ariaLabel="Like" />
      </PosterCard>

      {/* Middle card */}
      <PosterCard
        title={items[1]?.title}
        src={items[1]?.poster_path ? `${imgBase}${items[1].poster_path}` : null}
        className="absolute left-1/2 top-1/2 w-[38%] translate-x-[8%] -translate-y-[58%] rotate-[13deg] opacity-95"
      >
        <BrandBadge variant="bookmark" placement="inside" className="right-2 bottom-2" ariaLabel="Watchlist" />
      </PosterCard>

      {/* Front/primary card */}
      <PosterCard
        title={items[0]?.title}
        src={items[0]?.poster_path ? `${imgBase}${items[0].poster_path}` : null}
        className="absolute left-1/2 top-1/2 w-[46%] -translate-x-[42%] -translate-y-[50%] rotate-[-5deg] shadow-2xl"
        glow
      >
        {/* half-outside edge placements */}
        <BrandBadge variant="heart"     placement="edge" className="-left-3 top-4" ariaLabel="Like" />
        <BrandBadge variant="star"      placement="edge" className="-right-3 top-3" ariaLabel="Top" />
        <BrandBadge variant="bookmark"  placement="edge" className="-right-3 bottom-4" ariaLabel="Watchlist" />
      </PosterCard>
    </div>
  )
}

/* --------------------------- PosterCard --------------------------- */
function PosterCard({ src, title, className = '', glow = false, children }) {
  return (
    <div
      className={`group relative rounded-3xl overflow-hidden ring-1 ring-white/10 bg-white/5 backdrop-blur-sm ${className}`}
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

      {/* gradient subtle footer */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/60 to-transparent" />

      {/* in-card overlay area for badges */}
      <div className="pointer-events-none absolute inset-0">
        {/* children can add pointer events if needed */}
        <div className="pointer-events-auto relative h-full w-full">{children}</div>
      </div>
    </div>
  )
}

/* --------------------------- BrandBadge --------------------------- */
function BrandBadge({ variant = 'heart', placement = 'edge', className = '', ariaLabel }) {
  // ring uses only brand colors
  const ring = `conic-gradient(from 180deg at 50% 50%, ${BRAND.orange}, ${BRAND.red}, ${BRAND.blue}, ${BRAND.cyan}, ${BRAND.orange})`

  // inner gradient per variant (brand-only)
  const innerBg =
    variant === 'bookmark'
      ? `linear-gradient(135deg, ${BRAND.blue}, ${BRAND.cyan})`
      : variant === 'star'
      ? `linear-gradient(135deg, ${BRAND.orange}, ${BRAND.red})`
      : `linear-gradient(135deg, ${BRAND.orange}, ${BRAND.red})` // heart

  // edge = half outside; inside = fully in-card
  const edgeShift = placement === 'edge' ? 'translate-y-0' : ''
  const edgeX =
    placement === 'edge'
      ? (className.includes('left') ? '-translate-x-1/2' : className.includes('right') ? 'translate-x-1/2' : '')
      : ''

  return (
    <div
      aria-label={ariaLabel}
      className={`absolute ${className} ${edgeShift} ${edgeX} h-8 w-8 md:h-9 md:w-9 rounded-full p-[2px] shadow-[0_10px_30px_rgba(0,0,0,.35)]`}
      style={{ background: ring }}
    >
      <div
        className="relative grid h-full w-full place-items-center rounded-full text-white backdrop-blur-[2px]"
        style={{
          background: `
            radial-gradient(60% 60% at 35% 30%, rgba(255,255,255,.22) 0%, rgba(255,255,255,0) 60%),
            ${innerBg}
          `,
        }}
      >
        {variant === 'star' ? <IconStar /> : variant === 'bookmark' ? <IconBookmark /> : <IconHeart />}
      </div>
    </div>
  )
}

/* --------------------------- Icons --------------------------- */
function IconHeart() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden>
      <path
        d="M12 21s-7-4.35-9.33-8.09A5.5 5.5 0 0 1 12 6.2a5.5 5.5 0 0 1 9.33 6.71C19 16.65 12 21 12 21Z"
        fill="currentColor"
      />
    </svg>
  )
}
function IconStar() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden>
      <path d="m12 2 2.7 6.2 6.8.6-5.1 4.4 1.6 6.8-6-3.5-6 3.5 1.6-6.8-5.1-4.4 6.8-.6L12 2Z" fill="currentColor" />
    </svg>
  )
}
function IconBookmark() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden>
      <path d="M6 2h12a1 1 0 0 1 1 1v18l-7-4-7 4V3a1 1 0 0 1 1-1Z" fill="currentColor" />
    </svg>
  )
}