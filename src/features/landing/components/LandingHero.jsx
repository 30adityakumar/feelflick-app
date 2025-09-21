import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

const TMDB_IMG = (path, size = 'w1280') =>
  path ? `https://image.tmdb.org/t/p/${size}${path}` : null

export default function LandingHero() {
  const navigate = useNavigate()

  // --- TMDb client (supports v3 key or v4 bearer) ---
  const tmdbToken = import.meta.env.VITE_TMDB_API_KEY
  const isBearer = useMemo(() => !!tmdbToken && tmdbToken.includes('.'), [tmdbToken])
  const buildUrl = (path, params = {}) => {
    const url = new URL(`https://api.themoviedb.org/3${path}`)
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
    if (!isBearer && tmdbToken) url.searchParams.set('api_key', tmdbToken)
    return url.toString()
  }
  const buildHeaders = () =>
    isBearer ? { Authorization: `Bearer ${tmdbToken}`, accept: 'application/json' } : { accept: 'application/json' }

  // --- Showcase state ---
  const [items, setItems] = useState([])           // [{id,title,backdrop_path,poster_path}]
  const [index, setIndex] = useState(0)
  const [videoMap, setVideoMap] = useState({})     // id -> youtubeKey | null
  const [loading, setLoading] = useState(false)
  const [errored, setErrored] = useState(false)
  const [iframeLoaded, setIframeLoaded] = useState(false)
  const rotTimer = useRef(null)
  const iframeLoadTimer = useRef(null)

  // Fetch top-rated list (up to 10)
  useEffect(() => {
    let cancelled = false
    async function run() {
      if (!tmdbToken) return
      setLoading(true); setErrored(false)
      try {
        const res = await fetch(buildUrl('/movie/top_rated', { language: 'en-US', page: '1', region: 'US' }), { headers: buildHeaders() })
        const data = res.ok ? await res.json() : { results: [] }
        const list = (data.results || [])
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

  // Fetch trailer key lazily for current item
  useEffect(() => {
    let cancelled = false
    const cur = items[index]
    if (!tmdbToken || !cur || videoMap[cur.id] !== undefined) return
    async function getVideos() {
      try {
        const r = await fetch(buildUrl(`/movie/${cur.id}/videos`, { language: 'en-US' }), { headers: buildHeaders() })
        const j = r.ok ? await r.json() : { results: [] }
        const vids = Array.isArray(j.results) ? j.results : []
        const pick =
          vids.find(v => v.site === 'YouTube' && v.type === 'Trailer') ||
          vids.find(v => v.site === 'YouTube' && v.type === 'Teaser')
        if (!cancelled) setVideoMap(prev => ({ ...prev, [cur.id]: pick?.key ?? null }))
      } catch {
        if (!cancelled) setVideoMap(prev => ({ ...prev, [cur.id]: null }))
      }
    }
    getVideos()
    return () => { cancelled = true }
  }, [index, items, tmdbToken, isBearer])

  // Rotation: 15s if trailer, 5s if image
  useEffect(() => {
    if (items.length === 0) return
    const cur = items[index]
    const hasTrailer = !!videoMap[cur?.id]
    clearInterval(rotTimer.current)
    rotTimer.current = setInterval(() => {
      setIframeLoaded(false) // reset load state for next item
      setIndex(i => (i + 1) % items.length)
    }, hasTrailer ? 15000 : 5000)
    return () => clearInterval(rotTimer.current)
  }, [items, index, videoMap])

  // If iframe doesn't load within 3s, treat as broken and rely on image
  useEffect(() => {
    clearTimeout(iframeLoadTimer.current)
    setIframeLoaded(false)
    if (!videoMap[items[index]?.id]) return
    iframeLoadTimer.current = setTimeout(() => setIframeLoaded(false), 3000)
    return () => clearTimeout(iframeLoadTimer.current)
  }, [index, videoMap, items])

  const cur = items[index]
  const curBackdrop = TMDB_IMG(cur?.backdrop_path || cur?.poster_path, 'w1280')
  const curYouTubeKey = videoMap[cur?.id]

  return (
    <section className="relative overflow-hidden">
      {/* Background + radial light (unchanged) */}
      <div className="feelflick-landing-bg" aria-hidden="true" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-0 opacity-60"
        style={{ background: 'radial-gradient(700px 300px at 20% 15%, rgba(254,146,69,.25) 0%, transparent 60%)' }}
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 pt-24 pb-14 sm:pt-28 sm:pb-20 md:px-6">
        <div className="cq grid items-center gap-10 md:grid-cols-2">
          {/* Left: copy + CTAs (kept, with mood-first line) */}
          <div>
            <h1 className="text-4xl font-black tracking-tight text-white sm:text-6xl">
              Movies that match <span className="text-brand-100">how you feel</span>
            </h1>

            <p className="mt-4 max-w-xl text-base leading-relaxed text-white/80 sm:text-lg">
              Tell us your mood and skip the endless scroll. We’ll curate a tight list you’ll
              actually watch—then track what you love with a single tap.
            </p>

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
              <span className="ml-1 text-sm text-white/60">Your mood, your movie. No endless scrolling.</span>
            </div>
          </div>

          {/* Right: dynamic trailer/poster showcase */}
          <div className="hidden md:block">
            <div className="card-surface relative overflow-hidden rounded-3xl p-3">
              <div className="absolute inset-0 -z-10 rounded-3xl bg-gradient-to-tr from-brand-600/10 to-transparent" />

              <div className="relative aspect-[10/7] w-full overflow-hidden rounded-2xl border border-white/10 bg-neutral-900/60">
                {/* Backdrop image (always rendered as fallback/base) */}
                {curBackdrop ? (
                  <img
                    key={curBackdrop}
                    src={curBackdrop}
                    alt={cur?.title || cur?.name || 'Movie'}
                    className="absolute inset-0 h-full w-full object-cover"
                    loading="eager"
                    decoding="async"
                    onError={(e) => { e.currentTarget.style.display = 'none' }}
                  />
                ) : (
                  (loading || !tmdbToken || errored) && (
                    <div className="absolute inset-0 animate-pulse rounded-2xl bg-white/10" />
                  )
                )}

                {/* Trailer (if available) — stripped UI, cropped & masked */}
                {tmdbToken && curYouTubeKey && (
                  <iframe
                    key={curYouTubeKey}
                    title={cur?.title || cur?.name || 'Trailer'}
                    src={`https://www.youtube-nocookie.com/embed/${curYouTubeKey}?autoplay=1&mute=1&controls=0&rel=0&modestbranding=1&iv_load_policy=3&fs=0&disablekb=1&playsinline=1&start=12&end=27`}
                    className="absolute left-1/2 top-1/2 h-[115%] w-[115%] -translate-x-1/2 -translate-y-1/2 rounded-none"
                    allow="autoplay; encrypted-media"
                    referrerPolicy="strict-origin-when-cross-origin"
                    loading="eager"
                    // prevent any YouTube UI from appearing on interaction
                    style={{ pointerEvents: 'none' }}
                    onLoad={() => setIframeLoaded(true)}
                    sandbox="allow-same-origin allow-scripts allow-presentation"
                  />
                )}

                {/* Masks to hide top bar & bottom-right watermark */}
                <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/80 to-transparent" />
                <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/60 to-transparent" />
                <div aria-hidden className="pointer-events-none absolute bottom-0 right-0 h-16 w-16 bg-[radial-gradient(closest-side,rgba(0,0,0,.85),transparent)]" />

                {/* Caption & click-through */}
                {cur && (
                  <>
                    <button
                      onClick={() => navigate(`/movie/${cur.id}`)}
                      className="absolute inset-0"
                      aria-label={`Open ${cur.title || cur.name}`}
                      title={cur.title || cur.name}
                    />
                    <div className="pointer-events-none absolute bottom-0 left-0 right-0 p-3 text-left">
                      <div className="truncate text-sm font-semibold text-white/90">
                        {cur.title || cur.name}
                      </div>
                      <div className="text-xs text-white/60">Top rated picks</div>
                    </div>
                  </>
                )}

                {/* If no key or iframe never loaded → we still show the image (already beneath).
                    If even the image fails, the skeleton above remains visible. */}
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