require('dotenv').config();
const { supabase } = require('../utils/supabase');
const axios = require('axios');

const TMDB_API_KEY = process.env.TMDB_API_KEY;

async function fixRemaining() {
  console.log('\n🔧 FIXING REMAINING MOVIES WITH MISSING DATA\n');
  
  // Find all movies missing overview or runtime
  const { data: broken } = await supabase
    .from('movies')
    .select('id, tmdb_id, title, overview, runtime')
    .or('overview.is.null,runtime.is.null');
  
  console.log(`Found ${broken?.length || 0} movies with missing data\n`);
  
  if (!broken || broken.length === 0) {
    console.log('✅ No issues found!');
    return;
  }
  
  for (const movie of broken) {
    console.log(`\n${movie.title} (ID: ${movie.id}, TMDB: ${movie.tmdb_id})`);
    console.log(`  Missing: ${!movie.overview ? 'overview' : ''} ${!movie.runtime ? 'runtime' : ''}`);
    
    try {
      const response = await axios.get(
        `https://api.themoviedb.org/3/movie/${movie.tmdb_id}?api_key=${TMDB_API_KEY}`
      );
      
      const data = response.data;
      
      const updateData = {};
      if (!movie.overview && data.overview) updateData.overview = data.overview;
      if (!movie.runtime && data.runtime) updateData.runtime = data.runtime;
      
      if (Object.keys(updateData).length > 0) {
        const { error } = await supabase
          .from('movies')
          .update(updateData)
          .eq('id', movie.id);
        
        if (error) {
          console.log(`  ❌ Update failed:`, error.message);
        } else {
          console.log(`  ✅ Fixed: ${Object.keys(updateData).join(', ')}`);
        }
      } else {
        console.log(`  ⚠️  TMDB has no data for missing fields`);
      }
    } catch (error) {
      console.log(`  ❌ TMDB fetch failed:`, error.response?.status || error.message);
    }
    
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  
  console.log('\n✅ Done!');
}

fixRemaining();
