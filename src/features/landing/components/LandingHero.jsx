import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

const tmdbImg = (path, size = 'w780') =>
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

  // --- Data ---
  const [items, setItems] = useState([])
  const [index, setIndex] = useState(0)
  const [loading, setLoading] = useState(false)
  const [errored, setErrored] = useState(false)

  // --- Motion guards ---
  const [play, setPlay] = useState(true)
  const reduceMotion = useRef(false)
  const visRef = useRef(null)
  const rotRef = useRef(null)

  useEffect(() => {
    const m = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    reduceMotion.current = !!m?.matches
    const onChange = () => (reduceMotion.current = !!m?.matches)
    m?.addEventListener?.('change', onChange)
    return () => m?.removeEventListener?.('change', onChange)
  }, [])

  useEffect(() => {
    const el = visRef.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => setPlay(e.isIntersecting)),
      { threshold: 0.25 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  // Fetch top rated
  useEffect(() => {
    let cancelled = false
    async function run() {
      if (!token) return
      setLoading(true); setErrored(false)
      try {
        const r = await fetch(
          buildUrl('/movie/top_rated', { language: 'en-US', page: '1', region: 'US' }),
          { headers }
        )
        const j = r.ok ? await r.json() : { results: [] }
        const list = (j.results || [])
          .filter(m => m && (m.backdrop_path || m.poster_path))
          .slice(0, 12)
        if (!cancelled) setItems(list)
      } catch {
        if (!cancelled) setErrored(true)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    run()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, isBearer])

  // Cross-fade rotation
  useEffect(() => {
    clearInterval(rotRef.current)
    if (!items.length || reduceMotion.current || !play) return
    rotRef.current = setInterval(() => {
      setIndex(i => (i + 1) % items.length)
    }, 5500) // ~2s fade + ~3.5s hold
    return () => clearInterval(rotRef.current)
  }, [items.length, play])

  // Preload next
  useEffect(() => {
    if (!items.length) return
    const next = items[(index + 1) % items.length]
    const src = tmdbImg(next?.backdrop_path || next?.poster_path, 'w780')
    if (src) { const img = new Image(); img.src = src }
  }, [index, items])

  const cur = items[index]
  const prev = items[(index - 1 + (items.length || 1)) % (items.length || 1)]
  const curPath = cur?.backdrop_path || cur?.poster_path
  const prevPath = prev?.backdrop_path || prev?.poster_path

  return (
    <section className="relative overflow-hidden">
      {/* Background + soft radial light */}
      <div className="feelflick-landing-bg" aria-hidden="true" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-0 opacity-60"
        style={{
          background:
            'radial-gradient(700px 300px at 20% 15%, rgba(254,146,69,.25) 0%, transparent 60%)',
        }}
      />

      <div
        className="relative z-10 mx-auto max-w-7xl px-4 md:px-6"
        style={{ ['--nav-h']: '72px' }} // fallback if you don’t set this in TopNav
      >
        {/* Center the hero vertically with equal top/bottom feel */}
        <div className="grid items-center gap-8 md:grid-cols-2 md:gap-10 min-h-[calc(100svh-var(--nav-h))] py-10 sm:py-12">
          {/* Left: centered block */}
          <div>
            <h1 className="text-4xl font-black tracking-tight text-white sm:text-6xl">
              Movies that match <span className="text-brand-100">how you feel</span>
            </h1>

            <p className="mt-4 max-w-xl text-base leading-relaxed text-white/80 sm:text-lg">
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
              <Link
                to="/auth/sign-in"
                className="inline-flex h-11 items-center justify-center rounded-full border border-white/25 px-5 text-[0.95rem] font-semibold text-white/95 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-brand/60"
              >
                Sign in
              </Link>
              <span className="ml-1 text-sm text-white/60">
                Free to start. Your mood, your movie.
              </span>
            </div>

            {/* Mobile showcase (16:9) */}
            <div className="mt-8 md:hidden">
              <PosterShowcase
                refEl={visRef}
                cur={cur}
                prev={prev}
                curPath={curPath}
                prevPath={prevPath}
                navigate={navigate}
                loading={loading || !token || errored}
                variant="mobile"
              />
              {/* Hide note on mobile to keep the fold clean */}
              <p className="mt-3 hidden text-center text-xs text-white/50 sm:block">
                Screens are illustrative. TMDb data used under license.
              </p>
            </div>
          </div>

          {/* Desktop showcase */}
          <div className="hidden md:block">
            <PosterShowcase
              refEl={visRef}
              cur={cur}
              prev={prev}
              curPath={curPath}
              prevPath={prevPath}
              navigate={navigate}
              loading={loading || !token || errored}
              variant="desktop"
            />
            <p className="mt-3 text-center text-xs text-white/50">
              Screens are illustrative. TMDb data used under license.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------------------------- Poster Showcase ---------------------------- */
function PosterShowcase({ refEl, cur, prev, curPath, prevPath, navigate, loading, variant = 'desktop' }) {
  const isMobile = variant === 'mobile'
  const outerPad = isMobile ? 'p-2' : 'p-3'
  const aspect = isMobile ? 'aspect-video' : 'aspect-[10/7]'
  const sizes = isMobile ? '(max-width: 767px) 100vw, 640px' : '(min-width: 768px) 640px, 100vw'

  return (
    <div ref={refEl} className={`card-surface relative overflow-hidden rounded-3xl ${outerPad}`}>
      <div className="absolute inset-0 -z-10 rounded-3xl bg-gradient-to-tr from-brand-600/10 to-transparent" />
      <div className={`relative ${aspect} w-full overflow-hidden rounded-2xl border border-white/10 bg-neutral-900/60`}>
        {/* Skeleton */}
        {loading && <div className="absolute inset-0 animate-pulse rounded-2xl bg-white/10" />}

        {/* Previous (fade out) */}
        {prevPath && (
          <img
            key={`prev-${prev?.id}-${prevPath}`}
            src={tmdbImg(prevPath, 'w780')}
            srcSet={srcSetFor(prevPath)}
            sizes={sizes}
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-700"
            style={{ transform: 'scale(1.02)' }}
          />
        )}

        {/* Current (fade in, slight zoom) */}
        {curPath && (
          <img
            key={`cur-${cur?.id}-${curPath}`}
            src={tmdbImg(curPath, 'w780')}
            srcSet={srcSetFor(curPath)}
            sizes={sizes}
            alt={cur?.title || cur?.name || 'Movie'}
            className="absolute inset-0 h-full w-full object-cover opacity-100 transition-opacity duration-700"
            style={{ transform: 'scale(1.04)' }}
          />
        )}

        {/* Soft vignettes + caption */}
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/80 to-transparent" />
        <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/60 to-transparent" />

        {cur && (
          <>
            <button
              onClick={() => navigate(`/movie/${cur.id}`)}
              className="absolute inset-0"
              aria-label={`Open ${cur.title || cur.name}`}
              title={cur.title || cur.name}
            />
            <div className="pointer-events-none absolute bottom-0 left-0 right-0 p-3">
              <div className="truncate text-sm font-semibold text-white/90">
                {cur.title || cur.name}
              </div>
              <div className="text-xs text-white/60">Top rated picks</div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}