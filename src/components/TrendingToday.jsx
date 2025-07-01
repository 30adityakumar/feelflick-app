import { useEffect, useState, useRef } from "react"

const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY

// Simple genre map for quick lookup
const GENRES = {
  28: "Action", 12: "Adventure", 16: "Animation", 35: "Comedy", 80: "Crime", 99: "Documentary", 18: "Drama",
  10751: "Family", 14: "Fantasy", 36: "History", 27: "Horror", 10402: "Music", 9648: "Mystery", 10749: "Romance",
  878: "Sci-Fi", 10770: "TV", 53: "Thriller", 10752: "War", 37: "Western"
};

export default function TrendingToday() {
  const [movies, setMovies] = useState([])
  const [loading, setLoading] = useState(true)
  const scrollRef = useRef(null)

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
  const scrollAmount = 350
  const scrollLeft = () => scrollRef.current && scrollRef.current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
  const scrollRight = () => scrollRef.current && scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });

  // Skeleton loader cards
  const skeletons = Array.from({ length: 7 })

  return (
    <section style={{
      maxWidth: 1300, margin: "48px auto 0", padding: "0 8vw",
      position: "relative"
    }}>
      <div style={{
        fontWeight: 800, fontSize: "1.4rem", color: "#d0ffd0",
        marginBottom: 20, letterSpacing: "-0.5px",
        textShadow: "0 2px 8px #0c0a"
      }}>
        <span role="img" aria-label="fire">🔥</span> Trending Today
      </div>
      {/* Arrows */}
      <button
        aria-label="Scroll Left"
        onClick={scrollLeft}
        style={{
          position: "absolute", left: 0, top: 92, zIndex: 3,
          background: "rgba(24,16,10,0.74)",
          border: "none", borderRadius: "50%", color: "#fff",
          width: 38, height: 38, boxShadow: "0 3px 18px #0004",
          fontSize: 24, display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", transition: "background 0.18s", outline: "none"
        }}
      >‹</button>
      <button
        aria-label="Scroll Right"
        onClick={scrollRight}
        style={{
          position: "absolute", right: 0, top: 92, zIndex: 3,
          background: "rgba(24,16,10,0.74)",
          border: "none", borderRadius: "50%", color: "#fff",
          width: 38, height: 38, boxShadow: "0 3px 18px #0004",
          fontSize: 24, display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", transition: "background 0.18s", outline: "none"
        }}
      >›</button>
      <div
        ref={scrollRef}
        style={{
          display: "flex", gap: 30,
          overflowX: "auto",
          padding: "28px 0 28px 0",
          marginTop: "-28px",
          scrollbarWidth: "none"
        }}
        className="fflick-trending-scroll"
      >
        {loading
          ? skeletons.map((_, i) => (
              <div key={i} style={{
                flex: "0 0 168px",
                minWidth: 168, maxWidth: 168,
                height: 262,
                borderRadius: 20,
                background: "linear-gradient(130deg, #2d1b15 75%, #231d1a 100%)",
                marginBottom: 6,
                boxShadow: "0 3px 18px #0c0a",
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center"
              }}>
                <div style={{
                  width: 128, height: 188, borderRadius: 15,
                  background: "linear-gradient(98deg, #382a20 66%, #2e1d13 100%)",
                  opacity: 0.44, marginBottom: 13
                }} />
                <div style={{ width: 100, height: 15, borderRadius: 5, background: "#fff2", marginBottom: 7 }} />
                <div style={{ width: 55, height: 13, borderRadius: 4, background: "#fff1" }} />
              </div>
            ))
          : movies.length === 0 ? (
              <div style={{ color: "#eee", fontSize: 17, fontWeight: 600, opacity: 0.7 }}>
                No trending movies found. Try again later!
              </div>
            )
          : movies.map(movie => (
            <div
              key={movie.id}
              className="fflick-card"
              tabIndex={0}
              style={{
                flex: "0 0 168px", minWidth: 168, maxWidth: 168,
                display: "flex", flexDirection: "column", alignItems: "center",
                borderRadius: 20,
                background: "rgba(28, 21, 15, 0.86)",
                boxShadow: "0 3.5px 16px 0 #0007",
                padding: "0 0 18px 0", marginBottom: 5,
                position: "relative",
                border: "1.5px solid rgba(255,91,46,0.13)",
                transition: "transform 0.21s cubic-bezier(.35,.8,.4,1.4), box-shadow 0.21s, border 0.13s",
                cursor: "pointer",
                outline: "none"
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = "translateY(-16px) scale(1.09)"
                e.currentTarget.style.boxShadow = "0 13px 44px 0 rgba(255,91,46,0.10), 0 2px 22px 0 #000a"
                e.currentTarget.style.zIndex = 1
                e.currentTarget.style.outline = "none"
                e.currentTarget.style.border = "1.5px solid rgba(255,91,46,0.21)"
                e.currentTarget.style.marginTop = "-16px"
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = ""
                e.currentTarget.style.boxShadow = "0 3.5px 16px 0 #0007"
                e.currentTarget.style.zIndex = 0
                e.currentTarget.style.outline = "none"
                e.currentTarget.style.border = "1.5px solid rgba(255,91,46,0.13)"
                e.currentTarget.style.marginTop = ""
              }}
              onFocus={e => {
                e.currentTarget.style.outline = "none"
              }}
            >
              <img
                src={
                  movie.poster_path
                    ? `https://image.tmdb.org/t/p/w342${movie.poster_path}`
                    : "/posters/placeholder.png"
                }
                alt={movie.title}
                style={{
                  width: 148, height: 216, objectFit: "cover",
                  borderRadius: 17, marginBottom: 11,
                  boxShadow: "0 2.5px 14px #000c"
                }}
              />
              <div style={{
                fontWeight: 800, color: "#fff", fontSize: "1.13rem",
                textAlign: "center", marginBottom: 1,
                overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis", width: 144
              }}>{movie.title}</div>
              <div style={{
                color: "#ffbe88", fontSize: 15, fontWeight: 600, textAlign: "center", marginBottom: 0
              }}>
                {movie.genre_ids?.length
                  ? GENRES[movie.genre_ids[0]] || "Drama"
                  : "Drama"}
              </div>
              <div style={{
                color: "#e6e6e6", fontSize: 14, textAlign: "center"
              }}>
                {movie.release_date?.slice(0, 4) || ""}
              </div>
            </div>
          ))}
      </div>
      <style>{`
        .fflick-trending-scroll::-webkit-scrollbar { display: none; }
        .fflick-card:focus, .fflick-card:active { outline: none !important; border: 1.5px solid rgba(255,91,46,0.16) !important;}
      `}</style>
    </section>
  )
}
