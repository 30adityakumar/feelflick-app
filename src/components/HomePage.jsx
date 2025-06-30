import React, { useState, useEffect, useRef } from "react";
import MovieModal from "./MovieModal";

export default function HomePage({ userName = "Movie Lover", userId }) {
  const [trending, setTrending] = useState([]);
  const [watched, setWatched] = useState([]);
  const [modalMovie, setModalMovie] = useState(null);

  // Fetch trending movies from TMDb
  useEffect(() => {
    fetch(
      `https://api.themoviedb.org/3/trending/movie/week?api_key=${import.meta.env.VITE_TMDB_API_KEY}`
    )
      .then(res => res.json())
      .then(data => setTrending(data.results || []));
  }, []);

  // Fetch watched history from Supabase
  useEffect(() => {
    if (!userId) return;
    import("../supabaseClient").then(({ supabase }) => {
      supabase
        .from('movies_watched')
        .select('*')
        .eq('user_id', userId)
        .order('id', { ascending: false })
        .then(({ data }) => setWatched(data || []));
    });
  }, [userId]);

  const closeModal = () => setModalMovie(null);

  return (
    <div style={{ minHeight: "100vh", background: "#101015", width: "100vw", overflowX: "hidden" }}>
      {/* VIDEO HERO */}
      <div style={{ position: "relative", width: "100vw", height: 420, overflow: "hidden" }}>
        <video
          autoPlay
          muted
          playsInline
          poster="/home-hero-poster.jpg"
          src="/home-hero.mp4"
          style={{
            width: "100vw",
            height: "420px",
            objectFit: "cover",
            filter: "brightness(0.63)",
            background: "#232d41"
          }}
        />
        {/* Overlay greeting and button */}
        <div style={{
          position: "absolute",
          top: 0, left: 0, width: "100%", height: "100%",
          display: "flex", flexDirection: "column",
          alignItems: "flex-start", justifyContent: "center",
          paddingLeft: "7vw", paddingTop: 24, zIndex: 2
        }}>
          <div style={{
            fontSize: 44,
            fontWeight: 900,
            color: "#fff",
            letterSpacing: "-2px",
            marginBottom: 12,
            textShadow: "0 4px 16px #000b, 0 1px 16px #232d41"
          }}>
            Welcome back{userName ? `, ${userName}` : ""}!
          </div>
          <div style={{
            fontSize: 20,
            color: "#fdaf41",
            fontWeight: 700,
            marginBottom: 15,
            textShadow: "0 2px 12px #000d"
          }}>
            Discover movies you'll love — powered by your tastes and mood.
          </div>
          <button
            style={{
              fontWeight: 800,
              fontSize: 21,
              background: "linear-gradient(100deg,#fe9245 10%,#eb423b 95%)",
              color: "#fff",
              border: "none",
              borderRadius: 11,
              padding: "13px 32px",
              marginTop: 6,
              boxShadow: "0 1.5px 18px 0 #fe924522",
              cursor: "pointer",
              transition: "opacity 0.14s"
            }}
            onClick={() => window.alert("Mood-based recommendations coming soon!")}
          >
            Explore Mood Recommendations
          </button>
        </div>
      </div>

      {/* MAIN CAROUSELS (no margins, edge-to-edge) */}
      <div style={{ width: "100vw", padding: "0 0 0 0", margin: 0, boxSizing: "border-box" }}>
        <div style={{ maxWidth: 1300, margin: "0 auto", padding: "28px 30px 0 30px" }}>
          <HomeCarousel
            title="Trending Now"
            movies={trending}
            emptyMessage="Trending movies will appear here!"
            onMovieClick={setModalMovie}
          />
          <HomeCarousel
            title="Your Watch History"
            movies={watched}
            emptyMessage="Your recently watched movies will show up here."
            onMovieClick={setModalMovie}
          />
        </div>
      </div>

      {/* Movie Details Modal */}
      {modalMovie && (
        <MovieModal
          movie={modalMovie}
          open={!!modalMovie}
          onClose={closeModal}
        />
      )}

      {/* FOOTER */}
      <div style={{
        textAlign: "center",
        fontSize: 13,
        color: "#fff",
        opacity: 0.23,
        marginTop: 40
      }}>
        © {new Date().getFullYear()} FeelFlick — Movies that match your mood.
      </div>
    </div>
  );
}

