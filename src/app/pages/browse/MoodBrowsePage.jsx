import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/shared/lib/supabase/client'
import { usePageMeta } from '@/shared/hooks/usePageMeta'
import MovieCardRating from '@/shared/components/MovieCardRating'
import { ChevronLeft } from 'lucide-react'
import Button from '@/shared/ui/Button'

const SORT_OPTIONS = [
  { value: 'audience', label: 'Highest rated', orderCol: 'ff_audience_rating', orderDir: 'desc' },
  { value: 'critic', label: 'Critics love it', orderCol: 'ff_critic_rating', orderDir: 'desc' },
  { value: 'recent', label: 'Recently released', orderCol: 'release_date', orderDir: 'desc' },
  { value: 'hidden', label: 'Hidden gems', orderCol: 'ff_rating_genre_normalized', orderDir: 'desc' },
]

const PAGE_SIZE = 40

function useBrowseSpec() {
  const params = useParams()
  const { pathname } = useLocation()
  return useMemo(() => {
    if (pathname.startsWith('/mood/')) return { kind: 'mood', value: params.tag, column: 'mood_tags', isArray: true }
    if (pathname.startsWith('/tone/')) return { kind: 'tone', value: params.tag, column: 'tone_tags', isArray: true }
    if (pathname.startsWith('/browse/fit/')) return { kind: 'fit', value: params.profile, column: 'fit_profile', isArray: false }
    return null
  }, [pathname, params.tag, params.profile])
}

function formatTitle(spec) {
  const v = spec.value.replace(/_/g, ' ')
  if (spec.kind === 'mood') return `${v} films`
  if (spec.kind === 'tone') return `${v} films`
  return v
}

function describe(spec) {
  if (spec.kind === 'mood') return `Films that feel ${spec.value.replace(/_/g, ' ')}.`
  if (spec.kind === 'tone') return `Films with a ${spec.value.replace(/_/g, ' ')} tone.`
  return 'Films matching this profile.'
}

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
          <MovieCardRating movie={movie} showGenreBadge size="sm" />
        </div>
      </div>
      <div className="p-3">
        <p className="text-sm font-bold text-white line-clamp-1">{movie.title}</p>
        <p className="text-xs text-white/40 mt-0.5">
          {movie.release_year}{movie.runtime ? ` · ${movie.runtime}m` : ''}
        </p>
      </div>
    </button>
  )
}

// === PAGE ===

export default function MoodBrowsePage() {
  const navigate = useNavigate()
  const spec = useBrowseSpec()
  const [sort, setSort] = useState('audience')
  const [movies, setMovies] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)

  const title = spec ? formatTitle(spec) : 'Browse'
  usePageMeta({ title: `${title} · FeelFlick` })

  useEffect(() => {
    setPage(0)
    setMovies([])
    setHasMore(true)
  }, [spec?.value, sort])

  useEffect(() => {
    if (!spec) return
    let cancelled = false
    setLoading(true)

    const sortOpt = SORT_OPTIONS.find(s => s.value === sort) || SORT_OPTIONS[0]
    const from = page * PAGE_SIZE
    const to = from + PAGE_SIZE - 1

    let query = supabase
      .from('movies')
      .select(`
        id, tmdb_id, title, poster_path, release_year, runtime, primary_genre,
        ff_audience_rating, ff_audience_confidence,
        ff_critic_rating, ff_critic_confidence,
        ff_rating_genre_normalized, mood_tags, tone_tags, fit_profile
      `)
      .eq('is_valid', true)
      .not('poster_path', 'is', null)
      .gte('ff_audience_confidence', 50)

    if (spec.isArray) {
      query = query.contains(spec.column, [spec.value])
    } else {
      query = query.eq(spec.column, spec.value)
    }

    query = query
      .order(sortOpt.orderCol, { ascending: sortOpt.orderDir === 'asc', nullsFirst: false })
      .range(from, to)

    query.then(({ data, error }) => {
      if (cancelled) return
      if (error) { setLoading(false); return }
      setMovies(prev => page === 0 ? (data || []) : [...prev, ...(data || [])])
      setHasMore((data || []).length === PAGE_SIZE)
      setLoading(false)
    })

    return () => { cancelled = true }
  }, [spec, sort, page])

  if (!spec) return null

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-sm text-white/60 hover:text-white mb-6"
          aria-label="Go back"
        >
          <ChevronLeft className="h-4 w-4" /> Back
        </button>

        <div className="mb-8">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-white/40 mb-2">
            {spec.kind === 'fit' ? 'Fit Profile' : spec.kind === 'tone' ? 'Tone' : 'Mood'}
          </p>
          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight mb-3 capitalize">{spec.value.replace(/_/g, ' ')}</h1>
          <p className="text-white/60 max-w-2xl">{describe(spec)}</p>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {SORT_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setSort(opt.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                sort === opt.value
                  ? 'bg-white text-black'
                  : 'bg-white/[0.04] text-white/60 border border-white/10 hover:bg-white/[0.08]'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {loading && page === 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="aspect-[2/3] rounded-xl bg-white/[0.04] animate-pulse" />
            ))}
          </div>
        ) : movies.length === 0 ? (
          <p className="text-white/40 py-20 text-center">No films match this yet.</p>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {movies.map(m => (
                <MovieTile key={m.id} movie={m} onClick={() => navigate(`/movie/${m.tmdb_id}`)} />
              ))}
            </div>
            {hasMore && (
              <div className="mt-8 flex justify-center">
                <Button variant="secondary" onClick={() => setPage(p => p + 1)} disabled={loading}>
                  {loading ? 'Loading...' : 'Load more'}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
