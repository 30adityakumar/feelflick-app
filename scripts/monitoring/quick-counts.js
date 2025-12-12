require('dotenv').config();
const { supabase } = require('../utils/supabase');

async function quickCounts() {
  const tables = [
    'movies',
    'movie_people',
    'movie_genres',
    'movie_keywords',
    'ratings_external',
    'movie_mood_scores',
    'genres',
    'keywords',
    'people',
    'moods'
  ];
  
  console.log('\n📊 TABLE COUNTS\n');
  
  for (const table of tables) {
    const { count } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });
    
    console.log(`  ${table.padEnd(25)} ${count?.toLocaleString() || 0}`);
  }
}

quickCounts();
