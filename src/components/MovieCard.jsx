export default function MovieCard({
  movie,
  genreMap,
  showWatchedButton = false,
  onMarkWatched = () => {}
}) {
  const poster = movie.poster
    ? `https://image.tmdb.org/t/p/w185${movie.poster}`
    : movie.poster_path
      ? `https://image.tmdb.org/t/p/w185${movie.poster_path}`
      : 'https://via.placeholder.com/185x278?text=No+Image'

  const year  = movie.release_date ? new Date(movie.release_date).getFullYear() : '—'
  const score = movie.vote_average ? movie.vote_average.toFixed(1) : '–'

  const genres = (movie.genre_ids || [])
    .map(id => genreMap[id])
    .filter(Boolean)
    .slice(0, 3)
    .join(', ')

  return (
    <div className="bg-white/10 p-2 rounded-lg shadow text-center hover:scale-[1.02] transition-transform flex flex-col h-full">
      <img
        src={poster}
        alt={movie.title}
        className="rounded mb-2 mx-auto"
      />

      <div className="flex-1 flex flex-col justify-between">
        <div className="mb-2">
          <p className="text-sm font-medium text-white">{movie.title}</p>
          <p className="text-xs text-gray-300 mt-1">{genres || '—'}</p>
          <p className="text-xs text-gray-400">{year} • ⭐ {score}</p>
        </div>

        {showWatchedButton ? (
          <button
            onClick={() => onMarkWatched(movie)}
            className="mt-2 w-full bg-green-600 text-white py-1 rounded hover:bg-green-700"
          >
            Watched ✓
          </button>
        ) : (
          <p className="text-xs text-gray-500 mt-2">Already watched</p>
        )}
      </div>
    </div>
  )
}
