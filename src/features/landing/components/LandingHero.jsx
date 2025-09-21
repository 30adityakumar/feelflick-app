import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

/**
 * Landing hero
 * - Keeps your existing collage background via `.feelflick-landing-bg`
 * - Right-side "device" shows a 3x3 poster grid:
 *    row1 = top rated, row2 = popular, row3 = hidden gems (high rating, low votes)
 * - If TMDb key is missing, we show tasteful skeletons (no errors).
 */

const TMDB_IMG = (path, size = 'w342') =>
  path ? `https://image.tmdb.org/t/p/${size}${path}` : null // TMDb image basics

export default function LandingHero() {
  const navigate = useNavigate()
  const [sections, setSections] = useState({
    topRated: [],
    popular: [],
    gems: [],
  })
  const [loading, setLoading] = useState(true)

  // Use the same env var you've been using elsewhere. It should be a v4 Bearer token.
  const tmdbToken = import.meta.env.VITE_TMDB_API_KEY

  useEffect(() => {
    let cancelled = false
    async function run() {
      if (!tmdbToken) {
        setLoading(false)
        return
      }
      setLoading(true)
      try {
        const headers = { Authorization: `Bearer ${tmdbToken}`, accept: 'application/json' }

        // Fetch in parallel
        const [topRated, popular, gems] = await Promise.all([
          fetch(`https://api.themoviedb.org/3/movie/top_rated?language=en-US&page=1`, { headers }).then(r => r.json()).catch(() => ({ results: [] })),
          fetch(`https://api.themoviedb.org/3/movie/popular?language=en-US&page=1`, { headers }).then(r => r.json()).catch(() => ({ results: [] })),
          // "Hidden gems": well-rated but not ultra-voted (tweak thresholds as you like)
          fetch(`https://api.themoviedb.org/3/discover/movie?language=en-US&sort_by=vote_average.desc&vote_average.gte=7.2&vote_count.lte=600&with_original_language=en&page=1`, { headers })
            .then(r => r.json())
            .catch(() => ({ results: [] })),
        ])

        if (cancelled) return
        setSections({
          topRated: (topRated?.results ?? []).slice(0, 3),
          popular:  (popular?.results ?? []).slice(0, 3),
          gems:     (gems?.results ?? []).slice(0, 3),
        })
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    run()
    return () => { cancelled = true }
  }, [tmdbToken])

  const posters = useMemo(() => {
    const { topRated, popular, gems } = sections
    // fill in order: 3 + 3 + 3, fallback to whatever we have
    const joined = [...topRated, ...popular, ...gems].slice(0, 9)
    return joined
  }, [sections])

  return (
    <section className="relative isolate overflow-hidden" aria-labelledby="landing-hero-h1">
      {/* Background you already ship */}
      <div aria-hidden className="feelflick-landing-bg" />
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-br from-black/75 via-black/55 to-black/20" />

      <div className="relative mx-auto max-w-7xl px-4 pt-28 pb-16 sm:pt-32 sm:pb-24 md:px-6 lg:pt-36 lg:pb-28">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          {/* Left copy */}
          <div className="cq max-w-3xl">
            <h1
              id="landing-hero-h1"
              className="font-black tracking-tight text-white text-[clamp(2.2rem,7vw,4rem)] leading-[1.06]"
            >
              Movies that match
              <br />
              <span className="text-brand-100">how you feel</span>
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

            {/* Microcopy (replaces "No spam. No commitments.") */}
            <p className="mt-3 text-sm text-white/60">
              Start browsing in seconds. Create an account only if you want to save your picks.
            </p>
          </div>

          {/* Right "device" with 3x3 posters */}
          <div className="relative">
            <div className="rounded-[2rem] border border-white/10 bg-black/30 p-3 shadow-[0_20px_60px_rgba(0,0,0,0.45)] backdrop-blur-sm">
              <div className="rounded-[1.6rem] border border-white/10 bg-[#111317] p-2">
                <div className="grid grid-cols-3 gap-2 p-1">
                  {(loading ? Array.from({ length: 9 }) : posters).map((m, i) => {
                    if (loading) {
                      return (
                        <div
                          key={i}
                          className="aspect-[2/3] w-full animate-pulse rounded-xl bg-white/10"
                          aria-hidden
                        />
                      )
                    }
                    const src = TMDB_IMG(m?.poster_path, 'w342')
                    return (
                      <button
                        key={m.id ?? i}
                        className="group overflow-hidden rounded-xl border border-white/10 bg-white/5"
                        title={m?.title || m?.name}
                        onClick={() => m?.id && navigate(`/movie/${m.id}`)}
                      >
                        {src ? (
                          <img
                            src={src}
                            alt={m?.title || m?.name || 'Movie poster'}
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
            </div>

            {/* Footnote */}
            <p className="mt-3 text-center text-xs text-white/50">
              Screens are illustrative. TMDb data used under license.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}