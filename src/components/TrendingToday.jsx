import { useEffect, useState, useRef } from "react";

const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;

export default function TrendingToday() {
  const [movies, setMovies] = useState([]);
  const scrollRef = useRef(null);

  useEffect(() => {
    fetch(`https://api.themoviedb.org/3/trending/movie/day?api_key=${TMDB_API_KEY}`)
      .then(res => res.json())
      .then(data => setMovies((data.results || []).slice(0, 10)));
  }, []);

  // Scrolling
  const scrollAmount = 280;
  const scrollLeft = () => scrollRef.current && scrollRef.current.scrollBy({ left: -scrollAmount, behavior: "smooth" });
  const scrollRight = () => scrollRef.current && scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });

  return (
    <section style={{
      background: "rgba(10,10,10,0.72)",
      padding: "28px 0 35px 0",
      position: "relative",
      overflow: "visible",
      minHeight: 295,
      width: "100vw"
    }}>
      {/* Heading */}
      <div style={{
        fontWeight: 900,
        fontSize: "1.09rem",
        color: "#fff",
        letterSpacing: "0.14em",
        marginLeft: "8vw",
        marginBottom: 38,    // more gap below
        marginTop: 6,        // move title up
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
          width: 36, height: 62, color: "#fff", fontSize: 22,
          cursor: "pointer", zIndex: 6, opacity: 0.7, transition: "opacity 0.2s"
        }}
        onMouseOver={e => e.currentTarget.style.opacity = 1}
        onMouseOut={e => e.currentTarget.style.opacity = 0.7}
      >‹</button>
      <button
        aria-label="Scroll Right"
        onClick={scrollRight}
        style={{
          position: "absolute", right: "2vw", top: "60%", transform: "translateY(-50%)",
          background: "rgba(22,22,22,0.83)", border: "none", borderRadius: 14,
          width: 36, height: 62, color: "#fff", fontSize: 22,
          cursor: "pointer", zIndex: 6, opacity: 0.7, transition: "opacity 0.2s"
        }}
        onMouseOver={e => e.currentTarget.style.opacity = 1}
        onMouseOut={e => e.currentTarget.style.opacity = 0.7}
      >›</button>

      {/* Horizontally scrollable card grid */}
      <div
        ref={scrollRef}
        style={{
          display: "flex",
          gap: 34,
          overflowX: "auto",
          padding: "0 10vw 8px 10vw",
          margin: "0 auto",
          scrollbarWidth: "none",
          scrollSnapType: "x mandatory",
          minHeight: 200,
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
            flex: "0 0 125px",
            width: 125,
            minWidth: 125,
            height: 182,
            borderRadius: 13,
            boxShadow: "0 2px 9px #000a",
            background: "#181818",
            scrollSnapAlign: "center",
            overflow: "visible",
            marginBottom: 6,
            transition: "transform 0.19s cubic-bezier(.32,1.4,.46,1)",
            zIndex: 2
          }}
          tabIndex={0}
          onMouseEnter={e => {
            e.currentTarget.style.transform = "translateY(-12px) scale(1.09)";
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
              left: 8,           // move right, over the poster
              bottom: 7,
              fontSize: "2.95rem",
              fontWeight: 800,
              color: "#111",     // fill with black
              WebkitTextStroke: "2px #fff",
              textStroke: "2px #fff",
              opacity: 0.93,
              lineHeight: 1,
              zIndex: 3,
              pointerEvents: "none",
              textShadow: "0 2px 10px #000b",
              fontFamily: "Montserrat,Arial,sans-serif"
            }}>{idx + 1}</div>

            {/* Poster */}
            <img
              src={movie.poster_path
                ? `https://image.tmdb.org/t/p/w342${movie.poster_path}`
                : "/posters/placeholder.png"}
              alt={movie.title}
              style={{
                width: 125, height: 182, objectFit: "cover",
                borderRadius: 13,
                boxShadow: "0 2px 7px #000c",
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
