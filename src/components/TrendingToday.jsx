import { useEffect, useState } from "react"

const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY

export default function TrendingToday() {
  const [movies, setMovies] = useState([])
  const [loading, setLoading] = useState(true)

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

  // Skeleton loader cards
  const skeletons = Array.from({ length: 7 })

  return (
    <section style={{
      maxWidth: 1240, margin: "48px auto 0", padding: "0 8vw",
      position: "relative"
    }}>
      <div style={{
        fontWeight: 800, fontSize: "1.4rem", color: "#fff",
        marginBottom: 20, letterSpacing: "-0.5px",
        textShadow: "0 2px 8px #0c0a"
      }}>
        🔥 Trending Today
      </div>

      <div
        style={{
          display: "flex", gap: 26,
          overflowX: "auto",
          paddingBottom: 16,
          scrollbarWidth: "none"
        }}
        className="fflick-trending-scroll"
      >
        {loading
          ? skeletons.map((_, i) => (
              <div key={i} style={{
                flex: "0 0 148px",
                minWidth: 148, maxWidth: 148,
                height: 238,
                borderRadius: 19,
                background: "linear-gradient(130deg, #2d1b15 75%, #231d1a 100%)",
                marginBottom: 6,
                boxShadow: "0 3px 18px #0c0a",
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center"
              }}>
                <div style={{
                  width: 116, height: 166, borderRadius: 13,
                  background: "linear-gradient(98deg, #382a20 66%, #2e1d13 100%)",
                  opacity: 0.45, marginBottom: 12
                }} />
                <div style={{ width: 90, height: 13, borderRadius: 4, background: "#fff2", marginBottom: 6 }} />
                <div style={{ width: 50, height: 11, borderRadius: 4, background: "#fff1" }} />
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
              style={{
                flex: "0 0 148px", minWidth: 148, maxWidth: 148,
                display: "flex", flexDirection: "column", alignItems: "center",
                borderRadius: 19,
                background: "rgba(28, 21, 15, 0.79)",
                boxShadow: "0 3.5px 16px 0 #0007",
                padding: "0 0 16px 0", marginBottom: 5,
                position: "relative",
                border: "1.3px solid rgba(255,91,46,0.12)",
                transition: "transform 0.22s cubic-bezier(.35,.8,.4,1.4), box-shadow 0.22s, border 0.18s",
                cursor: "pointer"
              }}
              tabIndex={0}
              onMouseEnter={e => {
                e.currentTarget.style.transform = "translateY(-8px) scale(1.06)"
                e.currentTarget.style.boxShadow = "0 7px 28px 0 rgba(255,91,46,0.13), 0 2px 24px 0 #0008"
                e.currentTarget.style.border = "2.2px solid var(--theme-color, #ff5b2e)"
                e.currentTarget.style.zIndex = 1
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = ""
                e.currentTarget.style.boxShadow = "0 3.5px 16px 0 #0007"
                e.currentTarget.style.border = "1.3px solid rgba(255,91,46,0.12)"
                e.currentTarget.style.zIndex = 0
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
                  width: 132, height: 196, objectFit: "cover",
                  borderRadius: 14, marginBottom: 7,
                  boxShadow: "0 2.5px 14px #000c"
                }}
              />
              <div style={{
                fontWeight: 800, color: "#fff", fontSize: "1.07rem",
                textAlign: "center", marginBottom: 3,
                overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis", width: 124
              }}>{movie.title}</div>
              <div style={{
                color: "#e6e6e6", fontSize: 14, textAlign: "center", marginBottom: 3
              }}>{movie.release_date?.slice(0, 4) || ""}</div>
              <div style={{
                background: "linear-gradient(90deg, #FF5B2E 60%, #FFD9B7 100%)",
                color: "#fff", borderRadius: "50%",
                fontWeight: 800, width: 33, height: 33,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 15, marginTop: 6, boxShadow: "0 1.5px 8px #ff5b2e3d",
                border: "2.5px solid #fff2"
              }}>
                {movie.vote_average ? Math.round(movie.vote_average * 10) : "NR"}
              </div>
            </div>
          ))}
      </div>
      <style>{`
        .fflick-trending-scroll::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </section>
  )
}
