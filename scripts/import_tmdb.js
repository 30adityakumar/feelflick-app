// import_tmdb.js
import 'dotenv/config';
import axios from 'axios';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://orbhbwtgdfqhehuuxfmg.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yYmhid3RnZGZxaGVodXV4Zm1nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEwNDI4NDQsImV4cCI6MjA2NjYxODg0NH0.9JiUlmQNi3kLEssgzrI97qLzu3j2zKZlwFn42miAsDM"; // NEVER expose this in frontend!
const TMDB_API_KEY = "56e20962522bccd1990f31f2c791d8d1";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// --- Helper: sleep for X ms
function sleep(ms) { return new Promise(res => setTimeout(res, ms)); }

// --- 1. Import genres ---
async function importGenres() {
  const url = `https://api.themoviedb.org/3/genre/movie/list?api_key=${TMDB_API_KEY}&language=en-US`;
  const { data } = await axios.get(url);
  for (const g of data.genres) {
    await supabase
      .from('genres')
      .upsert({ id: g.id, name: g.name })  // assumes your `id` matches tmdb's genre id
  }
  console.log(`Imported genres: ${data.genres.length}`);
}

// --- 2. Import movies (batched, 10k total) ---
async function importMovies(startPage = 1, endPage = 500) {
  let lastPage = startPage;
  for (let page = startPage; page <= endPage; page++) {
    const url = `https://api.themoviedb.org/3/movie/popular?api_key=${TMDB_API_KEY}&language=en-US&page=${page}`;
    const { data } = await axios.get(url);
    if (!data.results?.length) break;

    for (const m of data.results) {
      // Upsert movie: DO NOT include 'id', let DB auto-increment!
      const { data: movie, error: movieError } = await supabase
        .from('movies')
        .upsert({
          tmdb_id: m.id,
          title: m.title,
          release_date: m.release_date,
          poster_path: m.poster_path,
          overview: m.overview,
        }, { onConflict: ['tmdb_id'] })
        .select();

      if (movieError) console.error("Movie insert error:", movieError, m.title);

      // Link genres
      if (movie && movie[0] && m.genre_ids) {
        for (const genre_id of m.genre_ids) {
          await supabase
            .from('movie_genres')
            .upsert({
              movie_id: movie[0].id,  // DB id
              genre_id: genre_id      // matches tmdb genre id (your genres.id)
            });
        }
      }
    }
    lastPage = page;
    console.log(`Page ${page} done.`);
    await sleep(1700); // TMDb: no more than 40 requests/10s
  }
  console.log("Import completed. Last page imported:", lastPage);
}

// --- CLI entry point ---
const start = Number(process.argv[2]) || 1;
const end = Number(process.argv[3]) || 500; // 500*20=10,000

(async () => {
  await importGenres();
  await importMovies(start, end);
})();
