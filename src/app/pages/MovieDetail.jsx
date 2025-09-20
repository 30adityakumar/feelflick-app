import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import Spinner from '@/shared/ui/Spinner'
import ErrorState from '@/shared/ui/ErrorState'
import {
  backdropImg,
  getMovieCredits,
  getMovieDetails,
  getSimilarMovies,
  posterSrcSet,
  tmdbImg,
} from '@/shared/api/tmdb'
import { useAsync } from '@/shared/hooks/useAsync'

export default function MovieDetailPage() {
  const { id } = useParams()

  const detailsQ = useAsync()
  const creditsQ = useAsync()
  const similarQ = useAsync()

  useEffect(() => {
    if (!id) return
    detailsQ.run((signal) => getMovieDetails(id, { signal }))
    creditsQ.run((signal) => getMovieCredits(id, { signal }))
    similarQ.run((signal) => getSimilarMovies(id, { page: 1, signal }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const details = detailsQ.data
  const cast = creditsQ.data?.cast?.slice?.(0, 10) ?? []
  const similars = similarQ.data?.results?.slice?.(0, 10) ?? []

  /* ----------------------------- Loading state ----------------------------- */
  if (detailsQ.loading && !details) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner className="text-white/70" />
      </div>
    )
  }

  /* ------------------------------ Error state ------------------------------ */
  if (detailsQ.error) {
    return (
      <div className="p-4">
        <ErrorState
          title="Failed to load movie"
          detail={detailsQ.error?.message}
          onRetry={() => detailsQ.run((signal) => getMovieDetails(id, { signal }))}
        />
      </div>
    )
  }

  if (!details) return null

  /* --------------------------------- View --------------------------------- */
  return (
    <div className="min-h-[70vh] text-white">
      {/* Hero */}
      <div className="relative">
        <img
          alt=""
          src={backdropImg(details.backdrop_path, 'w1280')}
          loading="lazy"
          className="h-56 w-full object-cover opacity-40 sm:h-72 md:h-96"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />
        <div className="absolute inset-x-0 bottom-0 mx-auto flex max-w-6xl gap-4 px-4 pb-4 sm:gap-6 sm:pb-6">
          <img
            alt={details.title}
            src={tmdbImg(details.poster_path, 'w342')}
            srcSet={posterSrcSet(details.poster_path)}
            width="342"
            height="513"
            className="-mt-20 hidden aspect-[2/3] w-36 rounded-xl object-cover shadow-lg sm:block md:w-44"
          />
          <div className="mt-2">
            <h1 className="text-xl font-semibold sm:text-2xl md:text-3xl">{details.title}</h1>
            <div className="mt-1 text-sm text-white/80">
              {(details.release_date || '').slice(0, 4)} • {Number(details.runtime) || '—'} min
            </div>
            <div className="mt-2 flex flex-wrap gap-2 text-xs text-white/80">
              {details.genres?.map((g) => (
                <span key={g.id} className="rounded-full border border-white/20 px-2 py-0.5">
                  {g.name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="mx-auto max-w-6xl px-4 py-6">
        {details.overview ? (
          <p className="max-w-3xl text-sm leading-6 text-white/90">{details.overview}</p>
        ) : null}

        {/* Cast */}
        <section className="mt-8">
          <h2 className="mb-3 text-lg font-semibold">Top Cast</h2>
          {creditsQ.loading && !cast.length ? (
            <Spinner className="text-white/70" />
          ) : cast.length ? (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6">
              {cast.map((c) => (
                <li key={c.cast_id ?? `${c.id}-${c.credit_id}`} className="rounded-lg bg-white/5 p-3">
                  <div className="truncate text-sm">{c.name}</div>
                  <div className="truncate text-xs text-white/60">{c.character}</div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-sm text-white/60">Cast not available.</div>
          )}
        </section>

        {/* Similar */}
        <section className="mt-10">
          <h2 className="mb-3 text-lg font-semibold">Similar Movies</h2>
          {similarQ.loading && !similars.length ? (
            <Spinner className="text-white/70" />
          ) : similars.length ? (
            <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
              {similars.map((m) => (
                <li key={m.id} className="group">
                  <Link to={`/movie/${m.id}`} className="block">
                    <img
                      alt={m.title}
                      src={tmdbImg(m.poster_path, 'w342')}
                      srcSet={posterSrcSet(m.poster_path)}
                      loading="lazy"
                      width="342"
                      height="513"
                      className="aspect-[2/3] w-full rounded-xl object-cover transition-transform group-hover:scale-[1.02]"
                    />
                    <div className="mt-2 truncate text-sm">{m.title}</div>
                    <div className="text-xs text-white/60">
                      {(m.release_date || '').slice(0, 4)} • ⭐ {m.vote_average?.toFixed?.(1) ?? '—'}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-sm text-white/60">No similar movies found.</div>
          )}
        </section>
      </div>
    </div>
  )
}