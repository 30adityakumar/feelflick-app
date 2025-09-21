import { useEffect, useMemo, useRef, useState } from "react"
import { useNavigate, Link } from "react-router-dom"

/* --------------------------- TMDb helpers --------------------------- */
const tmdbImg = (path, size = "w500") =>
  path ? `https://image.tmdb.org/t/p/${size}${path}` : null

const srcSetFor = (path) =>
  path
    ? `${tmdbImg(path, "w342")} 342w, ${tmdbImg(path, "w500")} 500w, ${tmdbImg(
        path,
        "w780"
      )} 780w, ${tmdbImg(path, "w1280")} 1280w`
    : undefined

/* ------------------------------------------------------------------- */
export default function TrendingToday({ variant = "landing" }) {
  const navigate = useNavigate()

  const token = import.meta.env.VITE_TMDB_API_KEY
  const isBearer = useMemo(() => !!token && token.includes("."), [token])

  const buildUrl = (path, params = {}) => {
    const url = new URL(`https://api.themoviedb.org/3${path}`)
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
    if (!isBearer && token) url.searchParams.set("api_key", token)
    return url.toString()
  }
  const headers = isBearer
    ? { Authorization: `Bearer ${token}`, accept: "application/json" }
    : { accept: "application/json" }

  const maxItems = variant === "landing" ? 12 : 18
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState(false)
  const railRef = useRef(null)
  const sectionRef = useRef(null)

  // Fetch only when in view
  useEffect(() => {
    const cached = sessionStorage.getItem("ff:trending:day:v1")
    if (cached) {
      try {
        const parsed = JSON.parse(cached)
        if (Array.isArray(parsed) && parsed.length) {
          setItems(parsed)
          setLoading(false)
        }
      } catch {}
    }

    if (!token) { setLoading(false); return }

    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return
        fetchTrending()
        io.disconnect()
      },
      { threshold: 0.2 }
    )
    if (sectionRef.current) io.observe(sectionRef.current)
    return () => io.disconnect()

    async function fetchTrending() {
      try {
        setLoading(true)
        setErr(false)
        // try day trending; fall back to top_rated if empty
        const r = await fetch(buildUrl("/trending/movie/day", { language: "en-US" }), { headers })
        const j = r.ok ? await r.json() : { results: [] }
        let list = (j.results || []).filter(m => m.poster_path).slice(0, maxItems)
        if (!list.length) {
          const t = await fetch(buildUrl("/movie/top_rated", { language: "en-US", page: "1" }), { headers })
          const tj = t.ok ? await t.json() : { results: [] }
          list = (tj.results || []).filter(m => m.poster_path).slice(0, maxItems)
        }
        setItems(list)
        sessionStorage.setItem("ff:trending:day:v1", JSON.stringify(list))
      } catch {
        setErr(true)
      } finally {
        setLoading(false)
      }
    }
  }, [token, isBearer, maxItems])

  const titleSize =
    variant === "landing"
      ? "text-xl sm:text-2xl"
      : "text-2xl sm:text-3xl"

  return (
    <section ref={sectionRef} className="relative">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="mb-3 flex items-end justify-between gap-3">
          <h2 className={`font-extrabold tracking-tight text-white ${titleSize}`}>
            Trending today
          </h2>

          {/* Thin "See all" only on landing; full nav lives in app */}
          {variant === "landing" && (
            <Link
              to="/trending"
              className="hidden text-sm font-semibold text-white/80 hover:text-white sm:inline"
            >
              See all →
            </Link>
          )}
        </div>

        {/* Rail */}
        <div className="relative">
          {/* gradient edges on desktop */}
          <div className="pointer-events-none absolute inset-y-0 left-0 hidden w-10 bg-gradient-to-r from-neutral-950 to-transparent md:block" />
          <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-10 bg-gradient-to-l from-neutral-950 to-transparent md:block" />

          <div
            ref={railRef}
            role="region"
            aria-label="Trending movies"
            className="scrollbar-none flex snap-x snap-mandatory overflow-x-auto gap-3 pb-2 md:gap-3.5"
          >
            {loading && (
              <>
                {Array.from({ length: 8 }).map((_, i) => (
                  <SkeletonPoster key={`sk-${i}`} />
                ))}
              </>
            )}

            {!loading &&
              items.map((m) => (
                <PosterCard
                  key={m.id}
                  movie={m}
                  onClick={() => navigate(`/movie/${m.id}`)}
                  variant={variant}
                />
              ))}

            {!loading && !items.length && (
              <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-5 text-sm text-white/75">
                {err || !token
                  ? "Sign in to explore trending picks."
                  : "No trending titles found right now."}
              </div>
            )}
          </div>

          {/* Arrow controls (desktop only) */}
          <RailButtons targetRef={railRef} />
        </div>
      </div>
    </section>
  )
}

