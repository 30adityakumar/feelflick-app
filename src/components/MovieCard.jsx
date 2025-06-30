import { useState } from "react";

export default function MovieCard({
  movie,
  genreMap,
  showWatchedButton = false,
  onMarkWatched = () => {},
  isWatched = false,
  onRemove = null
}) {
  const [hovered, setHovered] = useState(false);
  const path = movie.poster || movie.poster_path;
  const posterUrl = path
    ? `https://image.tmdb.org/t/p/w342${path}`
    : null;
  const year = movie.release_date ? new Date(movie.release_date).getFullYear() : "—";
  const score = movie.vote_average ? movie.vote_average.toFixed(1) : "–";
  const genres = (movie.genre_ids || [])
    .map(id => genreMap[id])
    .filter(Boolean)
    .slice(0, 2)
    .join(", ");

  const overview =
    movie.overview && movie.overview.trim().length
      ? movie.overview
      : "No overview available.";

  return (
    <div
      className="movie-card"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: 185,
        minHeight: 390,
        borderRadius: 16,
        background: "#19191e",
        boxShadow: hovered
          ? "0 10px 32px 0 #241e19aa, 0 2px 16px 0 #0009"
          : "0 2px 16px 0 #0009",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        transition: "box-shadow 0.2s, transform 0.16s",
        transform: hovered ? "scale(1.04) translateY(-6px)" : "scale(1.00)",
        cursor: "pointer",
        position: "relative"
      }}
    >
      {/* Poster with rating badge */}
      <div style={{ position: "relative", width: "100%" }}>
        {posterUrl ? (
          <img
            src={posterUrl}
            alt={movie.title}
            style={{
              width: "100%",
              minHeight: 265,
              objectFit: "cover",
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16
            }}
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: 265,
              background: "#222",
              color: "#aaa",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 14
            }}
          >No Image</div>
        )}
        {/* Rating badge */}
        <div style={{
          position: "absolute",
          top: 9,
          right: 9,
          background: "#18181b",
          borderRadius: "9999px",
          color: "#FFD700",
          fontWeight: 700,
          fontSize: 15,
          padding: "3px 11px",
          boxShadow: "0 1px 7px #0008"
        }}>
          ⭐ {score}
        </div>
      </div>
      {/* Card details */}
      <div style={{
        padding: "12px 13px 8px 13px",
        flex: 1,
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end"
      }}>
        <div style={{
          fontWeight: 700,
          fontSize: 17,
          color: "#fff",
          lineHeight: "1.17",
          marginBottom: 3,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis"
        }} title={movie.title}>{movie.title}</div>
        <div style={{
          fontSize: 13,
          color: "#bbb",
          lineHeight: 1.19,
          marginBottom: 2,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis"
        }} title={genres}>{genres || "—"}</div>
        <div style={{
          fontSize: 13,
          color: "#8a8d95",
          marginBottom: 4
        }}>{year}</div>
        {/* Watched/Remove buttons */}
        {showWatchedButton ? (
          <button
            onClick={() => onMarkWatched(movie)}
            style={{
              marginTop: 10,
              width: "100%",
              padding: "7px 0",
              borderRadius: 24,
              border: "none",
              background: "#18ba54",
              color: "#fff",
              fontWeight: 700,
              fontSize: 14,
              cursor: "pointer",
              boxShadow: "0 2px 10px 0 #16a34a22"
            }}
          >
            WATCHED ✓
          </button>
        ) : isWatched && onRemove ? (
          <div style={{
            marginTop: 10,
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center"
          }}>
            <div style={{
              color: "#bbb",
              fontSize: 13,
              marginBottom: 5
            }}>Already watched</div>
            <button
              onClick={onRemove}
              style={{
                background: '#9a2d2d',
                color: '#fff',
                border: 'none',
                borderRadius: 15,
                fontSize: 18,
                width: 30,
                height: 30,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'background 0.2s'
              }}
              title="Remove from Watched"
            >🗑️</button>
          </div>
        ) : (
          <div style={{
            marginTop: 10,
            width: "100%",
            color: "#bbb",
            fontSize: 13,
            textAlign: "center"
          }}>Already watched</div>
        )}
      </div>
      {/* Overview overlay on hover (like Netflix) */}
      <div style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: "100%",
        height: "100%",
        background: "rgba(20,21,26,0.97)",
        color: "#fff",
        fontSize: 13,
        opacity: hovered ? 1 : 0,
        pointerEvents: hovered ? "auto" : "none",
        borderRadius: 16,
        padding: "1.1rem 1rem 1.6rem 1rem",
        transition: "opacity 0.22s",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        textAlign: "left",
        boxSizing: "border-box",
        overflow: "hidden"
      }}>
        <span style={{
          display: "-webkit-box",
          WebkitLineClamp: 6,
          WebkitBoxOrient: "vertical",
          overflow: "hidden"
        }}>
          {overview}
        </span>
      </div>
    </div>
  );
}
