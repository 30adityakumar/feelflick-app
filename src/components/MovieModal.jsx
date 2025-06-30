// src/components/MovieModal.jsx
import React from "react";

export default function MovieModal({ movie, open, onClose }) {
  if (!movie || !open) return null;

  const imageUrl = movie.poster_path || movie.poster
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path || movie.poster}`
    : null;

  // Try to get year from release_date, fallback to movie.year
  const year = movie.release_date
    ? new Date(movie.release_date).getFullYear()
    : movie.year || "";

  // Genre names if available (array or comma separated)
  let genres = "";
  if (movie.genre_names) genres = Array.isArray(movie.genre_names) ? movie.genre_names.join(", ") : movie.genre_names;
  else if (movie.genre_ids && movie.genreMap) genres = movie.genre_ids.map(id => movie.genreMap[id]).join(", ");
  else if (movie.genres) genres = Array.isArray(movie.genres) ? movie.genres.join(", ") : movie.genres;

  return (
    <div style={{
      position: "fixed",
      zIndex: 1000,
      top: 0, left: 0, width: "100vw", height: "100vh",
      background: "rgba(20,24,32,0.82)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      animation: "fadeIn .16s"
    }}>
      {/* Modal Box */}
      <div style={{
        background: "#19213c",
        borderRadius: 22,
        boxShadow: "0 16px 68px #000b",
        padding: "32px 30px 20px 30px",
        minWidth: 320,
        maxWidth: 400,
        width: "90vw",
        color: "#fff",
        position: "relative"
      }}>
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            right: 18,
            top: 10,
            fontSize: 22,
            background: "none",
            border: "none",
            color: "#fff",
            opacity: 0.63,
            cursor: "pointer",
            transition: "opacity 0.13s"
          }}
          aria-label="Close"
        >×</button>
        {/* Poster */}
        {imageUrl &&
          <img
            src={imageUrl}
            alt={movie.title}
            style={{
              width: "100%",
              borderRadius: 14,
              boxShadow: "0 4px 20px #0005",
              marginBottom: 16,
              maxHeight: 280,
              objectFit: "cover"
            }}
          />
        }
        {/* Title */}
        <div style={{
          fontSize: 23,
          fontWeight: 800,
          marginBottom: 4,
          letterSpacing: "-1px",
          color: "#fff"
        }}>
          {movie.title || movie.name}
        </div>
        {/* Meta */}
        <div style={{ color: "#fdaf41", fontWeight: 600, fontSize: 15, marginBottom: 6 }}>
          {year && <span>{year} &nbsp;•&nbsp;</span>}
          {genres && <span>{genres} &nbsp;•&nbsp;</span>}
          <span>⭐ {movie.vote_average ? movie.vote_average.toFixed(1) : "--"}</span>
        </div>
        {/* Overview */}
        <div style={{
          color: "#b5bfd4",
          fontSize: 15.5,
          margin: "12px 0 6px 0",
          minHeight: 46,
          whiteSpace: "pre-wrap"
        }}>
          {movie.overview ? movie.overview : "No description available."}
        </div>
        {/* Actions */}
        {/* You can add “Mark as Watched”, “Add to Favorites” buttons here */}
        <div style={{
          marginTop: 16,
          display: "flex",
          justifyContent: "flex-end",
          gap: 10
        }}>
          {/* <button ...>Add to Favorites</button> */}
        </div>
      </div>
      {/* Fade in keyframes (inline for simplicity) */}
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  );
}
