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

  const scrollAmount = 290;
  const scrollLeft = () => scrollRef.current && scrollRef.current.scrollBy({ left: -scrollAmount, behavior: "smooth" });
  const scrollRight = () => scrollRef.current && scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });

  return (
    <section style={{
      background: "rgba(10,10,10,0.73)",
      padding: "36px 0 45px 0",
      position: "relative",
      overflow: "visible",
      minHeight: 320,
      width: "100vw"
    }}>
      {/* Heading */}
      <div style={{
        fontWeight: 900,
        fontSize: "1.1rem",
        color: "#fff",
        letterSpacing: "0.14em",
        marginLeft: "8vw",
        marginBottom: 39,
        marginTop: 2,
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
          position: "absolute", left: "2vw", top: "62%", transform: "translateY(-50%)",
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
          position: "absolute", right: "2vw", top: "62%", transform: "translateY(-50%)",
          background: "rgba(22,22,22,0.83)", border: "none", borderRadius: 14,
          width: 36, height: 62, color: "#fff", fontSize: 22,
          cursor: "pointer", zIndex: 6, opacity: 0.7, transition: "opacity 0.2s"
        }}
        onMouseOver={e => e.currentTarget.style.opacity = 1}
        onMouseOut={e => e.currentTarget.style.opacity = 0.7}
      >›</button>

      {/* Movie cards row */}
      <div
        ref={scrollRef}
        style={{
          display: "flex",
          gap: 32,
          overflowX: "auto",
          padding: "0 10vw 8px 10vw",
          margin: "0 auto",
          scrollbarWidth: "none",
          scrollSnapType: "x mandatory",
          minHeight: 232,
          width: "100%",
          boxSizing: "border-box",
          alignItems: "flex-end",
          position: "relative",
          overflow: "visible",
        }}
        className="trending-row"
      >
        {movies.map((movie, idx) => (
          <div key={movie.id} style={{
            position: "relative",
            flex: "0 0 152px",
            width: 152,
            minWidth: 152,
            height: 222,
            borderRadius: 15,
            boxShadow: "0 2px 11px #000b",
            background: "#181818",
            scrollSnapAlign: "center",
            overflow: "visible",
            marginBottom: 6,
            marginTop: 0,
            transition: "transform 0.19s cubic-bezier(.32,1.4,.46,1)",
            zIndex: 2
          }}
          tabIndex={0}
          onMouseEnter={e => {
            e.currentTarget.style.transform = "translateY(-20px) scale(1.1)";
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
              left: -38, // half in, half out
              bottom: 11,
              fontSize: "3.7rem",
              fontWeight: 900,
              color: "#111",     // black fill
              WebkitTextStroke: "1px #fff", // thin white outline
              textStroke: "1px #fff",
              opacity: 0.97,
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
                width: 152, height: 222, objectFit: "cover",
                borderRadius: 15,
                boxShadow: "0 2px 11px #000c",
                display: "block",
                background: "#191919"
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
