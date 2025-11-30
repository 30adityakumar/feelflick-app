// scripts/phase1/04-sync-genres.js
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const TMDB_API_KEY = process.env.TMDB_API_KEY;

async function syncGenres() {
  console.log('🎬 Syncing genres from TMDB...\n');

  try {
    // Fetch genres from TMDB
    const response = await axios.get(
      `https://api.themoviedb.org/3/genre/movie/list?api_key=${TMDB_API_KEY}`
    );

    const genres = response.data.genres;
    console.log(`Found ${genres.length} genres from TMDB\n`);

    // Insert into Supabase
    for (const genre of genres) {
      const { data, error } = await supabase
        .from('genres')
        .upsert({ id: genre.id, name: genre.name }, { onConflict: 'id' })
        .select();

      if (error) {
        console.error(`❌ Error inserting ${genre.name}:`, error.message);
      } else {
        console.log(`✅ ${genre.name} (ID: ${genre.id})`);
      }
    }

    console.log('\n✨ Genres sync complete!');
  } catch (error) {
    console.error('❌ Error fetching genres from TMDB:', error.message);
  }
}

syncGenres().catch(console.error);