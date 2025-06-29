export default function MovieCard({
  movie,
  genreMap,
  showWatchedButton = false,
  onMarkWatched = () => {}
}) {
  // pick up either watched.history’s `poster` or search’s `poster_path`
  const path = movie.poster || movie.poster_path;
  const posterUrl = path
    ? `https://image.tmdb.org/t/p/w185${path}`
    : null;

  const year  = movie.release_date ? new Date(movie.release_date).getFullYear() : '—';
  const score = movie.vote_average ? movie.vote_average.toFixed(1) : '–';
  const genres = (movie.genre_ids || [])
    .map((id) => genreMap[id])
    .filter(Boolean)
    .slice(0, 3)
    .join(', ');

  return (
    <div
      className="bg-white/10 rounded-lg shadow text-center flex flex-col transition-transform hover:scale-[1.02]"
      style={{ width: '150px', padding: '0.5rem' }}
    >
      {posterUrl ? (
        <img
          src={posterUrl}
          alt={movie.title}
          className="rounded object-cover mb-2"
          style={{ width: '100%', height: '225px' }}
        />
      ) : (
        <div
          className="rounded mb-2 flex items-center justify-center text-gray-400 text-xs"
          style={{ backgroundColor: '#222', width: '100%', height: '225px' }}
        >
          No Image
        </div>
      )}

      <div className="flex-1 flex flex-col justify-between">
        <div className="space-y-1">
          <p className="text-sm font-semibold truncate" title={movie.title}>
            {movie.title}
          </p>
          <p className="text-xs text-gray-300 truncate" title={genres}>
            {genres || '—'}
          </p>
          <p className="text-xs text-gray-400">
            {year} • ⭐ {score}
          </p>
        </div>

        {showWatchedButton ? (
          <button
            onClick={() => onMarkWatched(movie)}
            className="mt-2 w-full py-1 text-xs rounded bg-green-600 hover:bg-green-700 text-white"
          >
            Watched ✓
          </button>
        ) : (
          <p className="mt-2 text-xs text-gray-500">Already watched</p>
        )}
      </div>
    </div>
  );
}
