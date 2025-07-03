// importMovies.js
import fetch from "node-fetch";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "YOUR_SUPABASE_URL";
const SUPABASE_KEY = "YOUR_SUPABASE_SERVICE_ROLE_KEY"; // NEVER expose this in frontend!
const TMDB_API_KEY = "YOUR_TMDB_API_KEY";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function fetchAndSaveGenres() {
  const res = await fetch(`https://api.themoviedb.org/3/genre/movie/list?api_key=${TMDB_API_KEY}&language=en-US`);
  const { genres } = await res.json();
  for (const genre of genres) {
    await supabase.from("genres").upsert([{ id: genre.id, name: genre.name }]);
    console.log("Upserted genre:", genre.name);
  }
}

async function fetchAndSaveMovies(page = 1) {
  // 1. Fetch movies list (you can fetch top-rated, latest, popular, or use /discover)
  const res = await fetch(`https://api.themoviedb.org/3/movie/popular?api_key=${TMDB_API_KEY}&page=${page}`);
  const { results } = await res.json();
  for (const movie of results) {
    // 2. Get full details
    const detailsRes = await fetch(`https://api.themoviedb.org/3/movie/${movie.id}?api_key=${TMDB_API_KEY}`);
    const details = await detailsRes.json();

    // 3. Insert into movies
    await supabase.from("movies").upsert([{
      id: details.id,
      title: details.title,
      original_title: details.original_title,
      release_date: details.release_date,
      overview: details.overview,
      poster_path: details.poster_path,
      backdrop_path: details.backdrop_path,
      runtime: details.runtime,
      vote_average: details.vote_average,
      vote_count: details.vote_count,
      popularity: details.popularity,
      original_language: details.original_language,
      adult: details.adult,
      budget: details.budget,
      revenue: details.revenue,
      status: details.status,
      tagline: details.tagline,
      homepage: details.homepage,
      imdb_id: details.imdb_id,
      json_data: details // save raw for future proofing
    }]);
    // 4. Insert movie_genres relationships
    for (const genreId of details.genres.map(g=>g.id)) {
      await supabase.from("movie_genres").upsert([{ movie_id: details.id, genre_id: genreId }]);
    }
    console.log("Saved movie:", details.title);
  }
}

// -------------- Main Function ---------------
(async () => {
  await fetchAndSaveGenres(); // Only run once, or when you want to update genres.
  for (let page = 1; page <= 5; page++) { // You can increase pages for more movies.
    await fetchAndSaveMovies(page);
  }
  console.log("Import complete.");
})();
