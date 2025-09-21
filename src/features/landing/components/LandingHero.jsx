import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

/**
 * LandingHero
 * - Keeps your background + layout
 * - Removes the four feature chips
 * - Adds dynamic right-side showcase (poster/trailer rotator)
 * - Copy tuned for mood-first recommendations
 */

const TMDB_IMG = (path, size = 'w780') =>
  path ? `https://image.tmdb.org/t/p/${size}${path}` : null

export default function LandingHero() {
  const navigate = useNavigate()

  // ------------------- TMDb client (v3 key or v4 bearer) -------------------
  const tmdbToken = import.meta.env.VITE_TMDB_API_KEY
  const isBearer = useMemo(() => !!tmdbToken && tmdbToken.includes('.'), [tmdbToken])

  const buildUrl = (path, params = {}) => {
    const url = new URL(`https://api.themoviedb.org/3${path}`)
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
    if (!isBearer && tmdbToken) url.searchParams.set('api_key', tmdbToken) // v3 query key
    return url.toString()
  }
  const buildHeaders = () =>
    isBearer
      ? { Authorization: `Bearer ${tmdbToken}`, accept: 'application/json' }
      : { accept: 'application/json' }

  // ------------------- Showcase state -------------------
  const [items, setItems] = useState([]) // [{id,title,backdrop_path,poster_path}]
  const [index, setIndex] = useState(0)
  const [videoMap, setVideoMap] = useState({}) // id -> youtubeKey | null
  const [loading, setLoading] = useState(false)
  const [errored, setErrored] = useState(false)
  const tickRef = useRef(null)

  // Fetch Top Rated (limit 10)
  useEffect(() => {
    let cancelled = false
    async function run() {
      if (!tmdbToken) return
      setLoading(true)
      setErrored(false)
      try {
        const res = await fetch(
          buildUrl('/movie/top_rated', { language: 'en-US', page: '1', region: 'US' }),
          { headers: buildHeaders() }
        )
        const json = res.ok ? await res.json() : { results: [] }
        const list = (json.results || [])
          .filter(m => m && (m.backdrop_path || m.poster_path))
          .slice(0, 10)
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
  }, [tmdbToken, isBearer])

  // Fetch trailer key lazily for the current item
  useEffect(() => {
    let cancelled = false
    const cur = items[index]
    if (!tmdbToken || !cur || videoMap[cur.id] !== undefined) return
    async function getVideos() {
      try {
        const r = await fetch(buildUrl(`/movie/${cur.id}/videos`, { language: 'en-US' }), {
          headers: buildHeaders(),
        })
        const j = r.ok ? await r.json() : { results: [] }
        const vids = Array.isArray(j.results) ? j.results : []
        const pick = vids.find(v => v.site === 'YouTube' && v.type === 'Trailer') ||
                     vids.find(v => v.site === 'YouTube' && v.type === 'Teaser')
        if (!cancelled) {
          setVideoMap(prev => ({ ...prev, [cur.id]: pick?.key ?? null }))
        }
      } catch {
        if (!cancelled) setVideoMap(prev => ({ ...prev, [cur.id]: null }))
      }
    }
    getVideos()
    return () => { cancelled = true }
  }, [index, items, tmdbToken, isBearer, buildUrl])

  // Rotate every N seconds (longer if trailer)
  useEffect(() => {
    if (items.length === 0) return
    const cur = items[index]
    const hasTrailer = !!videoMap[cur?.id]
    const duration = hasTrailer ? 12000 : 5000
    clearInterval(tickRef.current)
    tickRef.current = setInterval(() => {
      setIndex(i => (i + 1) % items.length)
    }, duration)
    return () => clearInterval(tickRef.current)
  }, [items, index, videoMap])

  // Prefetch next backdrop
  useEffect(() => {
    const next = items[(index + 1) % (items.length || 1)]
    const src = TMDB_IMG(next?.backdrop_path || next?.poster_path, 'w1280')
    if (src) {
      const img = new Image()
      img.src = src
    }
  }, [index, items])

  const cur = items[index]
  const curBackdrop = TMDB_IMG(cur?.backdrop_path || cur?.poster_path, 'w1280')
  const curYouTubeKey = videoMap[cur?.id]

  // ------------------- UI -------------------
  return (
    <section className="relative overflow-hidden">
      {/* Background (your collage + radial light) */}
      <div className="feelflick-landing-bg" aria-hidden="true" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-0 opacity-60"
        style={{
          background:
            'radial-gradient(700px 300px at 20% 15%, rgba(254,146,69,.25) 0%, transparent 60%)',
        }}
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 pt-24 pb-14 sm:pt-28 sm:pb-20 md:px-6">
        <div className="cq grid items-center gap-10 md:grid-cols-2">
          {/* Left: copy + ctas (keep heading; refine supporting copy + small line) */}
          <div>
            <h1 className="text-4xl font-black tracking-tight text-white sm:text-6xl">
              Movies that match <span className="text-brand-100">how you feel</span>
            </h1>

            <p className="mt-4 max-w-xl text-base leading-relaxed text-white/80 sm:text-lg">
              Tell us your mood and skip the endless scroll. We’ll curate a tight list you’ll
              actually watch—then track what you love with a single tap.
            </p>

            {/* CTAs */}
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                to="/auth/sign-up"
                className="inline-flex h-11 items-center justify-center rounded-full px-5 text-[0.95rem] font-semibold text-white shadow-lift transition-transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-brand/60 bg-gradient-to-r from-[#fe9245] to-[#eb423b]"
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
                Your mood, your movie. No endless scrolling.
              </span>
            </div>
          </div>

          {/* Right: dynamic poster/trailer showcase (hidden on small screens) */}
          <div className="hidden md:block">
            <div className="card-surface relative overflow-hidden rounded-3xl p-3">
              <div className="absolute inset-0 -z-10 rounded-3xl bg-gradient-to-tr from-brand-600/10 to-transparent" />

              <div className="relative aspect-[10/7] w-full overflow-hidden rounded-2xl border border-white/10 bg-neutral-900/60">
                {/* Skeleton when loading or no key */}
                {(!tmdbToken || loading || (!cur && !errored)) && (
                  <div className="absolute inset-0 animate-pulse rounded-2xl bg-white/10" />
                )}

                {/* Trailer (if available) */}
                {tmdbToken && curYouTubeKey && (
                  <iframe
                    key={curYouTubeKey}
                    title={cur?.title || cur?.name || 'Trailer'}
                    src={`https://www.youtube.com/embed/${curYouTubeKey}?autoplay=1&mute=1&controls=0&rel=0&playsinline=1&modestbranding=1&loop=1&playlist=${curYouTubeKey}`}
                    className="absolute inset-0 h-full w-full"
                    allow="autoplay; encrypted-media"
                    allowFullScreen={false}
                  />
                )}

                {/* Backdrop image (fallback / when no trailer) */}
                {tmdbToken && !curYouTubeKey && curBackdrop && (
                  <img
                    key={curBackdrop}
                    src={curBackdrop}
                    alt={cur?.title || cur?.name || 'Movie'}
                    className="absolute inset-0 h-full w-full object-cover"
                    loading="eager"
                    decoding="async"
                  />
                )}

                {/* Click-through overlay to detail page */}
                {cur && (
                  <button
                    onClick={() => navigate(`/movie/${cur.id}`)}
                    className="absolute inset-0"
                    aria-label={`Open ${cur.title || cur.name}`}
                    title={cur.title || cur.name}
                  />
                )}

                {/* Soft vignette + caption */}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent" />
                {cur && (
                  <div className="pointer-events-none absolute bottom-0 left-0 right-0 p-3 text-left">
                    <div className="truncate text-sm font-semibold text-white/90">
                      {cur.title || cur.name}
                    </div>
                    <div className="text-xs text-white/60">Top rated picks</div>
                  </div>
                )}
              </div>
            </div>

            <p className="mt-3 text-center text-xs text-white/50">
              Screens are illustrative. TMDb data used under license.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}