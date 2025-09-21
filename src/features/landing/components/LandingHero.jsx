import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

/* --- tiny helpers --- */
const imgUrl = (path, size = 'w1280') =>
  path ? `https://image.tmdb.org/t/p/${size}${path}` : null

const srcSet = (path) =>
  path
    ? `${imgUrl(path, 'w500')} 500w, ${imgUrl(path, 'w780')} 780w, ${imgUrl(path, 'w1280')} 1280w, ${imgUrl(path, 'original')} 1920w`
    : undefined

export default function LandingHero() {
  /* TMDb: supports either v3 key or v4 bearer */
  const key = import.meta.env.VITE_TMDB_API_KEY
  const isBearer = useMemo(() => !!key && key.includes('.'), [key])
  const buildUrl = (p, q = {}) => {
    const u = new URL(`https://api.themoviedb.org/3${p}`)
    Object.entries(q).forEach(([k, v]) => u.searchParams.set(k, v))
    if (!isBearer && key) u.searchParams.set('api_key', key)
    return u.toString()
  }
  const headers = isBearer
    ? { Authorization: `Bearer ${key}`, accept: 'application/json' }
    : { accept: 'application/json' }

  /* data */
  const [items, setItems] = useState([]) // [{id, backdrop_path, poster_path}]
  const [i, setI] = useState(0)
  const [loading, setLoading] = useState(false)

  /* motion guards */
  const reduceMotion = useRef(false)
  const heroRef = useRef(null)
  const [inView, setInView] = useState(true)
  const rotRef = useRef(null)

  useEffect(() => {
    const m = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    reduceMotion.current = !!m?.matches
    const onChange = () => (reduceMotion.current = !!m?.matches)
    m?.addEventListener?.('change', onChange)
    return () => m?.removeEventListener?.('change', onChange)
  }, [])

  useEffect(() => {
    if (!heroRef.current) return
    const io = new IntersectionObserver(
      (entries) => setInView(entries[0]?.isIntersecting ?? true),
      { threshold: 0.25 }
    )
    io.observe(heroRef.current)
    return () => io.disconnect()
  }, [])

  /* fetch top-rated images */
  useEffect(() => {
    let cancelled = false
    async function run() {
      if (!key) return
      setLoading(true)
      try {
        const r = await fetch(
          buildUrl('/movie/top_rated', { language: 'en-US', page: '1', region: 'US' }),
          { headers }
        )
        const j = r.ok ? await r.json() : { results: [] }
        const list = (j.results || [])
          .filter((m) => m && (m.backdrop_path || m.poster_path))
          .slice(0, 12)
        if (!cancelled) setItems(list)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    run()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, isBearer])

  /* rotate background (very subtle) */
  useEffect(() => {
    clearInterval(rotRef.current)
    if (!items.length || reduceMotion.current || !inView) return
    rotRef.current = setInterval(() => {
      setI((x) => (x + 1) % items.length)
    }, 6000) // ~2s fade + ~4s hold
    return () => clearInterval(rotRef.current)
  }, [items.length, inView])

  /* preload next */
  useEffect(() => {
    if (!items.length) return
    const n = items[(i + 1) % items.length]
    const src = imgUrl(n?.backdrop_path || n?.poster_path, 'w1280')
    if (src) { const img = new Image(); img.src = src }
  }, [i, items])

  const curPath = items[i]?.backdrop_path || items[i]?.poster_path
  const prevPath = items[(i - 1 + (items.length || 1)) % (items.length || 1)]?.backdrop_path
    || items[(i - 1 + (items.length || 1)) % (items.length || 1)]?.poster_path

  return (
    <section ref={heroRef} className="relative overflow-hidden">
      {/* Base background you already have */}
      <div className="feelflick-landing-bg" aria-hidden="true" />

      {/* NEW: posters as full-bleed background (subtle) */}
      <div aria-hidden className="absolute inset-0 -z-0">
        {/* previous (fade out) */}
        {prevPath && (
          <img
            key={`prev-${prevPath}`}
            src={imgUrl(prevPath, 'w1280')}
            srcSet={srcSet(prevPath)}
            sizes="100vw"
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-700"
            style={{ filter: 'blur(1px) saturate(1.05) brightness(.85)', transform: 'scale(1.05)' }}
          />
        )}
        {/* current (fade in) */}
        {curPath && (
          <img
            key={`cur-${curPath}`}
            src={imgUrl(curPath, 'w1280')}
            srcSet={srcSet(curPath)}
            sizes="100vw"
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-100 transition-opacity duration-700"
            style={{ filter: 'blur(1px) saturate(1.05) brightness(.85)', transform: 'scale(1.06)' }}
          />
        )}
      </div>

      {/* Keep your bluish overlay EXACTLY as-is */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background:
            'radial-gradient(700px 300px at 20% 15%, rgba(254,146,69,.25) 0%, transparent 60%)',
        }}
      />

      {/* Content container — perfectly centered vertically */}
      <div
        className="relative z-10 mx-auto max-w-7xl px-4 md:px-6"
        style={{ ['--nav-h']: '72px' }}
      >
        <div className="grid min-h-[calc(100svh-var(--nav-h))] items-center py-10 sm:py-12">
          <div className="cq mx-auto w-full max-w-3xl text-center md:max-w-2xl">
            <h1 className="text-[clamp(2.25rem,8vw,4.25rem)] font-black leading-[1.05] tracking-tight text-white">
              Movies that match <span className="text-brand-100">how you feel</span>
            </h1>

            <p className="mx-auto mt-4 max-w-xl text-[clamp(1rem,2.7vw,1.25rem)] leading-relaxed text-white/85">
              Tell us how you want to feel. We hand-pick a short, spot-on list you’ll actually
              watch—no endless scrolling. Save favorites and keep your watchlist in one place.
            </p>

            {/* CTAs */}
            <div className="mx-auto mt-7 flex max-w-sm flex-col items-center justify-center gap-3 sm:max-w-none sm:flex-row">
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
            </div>

            <p className="mt-3 text-sm text-white/65">Free to start. Your mood, your movie.</p>
          </div>
        </div>
      </div>
    </section>
  )
}