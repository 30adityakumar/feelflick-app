import { useEffect, useState, useRef } from "react";

const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;

export default function TrendingToday() {
  const [movies, setMovies] = useState([]);
  const scrollRef = useRef(null);

  useEffect(() => {
    fetch(`https://api.themoviedb.org/3/trending/movie/day?api_key=${TMDB_API_KEY}`)
      .then(res => res.json())
      .then(data => setMovies(data.results || []));
  }, []);

  // Scrolling
  const scrollAmount = 330;
  const scrollLeft = () => scrollRef.current && scrollRef.current.scrollBy({ left: -scrollAmount, behavior: "smooth" });
  const scrollRight = () => scrollRef.current && scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });

  return (
    <section style={{
      background: "#000",
      padding: "44px 0 30px 0",
      position: "relative",
      overflow: "hidden"
    }}>
      {/* Heading */}
      <div style={{
        fontWeight: 900,
        fontSize: "2.6rem",
        color: "#fff",
        marginLeft: "6vw",
        marginBottom: 18,
        letterSpacing: "-1.5px"
      }}>
        Trending Now
      </div>

      {/* Left/Right Arrows */}
      <button
        aria-label="Scroll Left"
        onClick={scrollLeft}
        style={{
          position: "absolute", left: 0, top: "56%", transform: "translateY(-50%)",
          background: "rgba(22,22,22,0.82)", border: "none", borderRadius: 14,
          width: 48, height: 88, color: "#fff", fontSize: 33,
          cursor: "pointer", zIndex: 5, opacity: 0.75, transition: "opacity 0.2s"
        }}
        onMouseOver={e => e.currentTarget.style.opacity = 1}
        onMouseOut={e => e.currentTarget.style.opacity = 0.75}
      >‹</button>
      <button
        aria-label="Scroll Right"
        onClick={scrollRight}
        style={{
          position: "absolute", right: 0, top: "56%", transform: "translateY(-50%)",
          background: "rgba(22,22,22,0.82)", border: "none", borderRadius: 14,
          width: 48, height: 88, color: "#fff", fontSize: 33,
          cursor: "pointer", zIndex: 5, opacity: 0.75, transition: "opacity 0.2s"
        }}
        onMouseOver={e => e.currentTarget.style.opacity = 1}
        onMouseOut={e => e.currentTarget.style.opacity = 0.75}
      >›</button>

      {/* Card row */}
      <div
        ref={scrollRef}
        style={{
          display: "flex",
          gap: 44,
          overflowX: "auto",
          padding: "0 6vw 22px 6vw",
          scrollbarWidth: "none",
          scrollSnapType: "x mandatory",
          position: "relative",
        }}
        className="trending-row"
      >
        {movies.map((movie, idx) => (
          <div key={movie.id} style={{
            position: "relative",
            flex: "0 0 180px",
            width: 180,
            minWidth: 180,
            height: 270,
            borderRadius: 21,
            boxShadow: "0 3px 18px #0007",
            background: "#161616",
            scrollSnapAlign: "start",
            overflow: "visible",
            marginBottom: 18,
            transition: "transform 0.18s cubic-bezier(.32,1.4,.46,1)",
          }}>
            {/* Big ranking number */}
            <div style={{
              position: "absolute",
              left: -35,
              bottom: 10,
              fontSize: "6rem",
              fontWeight: 900,
              color: "transparent",
              WebkitTextStroke: "4px #fff",
              textStroke: "4px #fff",
              opacity: 0.88,
              lineHeight: 1,
              zIndex: 3,
              pointerEvents: "none",
              textShadow: "0 1.5px 8px #000a",
              fontFamily: "Montserrat,Arial,sans-serif"
            }}>{idx + 1}</div>

            {/* Poster */}
            <img
              src={movie.poster_path
                ? `https://image.tmdb.org/t/p/w342${movie.poster_path}`
                : "/posters/placeholder.png"}
              alt={movie.title}
              style={{
                width: 180, height: 270, objectFit: "cover",
                borderRadius: 21,
                boxShadow: "0 1.5px 10px #000d",
                display: "block"
              }}
            />
          </div>
        ))}
      </div>

      {/* Hide native scrollbar */}
      <style>{`
        .trending-row::-webkit-scrollbar { display: none; }
      `}</style>
    </section>
  );
}
