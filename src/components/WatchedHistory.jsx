import MovieCard from './MovieCard'

export default function WatchedHistory({ watched, genreMap, onRemove, gridClass, onMovieClick }) {
  if (!watched.length) {
    return <p className="text-gray-400">No watched movies yet.</p>
  }

  return (
    <div
      className={gridClass}
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
        gap: '1.3rem',
        justifyContent: 'center',
        width: "100%"
      }}
    >
      {watched.map(m => (
        <MovieCard
          key={m.movie_id}
          movie={m}
          genreMap={genreMap}
          isWatched
          onRemove={() => onRemove(m.movie_id)}
          onClick={() => onMovieClick && onMovieClick(m)} // << HERE
        />
      ))}
    </div>
  )
}
