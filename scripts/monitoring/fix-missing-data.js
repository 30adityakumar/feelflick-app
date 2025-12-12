require('dotenv').config();
const { supabase } = require('../utils/supabase');
const axios = require('axios');

const TMDB_API_KEY = process.env.TMDB_API_KEY;

async function fixMissingData() {
  console.log('\n🔧 FIXING MOVIES WITH MISSING DATA\n');
  
  // Find movies missing overview or runtime
  const { data: broken } = await supabase
    .from('movies')
    .select('id, tmdb_id, title, overview, runtime')
    .or('overview.is.null,runtime.is.null');
  
  console.log(`Found ${broken?.length || 0} movies with missing data\n`);
  
  for (const movie of broken || []) {
    console.log(`Fixing: ${movie.title} (TMDB: ${movie.tmdb_id})`);
    console.log(`  Missing: ${!movie.overview ? 'overview' : ''} ${!movie.runtime ? 'runtime' : ''}`);
    
    try {
      const response = await axios.get(
        `https://api.themoviedb.org/3/movie/${movie.tmdb_id}?api_key=${TMDB_API_KEY}`
      );
      
      const data = response.data;
      
      const { error } = await supabase
        .from('movies')
        .update({
          overview: data.overview || movie.overview,
          runtime: data.runtime || movie.runtime,
          release_date: data.release_date || movie.release_date,
          vote_average: data.vote_average || movie.vote_average,
          vote_count: data.vote_count || movie.vote_count
        })
        .eq('id', movie.id);
      
      if (error) {
        console.log(`  ❌ Update failed:`, error.message);
      } else {
        console.log(`  ✅ Fixed`);
      }
    } catch (error) {
      console.log(`  ❌ TMDB fetch failed:`, error.message);
    }
    
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  
  console.log('\n✅ Done!');
}

fixMissingData();
