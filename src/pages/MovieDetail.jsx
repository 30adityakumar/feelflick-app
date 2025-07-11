import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Header from "../components/Header";

const TMDB_KEY = import.meta.env.VITE_TMDB_API_KEY;
const TMDB_IMG = "https://image.tmdb.org/t/p/w500";
const TMDB_BACKDROP = "https://image.tmdb.org/t/p/original";

export default function MovieDetail() {
  const { id } = useParams();
  const [movie, setMovie] = useState(null);
  const [credits, setCredits] = useState(null);
  const [ratings, setRatings] = useState(null);
  const [trailer, setTrailer] = useState(null);
  const [similar, setSimilar] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    async function fetchData() {
      const res = await fetch(`https://api.themoviedb.org/3/movie/${id}?api_key=${TMDB_KEY}&language=en-US`);
      const data = await res.json();
      setMovie(data);

      // Fetch credits
      const creditsRes = await fetch(`https://api.themoviedb.org/3/movie/${id}/credits?api_key=${TMDB_KEY}`);
      setCredits(await creditsRes.json());

      // Fetch videos (trailers)
      const videoRes = await fetch(`https://api.themoviedb.org/3/movie/${id}/videos?api_key=${TMDB_KEY}`);
      const videosData = await videoRes.json();
      const ytTrailer = (videosData.results || []).find(v => v.type === "Trailer" && v.site === "YouTube");
      setTrailer(ytTrailer);

      // Fetch similar movies
      const similarRes = await fetch(`https://api.themoviedb.org/3/movie/${id}/similar?api_key=${TMDB_KEY}`);
      const similarData = await similarRes.json();
      setSimilar(similarData.results || []);

      // Fetch OMDb ratings
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

  // --- Page pieces ---
  const backdrop = movie.backdrop_path ? `${TMDB_BACKDROP}${movie.backdrop_path}` : "";
  const posterUrl = movie.poster_path ? `${TMDB_IMG}${movie.poster_path}` : "/placeholder-movie.png";
  const year = movie.release_date ? movie.release_date.slice(0, 4) : "";
  const genres = (movie.genres || []).map(g => g.name).join(", ");
  const runtime = movie.runtime ? `${movie.runtime} min` : "";
  const director = credits?.crew?.find(c => c.job === "Director");
  const topCast = credits?.cast?.slice(0, 6) || [];

  return (
    <div>
      <Header />
      <div style={{
        minHeight: "100vh",
        background: backdrop
          ? `linear-gradient(180deg,rgba(10,10,24,0.95) 60%,#161623 95%), url(${backdrop}) center/cover no-repeat`
          : "#161623",
        paddingTop: 70
      }}>
        <div style={{
          maxWidth: 920, margin: "0 auto", background: "rgba(23,23,34,0.98)",
          borderRadius: 22, boxShadow: "0 10px 48px #0009", padding: 0, overflow: "hidden"
        }}>
          <div style={{ display: "flex", flexWrap: "wrap" }}>
            <div style={{ flex: "0 0 288px", background: "#23232e" }}>
              <img
                src={posterUrl}
                alt={movie.title}
                style={{ width: 288, height: 430, objectFit: "cover", display: "block", borderRadius: "0 0 20px 0" }}
                onError={e => { e.currentTarget.src = "/placeholder-movie.png"; }}
              />
            </div>
            <div style={{ flex: 1, minWidth: 260, padding: "36px 34px 34px 36px" }}>
              <div style={{ fontSize: 36, fontWeight: 900, marginBottom: 8 }}>{movie.title} <span style={{ fontWeight: 400, color: "#ffbe60" }}>({year})</span></div>
              <div style={{ fontSize: 18, opacity: 0.9, marginBottom: 7 }}>
                {genres}{genres && " • "}{runtime}
              </div>
              <div style={{ fontStyle: "italic", opacity: 0.8, marginBottom: 14 }}>
                {movie.tagline}
              </div>
              <div style={{ fontSize: 17, margin: "18px 0", lineHeight: 1.54, opacity: 0.97 }}>
                {movie.overview}
              </div>
              <div style={{ marginBottom: 8, color: "#aab" }}>
                {director && <>🎬 <b style={{ color: "#fff" }}>{director.name}</b></>}
              </div>
              <div style={{ marginBottom: 14 }}>
                {topCast.length > 0 &&
                  <>
                    <div style={{ color: "#ffbe60", fontWeight: 700, marginBottom: 2 }}>Top Cast:</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "9px 17px", fontSize: 15 }}>
                      {topCast.map(actor =>
                        <span key={actor.id} style={{ opacity: 0.93 }}>{actor.name} <span style={{ color: "#aaa" }}>as</span> <span style={{ color: "#fff" }}>{actor.character}</span></span>
                      )}
                    </div>
                  </>
                }
              </div>
              {/* Ratings */}
              <div style={{ margin: "14px 0 20px 0", fontSize: 16 }}>
                {movie.vote_average && <span style={{ marginRight: 17, background: "#292", color: "#fff", borderRadius: 6, padding: "4px 8px", fontWeight: 700 }}>TMDb {movie.vote_average.toFixed(1)}</span>}
                {ratings?.imdbRating && <span style={{ marginRight: 17, background: "#446", color: "#fff", borderRadius: 6, padding: "4px 8px", fontWeight: 700 }}>IMDb {ratings.imdbRating}/10</span>}
                {ratings?.Metascore && <span style={{ marginRight: 17, background: "#356", color: "#fff", borderRadius: 6, padding: "4px 8px", fontWeight: 700 }}>Metacritic {ratings.Metascore}</span>}
                {ratings?.Ratings?.find(r => r.Source === "Rotten Tomatoes") &&
                  <span style={{ marginRight: 17, background: "#b53", color: "#fff", borderRadius: 6, padding: "4px 8px", fontWeight: 700 }}>RT {ratings.Ratings.find(r => r.Source === "Rotten Tomatoes").Value}</span>}
              </div>
              <div style={{ marginTop: 17 }}>
                <button style={{
                  padding: "12px 34px",
                  background: "linear-gradient(90deg,#fe9245 10%,#eb423b 90%)",
                  border: "none", color: "#fff", fontWeight: 700, fontSize: 17, borderRadius: 9, cursor: "pointer", marginRight: 16
                }}>
                  Add to Watchlist
                </button>
                <button style={{
                  padding: "12px 26px",
                  background: "#444", color: "#fff", fontWeight: 700, fontSize: 16, borderRadius: 8, border: "none", cursor: "pointer"
                }}>
                  Mark as Watched
                </button>
                {trailer &&
                  <a href={`https://www.youtube.com/watch?v=${trailer.key}`} target="_blank" rel="noopener noreferrer"
                    style={{ padding: "12px 18px", background: "#111b", color: "#ffd884", borderRadius: 8, marginLeft: 18, fontWeight: 700, fontSize: 15, textDecoration: "none" }}>
                    ▶ Watch Trailer
                  </a>
                }
              </div>
            </div>
          </div>
          {/* Similar Movies Row */}
          {similar.length > 0 &&
            <div style={{ marginTop: 38, padding: "0 36px 30px 36px" }}>
              <div style={{ fontWeight: 800, fontSize: 19, marginBottom: 13 }}>You Might Also Like</div>
              <div style={{ display: "flex", gap: 20, overflowX: "auto" }}>
                {similar.slice(0, 6).map(sm => (
                  <a href={`/movie/${sm.id}`} key={sm.id} style={{ display: "block", width: 110, color: "#fff", textDecoration: "none" }}>
                    <img src={sm.poster_path ? `https://image.tmdb.org/t/p/w342${sm.poster_path}` : "/placeholder-movie.png"} alt={sm.title} style={{ width: 110, height: 160, borderRadius: 9, marginBottom: 4, objectFit: "cover", background: "#23232e" }} />
                    <div style={{ fontSize: 14, textAlign: "center", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{sm.title}</div>
                  </a>
                ))}
              </div>
            </div>
          }
        </div>
      </div>
    </div>
  );
}
