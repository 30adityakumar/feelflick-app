require('dotenv').config();
const { supabase } = require('../utils/supabase');

async function checkDuplicates() {
  console.log('\n🔍 CHECKING FOR DUPLICATES\n');
  
  // Check duplicate TMDB IDs
  const { data: movies } = await supabase
    .from('movies')
    .select('tmdb_id, title, id');
  
  const tmdbMap = {};
  const duplicates = [];
  
  movies?.forEach(m => {
    if (tmdbMap[m.tmdb_id]) {
      duplicates.push({
        tmdb_id: m.tmdb_id,
        movie1: tmdbMap[m.tmdb_id],
        movie2: { id: m.id, title: m.title }
      });
    } else {
      tmdbMap[m.tmdb_id] = { id: m.id, title: m.title };
    }
  });
  
  if (duplicates.length > 0) {
    console.log(`⚠️  Found ${duplicates.length} duplicate TMDB IDs:\n`);
    duplicates.forEach(d => {
      console.log(`  TMDB ${d.tmdb_id}:`);
      console.log(`    - ID ${d.movie1.id}: ${d.movie1.title}`);
      console.log(`    - ID ${d.movie2.id}: ${d.movie2.title}`);
    });
  } else {
    console.log('✅ No duplicate TMDB IDs found');
  }
}

checkDuplicates();
