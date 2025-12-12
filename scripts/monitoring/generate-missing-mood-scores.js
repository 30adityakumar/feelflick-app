require('dotenv').config();
const { supabase } = require('../utils/supabase');

async function generateMissingMoodScores() {
  console.log('\n🎭 GENERATING MISSING MOOD SCORES\n');
  
  // Get all movie IDs that need mood scores
  const { data: allMovies } = await supabase
    .from('movies')
    .select('id')
    .eq('status', 'complete');
  
  const { data: existingScores } = await supabase
    .from('movie_mood_scores')
    .select('movie_id');
  
  const moviesWithScores = new Set(existingScores?.map(s => s.movie_id));
  const moviesMissingScores = allMovies?.filter(m => !moviesWithScores.has(m.id)) || [];
  
  console.log(`Movies needing mood scores: ${moviesMissingScores.length}\n`);
  
  if (moviesMissingScores.length === 0) {
    console.log('✅ All movies have mood scores!');
    return;
  }
  
  console.log('Run this command to generate them:\n');
  console.log('  node scripts/pipeline/09-calculate-mood-scores.js\n');
  console.log('Or run the full pipeline:\n');
  console.log('  node scripts/pipeline/run-pipeline.js\n');
}

generateMissingMoodScores();
