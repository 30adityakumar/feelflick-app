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
      background: "rgba(10, 10, 10, 0.75)", // translucent for background video
      padding: "35px 0 35px 0",
      position: "relative",
      overflow: "visible",           // allow pop-out!
      minHeight: 360,
      display: "flex",
      flexDirection: "column",
      alignItems: "center"
    }}>
      {/* Heading */}
      <div style={{
        fontWeight: 900,
        fontSize: "1.38rem",          // smaller!
        color: "#fff",
        marginBottom: 26,             // more gap!
        letterSpacing: "-0.6px",
        textAlign: "center"
      }}>
        Trending Now
      </div>

      {/* Arrows */}
      <button
        aria-label="Scroll Left"
        onClick={scrollLeft}
        style={{
          position: "absolute", left: "1vw", top: "54%", transform: "translateY(-50%)",
          background: "rgba(22,22,22,0.76)", border: "none", borderRadius: 14,
          width: 44, height: 75, color: "#fff", fontSize: 28,
          cursor: "pointer", zIndex: 5, opacity: 0.73, transition: "opacity 0.2s"
        }}
        onMouseOver={e => e.currentTarget.style.opacity = 1}
        onMouseOut={e => e.currentTarget.style.opacity = 0.73}
      >‹</button>
      <button
        aria-label="Scroll Right"
        onClick={scrollRight}
        style={{
          position: "absolute", right: "1vw", top: "54%", transform: "translateY(-50%)",
          background: "rgba(22,22,22,0.76)", border: "none", borderRadius: 14,
          width: 44, height: 75, color: "#fff", fontSize: 28,
          cursor: "pointer", zIndex: 5, opacity: 0.73, transition: "opacity 0.2s"
        }}
        onMouseOver={e => e.currentTarget.style.opacity = 1}
        onMouseOut={e => e.currentTarget.style.opacity = 0.73}
      >›</button>

      {/* Centered card grid */}
      <div
        ref={scrollRef}
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-end",
          gap: 38,
          overflowX: "auto",
          padding: "10px 9vw 14px 9vw",      // more side gap!
          margin: "0 auto",
          scrollbarWidth: "none",
          scrollSnapType: "x mandatory",
          position: "relative",
          minHeight: 270,                    // enough space for pop!
          width: "100%",
          maxWidth: 1600,                    // grid doesn't fill to edges on big screens
          overflow: "visible"
        }}
        className="trending-row"
      >
        {movies.map((movie, idx) => (
          <div key={movie.id} style={{
            position: "relative",
            flex: "0 0 170px",
            width: 170,
            minWidth: 170,
            height: 255,
            borderRadius: 18,
            boxShadow: "0 3px 14px #0009",
            background: "#181818",
            scrollSnapAlign: "start",
            overflow: "visible",
            marginBottom: 10,
            transition: "transform 0.18s cubic-bezier(.32,1.4,.46,1)",
            zIndex: 2
          }}
          tabIndex={0}
          onMouseEnter={e => {
            e.currentTarget.style.transform = "translateY(-16px) scale(1.075)";
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
              left: -30,
              bottom: 7,
              fontSize: "4.3rem",
              fontWeight: 900,
              color: "transparent",
              WebkitTextStroke: "3px #fff",
              textStroke: "3px #fff",
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
                width: 170, height: 255, objectFit: "cover",
                borderRadius: 18,
                boxShadow: "0 2px 11px #000c",
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
