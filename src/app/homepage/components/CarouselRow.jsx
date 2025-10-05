// src/app/homepage/components/CarouselRow.jsx
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const imgBase = 'https://image.tmdb.org/t/p/w342'

export default function CarouselRow({ title, endpoint = 'popular' }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const scrollerRef = useRef(null)
  const TMDB_KEY = import.meta.env.VITE_TMDB_API_KEY

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        setLoading(true); setError('')
        let url = ''
        if (endpoint === 'popular') url = `https://api.themoviedb.org/3/movie/popular?api_key=${TMDB_KEY}`
        else if (endpoint === 'top_rated') url = `https://api.themoviedb.org/3/movie/top_rated?api_key=${TMDB_KEY}`
        else if (endpoint === 'discover_for_you') {
          // light heuristic: trending/week
          url = `https://api.themoviedb.org/3/trending/movie/week?api_key=${TMDB_KEY}`
        } else {
          url = `https://api.themoviedb.org/3/movie/${endpoint}?api_key=${TMDB_KEY}`
        }

        const r = await fetch(url)
        const j = await r.json()
        if (!active) return
        setItems(j?.results?.filter(Boolean) || [])
      } catch (e) {
        if (!active) return
        setError('Failed to load')
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => { active = false }
  }, [TMDB_KEY, endpoint])

  const scrollByCards = (dir) => {
    const el = scrollerRef.current
    if (!el) return
    const cardW = 180 // approximate with gap
    el.scrollBy({ left: dir * cardW * 3, behavior: 'smooth' })
  }

  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-[1.1rem] font-bold tracking-tight text-white">{title}</h2>
        <div className="hidden gap-1 md:flex">
          <button
            type="button"
            onClick={() => scrollByCards(-1)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-white/10 bg-white/5 text-white/85 hover:bg-white/10 focus:outline-none"
            aria-label="Scroll left"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => scrollByCards(1)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-white/10 bg-white/5 text-white/85 hover:bg-white/10 focus:outline-none"
            aria-label="Scroll right"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div
        ref={scrollerRef}
        className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2"
      >
        {loading && <RowSkeleton />}
        {!loading && error && (
          <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/70">
            {error}
          </div>
        )}
        {!loading && !error && items.map((m) => (
          <Link
            key={m.id}
            to={`/movie/${m.id}`}
            className="group relative w-[150px] shrink-0 snap-start overflow-hidden rounded-2xl bg-white/[.04] ring-1 ring-white/10"
          >
            {m.poster_path ? (
              <img
                src={`${imgBase}${m.poster_path}`}
                alt={m.title}
                className="h-[225px] w-full object-cover transition-transform duration-200 group-hover:scale-[1.03]"
                loading="lazy"
              />
            ) : (
              <div className="h-[225px] w-full bg-[linear-gradient(135deg,#111827_0%,#0b1220_100%)]" />
            )}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/70 to-transparent" />
            <div className="absolute inset-x-2 bottom-2 line-clamp-2 text-[0.85rem] font-semibold text-white/95 drop-shadow">
              {m.title}
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}

function RowSkeleton() {
  const cards = new Array(8).fill(0)
  return (
    <>
      {cards.map((_, i) => (
        <div
          key={i}
          className="h-[225px] w-[150px] shrink-0 snap-start animate-pulse rounded-2xl bg-white/5 ring-1 ring-white/10"
        />
      ))}
    </>
  )
}