/* ----------------------------- UI pieces ----------------------------- */

function PosterCard({ movie, onClick, variant }) {
  const w = variant === "landing" ? "w-36 sm:w-40 md:w-44 lg:w-48" : "w-40 sm:w-44 md:w-48 lg:w-52"
  const year = (movie.release_date || movie.first_air_date || "").slice(0, 4)
  const rating = Math.round((movie.vote_average || 0) * 10) / 10

  return (
    <button
      onClick={onClick}
      className={`group relative snap-start shrink-0 ${w} overflow-hidden rounded-xl bg-white/5 ring-1 ring-white/10 transition-transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-brand/60`}
      aria-label={movie.title || movie.name}
    >
      {/* poster */}
      <div className="relative aspect-[2/3] w-full">
        <img
          src={tmdbImg(movie.poster_path, "w500")}
          srcSet={srcSetFor(movie.poster_path)}
          sizes="(min-width: 1024px) 208px, (min-width: 768px) 176px, 144px"
          alt={movie.title || movie.name}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover"
        />
        {/* top vignette */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/70 to-transparent" />
        {/* bottom meta strip */}
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-2 text-xs text-white/90">
          <div className="truncate font-medium">{movie.title || movie.name}</div>
          <div className="shrink-0 rounded-md bg-black/60 px-1.5 py-0.5 text-[11px]">
            {year || "—"}
          </div>
        </div>
        {/* rating chip */}
        <div className="absolute left-2 top-2 rounded-md bg-black/70 px-1.5 py-0.5 text-[11px] font-semibold text-white/90">
          ★ {rating.toFixed(1)}
        </div>
      </div>
    </button>
  )
}

function SkeletonPoster() {
  return (
    <div className="snap-start w-36 sm:w-40 md:w-44 lg:w-48">
      <div className="aspect-[2/3] w-full animate-pulse rounded-xl bg-white/10" />
    </div>
  )
}

function RailButtons({ targetRef }) {
  // only show on md+
  return (
    <>
      <button
        type="button"
        aria-label="Scroll left"
        onClick={() => scrollBy(targetRef, -1)}
        className="absolute left-1 top-1/2 hidden -translate-y-1/2 rounded-full border border-white/15 bg-black/40 p-2 text-white shadow-md backdrop-blur md:block"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
      </button>
      <button
        type="button"
        aria-label="Scroll right"
        onClick={() => scrollBy(targetRef, 1)}
        className="absolute right-1 top-1/2 hidden -translate-y-1/2 rounded-full border border-white/15 bg-black/40 p-2 text-white shadow-md backdrop-blur md:block"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
      </button>
    </>
  )
}

function scrollBy(ref, dir = 1) {
  const el = ref.current
  if (!el) return
  const card = el.querySelector(":scope > *")
  const delta = card ? card.getBoundingClientRect().width + 12 : 240
  el.scrollBy({ left: dir * delta * 3, behavior: "smooth" })
}