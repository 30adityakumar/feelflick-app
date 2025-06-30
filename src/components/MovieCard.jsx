export default function MovieCard({
  movie,
  genreMap,
  showWatchedButton = false,
  onMarkWatched = () => {}
}) {
  const path = movie.poster || movie.poster_path;
  const posterUrl = path
    ? `https://image.tmdb.org/t/p/w185${path}`
    : null;

  const year = movie.release_date ? new Date(movie.release_date).getFullYear() : '—';
  const score = movie.vote_average ? movie.vote_average.toFixed(1) : '–';
  const genres = (movie.genre_ids || [])
    .map(id => genreMap[id])
    .filter(Boolean)
    .slice(0, 3)
    .join(', ');

  return (
    <div
      style={{
        width: 150,
        minWidth: 150,
        maxWidth: 150,
        padding: '0.5rem',
        background: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
        boxShadow: '0 4px 10px 0 rgba(0,0,0,0.18)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        transition: 'transform 0.18s',
      }}
      className="movie-card"
    >
      {/* Poster */}
      {posterUrl ? (
        <img
          src={posterUrl}
          alt={movie.title}
          style={{
            width: '100%',
            height: 225,
            objectFit: 'cover',
            borderRadius: 8,
            marginBottom: 8,
          }}
        />
      ) : (
        <div
          style={{
            width: '100%',
            height: 225,
            background: '#222',
            borderRadius: 8,
            color: '#aaa',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 8,
            fontSize: 12,
          }}
        >
          No Image
        </div>
      )}

      {/* TEXT BLOCK */}
      <div style={{
        width: '100%',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        marginBottom: 4,
        overflow: 'hidden'
      }}>
        <div style={{
          fontWeight: 600,
          fontSize: 14,
          color: '#fff',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          width: '100%',
        }} title={movie.title}>{movie.title}</div>
        <div style={{
          color: '#bdbdbd',
          fontSize: 12,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          width: '100%',
        }} title={genres}>{genres || '—'}</div>
        <div style={{
          color: '#bababa',
          fontSize: 12,
        }}>
          {year} • <span style={{ color: '#FFD700' }}>⭐</span> {score}
        </div>
      </div>

      {/* BUTTON/LABEL */}
      {showWatchedButton ? (
        <button
          onClick={() => onMarkWatched(movie)}
          style={{
            marginTop: 4,
            width: '100%',
            padding: '6px 0',
            borderRadius: 6,
            border: 'none',
            background: '#16a34a',
            color: '#fff',
            fontWeight: 500,
            fontSize: 12,
            cursor: 'pointer'
          }}
        >
          Watched ✓
        </button>
      ) : (
        <div style={{
          marginTop: 4,
          width: '100%',
          color: '#bdbdbd',
          fontSize: 12,
        }}>Already watched</div>
      )}
    </div>
  );
}
