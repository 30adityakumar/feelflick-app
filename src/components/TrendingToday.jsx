import { useEffect, useState, useRef } from "react";

const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;

export default function TrendingToday() {
  const [movies, setMovies] = useState([]);
  const scrollRef = useRef(null);

  useEffect(() => {
    fetch(`https://api.themoviedb.org/3/trending/movie/day?api_key=${TMDB_API_KEY}`)
      .then(res => res.json())
      .then(data => setMovies((data.results || []).slice(0, 10))); // Only top 10
  }, []);

  // Scrolling
  const scrollAmount = 330;
  const scrollLeft = () => scrollRef.current && scrollRef.current.scrollBy({ left: -scrollAmount, behavior: "smooth" });
  const scrollRight = () => scrollRef.current && scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });

  return (
    <section style={{
      background: "rgba(10, 10, 10, 0.78)", // translucent for background video
      padding: "42px 0 26px 0",
      position: "relative",
      overflow: "hidden",
      borderRadius: "0 0 32px 32px", // optional: rounded bottom
      margin: "0 0 0 0"
    }}>
      {/* Heading */}
      <div style={{
        fontWeight: 900,
        fontSize: "2.04rem",
        color: "#fff",
        marginLeft: "7vw",
        marginBottom: 18,
        letterSpacing: "-1.2px"
      }}>
        Trending Now
      </div>

      {/* Arrows */}
      <button
        aria-label="Scroll Left"
        onClick={scrollLeft}
        style={{
          position: "absolute", left: "2vw", top: "57%", transform: "translateY(-50%)",
          background: "rgba(22,22,22,0.76)", border: "none", borderRadius: 14,
          width: 45, height: 78, color: "#fff", fontSize: 30,
          cursor: "pointer", zIndex: 5, opacity: 0.72, transition: "opacity 0.2s"
        }}
        onMouseOver={e => e.currentTarget.style.opacity = 1}
        onMouseOut={e => e.currentTarget.style.opacity = 0.72}
      >‹</button>
      <button
        aria-label="Scroll Right"
        onClick={scrollRight}
        style={{
          position: "absolute", right: "2vw", top: "57%", transform: "translateY(-50%)",
          background: "rgba(22,22,22,0.76)", border: "none", borderRadius: 14,
          width: 45, height: 78, color: "#fff", fontSize: 30,
          cursor: "pointer", zIndex: 5, opacity: 0.72, transition: "opacity 0.2s"
        }}
        onMouseOver={e => e.currentTarget.style.opacity = 1}
        onMouseOut={e => e.currentTarget.style.opacity = 0.72}
      >›</button>

      {/* Cards */}
      <div
        ref={scrollRef}
        style={{
          display: "flex",
          gap: 42,
          overflowX: "auto",
          padding: "0 7vw 22px 7vw",
          scrollbarWidth: "none",
          scrollSnapType: "x mandatory",
          position: "relative",
          zIndex: 2
        }}
        className="trending-row"
      >
        {movies.map((movie, idx) => (
          <div key={movie.id} style={{
            position: "relative",
            flex: "0 0 176px",
            width: 176,
            minWidth: 176,
            height: 264,
            borderRadius: 19,
            boxShadow: "0 3px 18px #0009",
            background: "#181818",
            scrollSnapAlign: "start",
            overflow: "visible",
            marginBottom: 15,
            transition: "transform 0.18s cubic-bezier(.32,1.4,.46,1)",
            zIndex: 2
          }}
          tabIndex={0}
          onMouseEnter={e => {
            e.currentTarget.style.transform = "translateY(-8px) scale(1.055)";
            e.currentTarget.style.zIndex = 10;
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = "";
            e.currentTarget.style.zIndex = 2;
          }}
        >
            {/* Big ranking number */}
            <div style={{
              position: "absolute",
              left: -33,
              bottom: 11,
              fontSize: "5.2rem",
              fontWeight: 900,
              color: "transparent",
              WebkitTextStroke: "4px #fff",
              textStroke: "4px #fff",
              opacity: 0.89,
              lineHeight: 1,
              zIndex: 3,
              pointerEvents: "none",
              textShadow: "0 2px 10px #000a",
              fontFamily: "Montserrat,Arial,sans-serif"
            }}>{idx + 1}</div>

            {/* Poster */}
            <img
              src={movie.poster_path
                ? `https://image.tmdb.org/t/p/w342${movie.poster_path}`
                : "/posters/placeholder.png"}
              alt={movie.title}
              style={{
                width: 176, height: 264, objectFit: "cover",
                borderRadius: 19,
                boxShadow: "0 2px 12px #000c",
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
