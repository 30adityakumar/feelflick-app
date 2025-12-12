const { supabase } = require('../utils/supabase');
const Logger = require('../utils/logger');

const logger = new Logger('fix-incomplete-processing.log');

async function fixIncompleteProcessing() {
  logger.info('Finding movies with incomplete processing...');
  
  const { data: movies } = await supabase
    .from('movies')
    .select('tmdb_id, title, has_embeddings, has_scores, has_cast_metadata')
    .or('last_embedding_at.is.null,processing_completed_at.is.null')
    .limit(200);
  
  logger.info(`Found ${movies.length} movies with incomplete processing`);
  
  // Log breakdown
  let needsEmbeddings = 0;
  let needsScores = 0;
  let needsCast = 0;
  
  movies.forEach(m => {
    if (!m.has_embeddings) needsEmbeddings++;
    if (!m.has_scores) needsScores++;
    if (!m.has_cast_metadata) needsCast++;
  });
  
  logger.info(`\nBreakdown:`);
  logger.info(`  - Need embeddings: ${needsEmbeddings}`);
  logger.info(`  - Need scores: ${needsScores}`);
  logger.info(`  - Need cast metadata: ${needsCast}`);
  
  logger.info('\n💡 Run the pipeline to process these movies:');
  logger.info('   cd scripts/pipeline && node run-pipeline.js discover');
}

fixIncompleteProcessing()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
