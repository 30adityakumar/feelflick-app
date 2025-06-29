import MovieCard from './MovieCard'

export default function WatchedHistory ({ watched, genreMap }) {
  return (
    <>
      <h2 className="text-lg font-bold mt-10 mb-4 text-white">🎬 Watched History</h2>

      {watched.length === 0 ? (
        <p className="text-gray-400">No watched movies yet.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
          {watched.map(m => (
            <MovieCard
              key={m.movie_id}
              movie={m}
              genreMap={genreMap}
            />
          ))}
        </div>
      )}
    </>
  )
}
