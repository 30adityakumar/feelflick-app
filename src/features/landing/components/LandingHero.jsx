import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

const MOODS = [
  { label: 'Feel-good', q: 'feel good' },
  { label: 'Thriller', q: 'thriller' },
  { label: 'Romance', q: 'romance' },
  { label: 'Mind-bending', q: 'mind bending' },
  { label: 'Family', q: 'family' },
  { label: 'Dark comedy', q: 'dark comedy' },
  { label: 'Anime', q: 'anime' },
  { label: 'Bollywood', q: 'bollywood' },
]

const TMDB_IMG = (path, size = 'w342') =>
  path ? `https://image.tmdb.org/t/p/${size}${path}` : null

export default function LandingHero() {
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [trending, setTrending] = useState([])
  const [loadingTrend, setLoadingTrend] = useState(false)
  const [trendError, setTrendError] = useState(null)
  const inputRef = useRef(null)

  // Submit search → /movies?query=...
  function submitSearch(term) {
    const value = (term ?? q).trim()
    if (!value) return
    navigate(`/movies?query=${encodeURIComponent(value)}`)
  }

  function onKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault()
      submitSearch()
    } else if (e.key === 'Escape') {
      setQ('')
      inputRef.current?.focus()
    }
  }

  // Optional: fetch trending preview if API key is configured
  const tmdbKey = import.meta.env.VITE_TMDB_API_KEY
  useEffect(() => {
    let cancelled = false
    if (!tmdbKey) return
    setLoadingTrend(true)
    fetch(`https://api.themoviedb.org/3/trending/movie/week?language=en-US`, {
      headers: { Authorization: `Bearer ${tmdbKey}`, accept: 'application/json' },
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((data) => {
        if (cancelled) return
        const results = Array.isArray(data?.results) ? data.results.slice(0, 12) : []
        setTrending(results)
        setTrendError(null)
      })
      .catch(() => {
        if (!cancelled) setTrendError('failed')
      })
      .finally(() => {
        if (!cancelled) setLoadingTrend(false)
      })
    return () => {
      cancelled = true
    }
  }, [tmdbKey])

  const showTrending = tmdbKey && trending.length > 0 && !trendError

  const bullets = useMemo(
    () => [
      'Mood-first discovery',
      'Zero-spoilers mode',
      'One-tap watchlist',
    ],
    []
  )

  return (
    <section className="relative isolate overflow-hidden" aria-labelledby="landing-hero-h1">
      {/* Background you already ship */}
      <div aria-hidden className="feelflick-landing-bg" />
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-br from-black/75 via-black/55 to-black/20" />

      <div className="relative mx-auto max-w-7xl px-4 pt-28 pb-16 sm:pt-32 sm:pb-24 md:px-6 lg:pt-36 lg:pb-28">
        <div className="cq mx-auto max-w-3xl text-center">
          <h1
            id="landing-hero-h1"
            className="font-black tracking-tight text-white text-[clamp(2.2rem,7vw,4rem)] leading-[1.06]"
          >
            Find the <span className="text-brand-100">right movie</span> for your mood.
          </h1>

          <p className="mt-4 text-white/80 text-[clamp(1rem,2.8vw,1.25rem)] leading-relaxed">
            Browse by feeling, keep spoilers off, and build your watchlist in seconds.
          </p>

          {/* Search */}
          <div className="mx-auto mt-6 max-w-xl">
            <div className="flex gap-2">
              <label htmlFor="landing-search" className="sr-only">Search movies</label>
              <input
                id="landing-search"
                ref={inputRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Search movies, genres, moods…"
                className="flex-1 rounded-full border border-white/20 bg-white/5 px-4 py-3 text-base text-white placeholder:text-white/50 outline-none focus:ring-2 focus:ring-brand/60"
                inputMode="search"
                autoComplete="off"
                spellCheck={false}
              />
              <button
                onClick={() => submitSearch()}
                className="rounded-full bg-gradient-to-r from-[#fe9245] to-[#eb423b] px-5 py-3 text-sm font-semibold text-white shadow-lift focus:outline-none focus:ring-2 focus:ring-brand/60"
              >
                Search
              </button>
            </div>

            {/* Mood chips */}
            <ul className="mt-3 flex flex-wrap items-center justify-center gap-2 text-sm" aria-label="Quick moods">
              {MOODS.map((m) => (
                <li key={m.q}>
                  <button
                    onClick={() => submitSearch(m.q)}
                    className="rounded-full border border-white/20 px-3 py-1.5 text-white/90 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-brand/60"
                  >
                    {m.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* CTAs */}
          <div className="mx-auto mt-6 flex max-w-md flex-col gap-3 sm:mt-7 sm:flex-row sm:items-center sm:justify-center">
            <Link
              to="/auth/sign-in"
              className="inline-flex h-11 items-center justify-center rounded-full border border-white/25 px-5 text-[clamp(.95rem,2.8vw,0.9rem)] font-semibold text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-brand/60"
            >
              Sign in
            </Link>
            <Link
              to="/auth/sign-up"
              className="inline-flex h-11 items-center justify-center rounded-full px-6 text-[clamp(1rem,3vw,0.95rem)] font-semibold text-white shadow-lift transition-transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-brand/60 bg-gradient-to-r from-[#fe9245] to-[#eb423b]"
            >
              Get started
            </Link>
          </div>

          {/* Highlights */}
          <ul className="mt-6 grid grid-cols-1 gap-2 text-left text-[0.95rem] text-white/80 sm:mt-7 sm:grid-cols-3 sm:text-sm" aria-label="Highlights">
            {bullets.map((b) => (
              <li key={b} className="flex items-center gap-2 justify-center sm:justify-start">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-brand-400" />
                {b}
              </li>
            ))}
          </ul>

          {/* Trending preview (optional, hides if no API key) */}
          {loadingTrend && (
            <div className="mx-auto mt-8 grid max-w-3xl grid-cols-3 gap-3 sm:grid-cols-6" aria-live="polite">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-40 w-full animate-pulse rounded-xl bg-white/10" />
              ))}
            </div>
          )}

          {showTrending && (
            <div className="mx-auto mt-8 max-w-4xl">
              <h2 className="mb-3 text-left text-sm font-semibold uppercase tracking-wide text-white/70">
                Trending this week
              </h2>
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
                {trending.map((m) => {
                  const src = TMDB_IMG(m.poster_path)
                  return (
                    <button
                      key={m.id}
                      onClick={() => navigate(`/movie/${m.id}`)}
                      className="group overflow-hidden rounded-xl border border-white/10 bg-white/5"
                      title={m.title || m.name}
                    >
                      {src ? (
                        <img
                          src={src}
                          alt={m.title || m.name}
                          loading="lazy"
                          decoding="async"
                          className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                          style={{ aspectRatio: '2 / 3' }}
                        />
                      ) : (
                        <div className="flex aspect-[2/3] items-center justify-center text-xs text-white/60">
                          No image
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}