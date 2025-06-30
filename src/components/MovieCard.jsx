import { useState } from "react";

export default function MovieCard({
  movie,
  genreMap,
  showWatchedButton = false,
  onMarkWatched = () => {}
}) {
  const [hovered, setHovered] = useState(false);

  const path = movie.poster || movie.poster_path;
  const posterUrl = path
    ? `https://image.tmdb.org/t/p/w185${path}`
    : null;

  const year = movie.release_date ? new Date(movie.release_date).getFullYear() : "—";
  const score = movie.vote_average ? movie.vote_average.toFixed(1) : "–";
  const genres = (movie.genre_ids || [])
    .map(id => genreMap[id])
    .filter(Boolean)
    .slice(0, 3)
    .join(", ");

  // Use overview from TMDb API, or fallback text
  const overview =
    movie.overview && movie.overview.trim().length
      ? movie.overview
      : "No overview available.";

  return (
    <div
      style={{
        width: 150,
        minWidth: 150,
        maxWidth: 150,
        padding: "0.5rem",
        background: "rgba(255,255,255,0.05)",
        borderRadius: 12,
        boxShadow: "0 4px 10px 0 rgba(0,0,0,0.18)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        transition: "transform 0.18s",
        position: "relative",
        cursor: "pointer",
        transform: hovered ? "scale(1.07)" : "scale(1.00)",
        zIndex: hovered ? 2 : 1
      }}
      className="movie-card"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Poster with overlay */}
      <div style={{ width: "100%", height: 225, position: "relative" }}>
        {posterUrl ? (
          <img
            src={posterUrl}
            alt={movie.title}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              borderRadius: 8,
              display: "block"
            }}
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              background: "#222",
              borderRadius: 8,
              color: "#aaa",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12
            }}
          >
            No Image
          </div>
        )}
        {/* Overview overlay */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: "100%",
            height: "100%",
            background: "rgba(24, 24, 24, 0.93)",
            color: "#fff",
            fontSize: 12,
            lineHeight: 1.4,
            opacity: hovered ? 1 : 0,
            pointerEvents: hovered ? "auto" : "none",
            borderRadius: 8,
            padding: "0.7rem 0.6rem",
            transition: "opacity 0.24s",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "left",
            zIndex: 3,
            boxSizing: "border-box",
            overflow: "hidden"
          }}
        >
          <span style={{
            display: "-webkit-box",
            WebkitLineClamp: 7,
            WebkitBoxOrient: "vertical",
            overflow: "hidden"
          }}>
            {overview}
          </span>
        </div>
      </div>

      {/* Text block under the poster */}
      <div style={{
        width: "100%",
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        gap: 2,
        marginBottom: 4,
        overflow: "hidden",
        marginTop: 8
      }}>
        <div style={{
          fontWeight: 600,
          fontSize: 14,
          color: "#fff",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          width: "100%"
        }} title={movie.title}>{movie.title}</div>
        <div style={{
          color: "#bdbdbd",
          fontSize: 12,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          width: "100%"
        }} title={genres}>{genres || "—"}</div>
        <div style={{
          color: "#bababa",
          fontSize: 12
        }}>
          {year} • <span style={{ color: "#FFD700" }}>⭐</span> {score}
        </div>
      </div>

      {/* Watched button or label */}
      {showWatchedButton ? (
        <button
          onClick={() => onMarkWatched(movie)}
          style={{
            marginTop: 4,
            width: "100%",
            padding: "6px 0",
            borderRadius: 6,
            border: "none",
            background: "#16a34a",
            color: "#fff",
            fontWeight: 500,
            fontSize: 12,
            cursor: "pointer"
          }}
        >
          Watched ✓
        </button>
      ) : (
        <div style={{
          marginTop: 4,
          width: "100%",
          color: "#bdbdbd",
          fontSize: 12
        }}>Already watched</div>
      )}
    </div>
  );
}
