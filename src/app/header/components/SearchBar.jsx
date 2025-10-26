// src/app/header/components/SearchBar.jsx
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, X } from 'lucide-react'

export default function SearchBar({ open, onClose }) {
  const nav = useNavigate()
  const inputRef = useRef(null)
  const [q, setQ] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const TMDB_KEY = import.meta.env.VITE_TMDB_API_KEY

  // Focus when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 10)
    } else {
      setQ('')
      setResults([])
      setLoading(false)
    }
  }, [open])

  // Escape to close
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose?.() }
    if (open) document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  useEffect(() => {
    let active = true
    if (!open) return
    if (!q || !TMDB_KEY) { setResults([]); return }

    const t = setTimeout(async () => {
      try {
        setLoading(true)
        const r = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${TMDB_KEY}&query=${encodeURIComponent(q)}`)
        const j = await r.json()
        if (!active) return
        const list = (j?.results || []).slice(0, 8)
        setResults(list)
      } finally {
        if (active) setLoading(false)
      }
    }, 200)

    return () => { active = false; clearTimeout(t) }
  }, [q, TMDB_KEY, open])

  const goMovie = (id) => {
    onClose?.()
    nav(`/movie/${id}`)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60]">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      {/* Desktop panel / Mobile full-screen */}
      <div className="absolute left-1/2 top-8 w-[min(92vw,720px)] -translate-x-1/2 md:top-24">
        <div className="rounded-2xl border border-white/10 bg-black/80 p-3 shadow-2xl">
          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
            <Search className="h-4 w-4 text-white/70" />
            <input
              ref={inputRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search movies…"
              className="w-full bg-transparent text-[0.95rem] text-white placeholder-white/50 focus:outline-none"
            />
            <button onClick={onClose} aria-label="Close" className="inline-flex h-8 w-8 items-center justify-center rounded-md text-white/80 hover:bg-white/10 focus:outline-none">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-2 max-h-[60vh] overflow-y-auto">
            {loading && <div className="p-3 text-white/60 text-sm">Searching…</div>}
            {!loading && results.length === 0 && q && (
              <div className="p-3 text-white/60 text-sm">No results for “{q}”.</div>
            )}
            <ul className="divide-y divide-white/10">
              {results.map((m) => (
                <li key={m.id}>
                  <button
                    className="flex w-full items-center gap-3 p-2 hover:bg-white/5 focus:outline-none rounded-lg"
                    onClick={() => goMovie(m.id)}
                  >
                    <img
                      src={m.poster_path ? `https://image.tmdb.org/t/p/w92${m.poster_path}` : 'https://dummyimage.com/80x120/1f2937/ffffff&text=No+Image'}
                      alt={m.title}
                      className="h-14 w-9 rounded-md object-cover"
                    />
                    <div className="text-left">
                      <div className="text-white text-[0.98rem] font-semibold leading-tight">{m.title}</div>
                      <div className="text-white/60 text-sm leading-tight">{m.release_date ? m.release_date.slice(0,4) : '—'}</div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Mobile fallback (centers panel lower if keyboard overlaps) */}
      <div className="md:hidden fixed inset-x-0 bottom-0 pointer-events-none" />
    </div>
  )
}