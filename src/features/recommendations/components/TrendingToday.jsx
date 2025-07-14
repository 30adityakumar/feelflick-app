import { useEffect, useState, useRef } from "react";

const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;

export default function TrendingToday({ onSignUp }) {
  const handleSignUp = onSignUp || (() => { window.location.href = '/auth/sign-up'; });
  const [movies, setMovies] = useState([]);
  const scrollRef = useRef(null);
  const [selectedMovie, setSelectedMovie] = useState(null);

  // Accessibility: Focus trap for modal
  const modalCloseRef = useRef(null);

  useEffect(() => {
    fetch(`https://api.themoviedb.org/3/trending/movie/day?api_key=${TMDB_API_KEY}`)
      .then(res => res.json())
      .then(data => setMovies((data.results || []).slice(0, 10)));
  }, []);

  const scrollAmount = 168 + 32; // CARD_WIDTH + CARD_GAP
  const scrollLeft = () => {
    if (scrollRef.current) scrollRef.current.scrollBy({ left: -scrollAmount, behavior: "smooth" });
  };
  const scrollRight = () => {
    if (scrollRef.current) scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
  };

  // Responsive styles and card sizing handled in style tag below!

  return (
    <>
      <style>{`
      .fflick-trending-section {
        background: rgba(10,10,10,0.73);
        padding: clamp(24px, 4vw, 55px) 0 clamp(28px, 6vw, 55px) 0;
        width: 100vw;
        min-height: 340px;
        position: relative;
        box-sizing: border-box;
        overflow: visible;
      }
      .fflick-trending-row {
        display: flex;
        gap: clamp(15px, 2.7vw, 32px);
        overflow-x: auto;
        scroll-snap-type: x mandatory;
        min-height: clamp(200px, 36vw, 246px);
        align-items: flex-end;
        width: 100%;
        padding-left: clamp(12px, 4vw, 44px);
        padding-top: clamp(8px, 3vw, 22px);
        scrollbar-width: none;
      }
      .fflick-trending-row::-webkit-scrollbar { display: none; }
      .fflick-poster {
        position: relative;
        flex: 0 0 clamp(104px, 26vw, 168px);
        min-width: clamp(104px, 26vw, 168px);
        height: clamp(140px, 39vw, 246px);
        border-radius: clamp(8px, 2vw, 15px);
        box-shadow: 0 2px 12px #000b;
        background: #181818;
        scroll-snap-align: center;
        margin-bottom: clamp(4px, 0.9vw, 10px);
        z-index: 2;
        cursor: pointer;
        outline: none;
        transition: box-shadow 0.13s cubic-bezier(.32,1.4,.46,1), filter 0.13s cubic-bezier(.32,1.4,.46,1), transform 0.15s cubic-bezier(.32,1.4,.46,1);
      }
      .fflick-poster:hover, .fflick-poster:focus-visible {
        box-shadow: 0 6px 32px #eb423b66, 0 1px 14px #fe924558;
        filter: brightness(1.14) saturate(1.12);
        transform: translateY(-11px) scale(1.045);
        z-index: 11;
      }
      .fflick-poster:focus-visible {
        outline: 2.7px solid #fe9245;
        outline-offset: 2.2px;
      }
      .fflick-ranking {
        position: absolute;
        left: -25px;
        bottom: 14px;
        font-size: clamp(2.0rem,7vw,4.4rem);
        font-weight: 900;
        color: #fff;
        opacity: 0.75;
        WebkitTextStroke: 2.5px #19171b;
        text-stroke: 2.5px #19171b;
        line-height: 1;
        z-index: 20;
        pointer-events: none;
        text-shadow: 0 2px 8px #000a, 0 5px 24px #fe924540;
        font-family: 'Montserrat', Arial, sans-serif;
        user-select: none;
      }
      .fflick-trending-arrow {
        position: absolute;
        top: 52%;
        transform: translateY(-50%);
        background: linear-gradient(132deg, rgba(22,22,22,0.97) 70%, #fe9245 100%);
        border: none;
        border-radius: 50%;
        width: clamp(40px, 7vw, 54px);
        height: clamp(40px, 7vw, 54px);
        display: flex;
        align-items: center;
        justify-content: center;
        color: #fff;
        font-size: clamp(2.1rem, 4vw, 2.7rem);
        cursor: pointer;
        z-index: 12;
        box-shadow: 0 2px 18px #eb423b24, 0 2px 12px #19171b45;
        opacity: 0.86;
        transition: opacity 0.22s, background 0.18s, box-shadow 0.13s, transform 0.13s;
        border: 1.5px solid #fe924580;
        outline: none;
      }
      .fflick-trending-arrow:focus-visible, .fflick-trending-arrow:hover {
        outline: 2.2px solid #fe9245;
        outline-offset: 2.2px;
        opacity: 1;
        background: linear-gradient(132deg, #fe9245 80%, rgba(22,22,22,0.97) 100%);
        box-shadow: 0 4px 32px #fe924546;
        transform: scale(1.06);
      }
      .fflick-trending-arrow.left { left: 0; }
      .fflick-trending-arrow.right { right: 0; }
    `}</style>

      <section
        className="fflick-trending-section"
        role="region"
        aria-labelledby="trending-movies-heading"
      >
        <h2 id="trending-movies-heading" className="fflick-trending-heading">
          Trending Now
        </h2>
        <div className="fflick-trending-row-wrap">
          {/* Left Arrow */}
          <button
            className="fflick-trending-arrow left"
            aria-label="Scroll trending movies left"
            onClick={scrollLeft}
            tabIndex={0}
          >
            {/* SVG left chevron */}
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
              <path d="M15.5 19L9.5 12L15.5 5" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <button
            className="fflick-trending-arrow right"
            aria-label="Scroll trending movies right"
            onClick={scrollRight}
            tabIndex={0}
          >
            {/* SVG right chevron */}
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
              <path d="M8.5 5L14.5 12L8.5 19" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          {/* Horizontal scroller */}
          <div
            ref={scrollRef}
            className="fflick-trending-row"
            tabIndex={0}
            aria-label="Trending movies carousel"
          >
            {movies.map((movie, idx) => (
            <div
              key={movie.id}
              className="fflick-poster"
              tabIndex={0}
              aria-label={`Show details for ${movie.title}`}
              onClick={() => setSelectedMovie(movie)}
              onKeyDown={e => {
                if (e.key === "Enter" || e.key === " ") setSelectedMovie(movie);
              }}
              role="button"
              aria-pressed="false"
            >
              {/* Big ranking number */}
              <div className="fflick-ranking">{idx + 1}</div>
              {/* Poster */}
              <img
                src={movie.poster_path
                  ? `https://image.tmdb.org/t/p/w342${movie.poster_path}`
                  : "/posters/placeholder.png"}
                alt={movie.title}
                style={{
                  width: "100%", height: "100%", objectFit: "cover",
                  borderRadius: "inherit",
                  boxShadow: "0 2px 11px #000c",
                  display: "block",
                  background: "#191919",
                  transition: "box-shadow 0.13s, filter 0.13s"
                }}
                draggable={false}
              />
            </div>
          ))}

          </div>
        </div>
        {/* MovieModal shown if a movie is selected */}
        {selectedMovie && (
          <MovieModal
            movie={selectedMovie}
            onClose={() => setSelectedMovie(null)}
            onSignIn={handleSignUp}
            closeRef={modalCloseRef}
          />
        )}
      </section>
    </>
  );
}

