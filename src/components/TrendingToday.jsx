import { useEffect, useState, useRef } from "react"

const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY

const GENRES = {
  28: "Action", 12: "Adventure", 16: "Animation", 35: "Comedy", 80: "Crime", 99: "Documentary", 18: "Drama",
  10751: "Family", 14: "Fantasy", 36: "History", 27: "Horror", 10402: "Music", 9648: "Mystery", 10749: "Romance",
  878: "Sci-Fi", 10770: "TV", 53: "Thriller", 10752: "War", 37: "Western"
};

export default function TrendingToday() {
  const [movies, setMovies] = useState([])
  const [loading, setLoading] = useState(true)
  const scrollRef = useRef(null)
  const [selectedMovie, setSelectedMovie] = useState(null)

  useEffect(() => {
    setLoading(true)
    fetch(`https://api.themoviedb.org/3/trending/movie/day?api_key=${TMDB_API_KEY}`)
      .then(res => res.json())
      .then(data => {
        setMovies(data.results || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  // Horizontal scroll arrows
  const scrollAmount = 360
  const scrollLeft = () => scrollRef.current && scrollRef.current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
  const scrollRight = () => scrollRef.current && scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });

  // Drag-to-scroll for mobile
  useEffect(() => {
    const node = scrollRef.current
    if (!node) return
    let startX = 0, scrollLeftVal = 0, isDown = false

    function onDown(e) {
      isDown = true
      startX = e.type === 'touchstart' ? e.touches[0].pageX : e.pageX
      scrollLeftVal = node.scrollLeft
    }
    function onMove(e) {
      if (!isDown) return
      const x = e.type === 'touchmove' ? e.touches[0].pageX : e.pageX
      node.scrollLeft = scrollLeftVal - (x - startX)
    }
    function onUp() { isDown = false }
    node.addEventListener('mousedown', onDown)
    node.addEventListener('mousemove', onMove)
    node.addEventListener('mouseleave', onUp)
    node.addEventListener('mouseup', onUp)
    node.addEventListener('touchstart', onDown, { passive: false })
    node.addEventListener('touchmove', onMove, { passive: false })
    node.addEventListener('touchend', onUp)
    return () => {
      node.removeEventListener('mousedown', onDown)
      node.removeEventListener('mousemove', onMove)
      node.removeEventListener('mouseleave', onUp)
      node.removeEventListener('mouseup', onUp)
      node.removeEventListener('touchstart', onDown)
      node.removeEventListener('touchmove', onMove)
      node.removeEventListener('touchend', onUp)
    }
  }, [])

  // Skeleton loader cards
  const skeletons = Array.from({ length: 7 })

  return (
    <section style={{
      maxWidth: 1300, margin: "0 auto", padding: "0 0vw", overflow: "visible",
      position: "relative",
      marginTop: 38,
      background: "rgba(10,10,10,0.73)",
      borderRadius: 0,
      minHeight: 380
    }}>
      <style>{`
        @media (max-width: 1020px) {
          .fflick-trending-row { gap: 3vw !important; }
          .fflick-trending-title { font-size: 1.18rem !important; padding-left: 3vw !important; }
        }
        @media (max-width: 700px) {
          .fflick-trending-row { gap: 10px !important; padding-bottom: 7vw !important; }
          .fflick-card { min-width: 65vw !important; max-width: 66vw !important; }
          .fflick-trending-title { font-size: 1rem !important; }
        }
      `}</style>
      {/* Title */}
      <div className="fflick-trending-title" style={{
        fontWeight: 800, fontSize: "1.35rem", color: "#fff",
        marginBottom: 22, letterSpacing: "0.01em", marginTop: 0,
        paddingLeft: 36, paddingTop: 24, textAlign: "left"
      }}>
        Trending Now
      </div>
      {/* Arrows */}
      <button
        aria-label="Scroll Left"
        onClick={scrollLeft}
        style={{
          position: "absolute", left: 0, top: "58%", zIndex: 3, transform: "translateY(-50%)",
          background: "rgba(24,16,10,0.65)",
          border: "none", borderRadius: "50%", color: "#fff",
          width: 40, height: 48, boxShadow: "0 3px 18px #0004",
          fontSize: 29, display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", transition: "background 0.18s", outline: "none"
        }}
      >‹</button>
      <button
        aria-label="Scroll Right"
        onClick={scrollRight}
        style={{
          position: "absolute", right: 0, top: "58%", zIndex: 3, transform: "translateY(-50%)",
          background: "rgba(24,16,10,0.65)",
          border: "none", borderRadius: "50%", color: "#fff",
          width: 40, height: 48, boxShadow: "0 3px 18px #0004",
          fontSize: 29, display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", transition: "background 0.18s", outline: "none"
        }}
      >›</button>
      {/* Movie row */}
      <div
        ref={scrollRef}
        className="fflick-trending-row"
        style={{
          display: "flex", gap: 28,
          overflowX: "auto",
          overflowY: "visible",
          padding: "6px 36px 36px 36px",
          margin: 0,
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          width: "100%",
        }}
      >
        {loading
          ? skeletons.map((_, i) => (
              <div key={i} style={{
                flex: "0 0 176px",
                minWidth: 176, maxWidth: 176,
                height: 266,
                borderRadius: 22,
                background: "linear-gradient(130deg, #2d1b15 75%, #231d1a 100%)",
                marginBottom: 6,
                boxShadow: "0 3px 18px #0c0a",
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center"
              }}>
                <div style={{
                  width: 130, height: 190, borderRadius: 17,
                  background: "linear-gradient(98deg, #382a20 66%, #2e1d13 100%)",
                  opacity: 0.44, marginBottom: 13
                }} />
                <div style={{ width: 100, height: 15, borderRadius: 5, background: "#fff2", marginBottom: 7 }} />
                <div style={{ width: 55, height: 13, borderRadius: 4, background: "#fff1" }} />
              </div>
            ))
          : movies.slice(0, 10).map((movie, i) => (
            <div
              key={movie.id}
              className="fflick-card"
              tabIndex={0}
              onClick={() => setSelectedMovie(movie)}
              style={{
                flex: "0 0 176px", minWidth: i === 4 ? 88 : 176, maxWidth: 176,
                display: "flex", flexDirection: "column", alignItems: "center",
                borderRadius: 22,
                background: "rgba(28, 21, 15, 0.81)",
                boxShadow: "0 3.5px 18px 0 #0009",
                padding: "0 0 13px 0", marginBottom: 5,
                position: "relative",
                border: "none",
                transition: "transform 0.15s cubic-bezier(.32,.8,.4,1.4), box-shadow 0.17s",
                cursor: "pointer",
                outline: "none",
                marginRight: i === 4 ? -65 : 0, // half-show 6th movie
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = "translateY(-9px) scale(1.04)"
                e.currentTarget.style.boxShadow = "0 8px 32px 0 rgba(255,91,46,0.08), 0 2px 14px 0 #000b"
                e.currentTarget.style.zIndex = 1
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = ""
                e.currentTarget.style.boxShadow = "0 3.5px 18px 0 #0009"
                e.currentTarget.style.zIndex = 0
              }}
              onFocus={e => { e.currentTarget.style.outline = "none" }}
            >
              <img
                src={
                  movie.poster_path
                    ? `https://image.tmdb.org/t/p/w342${movie.poster_path}`
                    : "/posters/placeholder.png"
                }
                alt={movie.title}
                style={{
                  width: 154, height: 225, objectFit: "cover",
                  borderRadius: 18, marginBottom: 11,
                  boxShadow: "0 2.5px 14px #000d"
                }}
              />
              {/* Ranking Number */}
              <div style={{
                position: "absolute",
                left: -28, top: 169,
                fontSize: 74, fontWeight: 900,
                color: "#fff",
                opacity: 0.14,
                textShadow: "0 3px 8px #000, 0 1px 0 #eb423b14",
                letterSpacing: "-7px",
                userSelect: "none",
                pointerEvents: "none"
              }}>{i + 1}</div>
            </div>
          ))}
      </div>
      {/* Movie Modal */}
      {selectedMovie && (
        <MovieModal movie={selectedMovie} onClose={() => setSelectedMovie(null)} />
      )}
    </section>
  )
}

// --- MovieModal Component ---
function MovieModal({ movie, onClose }) {
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
            onClick={() => { /* add sign-up action or navigation */ }}
            style={{
              background: "#e50914",
              color: "#fff",
              border: "none",
              borderRadius: 7,
              fontWeight: 600,
              fontSize: 18,
              padding: "13px 28px",
              boxShadow: "0 2px 12px #e5091431",
              cursor: "pointer",
              letterSpacing: "0.01em",
              marginTop: 8,
              display: "flex", alignItems: "center", gap: 7
            }}
          >
            Get Started <span style={{ fontSize: 22, marginLeft: 1 }}>›</span>
          </button>
        </div>
      </div>
    </>
  );
}
