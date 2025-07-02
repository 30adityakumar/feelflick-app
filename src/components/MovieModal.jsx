import { useNavigate } from "react-router-dom";

const GENRES = {
  28: "Action", 12: "Adventure", 16: "Animation", 35: "Comedy", 80: "Crime", 99: "Documentary", 18: "Drama",
  10751: "Family", 14: "Fantasy", 36: "History", 27: "Horror", 10402: "Music", 9648: "Mystery", 10749: "Romance",
  878: "Sci-Fi", 10770: "TV", 53: "Thriller", 10752: "War", 37: "Western"
};

function MovieModal({ movie, onClose }) {
  const navigate = useNavigate();
  if (!movie) return null;
  const genreLabels = (movie.genre_ids || []).map(id => GENRES[id] || null).filter(Boolean);

  return (
    <>
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.77)",
          zIndex: 10000,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          animation: "modalFadeIn 0.22s"
        }}
        onClick={onClose}
      />
      <style>{`
        @keyframes modalFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @media (max-width: 700px) {
          .fflick-movie-modal-main { width: 97vw !important; min-width: 0 !important; }
          .fflick-movie-modal-image { max-height: 210px !important; }
        }
      `}</style>
      <div
        className="fflick-movie-modal-main"
        style={{
          position: "fixed",
          left: "50%", top: "50%",
          transform: "translate(-50%, -50%)",
          width: "490px", maxWidth: "97vw", minWidth: "320px",
          background: "#18141c",
          borderRadius: "18px",
          boxShadow: "0 9px 54px #000b",
          color: "#fff",
          zIndex: 10001,
          overflow: "hidden",
          animation: "modalFadeIn 0.23s"
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            position: "absolute", top: 17, right: 17,
            background: "rgba(34,32,32,0.81)",
            border: "none", color: "#fff", fontSize: 32,
            width: 40, height: 40, borderRadius: "50%",
            cursor: "pointer", zIndex: 1, display: "flex", alignItems: "center", justifyContent: "center"
          }}
        >&#10005;</button>
        {/* Movie Image */}
        <img
          className="fflick-movie-modal-image"
          src={movie.backdrop_path
            ? `https://image.tmdb.org/t/p/w780${movie.backdrop_path}`
            : (movie.poster_path
                ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
                : "/posters/placeholder.png")}
          alt={movie.title}
          style={{
            width: "100%", objectFit: "cover",
            maxHeight: 220, borderTopLeftRadius: 18, borderTopRightRadius: 18,
            filter: "brightness(0.91) contrast(1.07)"
          }}
        />
        <div style={{ padding: "26px 18px 18px 18px" }}>
          <div style={{
            fontWeight: 900, fontSize: 28, marginBottom: 11,
            letterSpacing: "-1px"
          }}>
            {movie.title}
          </div>
          <div style={{ marginBottom: 12, display: "flex", gap: 7, flexWrap: "wrap" }}>
            {movie.release_date && (
              <span style={{
                background: "#33373c", color: "#fff",
                borderRadius: 7, padding: "4px 13px",
                fontSize: 15, marginRight: 3
              }}>
                {movie.release_date.slice(0, 4)}
              </span>
            )}
            {/* Genres */}
            {genreLabels.map((label, i) => (
              <span key={label} style={{
                background: "#33373c", color: "#fff",
                borderRadius: 7, padding: "4px 13px",
                fontSize: 15, marginRight: 3
              }}>
                {label}
              </span>
            ))}
          </div>
          <div style={{
            fontSize: 15.5, color: "#f2f2f2", marginBottom: 22,
            fontWeight: 400, lineHeight: 1.56
          }}>
            {movie.overview || "No description available."}
          </div>
          <button
            onClick={() => navigate("/auth/sign-up")}
            style={{
              background: "linear-gradient(90deg,#fe9245 10%,#eb423b 90%)",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontWeight: 700,
              fontSize: 15,         // smaller font size
              padding: "7px 18px",  // less padding
              minWidth: 100,        // smaller min width
              boxShadow: "0 2px 8px #fe92451a",
              cursor: "pointer",
              transition: "all 0.15s",
              letterSpacing: "0.01em",
              marginTop: 8,
              display: "flex", alignItems: "center", gap: 7,
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = "linear-gradient(90deg,#eb423b 10%,#fe9245 90%)";
              e.currentTarget.style.transform = "scale(1.03)";
              e.currentTarget.style.boxShadow = "0 6px 18px #fe92452d";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = "linear-gradient(90deg,#fe9245 10%,#eb423b 90%)";
              e.currentTarget.style.transform = "none";
              e.currentTarget.style.boxShadow = "0 2px 8px #fe92451a";
            }}
          >
            Get Started <span style={{ fontSize: 18, marginLeft: 1 }}>›</span>
          </button>
        </div>
      </div>
    </>
  );
}

export default MovieModal;
