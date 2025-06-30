import React, { useState } from "react";

const MOODS = [
  { key: "happy", label: "😊 Happy" },
  { key: "sad", label: "😢 Sad" },
  { key: "thrilled", label: "😲 Thrilled" },
  { key: "relaxed", label: "😌 Relaxed" },
  { key: "romantic", label: "🥰 Romantic" },
  // add more as you like!
];

export default function HomePage({ userName = "Movie Lover" }) {
  const [selectedMood, setSelectedMood] = useState(null);

  // placeholder data for carousels
  const recommendations = []; // TODO: Replace with recommendation logic
  const trending = [];        // TODO: Fetch from TMDB API
  const watchHistory = [];    // TODO: Use user’s watched list

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

      {/* CAROUSELS: PLACEHOLDER */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "26px 24px 8px 24px" }}>
        <HomeCarousel
          title="Recommended For You"
          movies={recommendations}
          emptyMessage="Your recommendations will appear here based on your watch history and mood."
        />
        <HomeCarousel
          title="Trending Now"
          movies={trending}
          emptyMessage="Trending movies will appear here!"
        />
        <HomeCarousel
          title="Your Watch History"
          movies={watchHistory}
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

// Carousel Section (simple placeholder, can upgrade to scrollable row)
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
                  width: 106,
                  borderRadius: 12,
                  overflow: "hidden",
                  background: "#222b",
                  boxShadow: "0 1px 8px #0003",
                  cursor: "pointer",
                  textAlign: "center",
                }}
              >
                {/* Replace with movie poster logic */}
                <div style={{
                  height: 148,
                  background: "#18305a",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontSize: 27
                }}>
                  🎬
                </div>
                <div style={{ color: "#fff", fontSize: 13, fontWeight: 700, margin: "6px 0" }}>
                  {movie.title || "Movie Title"}
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
