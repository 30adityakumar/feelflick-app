import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { MessageSquare, Share2, Star, LogIn } from 'lucide-react'

/** TMDb helpers */
const tmdbImg = (path, size = 'w500') =>
  path ? `https://image.tmdb.org/t/p/${size}${path}` : null
const srcSetFor = (path) =>
  path
    ? `${tmdbImg(path, 'w342')} 342w, ${tmdbImg(path, 'w500')} 500w, ${tmdbImg(path, 'w780')} 780w, ${tmdbImg(path, 'w1280')} 1280w`
    : undefined

export default function LandingHero() {
  const navigate = useNavigate()

  // --- TMDb client (v3 key or v4 bearer) ---
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

  // --- Data state for the 3 posters (Shawshank, Inception, Trending) ---
  const [cards, setCards] = useState([]) // [{id,title,poster_path}]
  const [loading, setLoading] = useState(false)

  // Motion/network guards (mobile keeps things simple)
  const reduceMotion = useRef(false)
  useEffect(() => {
    const m = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    reduceMotion.current = !!m?.matches
    const onChange = () => (reduceMotion.current = !!m?.matches)
    m?.addEventListener?.('change', onChange)
    return () => m?.removeEventListener?.('change', onChange)
  }, [])

  // Fetch 2 known titles + 1 trending
  useEffect(() => {
    let cancelled = false
    async function run() {
      if (!token) return
      setLoading(true)
      try {
        const [shaw, inc, trend] = await Promise.all([
          fetch(buildUrl('/movie/278', { language: 'en-US' }), { headers }).then((r) => r.json()),
          fetch(buildUrl('/movie/27205', { language: 'en-US' }), { headers }).then((r) => r.json()),
          fetch(buildUrl('/trending/movie/week', { language: 'en-US', page: '1' }), { headers }).then((r) => r.json()),
        ])
        const trendingPick = (trend?.results || []).find((m) => m?.poster_path)
        const list = [shaw, inc, trendingPick].filter(Boolean)
        if (!cancelled) setCards(list.slice(0, 3))
      } catch {
        if (!cancelled) setCards([])
      } finally {
        if (!cancelled) setLoading(false)
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
      {/* Abstract, site-wide background now handled globally (see CSS below) */}

      {/* Optional subtle highlight in hero area */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-0 opacity-60"
        style={{
          background:
            'radial-gradient(700px 300px at 20% 15%, rgba(254,146,69,.22) 0%, transparent 60%)',
        }}
      />

      <div
        className="relative z-10 mx-auto max-w-7xl px-4 md:px-6"
        style={{ ['--nav-h']: '72px' }}
      >
        {/* Vertically centered two-column layout */}
        <div
          className="grid items-center gap-10 md:grid-cols-2 py-14 sm:py-16"
          style={{ minHeight: 'calc(100svh - var(--topnav-h, var(--nav-h, 72px)))' }}
        >
          {/* LEFT: Headline & CTAs */}
          <div>
            <h1 className="text-[clamp(2.9rem,10vw,4.7rem)] font-black leading-[1.05] tracking-tight text-white">
              Movies that match <span className="text-brand-100">how you feel</span>
            </h1>

            <p className="mt-4 max-w-xl text-[clamp(1rem,2.7vw,1.25rem)] leading-relaxed text-white/85">
              Tell us how you want to feel. We hand-pick a short, spot-on list you’ll actually
              watch—no endless scrolling. Save favorites and keep your watchlist in one place.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link
                to="/auth/sign-up"
                className="inline-flex h-11 items-center justify-center rounded-full px-6 text-[0.95rem] font-semibold text-white shadow-lift transition-transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-brand/60 bg-gradient-to-r from-[#fe9245] to-[#eb423b]"
              >
                Get started
              </Link>

              {/* Transparent Sign in (pill, icon, subtle outline) */}
              <Link
                to="/auth/sign-in"
                className="group relative inline-flex h-11 items-center gap-2 rounded-full border border-white/25 px-5 text-[0.95rem] font-semibold text-white/95 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-brand/60"
              >
                <LogIn className="h-4 w-4 text-white/90" aria-hidden />
                <span>Sign in</span>
              </Link>
            </div>

            <p className="mt-3 text-sm text-white/65">
              Free to start. Your mood, your movie.
            </p>
          </div>

          {/* RIGHT: Social/review stack with three posters */}
          <div className="hidden md:block">
            <RightSocialStack cards={cards} loading={loading} onOpen={(id) => id && navigate(`/movie/${id}`)} />
          </div>

          {/* Mobile: keep the hero clean; we don’t render posters to avoid distraction/bandwidth */}
          {/* If you decide to show a miniature stack on phones later, we can add a tiny version here. */}
        </div>
      </div>
    </section>
  )
}

/* --------------------------- Right-side stack --------------------------- */
function RightSocialStack({ cards = [], loading, onOpen }) {
  // Fallback skeletons
  const safe = cards.filter(Boolean).slice(0, 3)
  const [c0, c1, c2] = safe

  return (
    <div className="relative mx-auto w-full max-w-md">
      {/* Main review tile (left) */}
      <div className="relative rounded-2xl bg-white/5 ring-1 ring-white/10 p-3 backdrop-blur-sm">
        {/* Header with avatar + caption */}
        <div className="mb-2 flex items-center gap-3">
          <Avatar name="Jason Argon" />
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-white/90">Jason Argon shared</div>
            <div className="truncate text-xs text-white/60">{c0?.title || 'A great pick'}</div>
          </div>
          <div className="ml-auto rounded-lg bg-white/10 p-1.5">
            <MessageSquare className="h-4 w-4 text-white/80" />
          </div>
        </div>

        {/* Poster (big) */}
        <Poster box={c0} loading={loading} onClick={() => onOpen?.(c0?.id)} ratioClass="aspect-[16/10]" />

        {/* Snippet */}
        <p className="mt-2 line-clamp-2 text-sm text-white/75">
          “Smart, human, and unforgettable. Perfect when you want something hopeful.”
        </p>

        {/* Shared with row */}
        <div className="mt-3 flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2 ring-1 ring-white/10">
          <Avatar size={22} name="A" />
          <Avatar size={22} name="B" />
          <Avatar size={22} name="C" />
          <div className="ml-1 truncate text-xs text-white/70">Shared with you and 5 others</div>
        </div>
      </div>

      {/* Right column: two small posters with action pills */}
      <div className="absolute -right-5 top-10 w-40 space-y-4">
        <SmallPosterCard
          box={c1}
          icon={<Share2 className="h-3.5 w-3.5" />}
          label="Share"
          onClick={() => onOpen?.(c1?.id)}
          loading={loading}
        />
        <SmallPosterCard
          box={c2}
          icon={<Star className="h-3.5 w-3.5" />}
          label="Rated 5★"
          onClick={() => onOpen?.(c2?.id)}
          loading={loading}
        />
      </div>
    </div>
  )
}

function SmallPosterCard({ box, icon, label, onClick, loading }) {
  return (
    <div className="relative overflow-hidden rounded-xl ring-1 ring-white/10 bg-white/5">
      <Poster box={box} loading={loading} ratioClass="aspect-square" onClick={onClick} />
      <div className="pointer-events-none absolute right-2 top-2 rounded-md bg-neutral-900/80 p-1.5 ring-1 ring-white/15">
        <div className="flex items-center gap-1 text-[11px] font-medium text-white/90">
          {icon}
          <span>{label}</span>
        </div>
      </div>
    </div>
  )
}

function Poster({ box, ratioClass = 'aspect-[16/10]', onClick, loading }) {
  const path = box?.poster_path
  return (
    <div className={`relative ${ratioClass} w-full overflow-hidden`}>
      {loading || !path ? (
        <div className="absolute inset-0 animate-pulse bg-white/10" />
      ) : (
        <img
          src={tmdbImg(path, 'w500')}
          srcSet={srcSetFor(path)}
          sizes="(min-width: 768px) 320px, 100vw"
          alt={box?.title || 'Poster'}
          className="absolute inset-0 h-full w-full cursor-pointer object-cover transition-transform duration-300 hover:scale-[1.02]"
          onClick={onClick}
          loading="eager"
          decoding="async"
        />
      )}
    </div>
  )
}

function Avatar({ name = 'User', size = 28 }) {
  const initial = (name || 'U').slice(0, 1).toUpperCase()
  return (
    <div
      className="grid place-items-center rounded-full bg-gradient-to-br from-white/90 to-white/70 text-neutral-900 ring-1 ring-white/40"
      style={{ width: size, height: size, fontSize: Math.max(12, size * 0.45) }}
      aria-hidden
      title={name}
    >
      {initial}
    </div>
  )
}