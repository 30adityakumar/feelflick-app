import { useEffect, useState } from "react"

const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY  // Make sure this is set in your Vite env

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

  if (loading) {
    return (
      <section style={{ maxWidth: 1160, margin: "30px auto", padding: "0 18px" }}>
        <div style={{
          fontWeight: 800, fontSize: "1.4rem", color: "#fff",
          marginBottom: 14, letterSpacing: "-0.4px"
        }}>Trending Today</div>
        <div style={{ color: "#aaa", fontSize: 16 }}>Loading...</div>
      </section>
    )
  }

  return (
    <section style={{
      maxWidth: 1160, margin: "30px auto", padding: "0 18px"
    }}>
      <div style={{
        fontWeight: 800, fontSize: "1.4rem", color: "#fff",
        marginBottom: 14, letterSpacing: "-0.4px"
      }}>Trending Today</div>
      <div style={{
        display: "flex", gap: 18, overflowX: "auto", paddingBottom: 10, scrollbarWidth: "thin"
      }}>
        {movies.map(movie => (
          <div key={movie.id} style={{
            flex: "0 0 135px", display: "flex", flexDirection: "column", alignItems: "center",
            borderRadius: 16, background: "#232745", boxShadow: "0 2px 12px #0005",
            padding: "0 0 14px 0", marginBottom: 5, minWidth: 135
          }}>
            <img
              src={
                movie.poster_path
                  ? `https://image.tmdb.org/t/p/w342${movie.poster_path}`
                  : "/posters/placeholder.png"
              }
              alt={movie.title}
              style={{
                width: 135, height: 196, objectFit: "cover",
                borderRadius: 15, marginBottom: 6, boxShadow: "0 2px 12px #0009"
              }}
            />
            <div style={{
              fontWeight: 800, color: "#fff", fontSize: "1.01rem", textAlign: "center", marginBottom: 2,
              whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden", width: 125
            }}>{movie.title}</div>
            <div style={{
              color: "#d5d6e5", fontSize: 13, textAlign: "center"
            }}>{movie.release_date?.slice(0, 4) || ""}</div>
            <div style={{
              background: "#eb423b", color: "#fff", borderRadius: "50%",
              fontWeight: 800, width: 33, height: 33,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 15, marginTop: 7, boxShadow: "0 1.5px 8px #eb423b3d"
            }}>
              {movie.vote_average ? Math.round(movie.vote_average * 10) : "NR"}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
