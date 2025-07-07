// importMovies.js
import fetch from "node-fetch";
import { createClient } from "@supabase/supabase-js";
import fs from "fs";

// CONFIG (replace with your values)
const SUPABASE_URL = "https://orbhbwtgdfqhehuuxfmg.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yYmhid3RnZGZxaGVodXV4Zm1nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEwNDI4NDQsImV4cCI6MjA2NjYxODg0NH0.9JiUlmQNi3kLEssgzrI97qLzu3j2zKZlwFn42miAsDM"; // NEVER expose this in frontend!
const TMDB_API_KEY = "56e20962522bccd1990f31f2c791d8d1";
const SUPABASE_TABLE = "movies";
const BATCH_SIZE = 25;
const DELAY_MS = 350;
const START_PAGE = 1;
const END_PAGE = 1000; // Set high for max pages (each has 20 movies)
const PROGRESS_FILE = "./progress.json"; // Local file to track progress

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Read progress
function getLastPage() {
  if (fs.existsSync(PROGRESS_FILE)) {
    const data = JSON.parse(fs.readFileSync(PROGRESS_FILE, "utf-8"));
    return data.lastPage || START_PAGE;
  }
  return START_PAGE;
}
function setLastPage(page) {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify({ lastPage: page }, null, 2));
}

// Delay helper
const delay = ms => new Promise(res => setTimeout(res, ms));

async function fetchMoviesPage(page) {
  const url = `https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_KEY}&language=en-US&sort_by=popularity.desc&include_adult=false&page=${page}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`TMDb error: ${res.status} ${res.statusText}`);
  const json = await res.json();
  return json.results || [];
}

async function main() {
  let totalImported = 0;
  let page = getLastPage();
  for (; page <= END_PAGE; page++) {
    console.log(`\nFetching TMDb page ${page}...`);
    let movies;
    try {
      movies = await fetchMoviesPage(page);
    } catch (err) {
      console.error(`Error fetching page ${page}:`, err.message);
      await delay(2000);
      continue;
    }
    if (!movies.length) {
      console.log("No more movies. Done.");
      break;
    }

    // Prepare movies (you can expand fields here)
    const rows = movies.map(m => ({
      tmdb_id: m.id,
      title: m.title,
      overview: m.overview,
      release_date: m.release_date,
      poster_path: m.poster_path,
      backdrop_path: m.backdrop_path,
      genre_ids: m.genre_ids,
      vote_average: m.vote_average,
      vote_count: m.vote_count,
      popularity: m.popularity,
      original_language: m.original_language,
    }));

    // Batch upsert to avoid duplicates (tmdb_id must be unique in Supabase)
    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE);
      const { error } = await supabase
        .from(SUPABASE_TABLE)
        .upsert(batch, { onConflict: "tmdb_id" }); // requires unique constraint on tmdb_id

      if (error) {
        console.error(`Supabase error on page ${page}:`, error.message);
      } else {
        totalImported += batch.length;
        console.log(`Imported batch (${batch.length}), total so far: ${totalImported}`);
      }
      await delay(100);
    }

    setLastPage(page); // Save progress
    await delay(DELAY_MS);
  }
  console.log(`\nImport complete! Total movies imported: ${totalImported}`);
}

main().catch((err) => {
  console.error("Import failed:", err);
  process.exit(1);
});
