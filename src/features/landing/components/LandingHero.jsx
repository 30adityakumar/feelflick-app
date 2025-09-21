import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

/**
 * LandingHero
 * - Keep your background + overlay
 * - Functional CTAs
 * - Right-side 3x3 poster mosaic (Top Rated, Popular, Hidden Gems)
 */

const TMDB_IMG = (path, size = 'w342') =>
  path ? `https://image.tmdb.org/t/p/${size}${path}` : null

// Smart fetch that supports both TMDb v3 (api_key) and v4 (Bearer) keys.
function tmdbFetch(path, params = {}, key) {
  const isV4 = key && (key.startsWith('eyJ') || key.length > 40)
  const url = new URL(`https://api.themoviedb.org/3/${path}`)
  if (!isV4 && key) url.searchParams.set('api_key', key)
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)))
  const init = isV4
    ? { headers: { Authorization: `Bearer ${key}`, accept: 'application/json' } }
    : {}
  return fetch(url.toString(), init)
}

export default function LandingHero() {
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const inputRef = useRef(null)

  const [tiles, setTiles] = useState(Array.from({ length: 9 }, () => null))
  const [loading, setLoading] = useState(false)

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

  // Fetch posters for the right mosaic
  useEffect(() => {
    let cancel = false
    const key = import.meta.env.VITE_TMDB_API_KEY
    if (!key) {
      // no key → leave placeholders
      return
    }
    setLoading(true)

    async function load() {
      try {
        // 1) Top Rated (3)
        const top = await tmdbFetch('movie/top_rated', { language: 'en-US', page: 1 }, key)
          .then(r => (r.ok ? r.json() : Promise.reject(r)))
          .then(d => (Array.isArray(d?.results) ? d.results : []))

        // 2) Popular (3)
        const pop = await tmdbFetch('movie/popular', { language: 'en-US', page: 1 }, key)
          .then(r => (r.ok ? r.json() : Promise.reject(r)))
          .then(d => (Array.isArray(d?.results) ? d.results : []))

        // 3) Hidden gems (vote_average desc but modest vote_count)
        const gems = await tmdbFetch(
          'discover/movie',
          {
            language: 'en-US',
            sort_by: 'vote_average.desc',
            'vote_count.gte': 200, // keep some quality
            'vote_count.lte': 2000, // avoid mega-hits
            page: 1,
            include_adult: false,
          },
          key
        )
          .then(r => (r.ok ? r.json() : Promise.reject(r)))
          .then(d => (Array.isArray(d?.results) ? d.results : []))

        // Pick 3 each, dedupe by id, fill to 9 (fallback to top rated)
        const pick = (arr, n) => arr.filter(m => m?.poster_path).slice(0, n)
        const chosen = []
        const seen = new Set()

        for (const list of [pick(top, 3), pick(pop, 3), pick(gems, 3)]) {
          for (const m of list) {
            if (!seen.has(m.id)) {
              chosen.push(m)
              seen.add(m.id)
            }
          }
        }
        // Backfill
        if (chosen.length < 9) {
          for (const m of top) {
            if (m?.poster_path && !seen.has(m.id)) {
              chosen.push(m)
              seen.add(m.id)
              if (chosen.length === 9) break
            }
          }
        }

        if (!cancel) {
          // map to 9 slots; if fewer, keep placeholders
          const next = Array.from({ length: 9 }, (_, i) => chosen[i] || null)
          setTiles(next)
        }
      } catch {
        // leave placeholders on error
      } finally {
        if (!cancel) setLoading(false)
      }
    }

    load()
    return () => { cancel = true }
  }, [])

  const microcopy = useMemo(
    () => 'Private by default. No email required to browse.',
    []
  )

  return (
    <section className="relative isolate overflow-hidden" aria-labelledby="landing-hero-h1">
      {/* Background you already ship */}
      <div aria-hidden className="feelflick-landing-bg" />
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-br from-black/75 via-black/55 to-black/20" />

      <div className="relative mx-auto max-w-7xl px-4 pt-28 pb-16 sm:pt-32 sm:pb-24 md:px-6 lg:pt-36 lg:pb-28">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          {/* LEFT: copy + actions */}
          <div className="max-w-3xl">
            <h1
              id="landing-hero-h1"
              className="font-black tracking-tight text-white text-[clamp(2.2rem,7vw,4rem)] leading-[1.06]"
            >
              Movies that match <span className="text-brand-100">how you feel</span>
            </h1>

            <p className="mt-4 text-white/80 text-[clamp(1rem,2.8vw,1.25rem)] leading-relaxed">
              Browse smarter, build your watchlist, and keep track of what you’ve loved — all in a clean, fast, and beautiful experience.
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
            </div>

            {/* CTAs */}
            <div className="mt-6 flex flex-col gap-3 sm:mt-7 sm:flex-row sm:items-center">
              <Link
                to="/auth/sign-up"
                className="inline-flex h-11 items-center justify-center rounded-full px-6 text-[clamp(1rem,3vw,0.95rem)] font-semibold text-white shadow-lift transition-transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-brand/60 bg-gradient-to-r from-[#fe9245] to-[#eb423b]"
              >
                Get started
              </Link>
              <Link
                to="/auth/sign-in"
                className="inline-flex h-11 items-center justify-center rounded-full border border-white/25 px-5 text-[clamp(.95rem,2.8vw,0.9rem)] font-semibold text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-brand/60"
              >
                Sign in
              </Link>
            </div>

            {/* Trust microcopy (replaces “No spam. No commitments.”) */}
            <p className="mt-2 text-sm text-white/60">{microcopy}</p>
          </div>

          {/* RIGHT: 3×3 poster mosaic (hidden on small, shown ≥lg) */}
          <div className="relative hidden lg:block">
            {/* Frame */}
            <div className="rounded-[28px] border border-white/10 bg-white/5 p-3 shadow-[0_20px_60px_rgba(0,0,0,.35),inset_0_0_0_1px_rgba(255,255,255,.06)]">
              <PosterMosaic
                items={tiles}
                loading={loading}
                onClick={(id) => navigate(`/movie/${id}`)}
              />
            </div>
            <p className="mt-3 text-right text-xs text-white/50">
              Screens are illustrative. TMDb data used under license.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

/* --------------------------- PosterMosaic --------------------------- */
function PosterMosaic({ items, loading, onClick }) {
  // fixed 3×3 grid, posters keep 2:3 ratio to avoid CLS
  return (
    <div
      className="grid grid-cols-3 gap-3"
      role="list"
      aria-label="Featured movies"
    >
      {items.map((m, i) => {
        const src = TMDB_IMG(m?.poster_path)
        return (
          <div key={m?.id ?? `ph-${i}`} role="listitem">
            {src ? (
              <button
                onClick={() => onClick?.(m.id)}
                className="group block overflow-hidden rounded-xl border border-white/10 bg-white/5"
                title={m?.title || m?.name || 'Details'}
              >
                <img
                  src={src}
                  alt={m?.title || m?.name || 'Movie poster'}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                  style={{ aspectRatio: '2 / 3' }}
                />
              </button>
            ) : (
              <div
                className={`aspect-[2/3] rounded-xl border border-white/10 ${loading ? 'animate-pulse bg-white/10' : 'bg-white/5'}`}
                aria-hidden
              />
            )}
          </div>
        )
      })}
    </div>
  )
}