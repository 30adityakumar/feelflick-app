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
  const scrollAmount = 340;
  const scrollLeft = () => scrollRef.current && scrollRef.current.scrollBy({ left: -scrollAmount, behavior: "smooth" });
  const scrollRight = () => scrollRef.current && scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });

  return (
    <section style={{
      background: "rgba(10,10,10,0.72)",
      padding: "52px 0 35px 0",
      position: "relative",
      overflow: "visible",
      minHeight: 355,
      width: "100vw"
    }}>
      {/* Heading */}
      <div style={{
        fontWeight: 900,
        fontSize: "1.15rem",
        color: "#fff",
        letterSpacing: "0.15em",
        marginLeft: "8vw",
        marginBottom: 25,
        marginTop: 0,
        textAlign: "left",
        textTransform: "uppercase"
      }}>
        Trending Now
      </div>

      {/* Arrows */}
      <button
        aria-label="Scroll Left"
        onClick={scrollLeft}
        style={{
          position: "absolute", left: "2vw", top: "60%", transform: "translateY(-50%)",
          background: "rgba(22,22,22,0.83)", border: "none", borderRadius: 14,
          width: 44, height: 76, color: "#fff", fontSize: 27,
          cursor: "pointer", zIndex: 6, opacity: 0.75, transition: "opacity 0.2s"
        }}
        onMouseOver={e => e.currentTarget.style.opacity = 1}
        onMouseOut={e => e.currentTarget.style.opacity = 0.75}
      >‹</button>
      <button
        aria-label="Scroll Right"
        onClick={scrollRight}
        style={{
          position: "absolute", right: "2vw", top: "60%", transform: "translateY(-50%)",
          background: "rgba(22,22,22,0.83)", border: "none", borderRadius: 14,
          width: 44, height: 76, color: "#fff", fontSize: 27,
          cursor: "pointer", zIndex: 6, opacity: 0.75, transition: "opacity 0.2s"
        }}
        onMouseOver={e => e.currentTarget.style.opacity = 1}
        onMouseOut={e => e.currentTarget.style.opacity = 0.75}
      >›</button>

      {/* Horizontally scrollable card grid */}
      <div
        ref={scrollRef}
        style={{
          display: "flex",
          gap: 48,
          overflowX: "auto",
          padding: "5px 10vw 8px 10vw",      // generous sides
          margin: "0 auto",
          scrollbarWidth: "none",
          scrollSnapType: "x mandatory",
          minHeight: 255,
          width: "100%",
          boxSizing: "border-box",
          alignItems: "flex-end",
          position: "relative"
        }}
        className="trending-row"
      >
        {movies.map((movie, idx) => (
          <div key={movie.id} style={{
            position: "relative",
            flex: "0 0 174px",
            width: 174,
            minWidth: 174,
            height: 255,
            borderRadius: 18,
            boxShadow: "0 3px 16px #0008",
            background: "#181818",
            scrollSnapAlign: "center",
            overflow: "visible",
            marginBottom: 6,
            transition: "transform 0.19s cubic-bezier(.32,1.4,.46,1)",
            zIndex: 2
          }}
          tabIndex={0}
          onMouseEnter={e => {
            e.currentTarget.style.transform = "translateY(-17px) scale(1.09)";
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
              left: -34,
              bottom: 6,
              fontSize: "4.6rem",
              fontWeight: 900,
              color: "transparent",
              WebkitTextStroke: "3.5px #fff",
              textStroke: "3.5px #fff",
              opacity: 0.87,
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
                width: 174, height: 255, objectFit: "cover",
                borderRadius: 18,
                boxShadow: "0 2px 12px #000b",
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