// Carousel
function HomeCarousel({ title, movies, emptyMessage, onMovieClick }) {
  const scrollRef = useRef();

  function scrollBy(offset) {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  }

  const showArrows = movies && movies.length > 5 && typeof window !== "undefined" && window.innerWidth > 700;

  return (
    <div style={{ marginBottom: 44, position: 'relative' }}>
      <div style={{ fontSize: 23, fontWeight: 800, color: "#fff", marginBottom: 13 }}>
        {title}
      </div>
      <div style={{ position: "relative" }}>
        {movies && movies.length > 0 ? (
          <>
            {showArrows && (
              <>
                <button
                  onClick={() => scrollBy(-370)}
                  style={arrowBtnStyle("left")}
                  aria-label="Scroll left"
                >‹</button>
                <button
                  onClick={() => scrollBy(370)}
                  style={arrowBtnStyle("right")}
                  aria-label="Scroll right"
                >›</button>
              </>
            )}
            <div
              ref={scrollRef}
              style={{
                display: "flex",
                gap: 28,
                overflowX: "auto",
                paddingBottom: 4,
                scrollBehavior: "smooth",
                scrollbarWidth: "none",
              }}
              className="no-scrollbar"
            >
              {movies.map((movie) => (
                <div
                  key={movie.id || movie.movie_id}
                  style={{
                    width: 155,
                    minWidth: 155,
                    borderRadius: 14,
                    overflow: "hidden",
                    background: "#232d41",
                    boxShadow: "0 2px 16px #0008",
                    cursor: "pointer",
                    textAlign: "center",
                    position: "relative",
                    transition: "transform 0.18s, box-shadow 0.17s",
                  }}
                  tabIndex={0}
                  aria-label={movie.title}
                  onClick={() => onMovieClick && onMovieClick(movie)}
                  onMouseOver={e => {
                    e.currentTarget.style.transform = "scale(1.07)";
                    e.currentTarget.style.boxShadow = "0 6px 36px #fdaf4122";
                  }}
                  onMouseOut={e => {
                    e.currentTarget.style.transform = "scale(1.0)";
                    e.currentTarget.style.boxShadow = "0 2px 16px #0008";
                  }}
                >
                  {movie.poster_path || movie.poster ? (
                    <img
                      src={`https://image.tmdb.org/t/p/w342${movie.poster_path || movie.poster}`}
                      alt={movie.title}
                      style={{
                        width: "100%",
                        height: 232,
                        objectFit: "cover",
                        display: "block",
                        borderTopLeftRadius: 14,
                        borderTopRightRadius: 14,
                        transition: "filter 0.16s",
                      }}
                    />
                  ) : (
                    <div style={{
                      height: 232,
                      background: "#18305a",
                      color: "#fff",
                      fontSize: 32,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}>
                      🎬
                    </div>
                  )}
                  <div style={{
                    color: "#fff",
                    fontSize: 15,
                    fontWeight: 800,
                    margin: "7px 0 8px 0",
                    padding: "0 7px",
                    whiteSpace: "nowrap",
                    textOverflow: "ellipsis",
                    overflow: "hidden",
                    textAlign: "center",
                  }}>
                    {movie.title || movie.name}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div style={{ color: "#999", fontSize: 15, marginTop: 12, marginLeft: 5 }}>
            {emptyMessage}
          </div>
        )}
      </div>
    </div>
  );
}

// Helper: Arrow Button Style
function arrowBtnStyle(side) {
  return {
    position: "absolute",
    [side]: -12,
    top: "44%",
    zIndex: 5,
    background: "rgba(24,64,109,0.91)",
    color: "#fff",
    fontWeight: 900,
    fontSize: 28,
    border: "none",
    borderRadius: "50%",
    width: 38,
    height: 38,
    boxShadow: "0 3px 16px #0006",
    cursor: "pointer",
    opacity: 0.76,
    display: typeof window !== "undefined" && window.innerWidth > 700 ? "block" : "none",
    transition: "background 0.13s, opacity 0.16s",
    outline: "none",
  };
}
