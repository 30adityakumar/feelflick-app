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

  // BRAND COLORS (extracted from your logo)
  const NAVY = "#18406d";
  const ORANGE = "#fe9245";
  const RED = "#eb423b";
  const YELLOW = "#fdaf41";
  const OFFWHITE = "#f7ede7";

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

  return (
    <div
      className="movie-card"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: 185,
        minHeight: 390,
        borderRadius: 18,
        background: `linear-gradient(135deg, ${NAVY} 90%, ${ORANGE} 110%)`,
        border: hovered
          ? `2.5px solid ${ORANGE}`
          : "2.5px solid transparent",
        boxShadow: hovered
          ? `0 8px 36px 0 ${ORANGE}44, 0 2px 16px 0 #0009`
          : "0 2px 16px 0 #0009",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        transition: "box-shadow 0.18s, transform 0.15s, border 0.22s",
        transform: hovered ? "scale(1.045) translateY(-7px)" : "scale(1.00)",
        cursor: "pointer",
        position: "relative"
      }}
    >
      {/* Poster */}
      <div style={{ position: "relative", width: "100%" }}>
        {posterUrl ? (
          <img
            src={posterUrl}
            alt={movie.title}
            style={{
              width: "100%",
              minHeight: 265,
              objectFit: "cover",
              borderTopLeftRadius: 18,
              borderTopRightRadius: 18
            }}
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: 265,
              background: OFFWHITE,
              color: NAVY,
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
          background: NAVY,
          borderRadius: "9999px",
          color: YELLOW,
          fontWeight: 700,
          fontSize: 15,
          padding: "4px 12px",
          boxShadow: "0 1px 7px #0005"
        }}>
          ⭐ {score}
        </div>
      </div>
      {/* Card details */}
      <div style={{
        padding: "14px 15px 10px 15px",
        flex: 1,
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        background: "rgba(24,64,109,0.97)"
      }}>
        <div style={{
          fontWeight: 700,
          fontSize: 17,
          color: OFFWHITE,
          lineHeight: "1.14",
          marginBottom: 3,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          letterSpacing: "-0.03em"
        }} title={movie.title}>{movie.title}</div>
        <div style={{
          fontSize: 13,
          color: YELLOW,
          fontWeight: 500,
          lineHeight: 1.16,
          marginBottom: 2,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis"
        }} title={genres}>{genres || "—"}</div>
        <div style={{
          fontSize: 13,
          color: OFFWHITE,
          marginBottom: 7
        }}>{year}</div>
        {/* Watched/Remove buttons */}
        {showWatchedButton ? (
          <button
            onClick={() => onMarkWatched(movie)}
            style={{
              marginTop: 7,
              width: "100%",
              padding: "8px 0",
              borderRadius: 24,
              border: "none",
              background: ORANGE,
              color: NAVY,
              fontWeight: 800,
              fontSize: 15,
              cursor: "pointer",
              letterSpacing: "0.03em",
              boxShadow: `0 2px 10px 0 ${ORANGE}22`
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
              color: ORANGE,
              fontSize: 13,
              fontWeight: 600,
              marginBottom: 4,
              letterSpacing: "0.02em"
            }}>Already watched</div>
            <button
              onClick={onRemove}
              style={{
                background: RED,
                color: "#fff",
                border: 'none',
                borderRadius: 18,
                fontSize: 19,
                width: 32,
                height: 32,
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
            color: ORANGE,
            fontSize: 13,
            textAlign: "center",
            fontWeight: 600
          }}>Already watched</div>
        )}
      </div>
    </div>
  );
}
