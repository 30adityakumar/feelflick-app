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
    <div style={{
      minHeight: "100vh",
      background: "#101015",
      width: "100vw",
      overflowX: "hidden",
    }}>
      {/* HERO VIDEO (FULL WIDTH) */}
      <div style={{
        position: "relative",
        width: "100vw",
        height: "410px",
        overflow: "hidden",
      }}>
        <video
          autoPlay
          muted
          playsInline
          poster="/home-hero-poster.jpg"
          src="/home-hero.mp4"
          style={{
            width: "100vw",
            height: "100%",
            objectFit: "cover",
            background: "#232d41",
            display: "block"
          }}
        />
        {/* Black overlay for legibility */}
        <div style={{
          position: "absolute",
          top: 0, left: 0, width: "100%", height: "100%",
          background: "linear-gradient(110deg,rgba(14,16,22,0.83) 58%,rgba(24,64,109,0.43) 100%)",
        }} />
        {/* Overlay greeting/button (perfectly centered) */}
        <div style={{
          position: "absolute",
          top: 0, left: 0, width: "100%", height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 2,
          textAlign: "center"
        }}>
          <div style={{
            fontSize: "clamp(2.1rem,4vw,3.2rem)",
            fontWeight: 900,
            color: "#fff",
            letterSpacing: "-2px",
            marginBottom: 10,
            textShadow: "0 4px 18px #000b, 0 1px 16px #232d41"
          }}>
            Welcome back{userName ? `, ${userName}` : ""}!
          </div>
          <div style={{
            fontSize: "clamp(1rem,1.7vw,1.45rem)",
            color: "#fdaf41",
            fontWeight: 700,
            marginBottom: 18,
            textShadow: "0 2px 12px #000d"
          }}>
            Discover movies you'll love — powered by your tastes and mood.
          </div>
          <button
            style={{
              fontWeight: 800,
              fontSize: "clamp(1rem,1.3vw,1.15rem)",
              background: "linear-gradient(100deg,#fe9245 10%,#eb423b 95%)",
              color: "#fff",
              border: "none",
              borderRadius: 11,
              padding: "13px 34px",
              marginTop: 6,
              boxShadow: "0 1.5px 18px 0 #fe924522",
              cursor: "pointer",
              transition: "opacity 0.14s"
            }}
            onClick={() => window.alert("Mood-based recommendations coming soon!")}
          >
            EXPLORE MOOD RECOMMENDATIONS
          </button>
        </div>
      </div>

      {/* CAROUSELS (FULL WIDTH) */}
      <div style={{
        width: "100vw",
        background: "transparent",
        margin: "0",
        padding: "0"
      }}>
        <div style={{
          width: "100vw",
          padding: "0 3vw", // add some side padding for breath
          marginTop: 30
        }}>
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

      {/* MOVIE DETAILS MODAL */}
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
        marginTop: 30,
        marginBottom: 8
      }}>
        © {new Date().getFullYear()} FeelFlick — Movies that match your mood.
      </div>
    </div>
  );
}

// Carousel (FULL WIDTH, ARROWS CENTERED)
function HomeCarousel({ title, movies, emptyMessage, onMovieClick }) {
  const scrollRef = useRef();

  function scrollBy(offset) {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  }

  const showArrows = movies && movies.length > 5 && typeof window !== "undefined" && window.innerWidth > 700;

  return (
    <div style={{ marginBottom: 35, position: 'relative', width: "100%" }}>
      <div style={{
        fontSize: "clamp(1.25rem,2vw,1.7rem)",
        fontWeight: 800,
        color: "#fff",
        marginBottom: 10
      }}>
        {title}
      </div>
      <div style={{ position: "relative" }}>
        {movies && movies.length > 0 ? (
          <>
            {showArrows && (
              <>
                <button
                  onClick={() => scrollBy(-350)}
                  style={arrowBtnStyle("left")}
                  aria-label="Scroll left"
                >
                  <span style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.7rem",
                    fontWeight: 900,
                    lineHeight: 1
                  }}>‹</span>
                </button>
                <button
                  onClick={() => scrollBy(350)}
                  style={arrowBtnStyle("right")}
                  aria-label="Scroll right"
                >
                  <span style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.7rem",
                    fontWeight: 900,
                    lineHeight: 1
                  }}>›</span>
                </button>
              </>
            )}
            <div
              ref={scrollRef}
              style={{
                display: "flex",
                gap: 18,
                overflowX: "auto",
                paddingBottom: 4,
                scrollBehavior: "smooth",
                scrollbarWidth: "none",
                width: "100%",
              }}
              className="no-scrollbar"
            >
              {movies.map((movie) => (
                <div
                  key={movie.id || movie.movie_id}
                  style={{
                    width: 124,
                    minWidth: 124,
                    borderRadius: 12,
                    overflow: "hidden",
                    background: "#232d41",
                    boxShadow: "0 2px 10px #0007",
                    cursor: "pointer",
                    textAlign: "center",
                    position: "relative",
                    transition: "transform 0.16s, box-shadow 0.16s",
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
                    e.currentTarget.style.boxShadow = "0 2px 10px #0007";
                  }}
                >
                  {movie.poster_path || movie.poster ? (
                    <img
                      src={`https://image.tmdb.org/t/p/w342${movie.poster_path || movie.poster}`}
                      alt={movie.title}
                      style={{
                        width: "100%",
                        height: 175,
                        objectFit: "cover",
                        display: "block",
                        borderTopLeftRadius: 12,
                        borderTopRightRadius: 12,
                        transition: "filter 0.14s",
                      }}
                    />
                  ) : (
                    <div style={{
                      height: 175,
                      background: "#18305a",
                      color: "#fff",
                      fontSize: 20,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}>
                      🎬
                    </div>
                  )}
                  <div style={{
                    color: "#fff",
                    fontSize: 12,
                    fontWeight: 800,
                    margin: "5px 0 7px 0",
                    padding: "0 5px",
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
          <div style={{ color: "#999", fontSize: 13, marginTop: 10, marginLeft: 4 }}>
            {emptyMessage}
          </div>
        )}
      </div>
    </div>
  );
}

function arrowBtnStyle(side) {
  return {
    position: "absolute",
    [side]: -16,
    top: "50%",
    transform: "translateY(-50%)",
    zIndex: 5,
    background: "rgba(24,64,109,0.91)",
    color: "#fff",
    border: "none",
    borderRadius: "50%",
    width: 34,
    height: 34,
    display: typeof window !== "undefined" && window.innerWidth > 700 ? "flex" : "none",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 3px 12px #0006",
    cursor: "pointer",
    opacity: 0.78,
    transition: "background 0.13s, opacity 0.16s",
    outline: "none",
    padding: 0
  };
}
