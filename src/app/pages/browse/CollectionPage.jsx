import { useParams, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from '@/shared/lib/supabase/client'
import { usePageMeta } from '@/shared/hooks/usePageMeta'
import MovieCardRating from '@/shared/components/MovieCardRating'
import { ChevronLeft } from 'lucide-react'

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
          <MovieCardRating movie={movie} size="sm" />
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

export default function CollectionPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [movies, setMovies] = useState([])
  const [collectionName, setCollectionName] = useState('')
  const [loading, setLoading] = useState(true)

  usePageMeta({ title: `${collectionName || 'Collection'} · FeelFlick` })

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    supabase
      .from('movies')
      .select(`
        id, tmdb_id, title, poster_path, release_year, release_date, runtime, primary_genre,
        collection_name, collection_id,
        ff_audience_rating, ff_audience_confidence,
        ff_critic_rating, ff_critic_confidence,
        ff_rating_genre_normalized
      `)
      .eq('collection_id', parseInt(id, 10))
      .eq('is_valid', true)
      .not('poster_path', 'is', null)
      .order('release_date', { ascending: true, nullsFirst: false })
      .then(({ data }) => {
        if (cancelled) return
        setMovies(data || [])
        setCollectionName(data?.[0]?.collection_name || 'Collection')
        setLoading(false)
      })
    return () => { cancelled = true }
  }, [id])

  const ratedMovies = movies.filter(m => m.ff_audience_rating != null)
  const avgRating = ratedMovies.length > 0
    ? Math.round(ratedMovies.reduce((s, m) => s + m.ff_audience_rating, 0) / ratedMovies.length)
    : null

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <button
          onClick={() => navigate(-1)}
          aria-label="Go back"
          className="inline-flex items-center gap-1.5 text-sm text-white/50 hover:text-white mb-6"
        >
          <ChevronLeft className="h-4 w-4" /> Back
        </button>

        <div className="mb-8">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-white/40 mb-2">Collection</p>
          <h1 className="text-4xl sm:text-5xl font-black text-white mb-3">{collectionName}</h1>
          <p className="text-white/55">
            {movies.length} {movies.length === 1 ? 'film' : 'films'}
            {avgRating != null && <> · Avg audience rating {avgRating}/100</>}
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="aspect-[2/3] rounded-xl bg-white/[0.04] animate-pulse" />
            ))}
          </div>
        ) : movies.length === 0 ? (
          <p className="text-white/40 py-20 text-center">Collection not found.</p>
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
