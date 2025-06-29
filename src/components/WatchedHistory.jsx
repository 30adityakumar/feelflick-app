import MovieCard from './MovieCard'

export default function WatchedHistory({ watched, genreMap }) {
  if (!watched.length) {
    return <p className="text-gray-400">No watched movies yet.</p>
  }

  return (
    <>
      <h2 className="text-lg font-bold mt-10 mb-4 text-white">🎬 Watched History</h2>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
          gap: '2rem',
          justifyItems: 'center'
        }}
      >
        {watched.map(movie => (
          <MovieCard
            key={movie.movie_id}
            movie={movie}
            genreMap={genreMap}
          />
        ))}
      </div>
    </>
  )
}
