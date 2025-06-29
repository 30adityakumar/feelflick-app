import MovieCard from './MovieCard'

export default function ResultsGrid({
  results,
  genreMap,
  onMarkWatched,
  watchedIds
}) {
  if (!results.length) return null;

  return (
    <>
      <h2 className="text-xl font-semibold mb-4 text-white">🔍 Search Results</h2>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 150px)',
          gap: '1.5rem',
          justifyContent: 'center'
        }}
      >
        {results.map((m) => (
          <MovieCard
            key={m.id}
            movie={m}
            genreMap={genreMap}
            showWatchedButton={!watchedIds.has(m.id)}
            onMarkWatched={onMarkWatched}
          />
        ))}
      </div>
    </>
  );
}
