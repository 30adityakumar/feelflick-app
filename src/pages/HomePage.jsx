import { useState, useEffect } from "react";
import CarouselRow from "../components/CarouselRow";

const FEATURED_MOVIE = {
  title: "Oppenheimer",
  overview: "The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb.",
  backdrop_path: "/q8U8wF4Y6WzTGSpfOdG2hyO6wCv.jpg",
  poster_path: "/2GQySOUQG7dGQeLW2zKq8G8A1LQ.jpg"
};

export default function HomePage({ userName }) {
  // Placeholder movie rows; replace with API or DB queries later
  const [recommended, setRecommended] = useState([]);
  const [popular, setPopular] = useState([]);

  useEffect(() => {
    // TODO: Fetch recommended and popular movies here, or from TMDb API/Supabase
    setRecommended([
      { id: 1, title: "Barbie", poster_path: "/iuFNMS8U5cb6xfzi51Dbkovj7vM.jpg" },
      { id: 2, title: "The Dark Knight", poster_path: "/qJ2tW6WMUDux911r6m7haRef0WH.jpg" },
      { id: 3, title: "Past Lives", poster_path: "/k3waqVXSnvCZWfJYNtdamTgTtTA.jpg" },
      { id: 4, title: "Inception", poster_path: "/edv5CZvWj09upOsy2Y6IwDhK8bt.jpg" }
    ]);
    setPopular([
      { id: 5, title: "Avatar", poster_path: "/jRXYjXNq0Cs2TcJjLkki24MLp7u.jpg" },
      { id: 6, title: "Inception", poster_path: "/edv5CZvWj09upOsy2Y6IwDhK8bt.jpg" },
      { id: 7, title: "No Hard Feelings", poster_path: "/gD72DhJ7NbfxvtxGiAzLaa0xaoj.jpg" }
    ]);
  }, []);

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
