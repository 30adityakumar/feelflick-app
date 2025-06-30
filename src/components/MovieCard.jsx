export default function MovieCard({
  movie,
  genreMap,
  isWatched,
  onMarkWatched,
  onRemove,
  onClick
}) {
  // Format year
  const year = movie.release_date ? new Date(movie.release_date).getFullYear() : null
  // Format genres (if you want to show)
  const genres = Array.isArray(movie.genre_ids)
    ? (genreMap
        ? movie.genre_ids.map(id => genreMap[id]).filter(Boolean).join(", ")
        : "")
    : ""
  // Poster URL
  const posterUrl = movie.poster_path || movie.poster
    ? `https://image.tmdb.org/t/p/w342${movie.poster_path || movie.poster}`
    : null

  return (
    <div
      onClick={onClick}
      style={{
        background: "#232d41",
        borderRadius: 13,
        overflow: "hidden",
        boxShadow: "0 2px 12px #0008",
        cursor: "pointer",
        width: 130,
        minWidth: 130,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        position: "relative",
        transition: "transform 0.16s, box-shadow 0.16s"
      }}
      tabIndex={0}
      aria-label={movie.title}
      onMouseOver={e => {
        e.currentTarget.style.transform = "scale(1.07)"
        e.currentTarget.style.boxShadow = "0 6px 36px #fdaf4122"
      }}
      onMouseOut={e => {
        e.currentTarget.style.transform = "scale(1.0)"
        e.currentTarget.style.boxShadow = "0 2px 12px #0008"
      }}
    >
      {/* Poster */}
      {posterUrl ? (
        <img
          src={posterUrl}
          alt={movie.title}
          style={{
            width: "100%",
            height: 180,
            objectFit: "cover",
            borderTopLeftRadius: 13,
            borderTopRightRadius: 13,
            display: "block"
          }}
        />
      ) : (
        <div style={{
          height: 180,
          background: "#18305a",
          color: "#fff",
          fontSize: 22,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%"
        }}>
          🎬
        </div>
      )}

      {/* Title/Info */}
      <div style={{
        color: "#fff",
        fontSize: 12.5,
        fontWeight: 800,
        margin: "7px 0 2px 0",
        padding: "0 6px",
        whiteSpace: "nowrap",
        textOverflow: "ellipsis",
        overflow: "hidden",
        textAlign: "center"
      }}>
        {movie.title || movie.name}
      </div>
      <div style={{
        color: "#fdaf41",
        fontSize: 10.5,
        fontWeight: 600,
        textAlign: "center",
        marginBottom: 3
      }}>
        {genres}
      </div>
      <div style={{
        color: "#a5b7cc",
        fontSize: 10.5,
        fontWeight: 500,
        textAlign: "center",
        marginBottom: 5
      }}>
        {year && <span>{year}</span>}
        {year && movie.vote_average && <> • </>}
        {movie.vote_average ? <>⭐ {movie.vote_average.toFixed(1)}</> : ""}
      </div>

      {/* Watched/Remove Button */}
      <div style={{ marginBottom: 9 }}>
        {onMarkWatched && !isWatched && (
          <button
            onClick={e => { e.stopPropagation(); onMarkWatched(movie) }}
            style={{
              fontSize: 11,
              background: "#fe9245",
              color: "#18406d",
              border: "none",
              borderRadius: 7,
              fontWeight: 700,
              padding: "3.5px 11px",
              marginTop: 4,
              cursor: "pointer"
            }}
          >
            Mark Watched
          </button>
        )}
        {isWatched && !onRemove && (
          <span style={{
            fontSize: 11.5,
            color: "#5ece3d",
            background: "#232",
            borderRadius: 6,
            fontWeight: 700,
            padding: "3.5px 9px",
            marginTop: 4,
            display: "inline-block"
          }}>
            Watched
          </span>
        )}
        {onRemove && (
          <button
            onClick={e => { e.stopPropagation(); onRemove() }}
            title="Remove from watched"
            style={{
              fontSize: 12,
              background: "#eb423b",
              color: "#fff",
              border: "none",
              borderRadius: 7,
              fontWeight: 700,
              padding: "3.5px 11px",
              marginTop: 4,
              cursor: "pointer"
            }}
          >
            🗑 Remove
          </button>
        )}
      </div>
    </div>
  )
}
