import MovieCard from './MovieCard'

export default function WatchedHistory({ watched, genreMap, onRemove }) {
  if (!watched?.length) {
    return <p className="text-gray-400">No watched movies yet.</p>
  }

  return (
    <>
      <h2 className="text-lg font-bold mt-10 mb-4 text-white">🎬 Watched History</h2>
      <div
        style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
            gap: '2.2rem',
            justifyItems: 'center',
            alignItems: 'flex-start',
            maxWidth: 950,
            margin: '0 auto'
        }}
      >
        {watched.map((m) => (
          <MovieCard
            key={m.movie_id}
            movie={m}
            genreMap={genreMap}
            isWatched={true}
            onRemove={() => onRemove(m.movie_id)}
          />
        ))}
      </div>
    </>
  )
}
