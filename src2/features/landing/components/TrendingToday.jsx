import { useEffect, useState, useRef } from "react";

const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;

const CARD_WIDTH = 168;
const CARD_HEIGHT = 246;
const CARD_GAP = 32;
const VISIBLE_FULL = 5;
const PARTIAL = 0.5;

export default function TrendingToday({ onSignIn, onSignUp }) {
  // Use the passed in onSignUp for sign up, or fallback to a redirect.
  const handleSignUp = onSignUp || (() => { window.location.href = '/auth/sign-up'; });
  const [movies, setMovies] = useState([]);
  const scrollRef = useRef(null);

  // Modal state
  const [selectedMovie, setSelectedMovie] = useState(null);

  useEffect(() => {
    fetch(`https://api.themoviedb.org/3/trending/movie/day?api_key=${TMDB_API_KEY}`)
      .then(res => res.json())
      .then(data => setMovies((data.results || []).slice(0, 10)));
  }, []);

  const scrollAmount = CARD_WIDTH + CARD_GAP;
  const scrollLeft = () => {
    if (scrollRef.current) scrollRef.current.scrollBy({ left: -scrollAmount, behavior: "smooth" });
  };
  const scrollRight = () => {
    if (scrollRef.current) scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
  };

  const LEFT_PADDING = 44;
  const scrollerWidth =
    VISIBLE_FULL * CARD_WIDTH +
    PARTIAL * CARD_WIDTH +
    (VISIBLE_FULL + PARTIAL - 1) * CARD_GAP +
    LEFT_PADDING;

  return (
    <section style={{
      background: "rgba(10,10,10,0.73)",
      padding: "36px 0 55px 0",
      position: "relative",
      overflow: "visible",
      minHeight: 360,
      width: "100%",
      boxSizing: "border-box"
    }}>
      {/* Heading */}
      <div style={{
        fontWeight: 900,
        fontSize: "1.37rem",
        color: "#fff",
        letterSpacing: "0.14em",
        marginLeft: "8vw",
        marginBottom: 38,
        marginTop: 6,
        textAlign: "left",
        textTransform: "uppercase"
      }}>
        Trending Now
      </div>

      {/* Row wrapper for padding & arrows */}
      <div style={{
        position: "relative",
        width: "100%",
        padding: "0 8vw",
        boxSizing: "border-box",
        overflow: "visible"
      }}>
        {/* Left Arrow */}
        <button
          aria-label="Scroll Left"
          onClick={scrollLeft}
          style={{
            position: "absolute", left: 0, top: "52%", transform: "translateY(-50%)",
            background: "rgba(22,22,22,0.83)", border: "none", borderRadius: 14,
            width: 36, height: 62, color: "#fff", fontSize: 22,
            cursor: "pointer", zIndex: 6, opacity: 0.7, transition: "opacity 0.2s"
          }}
          onMouseOver={e => e.currentTarget.style.opacity = 1}
          onMouseOut={e => e.currentTarget.style.opacity = 0.7}
        >‹</button>
        {/* Right Arrow */}
        <button
          aria-label="Scroll Right"
          onClick={scrollRight}
          style={{
            position: "absolute", right: 0, top: "52%", transform: "translateY(-50%)",
            background: "rgba(22,22,22,0.83)", border: "none", borderRadius: 14,
            width: 36, height: 62, color: "#fff", fontSize: 22,
            cursor: "pointer", zIndex: 6, opacity: 0.7, transition: "opacity 0.2s"
          }}
          onMouseOver={e => e.currentTarget.style.opacity = 1}
          onMouseOut={e => e.currentTarget.style.opacity = 0.7}
        >›</button>

        {/* Horizontal scroller */}
        <div
          ref={scrollRef}
          style={{
            display: "flex",
            gap: CARD_GAP,
            overflowX: "auto",
            overflowY: "visible",
            margin: "0 auto",
            scrollbarWidth: "none",
            scrollSnapType: "x mandatory",
            minHeight: CARD_HEIGHT,
            alignItems: "flex-end",
            position: "relative",
            width: scrollerWidth,
            maxWidth: "100%",
            boxSizing: "border-box",
            marginLeft: "auto",
            marginRight: "auto",
            zIndex: 2,
            paddingLeft: LEFT_PADDING,
            paddingTop: 16 // space for pop
          }}
          className="trending-row"
        >
          {movies.map((movie, idx) => (
            <div
              key={movie.id}
              className="fflick-poster"
              tabIndex={0}
              onClick={() => setSelectedMovie(movie)}
              style={{
                position: "relative",
                flex: `0 0 ${CARD_WIDTH}px`,
                width: CARD_WIDTH,
                minWidth: CARD_WIDTH,
                height: CARD_HEIGHT,
                borderRadius: 15,
                boxShadow: "0 2px 11px #000b",
                background: "#181818",
                scrollSnapAlign: "center",
                overflow: "visible",
                marginBottom: 6,
                marginTop: 0,
                transition: "box-shadow 0.13s cubic-bezier(.32,1.4,.46,1), filter 0.13s cubic-bezier(.32,1.4,.46,1), transform 0.13s cubic-bezier(.32,1.4,.46,1)",
                zIndex: 2
              }}
              onMouseEnter={e => {
                const img = e.currentTarget.querySelector("img");
                img.style.boxShadow = "0 4px 16px #0009";
                img.style.filter = "brightness(1.06)";
                e.currentTarget.style.transform = "translateY(-5px) scale(1.03)";
                e.currentTarget.style.zIndex = 10;
              }}
              onMouseLeave={e => {
                const img = e.currentTarget.querySelector("img");
                img.style.boxShadow = "0 2px 11px #000c";
                img.style.filter = "";
                e.currentTarget.style.transform = "";
                e.currentTarget.style.zIndex = 2;
              }}
            >
              {/* Big ranking number */}
              <div style={{
                position: "absolute",
                left: -26,
                bottom: 12,
                fontSize: "4.8rem",
                fontWeight: 900,
                color: "#fff",
                opacity: 0.8, // more transparent now
                WebkitTextStroke: "2.5px #fff",
                textStroke: "2.5px #fff",
                lineHeight: 1,
                zIndex: 3,
                pointerEvents: "none",
                textShadow: "0 2px 8px #000a",
                fontFamily: "Montserrat,Arial,sans-serif"
              }}>{idx + 1}</div>

              {/* Poster */}
              <img
                src={movie.poster_path
                  ? `https://image.tmdb.org/t/p/w342${movie.poster_path}`
                  : "/posters/placeholder.png"}
                alt={movie.title}
                style={{
                  width: CARD_WIDTH, height: CARD_HEIGHT, objectFit: "cover",
                  borderRadius: 15,
                  boxShadow: "0 2px 11px #000c",
                  display: "block",
                  background: "#191919",
                  transition: "box-shadow 0.13s, filter 0.13s"
                }}
              />
            </div>
          ))}
        </div>
      </div>
      <style>{`
        .trending-row::-webkit-scrollbar { display: none; }
        .fflick-poster:focus img {
          box-shadow: 0 4px 16px #0009 !important;
          filter: brightness(1.06);
        }
        .fflick-poster:focus {
          transform: translateY(-5px) scale(1.03) !important;
          z-index: 10;
        }
      `}</style>
      {/* MovieModal shown if a movie is selected */}
      {selectedMovie && (
        <MovieModal
          movie={selectedMovie}
          onClose={() => setSelectedMovie(null)}
          onSignIn={handleSignUp} // <-- This points to SIGN UP page now!
        />
      )}
    </section>
  );
}

// --- MovieModal Component (inline for this file) ---
function MovieModal({ movie, onClose, onSignIn }) {
  if (!movie) return null;
  const GENRES = {
    28: "Action", 12: "Adventure", 16: "Animation", 35: "Comedy", 80: "Crime", 99: "Documentary", 18: "Drama",
    10751: "Family", 14: "Fantasy", 36: "History", 27: "Horror", 10402: "Music", 9648: "Mystery", 10749: "Romance",
    878: "Sci-Fi", 10770: "TV", 53: "Thriller", 10752: "War", 37: "Western"
  };
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
            onClick={onSignIn}
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
