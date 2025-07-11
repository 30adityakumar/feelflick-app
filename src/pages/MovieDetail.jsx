import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

const TMDB_KEY = import.meta.env.VITE_TMDB_API_KEY;
const TMDB_IMG = "https://image.tmdb.org/t/p/w500";

export default function MovieDetail() {
  const { id } = useParams();
  const [movie, setMovie] = useState(null);
  const [credits, setCredits] = useState(null);
  const [ratings, setRatings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    async function fetchData() {
      const res = await fetch(`https://api.themoviedb.org/3/movie/${id}?api_key=${TMDB_KEY}&language=en-US`);
      const data = await res.json();
      const resCredits = await fetch(`https://api.themoviedb.org/3/movie/${id}/credits?api_key=${TMDB_KEY}`);
      const creditsData = await resCredits.json();
      setMovie(data);
      setCredits(creditsData);
      if (data.imdb_id) {
        const omdb = await fetch(`https://www.omdbapi.com/?apikey=${import.meta.env.VITE_OMDB_API_KEY}&i=${data.imdb_id}`);
        setRatings(await omdb.json());
      }
      setLoading(false);
    }
    fetchData();
  }, [id]);

  if (loading) return <div style={{ color: "#fff", textAlign: "center", marginTop: 60 }}>Loading...</div>;
  if (!movie) return <div style={{ color: "#fff" }}>Movie not found.</div>;

  const genres = (movie.genres || []).map(g => g.name).join(", ");
  const runtime = movie.runtime ? `${movie.runtime} min` : "";
  const year = movie.release_date ? movie.release_date.slice(0, 4) : "";
  const posterUrl = movie.poster_path ? `${TMDB_IMG}${movie.poster_path}` : "/placeholder-movie.png";
  const topCast = credits?.cast?.slice(0, 6) || [];
  const director = credits?.crew?.find(c => c.job === "Director");

  return (
    <div style={{ maxWidth: 850, margin: "40px auto", color: "#fff", background: "#181820", borderRadius: 18, boxShadow: "0 8px 40px #0007", overflow: "hidden" }}>
      <div style={{ display: "flex", flexWrap: "wrap" }}>
        <div style={{ flex: "0 0 280px", background: "#222" }}>
          <img
            src={posterUrl}
            alt={movie.title}
            style={{ width: 280, height: 410, objectFit: "cover", display: "block" }}
            onError={e => { e.currentTarget.src = "/placeholder-movie.png"; }}
          />
        </div>
        <div style={{ flex: 1, minWidth: 260, padding: "38px 32px 34px 32px" }}>
          <div style={{ fontSize: 32, fontWeight: 800, marginBottom: 8 }}>{movie.title} <span style={{ fontWeight: 400, color: "#ffbe60" }}>({year})</span></div>
          <div style={{ fontSize: 18, opacity: 0.87, marginBottom: 13 }}>
            {genres}{genres && " • "}{runtime}
          </div>
          <div style={{ fontSize: 17, margin: "22px 0", lineHeight: 1.55, opacity: 0.95 }}>
            {movie.overview}
          </div>
          <div style={{ margin: "10px 0 26px 0" }}>
            {director && <span style={{ marginRight: 18, color: "#aaa" }}>🎬 Directed by <b style={{ color: "#fff" }}>{director.name}</b></span>}
          </div>
          <div style={{ marginBottom: 16 }}>
            {topCast.length > 0 &&
              <>
                <div style={{ color: "#ffbe60", fontWeight: 700, marginBottom: 2 }}>Top Cast:</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "10px 16px", fontSize: 16 }}>
                  {topCast.map(actor =>
                    <div key={actor.id}>
                      {actor.name} <span style={{ color: "#aaa" }}>as</span> <span style={{ color: "#fff" }}>{actor.character}</span>
                    </div>
                  )}
                </div>
              </>
            }
          </div>
          <div style={{ margin: "12px 0 20px 0", fontSize: 16 }}>
            {movie.vote_average &&
              <span style={{ marginRight: 18 }}>⭐ TMDb {movie.vote_average.toFixed(1)}</span>}
            {ratings?.imdbRating &&
              <span style={{ marginRight: 18 }}>🎬 IMDb {ratings.imdbRating}/10</span>}
            {ratings?.Metascore &&
              <span style={{ marginRight: 18 }}>🟢 Metacritic {ratings.Metascore}</span>}
            {ratings?.Ratings?.find(r => r.Source === "Rotten Tomatoes") &&
              <span style={{ marginRight: 18 }}>🍅 RT {ratings.Ratings.find(r => r.Source === "Rotten Tomatoes").Value}</span>}
          </div>
          <div style={{ marginTop: 14 }}>
            <button style={{
              padding: "11px 36px",
              background: "linear-gradient(90deg,#fe9245 10%,#eb423b 90%)",
              border: "none", color: "#fff", fontWeight: 700, fontSize: 17, borderRadius: 9, cursor: "pointer", marginRight: 16
            }}>
              Add to Watchlist
            </button>
            <button style={{
              padding: "11px 28px",
              background: "#444", color: "#fff", fontWeight: 700, fontSize: 16, borderRadius: 8, border: "none", cursor: "pointer"
            }}>
              Mark as Watched
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
