import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../supabaseClient";
import MovieModal from "./MovieModal";

// Define moods for mood picker
const MOODS = [
  { key: "happy", label: "😊 HAPPY" },
  { key: "sad", label: "😢 SAD" },
  { key: "thrilled", label: "😲 THRILLED" },
  { key: "relaxed", label: "😌 RELAXED" },
  { key: "romantic", label: "🥰 ROMANTIC" },
];

export default function HomePage({ userName = "Movie Lover", userId }) {
  const [selectedMood, setSelectedMood] = useState(null);
  const [trending, setTrending] = useState([]);
  const [watched, setWatched] = useState([]);
  const [modalMovie, setModalMovie] = useState(null);

  const closeModal = () => setModalMovie(null);

  // Fetch trending movies from TMDb when component mounts
  useEffect(() => {
    fetch(
      `https://api.themoviedb.org/3/trending/movie/week?api_key=${import.meta.env.VITE_TMDB_API_KEY}`
    )
      .then(res => res.json())
      .then(data => setTrending(data.results || []))
      .catch(() => setTrending([]));
  }, []);

  // Fetch watched history from Supabase when component mounts or userId changes
  useEffect(() => {
    if (!userId) return;
    supabase
      .from('movies_watched')
      .select('*')
      .eq('user_id', userId)
      .order('id', { ascending: false })
      .then(({ data }) => setWatched(data || []));
  }, [userId]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(120deg, #18406d 0%, #232d41 60%, #fe9245 120%)",
        paddingBottom: 70,
      }}
    >
      {/* HERO / MOOD PROMPT */}
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: "48px 24px 38px 24px",
          borderRadius: 18,
          background:
            "linear-gradient(110deg,rgba(24,64,109,0.7) 68%,rgba(254,146,69,0.15) 100%)",
          boxShadow: "0 8px 48px 0 #0005",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          marginTop: 38,
        }}
      >
        <div
          style={{
            fontSize: 30,
            fontWeight: 900,
            color: "#fff",
            letterSpacing: "-1.2px",
            marginBottom: 8,
            textShadow: "0 1px 12px #232d41bb",
          }}
        >
          Welcome back, <span style={{ color: "#fdaf41" }}>{userName}</span>
        </div>
        <div style={{ fontSize: 19, color: "#eee", marginBottom: 17 }}>
          How are you feeling today?
        </div>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 18 }}>
          {MOODS.map((mood) => (
            <button
              key={mood.key}
              onClick={() => setSelectedMood(mood.key)}
              style={{
                padding: "10px 22px",
                fontWeight: 700,
                fontSize: 17,
                border: "none",
                borderRadius: 24,
                background:
                  selectedMood === mood.key
                    ? "linear-gradient(90deg,#fe9245 70%,#fdaf41 100%)"
                    : "rgba(253,175,65,0.15)",
                color: selectedMood === mood.key ? "#18406d" : "#fff",
                cursor: "pointer",
                outline: selectedMood === mood.key ? "2.5px solid #fdaf41" : "none",
                boxShadow: selectedMood === mood.key
                  ? "0 2px 18px #fdaf4135"
                  : "0 1.5px 8px #0001",
                transition: "background 0.16s, outline 0.13s, color 0.13s",
              }}
            >
              {mood.label}
            </button>
          ))}
        </div>
        <div style={{ color: "#bbb", fontSize: 15 }}>
          Pick a mood to get personalized recommendations!
        </div>
      </div>

      {/* CAROUSELS */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "26px 24px 8px 24px" }}>
        {/* Recommended For You (placeholder) */}
        <HomeCarousel
          title="Recommended For You"
          movies={[]} // Replace with recommendations when ready
          emptyMessage="Your recommendations will appear here based on your watch history and mood."
        />
        {/* Trending Now (real TMDb data) */}
        <HomeCarousel
          title="Trending Now"
          movies={trending}
          emptyMessage="Trending movies will appear here!"
          onMovieClick={setModalMovie}
        />
        {/* Your Watch History (real data!) */}
        <HomeCarousel
          title="Your Watch History"
          movies={watched}
          emptyMessage="Your recently watched movies will show up here."
        />
      </div>

       {/* Movie Details Modal (add this before footer!) */}
        {modalMovie && (
        <MovieModal
            movie={modalMovie}
            open={!!modalMovie}
            onClose={closeModal}
        />
        )}   

      {/* FOOTER */}
      <div
        style={{
          textAlign: "center",
          fontSize: 13,
          color: "#fff",
          opacity: 0.23,
          marginTop: 70,
        }}
      >
        © {new Date().getFullYear()} FeelFlick — Movies that match your mood.
      </div>
    </div>
  );
}

