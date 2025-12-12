require('dotenv').config();
const { supabase } = require('../utils/supabase');

async function generateAllMissingMoodScores() {
  console.log('\n🎭 GENERATING ALL MISSING MOOD SCORES\n');
  
  // Get ALL movies
  const { data: allMovies } = await supabase
    .from('movies')
    .select('id, title, genres')
    .eq('status', 'complete');
  
  // Get movies that already have mood scores
  const { data: withScores } = await supabase
    .from('movie_mood_scores')
    .select('movie_id');
  
  const hasScores = new Set(withScores?.map(s => s.movie_id));
  const needsScores = allMovies?.filter(m => !hasScores.has(m.id)) || [];
  
  console.log(`Total movies: ${allMovies?.length}`);
  console.log(`Need mood scores: ${needsScores.length}\n`);
  
  if (needsScores.length === 0) {
    console.log('✅ All movies have mood scores!');
    return;
  }
  
  console.log('This will take ~10-15 minutes...\n');
  console.log('Run the pipeline script instead:\n');
  console.log('  node scripts/pipeline/09-calculate-mood-scores.js\n');
  console.log('Or continue here? (Ctrl+C to cancel, Enter to continue)');
}

generateAllMissingMoodScores();
