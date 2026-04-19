import { useParams, useNavigate } from 'react-router-dom'
import { useEffect, useState, useMemo } from 'react'
import { supabase } from '@/shared/lib/supabase/client'
import { usePageMeta } from '@/shared/hooks/usePageMeta'
import MovieCardRating from '@/shared/components/MovieCardRating'
import { ChevronLeft } from 'lucide-react'

import { CURATED_LISTS } from './curatedListsConfig'

// === MOVIE TILE ===

function MovieTile({ movie, onClick }) {
  return (
    <button
      onClick={onClick}
      className="group text-left rounded-xl overflow-hidden bg-white/[0.02] border border-white/8 hover:border-white/20 transition-all"
    >
      <div className="relative aspect-[2/3]">
        <img
          src={`https://image.tmdb.org/t/p/w342${movie.poster_path}`}
          alt={movie.title}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-2 right-2">
          <MovieCardRating movie={movie} size="sm" showGenreBadge />
        </div>
      </div>
      <div className="p-3">
        <p className="text-sm font-bold text-white line-clamp-1">{movie.title}</p>
        <p className="text-xs text-white/40 mt-0.5">{movie.release_year}</p>
      </div>
    </button>
  )
}

// === PAGE ===

export default function CuratedListPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [movies, setMovies] = useState([])
  const [loading, setLoading] = useState(true)

  const list = useMemo(() => CURATED_LISTS.find(l => l.slug === slug), [slug])
  usePageMeta({ title: `${list?.title || 'List'} · FeelFlick` })

  useEffect(() => {
    if (!list) { setLoading(false); return }
    let cancelled = false
    setLoading(true)
    list.query(supabase).then(({ data }) => {
      if (cancelled) return
      setMovies(data || [])
      setLoading(false)
    })
    return () => { cancelled = true }
  }, [list])

  if (!list) {
    return <div className="min-h-screen flex items-center justify-center text-white/40">List not found</div>
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <button
          onClick={() => navigate(-1)}
          aria-label="Go back"
          className="inline-flex items-center gap-1.5 text-sm text-white/60 hover:text-white mb-6"
        >
          <ChevronLeft className="h-4 w-4" /> Back
        </button>

        <div className="mb-8">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-purple-300/80 mb-2">Curated List</p>
          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight mb-3">{list.title}</h1>
          <p className="text-white/60 max-w-2xl">{list.description}</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="aspect-[2/3] rounded-xl bg-white/[0.04] animate-pulse" />
            ))}
          </div>
        ) : movies.length === 0 ? (
          <p className="text-white/40 py-20 text-center">No films match this list yet.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {movies.map(m => (
              <MovieTile key={m.id} movie={m} onClick={() => navigate(`/movie/${m.tmdb_id}`)} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
