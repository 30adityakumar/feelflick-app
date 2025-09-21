import { useEffect, useMemo, useRef, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { ChevronLeft, ChevronRight, Flame, Star } from "lucide-react"

/** Build TMDb URLs (works with v3 key or v4 bearer token) */
const img = (path, size = "w500") => (path ? `https://image.tmdb.org/t/p/${size}${path}` : null)
const srcSet = (path) =>
  path
    ? `${img(path,"w342")} 342w, ${img(path,"w500")} 500w, ${img(path,"w780")} 780w, ${img(path,"w1280")} 1280w`
    : undefined

export default function TrendingToday({ limit = 12, title = "Trending today", cta = "See all trending →" }) {
  const nav = useNavigate()

  // token may be v3 or a v4 bearer
  const token = import.meta.env.VITE_TMDB_API_KEY
  const isBearer = useMemo(() => !!token && token.includes("."), [token])
  const buildUrl = (path, params = {}) => {
    const u = new URL(`https://api.themoviedb.org/3${path}`)
    Object.entries(params).forEach(([k, v]) => u.searchParams.set(k, v))
    if (!isBearer && token) u.searchParams.set("api_key", token)
    return u.toString()
  }
  const headers = isBearer
    ? { Authorization: `Bearer ${token}`, accept: "application/json" }
    : { accept: "application/json" }

  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)

  const railRef = useRef(null)

  useEffect(() => {
    let cancel = false
    async function run() {
      setLoading(true)
      try {
        if (!token) { setItems([]); return }
        const r = await fetch(buildUrl("/trending/movie/day", { language: "en-US", page: "1" }), { headers })
        const j = r.ok ? await r.json() : { results: [] }
        const list = (j.results || []).filter(m => m?.poster_path).slice(0, limit)
        if (!cancel) setItems(list)
      } finally {
        if (!cancel) setLoading(false)
      }
    }
    run()
    return () => { cancel = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, isBearer, limit])

  const scrollBy = (px) => railRef.current?.scrollBy({ left: px, behavior: "smooth" })

  return (
    <section className="relative">
      <div className="mx-auto max-w-7xl px-4 md:px-6 py-10 sm:py-14">
        {/* Section header */}
        <div className="mb-4 flex items-end justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-md bg-brand/20 text-brand">
              <Flame className="h-4 w-4" />
            </span>
            <h3 className="text-xl font-bold tracking-tight text-white sm:text-2xl">{title}</h3>
          </div>

          {/* Desktop arrows (keyboard accessible) */}
          <div className="hidden items-center gap-2 md:flex">
            <button
              className="rounded-full border border-white/15 p-2 text-white/80 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-brand/60"
              aria-label="Scroll left"
              onClick={() => scrollBy(-600)}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              className="rounded-full border border-white/15 p-2 text-white/80 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-brand/60"
              aria-label="Scroll right"
              onClick={() => scrollBy(600)}
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Posters rail */}
        <div
          ref={railRef}
          className="group relative -mx-4 overflow-x-auto px-4 [scrollbar-width:none] sm:[scrollbar-width:auto]"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          <ul className="flex snap-x snap-mandatory gap-3 pb-1">
            {(loading ? Array.from({ length: limit }) : items).map((m, i) => (
              <li key={m?.id ?? i} className="snap-start">
                <Card
                  loading={loading}
                  title={m?.title}
                  vote={m?.vote_average}
                  src={img(m?.poster_path)}
                  set={srcSet(m?.poster_path)}
                  onClick={() => m?.id && nav(`/movie/${m.id}`)}
                />
              </li>
            ))}
            {/* CTA tile at the end */}
            <li className="snap-start">
              <SeeAllTile label={cta} onClick={() => nav('/trending')} />
            </li>
          </ul>
        </div>
      </div>
    </section>
  )
}

/* ------------------------------ Small pieces ------------------------------ */

function Card({ loading, title, vote, src, set, onClick }) {
  return (
    <div className="relative h-[200px] w-[140px] sm:h-[240px] sm:w-[168px]">
      <div className="group/card relative h-full w-full overflow-hidden rounded-xl bg-white/5 ring-1 ring-white/10">
        {/* image / skeleton */}
        {loading || !src ? (
          <div className="h-full w-full animate-pulse bg-white/10" />
        ) : (
          <img
            src={src}
            srcSet={set}
            sizes="(max-width: 640px) 40vw, 168px"
            alt={title || "Poster"}
            className="h-full w-full object-cover transition-transform duration-300 group-hover/card:scale-[1.03]"
            loading="lazy"
            decoding="async"
            onClick={onClick}
          />
        )}

        {/* bottom caption */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 rounded-b-xl bg-gradient-to-t from-black/70 to-transparent p-2">
          <div className="truncate text-[12px] font-medium text-white/95">{title || "—"}</div>
          {typeof vote === "number" && (
            <div className="mt-0.5 flex items-center gap-1 text-[11px] text-white/70">
              <Star className="h-3 w-3 text-amber-300" />
              <span>{vote.toFixed(1)}</span>
            </div>
          )}
        </div>

        {/* clickable layer */}
        <button
          onClick={onClick}
          className="absolute inset-0"
          aria-label={title ? `Open ${title}` : "Open movie"}
        />
      </div>
    </div>
  )
}

function SeeAllTile({ label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="grid h-[200px] w-[140px] place-items-center rounded-xl border border-dashed border-white/20 bg-white/5 text-center text-[12.5px] font-semibold text-white/85 transition hover:border-white/30 hover:bg-white/10 sm:h-[240px] sm:w-[168px]"
      aria-label={label}
    >
      {label}
    </button>
  )
}