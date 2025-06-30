import React, { useState, useEffect } from "react";

// Define moods for mood picker
const MOODS = [
  { key: "happy", label: "😊 HAPPY" },
  { key: "sad", label: "😢 SAD" },
  { key: "thrilled", label: "😲 THRILLED" },
  { key: "relaxed", label: "😌 RELAXED" },
  { key: "romantic", label: "🥰 ROMANTIC" },
];

export default function HomePage({ userName = "Movie Lover" }) {
  const [selectedMood, setSelectedMood] = useState(null);
  const [trending, setTrending] = useState([]);

  // Fetch trending movies from TMDb when component mounts
  useEffect(() => {
    fetch(
      `https://api.themoviedb.org/3/trending/movie/week?api_key=${import.meta.env.VITE_TMDB_API_KEY}`
    )
      .then(res => res.json())
      .then(data => setTrending(data.results || []))
      .catch(() => setTrending([]));
  }, []);

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
        />
        {/* Your Watch History (placeholder) */}
        <HomeCarousel
          title="Your Watch History"
          movies={[]} // Replace with user's real watch history
          emptyMessage="Your recently watched movies will show up here."
        />
      </div>
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

// Carousel Section
function HomeCarousel({ title, movies, emptyMessage }) {
  return (
    <div style={{ marginBottom: 38 }}>
      <div style={{ fontSize: 19, fontWeight: 700, color: "#fff", marginBottom: 10 }}>
        {title}
      </div>
      <div style={{ minHeight: 120 }}>
        {movies && movies.length > 0 ? (
          <div style={{ display: "flex", gap: 16, overflowX: "auto" }}>
            {movies.map((movie) => (
              <div
                key={movie.id}
                style={{
                  width: 110,
                  borderRadius: 12,
                  overflow: "hidden",
                  background: "#222b",
                  boxShadow: "0 1px 8px #0003",
                  cursor: "pointer",
                  textAlign: "center",
                  transition: "transform 0.16s",
                }}
                tabIndex={0}
                aria-label={movie.title}
              >
                {/* Movie poster from TMDb */}
                {movie.poster_path ? (
                  <img
                    src={`https://image.tmdb.org/t/p/w300${movie.poster_path}`}
                    alt={movie.title}
                    style={{
                      width: "100%",
                      height: 150,
                      objectFit: "cover",
                      display: "block",
                    }}
                  />
                ) : (
                  <div style={{
                    height: 150,
                    background: "#18305a",
                    color: "#fff",
                    fontSize: 27,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}>
                    🎬
                  </div>
                )}
                <div style={{
                  color: "#fff",
                  fontSize: 13,
                  fontWeight: 700,
                  margin: "6px 0",
                  whiteSpace: "nowrap",
                  textOverflow: "ellipsis",
                  overflow: "hidden"
                }}>
                  {movie.title || movie.name}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ color: "#999", fontSize: 15, marginTop: 12, marginLeft: 5 }}>
            {emptyMessage}
          </div>
        )}
      </div>
    </div>
  );
}
