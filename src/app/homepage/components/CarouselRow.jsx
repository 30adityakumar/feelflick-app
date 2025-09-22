import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const tmdbImg = (p, size='w342') => p ? `https://image.tmdb.org/t/p/${size}${p}` : null

export default function CarouselRow({ title, endpoint='popular' }) {
  const token = import.meta.env.VITE_TMDB_API_KEY
  const isBearer = useMemo(() => !!token && token.includes('.'), [token])

  const buildUrl = (path, params={}) => {
    const url = new URL(`https://api.themoviedb.org/3${path}`)
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v))
    if (!isBearer && token) url.searchParams.set('api_key', token)
    return url.toString()
  }
  const headers = isBearer ? { Authorization: `Bearer ${token}`, accept: 'application/json' } : { accept: 'application/json' }

  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState(null)

  useEffect(() => {
    let cancelled = false
    const ctrl = new AbortController()
    async function run() {
      setLoading(true); setErr(null)
      try {
        if (!token) throw new Error('Missing TMDb key')
        const r = await fetch(buildUrl(`/movie/${endpoint}`, { language: 'en-US', page: 1, region: 'US' }), { headers, signal: ctrl.signal })
        if (!r.ok) throw new Error(`TMDb ${r.status}`)
        const j = await r.json()
        const list = Array.isArray(j?.results) ? j.results.filter(Boolean) : []
        if (!cancelled) setItems(list)
      } catch (e) {
        if (!cancelled && e.name !== 'AbortError') setErr(e.message || 'Failed to load')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    run()
    return () => { cancelled = true; ctrl.abort() }
  }, [endpoint, isBearer, token])

  const ref = useRef(null)
  const scrollBy = (dx) => { const el = ref.current; if (el && typeof el.scrollBy === 'function') el.scrollBy({ left: dx, behavior: 'smooth' }) }

  return (
    <section className="px-3 md:px-0">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-white font-semibold text-lg md:text-xl">{title}</h2>
        <div className="hidden md:flex items-center gap-2">
          <button onClick={() => scrollBy(-420)} className="h-8 w-8 grid place-items-center rounded-md border border-white/10 bg-white/5 text-white/80 hover:bg-white/10" aria-label="Left"><ChevronLeft className="h-4 w-4"/></button>
          <button onClick={() => scrollBy(420)}  className="h-8 w-8 grid place-items-center rounded-md border border-white/10 bg-white/5 text-white/80 hover:bg-white/10"  aria-label="Right"><ChevronRight className="h-4 w-4"/></button>
        </div>
      </div>

      <div ref={ref} className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory hide-scrollbar">
        <style>{`.hide-scrollbar::-webkit-scrollbar{display:none}`}</style>

        {loading && Array.from({length:8}).map((_,i)=>
          <div key={i} className="snap-start w-[140px] sm:w-[160px] md:w-[180px] aspect-[2/3] rounded-xl bg-white/5 border border-white/10 animate-pulse" />
        )}

        {!loading && err && (
          <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-rose-300/90">{err}</div>
        )}

        {!loading && !err && items.map(m => {
          const poster = tmdbImg(m.poster_path || m.backdrop_path, 'w342')
          return (
            <a key={m.id} href={`/movie/${m.id}`} className="snap-start shrink-0 group relative w-[140px] sm:w-[160px] md:w-[180px] aspect-[2/3] overflow-hidden rounded-xl border border-white/10 bg-white/5">
              {poster ? (
                <img src={poster} alt={m.title || m.name || 'Poster'} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" loading="lazy" decoding="async" />
              ) : (
                <div className="grid h-full w-full place-items-center text-xs text-white/60">No image</div>
              )}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                <div className="truncate text-[13px] font-semibold text-white/95">{m.title || m.name}</div>
                <div className="text-[11px] text-white/60">{(m.release_date || '').slice(0,4)}</div>
              </div>
            </a>
          )
        })}
      </div>
    </section>
  )
}