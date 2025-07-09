import { useState, useEffect } from "react";
import CarouselRow from "../components/CarouselRow";
import { supabase } from "../supabaseClient";

const TMDB_KEY = import.meta.env.VITE_TMDB_API_KEY;

const FEATURED_MOVIE = {
  title: "Oppenheimer",
  overview: "The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb.",
  backdrop_path: "/q8U8wF4Y6WzTGSpfOdG2hyO6wCv.jpg",
};

export default function HomePage({ userName, userId }) {
  const [recommended, setRecommended] = useState([]);
  const [popular, setPopular] = useState([]);

  useEffect(() => {
    // Fetch "Popular Now" from TMDb
    fetch(`https://api.themoviedb.org/3/movie/popular?api_key=${TMDB_KEY}&language=en-US&page=1`)
      .then(r => r.json())
      .then(data => {
        setPopular((data.results || []).slice(0, 12));
      });

    // Fetch recommended for this user from Supabase (user's genres)
    async function fetchRecommended() {
      if (!userId) return;
      const { data: genres } = await supabase
        .from("user_preferences")
        .select("genre_id")
        .eq("user_id", userId);
      if (!genres || genres.length === 0) return;

      const genreString = genres.map(g => g.genre_id).join(",");
      fetch(`https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_KEY}&language=en-US&with_genres=${genreString}&sort_by=popularity.desc`)
        .then(r => r.json())
        .then(data => {
          setRecommended((data.results || []).slice(0, 12));
        });
    }
    fetchRecommended();
  }, [userId]);

  return (
    <div style={{ minHeight: "100vh", background: "#191820", color: "#fff", paddingBottom: 40 }}>
      {/* Hero Section */}
      <div style={{
        width: "100%",
        height: 420,
        background: `linear-gradient(to right, #18151ce9 60%, #18151c44 100%), url(https://image.tmdb.org/t/p/original${FEATURED_MOVIE.backdrop_path}) center/cover no-repeat`,
        borderRadius: "0 0 36px 36px",
        position: "relative",
        marginBottom: 32,
        display: "flex", alignItems: "flex-end", padding: 0,
        boxShadow: "0 5px 30px #0007"
      }}>
        <div style={{
          padding: "38px 40px 44px 48px", maxWidth: 540,
          background: "linear-gradient(90deg,#18151cf7 80%,#18151c99 100%)",
          borderRadius: "0 0 36px 0"
        }}>
          <div style={{ fontSize: 30, fontWeight: 800, marginBottom: 8 }}>{FEATURED_MOVIE.title}</div>
          <div style={{ fontSize: 17, opacity: 0.94, marginBottom: 20 }}>{FEATURED_MOVIE.overview}</div>
          <button style={{
            padding: "12px 34px",
            background: "linear-gradient(90deg,#fe9245 10%,#eb423b 90%)",
            border: "none", color: "#fff", fontWeight: 700, fontSize: 18, borderRadius: 9, cursor: "pointer"
          }}>
            Watch now
          </button>
        </div>
      </div>
      {/* Movie Rows */}
      <CarouselRow title="Recommended for you" movies={recommended} />
      <CarouselRow title="Popular Now" movies={popular} />
      {/* Add more rows as needed */}
    </div>
  );
}
