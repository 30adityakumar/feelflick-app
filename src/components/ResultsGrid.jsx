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
            gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
            gap: '2.2rem',
            justifyItems: 'center',
            alignItems: 'flex-start',
            maxWidth: 950,
            margin: '0 auto'
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
