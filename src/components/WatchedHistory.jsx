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
          gridTemplateColumns: 'repeat(5, 150px)',
          gap: '1.5rem',
          justifyContent: 'center'
        }}
      >
        {watched.map((m) => (
          <MovieCard
            key={m.movie_id}
            movie={m}
            genreMap={genreMap}
          />
        ))}
      </div>
    </>
  )
}
