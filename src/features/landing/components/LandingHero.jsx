import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { LogIn, MessageSquare, Share2 } from 'lucide-react'

const tmdbImg = (path, size = 'w342') =>
  path ? `https://image.tmdb.org/t/p/${size}${path}` : null

export default function LandingHero() {
  // TMDb client (v3 key or v4 bearer)
  const token = import.meta.env.VITE_TMDB_API_KEY
  const isBearer = useMemo(() => !!token && token.includes('.'), [token])
  const buildUrl = (path, params = {}) => {
    const url = new URL(`https://api.themoviedb.org/3${path}`)
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
    if (!isBearer && token) url.searchParams.set('api_key', token)
    return url.toString()
  }
  const headers = isBearer
    ? { Authorization: `Bearer ${token}`, accept: 'application/json' }
    : { accept: 'application/json' }

  // Fetch three posters: Shawshank, Inception, + trending
  const [cards, setCards] = useState([
    { key: 'shawshank', title: 'The Shawshank Redemption', poster: null },
    { key: 'inception', title: 'Inception', poster: null },
    { key: 'trending', title: 'Trending', poster: null },
  ])

  useEffect(() => {
    let cancelled = false
    async function run() {
      if (!token) return
      try {
        const [shaw, ince, trend] = await Promise.all([
          fetch(buildUrl('/search/movie', { query: 'The Shawshank Redemption', language: 'en-US', page: '1' }), { headers }).then(r => r.json()),
          fetch(buildUrl('/search/movie', { query: 'Inception', language: 'en-US', page: '1' }), { headers }).then(r => r.json()),
          fetch(buildUrl('/trending/movie/day', { language: 'en-US' }), { headers }).then(r => r.json()),
        ])
        const s = shaw?.results?.[0]?.poster_path || null
        const i = ince?.results?.[0]?.poster_path || null
        const t = trend?.results?.[0]?.poster_path || null
        if (!cancelled) {
          setCards([
            { key: 'shawshank', title: 'The Shawshank Redemption', poster: s },
            { key: 'inception', title: 'Inception', poster: i },
            { key: 'trending', title: trend?.results?.[0]?.title || 'Trending', poster: t },
          ])
        }
      } catch {
        // leave as null -> placeholders show
      }
    }
    run()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, isBearer])

  return (
    <section
      className="relative overflow-hidden"
      style={{ marginTop: 'var(--topnav-h, var(--nav-h, 72px))' }}
    >
      {/* Optional subtle highlight that harmonizes with the global bg */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-60"
        style={{
          background:
            'radial-gradient(700px 300px at 20% 15%, rgba(254,146,69,.22) 0%, transparent 60%)',
        }}
      />

      {/* Content: centered vertically below TopNav */}
      <div
        className="relative z-10 mx-auto max-w-7xl px-4 md:px-6"
        style={{ ['--nav-h']: '72px' }}
      >
        <div
          className="grid items-center gap-10 md:grid-cols-2 py-14 sm:py-16"
          style={{ minHeight: 'calc(100svh - var(--topnav-h, var(--nav-h, 72px)))' }}
        >
          {/* LEFT — headline + copy + CTA */}
          <div className="text-center md:text-left">
            <h1 className="text-[clamp(2.75rem,10vw,4.75rem)] font-black leading-[1.05] tracking-tight text-white">
              Movies that match <span className="text-brand-100">how you feel</span>
            </h1>

            <p className="mt-4 max-w-xl text-[clamp(1rem,2.7vw,1.25rem)] leading-relaxed text-white/85 md:max-w-lg">
              Tell us how you want to feel. We hand-pick a short, spot-on list you’ll actually
              watch—no endless scrolling. Save favorites and keep your watchlist in one place.
            </p>

            <div className="mt-7 flex flex-col items-center gap-3 sm:flex-row md:justify-start justify-center">
              <Link
                to="/auth/sign-up"
                className="inline-flex h-11 items-center justify-center rounded-full px-6 text-[0.95rem] font-semibold text-white shadow-lift transition-transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-brand/60 bg-gradient-to-r from-[#fe9245] to-[#eb423b]"
              >
                Get started
              </Link>
              {/* Transparent sign-in pill */}
              <Link
                to="/auth/sign-in"
                className="group relative inline-flex h-11 items-center gap-2 rounded-full px-5
                           text-[0.95rem] font-semibold text-white/95
                           bg-transparent hover:bg-white/10
                           focus:outline-none focus:ring-2 focus:ring-brand/60"
              >
                <span className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-white/25" />
                <span className="pointer-events-none absolute inset-0 rounded-full [mask:linear-gradient(#000_0,transparent_2px)] ring-1 ring-white/15" />
                <LogIn className="h-4 w-4 text-white/90" aria-hidden />
                <span>Sign in</span>
              </Link>
            </div>

            <p className="mt-3 text-sm text-white/65">Free to start. Your mood, your movie.</p>
          </div>

          {/* RIGHT — subtle “social/review” collage (desktop only) */}
          <div className="hidden md:block">
            <Collage3 cards={cards} />
          </div>
        </div>
      </div>
    </section>
  )
}

/* ----------------------- Right-side collage ----------------------- */
function Collage3({ cards }) {
  // Layout: one main card + two smaller; gentle glass/blur, light shadows
  return (
    <div className="relative mx-auto w-full max-w-lg">
      {/* Main card */}
      <div className="relative rounded-2xl border border-white/10 bg-white/5 p-3 shadow-2xl backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 shrink-0 rounded-full bg-white/20" />
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-white/90">Jason Argon shared</div>
            <div className="truncate text-xs text-white/65">{cards[0]?.title || 'The Shawshank Redemption'}</div>
          </div>
          <div className="ml-auto rounded-lg bg-white/10 p-1.5 text-white/90">
            <MessageSquare className="h-4 w-4" />
          </div>
        </div>

        <PosterBlock poster={cards[0]?.poster} fallbackTitle="Shawshank" className="mt-3 aspect-[16/10] w-full rounded-xl" />

        <div className="mt-3 rounded-xl bg-white/7.5 p-3 text-sm text-white/85">
          Some moments that keep you rooting for hope—and for each other.
        </div>

        <div className="mt-2 flex items-center gap-2">
          {[0,1,2,3,4].map(i => (
            <div key={i} className="h-6 w-6 rounded-full bg-white/15" />
          ))}
          <div className="ml-3 truncate text-sm text-white/80">Shared with you and 5 others</div>
        </div>
      </div>

      {/* Floating small cards */}
      <div className="absolute right-0 top-6">
        <SmallCard poster={cards[1]?.poster} label={cards[1]?.title || 'Inception'} icon={<Share2 className="h-3.5 w-3.5" />} />
      </div>
      <div className="absolute right-8 bottom-[-14px]">
        <SmallCard poster={cards[2]?.poster} label={cards[2]?.title || 'Trending'} />
      </div>
    </div>
  )
}

function PosterBlock({ poster, fallbackTitle, className = '' }) {
  return poster ? (
    <img
      src={tmdbImg(poster, 'w500')}
      srcSet={`${tmdbImg(poster, 'w342')} 342w, ${tmdbImg(poster, 'w500')} 500w, ${tmdbImg(poster, 'w780')} 780w`}
      sizes="(max-width: 768px) 100vw, 480px"
      alt={fallbackTitle}
      className={`h-auto w-full rounded-lg object-cover ${className}`}
      loading="lazy"
      decoding="async"
    />
  ) : (
    <div className={`grid place-items-center bg-white/10 text-white/60 ${className}`}>
      {fallbackTitle}
    </div>
  )
}

function SmallCard({ poster, label, icon = null }) {
  return (
    <div className="relative rounded-xl border border-white/10 bg-white/5 p-2 shadow-xl backdrop-blur">
      <PosterBlock poster={poster} fallbackTitle={label} className="aspect-square w-28 rounded-lg" />
      <div className="absolute -right-2 -top-2 rounded-md bg-white/10 p-1.5 text-white/90">
        {icon}
      </div>
    </div>
  )
}