// Fancier Carousel with posters, scroll arrows, hover effect!
function HomeCarousel({ title, movies, emptyMessage, onMovieClick }) {
  const scrollRef = useRef();

  function scrollBy(offset) {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  }

  // Hide arrows on mobile (window check)
  const showArrows = movies && movies.length > 5 && typeof window !== "undefined" && window.innerWidth > 700;

  return (
    <div style={{ marginBottom: 38, position: 'relative' }}>
      <div style={{ fontSize: 21, fontWeight: 800, color: "#fff", marginBottom: 13 }}>
        {title}
      </div>
      <div style={{ position: "relative" }}>
        {movies && movies.length > 0 ? (
          <>
            {/* Left/Right arrows */}
            {showArrows && (
              <>
                <button
                  onClick={() => scrollBy(-370)}
                  style={arrowBtnStyle("left")}
                  aria-label="Scroll left"
                >‹</button>
                <button
                  onClick={() => scrollBy(370)}
                  style={arrowBtnStyle("right")}
                  aria-label="Scroll right"
                >›</button>
              </>
            )}
            <div
              ref={scrollRef}
              style={{
                display: "flex",
                gap: 28,
                overflowX: "auto",
                paddingBottom: 4,
                scrollBehavior: "smooth",
                scrollbarWidth: "none",
              }}
              className="no-scrollbar"
            >
              {movies.map((movie) => (
                <div
                  key={movie.id || movie.movie_id}
                  style={{
                    width: 145,
                    minWidth: 145,
                    borderRadius: 14,
                    overflow: "hidden",
                    background: "#232d41",
                    boxShadow: "0 2px 16px #0008",
                    cursor: "pointer",
                    textAlign: "center",
                    position: "relative",
                    transition: "transform 0.18s, box-shadow 0.17s",
                  }}
                  onClick={() => onMovieClick && onMovieClick(movie)}
                  tabIndex={0}
                  aria-label={movie.title}
                  onMouseOver={e => {
                    e.currentTarget.style.transform = "scale(1.07)";
                    e.currentTarget.style.boxShadow = "0 6px 36px #fdaf4122";
                  }}
                  onMouseOut={e => {
                    e.currentTarget.style.transform = "scale(1.0)";
                    e.currentTarget.style.boxShadow = "0 2px 16px #0008";
                  }}
                >
                  {/* Movie poster from TMDb (or your DB) */}
                  {movie.poster_path || movie.poster ? (
                    <img
                      src={`https://image.tmdb.org/t/p/w342${movie.poster_path || movie.poster}`}
                      alt={movie.title}
                      style={{
                        width: "100%",
                        height: 216,
                        objectFit: "cover",
                        display: "block",
                        borderTopLeftRadius: 14,
                        borderTopRightRadius: 14,
                        transition: "filter 0.16s",
                      }}
                    />
                  ) : (
                    <div style={{
                      height: 216,
                      background: "#18305a",
                      color: "#fff",
                      fontSize: 32,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}>
                      🎬
                    </div>
                  )}
                  {/* Title */}
                  <div style={{
                    color: "#fff",
                    fontSize: 14.7,
                    fontWeight: 800,
                    margin: "7px 0 8px 0",
                    padding: "0 7px",
                    whiteSpace: "nowrap",
                    textOverflow: "ellipsis",
                    overflow: "hidden",
                    textAlign: "center",
                  }}>
                    {movie.title || movie.name}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div style={{ color: "#999", fontSize: 15, marginTop: 12, marginLeft: 5 }}>
            {emptyMessage}
          </div>
        )}
      </div>
    </div>
  );
}

// Helper: Arrow Button Style
function arrowBtnStyle(side) {
  return {
    position: "absolute",
    [side]: -12,
    top: "44%",
    zIndex: 5,
    background: "rgba(24,64,109,0.91)",
    color: "#fff",
    fontWeight: 900,
    fontSize: 28,
    border: "none",
    borderRadius: "50%",
    width: 38,
    height: 38,
    boxShadow: "0 3px 16px #0006",
    cursor: "pointer",
    opacity: 0.76,
    display: typeof window !== "undefined" && window.innerWidth > 700 ? "block" : "none",
    transition: "background 0.13s, opacity 0.16s",
    outline: "none",
  };
}
