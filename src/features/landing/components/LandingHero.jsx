import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

const TMDB_IMG = (path, size = 'w342') =>
  path ? `https://image.tmdb.org/t/p/${size}${path}` : null

export default function LandingHero() {
  const navigate = useNavigate()
  const [gridMovies, setGridMovies] = useState([])
  const [loading, setLoading] = useState(false)
  const [errored, setErrored] = useState(false)

  // ------- TMDb client: supports v3 key OR v4 bearer token -------
  const tmdbToken = import.meta.env.VITE_TMDB_API_KEY
  const isBearer = useMemo(() => {
    // crude but reliable: Bearer tokens are long JWTs containing "."
    return !!tmdbToken && tmdbToken.includes('.')
  }, [tmdbToken])

  function buildUrl(path, params = {}) {
    const url = new URL(`https://api.themoviedb.org/3${path}`)
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
    if (!isBearer && tmdbToken) url.searchParams.set('api_key', tmdbToken) // v3
    return url.toString()
  }

  function buildHeaders() {
    return isBearer
      ? { Authorization: `Bearer ${tmdbToken}`, accept: 'application/json' }
      : { accept: 'application/json' }
  }

  // ------- Fetch 3x (TopRated, Popular, HiddenGems) and compose 9 -------
  useEffect(() => {
    let cancelled = false
    async function run() {
      if (!tmdbToken) return // show placeholders if not configured
      setLoading(true)
      setErrored(false)
      try {
        const [topRes, popRes, gemRes] = await Promise.all([
          fetch(
            buildUrl('/movie/top_rated', { language: 'en-US', page: '1' }),
            { headers: buildHeaders() }
          ),
          fetch(
            buildUrl('/movie/popular', { language: 'en-US', page: '1' }),
            { headers: buildHeaders() }
          ),
          fetch(
            buildUrl('/discover/movie', {
              // “Hidden gems”: great rating with fewer votes
              sort_by: 'vote_average.desc',
              'vote_average.gte': '7.4',
              'vote_count.lte': '1200',
              'vote_count.gte': '80',
              include_adult: 'false',
              language: 'en-US',
              page: '1',
            }),
            { headers: buildHeaders() }
          ),
        ])

        const [top, pop, gem] = await Promise.all([
          topRes.ok ? topRes.json() : { results: [] },
          popRes.ok ? popRes.json() : { results: [] },
          gemRes.ok ? gemRes.json() : { results: [] },
        ])

        const pick = (arr, n) =>
          (Array.isArray(arr) ? arr : []).filter(Boolean).slice(0, n)

        // Compose 3 + 3 + 3 (dedup by id)
        const chosen = [...pick(top.results, 5), ...pick(pop.results, 5), ...pick(gem.results, 5)]
          .filter(Boolean)
          .reduce((acc, m) => {
            if (!acc.some((x) => x.id === m.id) && m.poster_path) acc.push(m)
            return acc
          }, [])
          .slice(0, 9)

        if (!cancelled) setGridMovies(chosen)
      } catch {
        if (!cancelled) setErrored(true)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [tmdbToken, isBearer])

  // ------- UI -------
  return (
    <section className="relative isolate overflow-hidden" aria-labelledby="landing-hero-h1">
      {/* Background you already ship */}
      <div aria-hidden className="feelflick-landing-bg" />
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-br from-black/75 via-black/55 to-black/20" />

      <div className="relative mx-auto max-w-7xl px-4 pt-28 pb-16 sm:pt-32 sm:pb-24 md:px-6 lg:pt-36 lg:pb-28">
        {/* 2-col on lg+, stacked on mobile */}
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
          {/* Left: copy + CTAs (keep your look) */}
          <div className="cq max-w-3xl">
            <h1
              id="landing-hero-h1"
              className="font-black tracking-tight text-white text-[clamp(2.3rem,7.2vw,4.2rem)] leading-[1.02]"
            >
              Movies that match <br className="hidden sm:block" />
              how <span className="text-brand-100">you feel</span>
            </h1>

            <p className="mt-4 text-white/80 text-[clamp(1rem,2.8vw,1.25rem)] leading-relaxed">
              Browse smarter, build your watchlist, and keep track of what you’ve loved — all in a clean, fast, and beautiful experience.
            </p>

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

            {/* Small line under CTAs (updated) */}
            <p className="mt-3 text-white/70 text-sm sm:text-base">
              <span className="align-middle">Your mood, your movie. Nothing else.</span>
            </p>
          </div>

          {/* Right: framed 3×3 poster grid */}
          <div className="relative">
            <div className="rounded-[20px] border border-white/10 bg-black/20 p-2 shadow-2xl backdrop-blur-sm md:p-3">
              <div className="rounded-[16px] border border-white/10 bg-neutral-900/60 p-2 md:p-3">
                <div className="grid grid-cols-3 gap-2 md:gap-3 lg:gap-3">
                  {(loading || !tmdbToken || errored || gridMovies.length === 0) &&
                    Array.from({ length: 9 }).map((_, i) => (
                      <div
                        key={`ph-${i}`}
                        className="aspect-[2/3] animate-pulse rounded-[12px] bg-white/10"
                      />
                    ))}

                  {gridMovies.length > 0 &&
                    gridMovies.map((m) => {
                      const src = TMDB_IMG(m.poster_path, 'w342')
                      return (
                        <button
                          key={m.id}
                          onClick={() => navigate(`/movie/${m.id}`)}
                          className="group overflow-hidden rounded-[12px] border border-white/10 bg-white/5"
                          title={m.title || m.name}
                        >
                          {src ? (
                            <img
                              src={src}
                              alt={m.title || m.name}
                              loading="lazy"
                              decoding="async"
                              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
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
            </div>

            <p className="mt-3 text-center text-xs text-white/45">
              Screens are illustrative. TMDb data used under license.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}