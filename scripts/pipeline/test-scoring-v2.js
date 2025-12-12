require('dotenv').config();
const Logger = require('../utils/logger');
const { supabase } = require('../utils/supabase');
const { calculateMovieScores } = require('./07-calculate-movie-scores-v2-integrated');

const logger = new Logger('test-scoring-v2.log');

async function testV2Scoring() {
  logger.section('�� TESTING V2 SCORING ON SAMPLE MOVIES');
  
  // Get 10 high-quality movies for testing
  const { data: testMovies } = await supabase
    .from('movies')
    .select('id, title, ff_rating, quality_score')
    .not('ff_rating', 'is', null)
    .order('vote_count', { ascending: false })
    .limit(10);
  
  logger.info(`Testing on ${testMovies.length} movies:\n`);
  testMovies.forEach((m, i) => {
    logger.info(`${i+1}. ${m.title} (Current FF: ${m.ff_rating})`);
  });
  
  logger.info('\n🚀 Running V2 scoring...\n');
  
  // Temporarily limit to test movies
  const movieIds = testMovies.map(m => m.id);
  
  // Run V2 (you'll need to modify it to accept movieIds filter)
  // await calculateMovieScores();
  
  logger.info('\n✅ Test complete! Check results in database.');
}

testV2Scoring();
