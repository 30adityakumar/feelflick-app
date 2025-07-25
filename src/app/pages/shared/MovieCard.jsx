import { Link, useNavigate } from "react-router-dom";

const TMDB_IMG = "https://image.tmdb.org/t/p/w342";

/**
 * Props:
 * - movie: { movie_id, title, poster, poster_path, ... }
 * - isWatched: boolean (optional)
 * - onRemove: function (optional)
 * - onClick: function (optional)
 */
export default function MovieCard({ movie, isWatched, onRemove, onClick }) {
  const navigate = useNavigate();

  // Support both poster and poster_path fields
  const posterPath = movie.poster || movie.poster_path || "";
  const posterUrl = posterPath
    ? (posterPath.startsWith("http")
        ? posterPath
        : `${TMDB_IMG}${posterPath}`)
    : "/placeholder-movie.png";

  // Use movie.movie_id (not id!) for detail page links
  const movieId = movie.movie_id || movie.id; // fallback if old data

  // If onRemove is provided, show a remove button (for watched/history)
  const showRemove = isWatched && typeof onRemove === "function";

  return (
    <div
      style={{
        width: 120,
        minWidth: 120,
        cursor: "pointer",
        borderRadius: 13,
        overflow: "hidden",
        background: "#23212b",
        boxShadow: "0 2px 10px #0003",
        position: "relative",
        transition: "transform 0.17s",
        willChange: "transform"
      }}
      tabIndex={0}
      onMouseOver={e => e.currentTarget.style.transform = "scale(1.06)"}
      onMouseOut={e => e.currentTarget.style.transform = "scale(1)"}
      onClick={() => {
        if (onClick) {
          onClick(movie);
        } else {
          navigate(`/movie/${movieId}`);
        }
      }}
    >
      {/* Remove button in corner (only for watched) */}
      {showRemove && (
        <button
          className="absolute top-2 right-2 text-red-500 hover:text-red-700 bg-black bg-opacity-60 p-1.5 rounded-full z-10"
          onClick={e => {
            e.stopPropagation(); // Prevent card click
            onRemove(movieId);
          }}
          aria-label="Remove from watched"
        >
          ✖️
        </button>
      )}
      {/* Poster */}
      <img
        src={posterUrl}
        alt={movie.title}
        style={{ width: "100%", height: 175, objectFit: "cover", display: "block" }}
        onError={e => { e.currentTarget.src = "/placeholder-movie.png"; }}
      />
      {/* Movie title */}
      <div style={{
        padding: "8px 10px 9px 10px",
        fontWeight: 600,
        fontSize: 14,
        color: "#fff",
        whiteSpace: "normal",
        textAlign: "center"
      }}>
        {movie.title}
      </div>
    </div>
  );
}
