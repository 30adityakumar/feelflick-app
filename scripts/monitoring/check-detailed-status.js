require('dotenv').config();
const { supabase } = require('./utils/supabase');

async function checkStatus() {
  // Status counts
  const { count: complete } = await supabase
    .from('movies')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'complete');
  
  const { count: pending } = await supabase
    .from('movies')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending');
  
  const { count: nullStatus } = await supabase
    .from('movies')
    .select('*', { count: 'exact', head: true })
    .is('status', null);
  
  // Movies without cast metadata
  const { count: noCastMetadata } = await supabase
    .from('movies')
    .select('*', { count: 'exact', head: true })
    .eq('has_scores', true)
    .or('has_cast_metadata.is.null,has_cast_metadata.eq.false');
  
  // Movies without mood scores
  const { data: moviesWithMoodScores } = await supabase
    .from('movie_mood_scores')
    .select('movie_id', { count: 'exact' });
  
  const uniqueMoviesWithMood = new Set(moviesWithMoodScores?.map(m => m.movie_id) || []).size;
  
  const { count: totalMovies } = await supabase
    .from('movies')
    .select('*', { count: 'exact', head: true });
  
  console.log('\n📊 DETAILED STATUS:\n');
  console.log(`Total movies:              ${totalMovies}`);
  console.log(`Complete:                  ${complete}`);
  console.log(`Pending:                   ${pending}`);
  console.log(`Null status:               ${nullStatus}`);
  console.log(`\nMissing cast metadata:     ${noCastMetadata || 0}`);
  console.log(`Movies with mood scores:   ${uniqueMoviesWithMood}`);
  console.log(`Movies WITHOUT mood:       ${totalMovies - uniqueMoviesWithMood}`);
}

checkStatus();
