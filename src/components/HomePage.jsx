// src/pages/HomePage.jsx
import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
// You should have a HomeCarousel component for displaying lists of movies (or use your own UI).
import HomeCarousel from "../components/HomeCarousel"; // <- Adjust this path if your file structure differs

export default function HomePage({ userId }) {
  // -- States to store user data --
  const [userGenres, setUserGenres] = useState([]);
  const [userFavMovies, setUserFavMovies] = useState([]);
  const [genreRecs, setGenreRecs] = useState([]);
  const [movieRecs, setMovieRecs] = useState([]);
  const [trending, setTrending] = useState([]);
  const [watched, setWatched] = useState([]);
  const [loading, setLoading] = useState(true);

  // -- 1. Fetch user genres --
  useEffect(() => {
    if (!userId) return;
    supabase
      .from("user_preferences")
      .select("genre_id")
      .eq("user_id", userId)
      .then(({ data }) => setUserGenres(data ? data.map(r => r.genre_id) : []));
  }, [userId]);

  // -- 2. Fetch favorite movies (from onboarding) --
  useEffect(() => {
    if (!userId) return;
    supabase
      .from("user_watchlist")
      .select("movie_id")
      .eq("user_id", userId)
      .eq("status", "onboarding")
      .then(({ data }) => setUserFavMovies(data ? data.map(r => r.movie_id) : []));
  }, [userId]);

  // -- 3. Fetch recommendations based on genres --
  useEffect(() => {
    if (!userGenres.length) { setGenreRecs([]); return; }
    // Use your backend or TMDb API for real recs. For demo, just fetch random movies from DB:
    supabase
      .from("movies")
      .select("*")
      .in("id", userGenres.length ? [1,2,3,4,5] : []) // Replace with real fetch: by genres!
      .limit(12)
      .then(({ data }) => setGenreRecs(data || []));
  }, [userGenres]);

  // -- 4. Fetch recommendations based on movies --
  useEffect(() => {
    if (!userFavMovies.length) { setMovieRecs([]); return; }
    // For demo: fetch movies with similar genres. In real app: use TMDb /movie/{movie_id}/recommendations
    supabase
      .from("movies")
      .select("*")
      .in("id", userFavMovies.length ? [6,7,8,9,10] : []) // Replace with your own logic or TMDb!
      .limit(12)
      .then(({ data }) => setMovieRecs(data || []));
  }, [userFavMovies]);

  // -- 5. Fetch trending movies (always show) --
  useEffect(() => {
    // For real app: Use TMDb trending API or your DB logic
    supabase
      .from("movies")
      .select("*")
      .order("popularity", { ascending: false })
      .limit(15)
      .then(({ data }) => setTrending(data || []));
  }, []);

  // -- 6. Fetch user's watch history --
  useEffect(() => {
    if (!userId) return;
    supabase
      .from("movies_watched")
      .select("movie_id, title, poster, release_date")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(12)
      .then(({ data }) => setWatched(data || []));
  }, [userId]);

  // -- 7. Simple loader --
  useEffect(() => {
    // Simulate loading state until initial data is fetched (or improve this with Promise.all for more accuracy)
    if (
      (userGenres !== null) &&
      (userFavMovies !== null) &&
      (trending !== null) &&
      (watched !== null)
    ) setLoading(false);
  }, [userGenres, userFavMovies, trending, watched]);

  // -- 8. Figure out which carousels to show --
  const hasGenres = userGenres.length > 0;
  const hasMovies = userFavMovies.length > 0;

  // -- 9. Render --
  if (loading) {
    return (
      <div style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontWeight: 700, color: "#fff", fontSize: 22 }}>Loading your personalized homepage…</span>
      </div>
    );
  }

  return (
    <div style={{ background: "#1a1821", minHeight: "100vh", padding: "0 0 48px 0" }}>
      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "28px 8px 0 8px" }}>
        {/* Hero area */}
        <h1 style={{ color: "#fff", fontSize: 32, fontWeight: 900, marginBottom: 10 }}>
          Welcome back!
        </h1>
        <div style={{ color: "#fdaf41", fontWeight: 500, fontSize: 18, marginBottom: 18 }}>
          Find your next movie, handpicked for you 🎬
        </div>

        {/* CAROUSELS AND PROMPTS */}

        {/* Scenario 1: Only genres */}
        {hasGenres && !hasMovies && (
          <>
            <HomeCarousel
              title="Movies For Your Favorite Genres"
              movies={genreRecs}
              emptyMessage="Movies from your preferred genres will appear here!"
            />
          </>
        )}

        {/* Scenario 2: Only movies */}
        {!hasGenres && hasMovies && (
          <>
            <HomeCarousel
              title="Because You Liked…"
              movies={movieRecs}
              emptyMessage="Recommendations based on your favorite movies will show up here!"
            />
          </>
        )}

        {/* Scenario 3: Both genres and movies */}
        {hasGenres && hasMovies && (
          <>
            <HomeCarousel
              title="Movies For Your Favorite Genres"
              movies={genreRecs}
              emptyMessage="Movies from your preferred genres will appear here!"
            />
            <HomeCarousel
              title="Because You Liked…"
              movies={movieRecs}
              emptyMessage="Recommendations based on your favorite movies will show up here!"
            />
          </>
        )}

        {/* Scenario 4: No onboarding data */}
        {!hasGenres && !hasMovies && (
          <div style={{
            color: "#fdaf41",
            fontWeight: 700,
            fontSize: 20,
            margin: "44px 0 24px 0",
            background: "#18141c",
            borderRadius: 16,
            padding: "28px",
            textAlign: "center",
          }}>
            Get more personal recommendations!
            <br />
            Add your favorite genres or movies to get started.
          </div>
        )}

        {/* Always show trending movies */}
        <HomeCarousel
          title="Trending Now"
          movies={trending}
          emptyMessage="Trending movies will appear here!"
        />

        {/* Always show user's watch history */}
        <HomeCarousel
          title="Your Watch History"
          movies={watched}
          emptyMessage="Your recently watched movies will show up here."
        />
      </div>
    </div>
  );
}
