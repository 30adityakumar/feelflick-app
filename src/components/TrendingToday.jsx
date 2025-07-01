import { useEffect, useState, useRef } from "react";

const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;

const CARD_WIDTH = 152;
const CARD_GAP = 32;
const VISIBLE_CARDS = 5;

export default function TrendingToday() {
  const [movies, setMovies] = useState([]);
  const scrollRef = useRef(null);

  useEffect(() => {
    fetch(`https://api.themoviedb.org/3/trending/movie/day?api_key=${TMDB_API_KEY}`)
      .then(res => res.json())
      .then(data => setMovies((data.results || []).slice(0, 10)));
  }, []);

  const scrollAmount = CARD_WIDTH + CARD_GAP;
  const scrollLeft = () => {
    if (scrollRef.current) scrollRef.current.scrollBy({ left: -scrollAmount, behavior: "smooth" });
  };
  const scrollRight = () => {
    if (scrollRef.current) scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
  };

  // How wide should the scroller be to show 5 cards?
  const scrollerWidth = VISIBLE_CARDS * CARD_WIDTH + (VISIBLE_CARDS - 1) * CARD_GAP;

  return (
    <section style={{
      background: "rgba(10,10,10,0.73)",
      padding: "36px 0 55px 0",
      position: "relative",
      overflow: "visible",
      minHeight: 340,
      width: "100%",
      boxSizing: "border-box"
    }}>
      {/* Heading */}
      <div style={{
        fontWeight: 900,
        fontSize: "1.25rem",
        color: "#fff",
        letterSpacing: "0.14em",
        marginLeft: "8vw",
        marginBottom: 38,
        marginTop: 6,
        textAlign: "left",
        textTransform: "uppercase"
      }}>
        Trending Now
      </div>

      {/* Row wrapper for padding & arrows */}
      <div style={{
        position: "relative",
        width: "100%",
        padding: "0 8vw",
        boxSizing: "border-box",
        overflow: "visible", // must be visible for pop
        minHeight: 1 // fix Chrome issue
      }}>
        {/* Left Arrow */}
        <button
          aria-label="Scroll Left"
          onClick={scrollLeft}
          style={{
            position: "absolute", left: 0, top: "52%", transform: "translateY(-50%)",
            background: "rgba(22,22,22,0.83)", border: "none", borderRadius: 14,
            width: 36, height: 62, color: "#fff", fontSize: 22,
            cursor: "pointer", zIndex: 6, opacity: 0.7, transition: "opacity 0.2s"
          }}
          onMouseOver={e => e.currentTarget.style.opacity = 1}
          onMouseOut={e => e.currentTarget.style.opacity = 0.7}
        >‹</button>
        {/* Right Arrow */}
        <button
          aria-label="Scroll Right"
          onClick={scrollRight}
          style={{
            position: "absolute", right: 0, top: "52%", transform: "translateY(-50%)",
            background: "rgba(22,22,22,0.83)", border: "none", borderRadius: 14,
            width: 36, height: 62, color: "#fff", fontSize: 22,
            cursor: "pointer", zIndex: 6, opacity: 0.7, transition: "opacity 0.2s"
          }}
          onMouseOver={e => e.currentTarget.style.opacity = 1}
          onMouseOut={e => e.currentTarget.style.opacity = 0.7}
        >›</button>

        {/* Horizontal scroller */}
        <div
          ref={scrollRef}
          style={{
            display: "flex",
            gap: CARD_GAP,
            overflowX: "auto",
            overflowY: "visible",
            margin: "0 auto",
            scrollbarWidth: "none",
            scrollSnapType: "x mandatory",
            minHeight: 232,
            alignItems: "flex-end",
            position: "relative",
            width: scrollerWidth,
            maxWidth: "100%",
            boxSizing: "border-box",
            // To center cards: marginLeft/right auto
            marginLeft: "auto",
            marginRight: "auto",
            paddingTop: 0,
            paddingBottom: 0,
            zIndex: 2,
            // No overflow:hidden anywhere!
          }}
          className="trending-row"
        >
          {movies.map((movie, idx) => (
            <div key={movie.id} style={{
              position: "relative",
              flex: `0 0 ${CARD_WIDTH}px`,
              width: CARD_WIDTH,
              minWidth: CARD_WIDTH,
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
                left: -13,
                bottom: 11,
                fontSize: "4.2rem",
                fontWeight: 900,
                color: "#111",
                WebkitTextStroke: "1px #fff",
                textStroke: "1px #fff",
                opacity: 0.98,
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
                  width: CARD_WIDTH, height: 222, objectFit: "cover",
                  borderRadius: 15,
                  boxShadow: "0 2px 11px #000c",
                  display: "block",
                  background: "#191919"
                }}
              />
            </div>
          ))}
        </div>
      </div>
      {/* Hide native scrollbar */}
      <style>{`
        .trending-row::-webkit-scrollbar { display: none; }
      `}</style>
    </section>
  );
}