// --- MovieModal Component (AAA, responsive, smooth) ---
function MovieModal({ movie, onClose, onSignIn, closeRef }) {
  if (!movie) return null;
  const GENRES = {
    28: "Action", 12: "Adventure", 16: "Animation", 35: "Comedy", 80: "Crime", 99: "Documentary", 18: "Drama",
    10751: "Family", 14: "Fantasy", 36: "History", 27: "Horror", 10402: "Music", 9648: "Mystery", 10749: "Romance",
    878: "Sci-Fi", 10770: "TV", 53: "Thriller", 10752: "War", 37: "Western"
  };
  const genreLabels = (movie.genre_ids || []).map(id => GENRES[id] || null).filter(Boolean);

  // Trap focus inside modal (basic version)
  useEffect(() => {
    const handleKeyDown = e => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab") {
        const focusables = Array.from(document.querySelectorAll('.fflick-movie-modal-main button, .fflick-movie-modal-main [tabindex="0"]'));
        if (focusables.length === 0) return;
        const first = focusables[0], last = focusables[focusables.length - 1];
        if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault(); first.focus();
        }
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault(); last.focus();
        }
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    if (closeRef && closeRef.current) closeRef.current.focus();
  }, [closeRef]);

  return (
    <>
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.82)",
          zIndex: 10000,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          animation: "modalFadeIn 0.19s"
        }}
        onClick={onClose}
        aria-label="Movie details modal background"
        role="dialog"
        aria-modal="true"
      />
      <style>{`
        @keyframes modalFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @media (max-width: 700px) {
          .fflick-movie-modal-main { width: 99vw !important; min-width: 0 !important; }
          .fflick-movie-modal-image { max-height: 178px !important; }
        }
      `}</style>
      <div
        className="fflick-movie-modal-main"
        style={{
          position: "fixed",
          left: "50%", top: "50%",
          transform: "translate(-50%, -50%)",
          width: "430px", maxWidth: "99vw", minWidth: "270px",
          background: "#18141c",
          borderRadius: "18px",
          boxShadow: "0 9px 54px #000b",
          color: "#fff",
          zIndex: 10001,
          overflow: "hidden",
          animation: "modalFadeIn 0.19s"
        }}
        role="document"
        aria-label={`Details for ${movie.title}`}
        tabIndex={0}
      >
        {/* Close Button */}
        <button
          ref={closeRef}
          onClick={onClose}
          aria-label="Close movie details"
          style={{
            position: "absolute", top: 14, right: 14,
            background: "rgba(34,32,32,0.87)",
            border: "none", color: "#fff", fontSize: 29,
            width: 36, height: 36, borderRadius: "50%",
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
            maxHeight: 195, borderTopLeftRadius: 18, borderTopRightRadius: 18,
            filter: "brightness(0.92) contrast(1.08)"
          }}
        />
        <div style={{ padding: "20px 16px 16px 16px" }}>
          <div style={{
            fontWeight: 900, fontSize: 24, marginBottom: 10,
            letterSpacing: "-1px"
          }}>
            {movie.title}
          </div>
          <div style={{ marginBottom: 10, display: "flex", gap: 7, flexWrap: "wrap" }}>
            {movie.release_date && (
              <span style={{
                background: "#33373c", color: "#fff",
                borderRadius: 7, padding: "3px 11px",
                fontSize: 13, marginRight: 3
              }}>
                {movie.release_date.slice(0, 4)}
              </span>
            )}
            {/* Genres */}
            {genreLabels.map((label, i) => (
              <span key={label} style={{
                background: "#33373c", color: "#fff",
                borderRadius: 7, padding: "3px 11px",
                fontSize: 13, marginRight: 3
              }}>
                {label}
              </span>
            ))}
          </div>
          <div style={{
            fontSize: 14, color: "#f2f2f2", marginBottom: 19,
            fontWeight: 400, lineHeight: 1.52
          }}>
            {movie.overview || "No description available."}
          </div>
          <button
            onClick={onSignIn}
            aria-label="Sign up or log in to start tracking"
            style={{
              background: "linear-gradient(90deg,#fe9245 10%,#eb423b 90%)",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontWeight: 700,
              fontSize: 14,
              padding: "7px 17px",
              minWidth: 82,
              boxShadow: "0 2px 8px #fe92451a",
              cursor: "pointer",
              transition: "all 0.15s",
              letterSpacing: "0.01em",
              marginTop: 6,
              display: "flex", alignItems: "center", gap: 7,
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = "linear-gradient(90deg,#eb423b 10%,#fe9245 90%)";
              e.currentTarget.style.transform = "scale(1.04)";
              e.currentTarget.style.boxShadow = "0 6px 18px #fe92452d";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = "linear-gradient(90deg,#fe9245 10%,#eb423b 90%)";
              e.currentTarget.style.transform = "none";
              e.currentTarget.style.boxShadow = "0 2px 8px #fe92451a";
            }}
          >
            Get Started <span style={{ fontSize: 16, marginLeft: 1 }}>›</span>
          </button>
        </div>
      </div>
    </>
  );
}
