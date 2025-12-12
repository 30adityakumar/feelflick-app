// scripts/pipeline/08-generate-embeddings.js

require('dotenv').config();
const Logger = require('../utils/logger');
const { supabase, updateMovie } = require('../utils/supabase');
const OpenAI = require('openai');

const logger = new Logger('08-generate-embeddings.log');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ADD THIS CONSTANT
const MAX_MOVIES = 10000; // Process up to 10k movies per run

async function main() {
  const startTime = Date.now();
  
  logger.section('🤖 GENERATE EMBEDDINGS (OpenAI)');
  logger.info('Started at: ' + new Date().toISOString());
  logger.info('Batch mode: enabled');
  logger.info(`Max movies: ${MAX_MOVIES}`);

  try {
    // Get movies without embeddings
    const { data: movies, error } = await supabase
      .from('movies')
      .select('id, title, overview, genres')
      .eq('status', 'complete')
      .is('embedding', null)
      .limit(MAX_MOVIES);

    if (error) throw error;

    if (!movies || movies.length === 0) {
      logger.info('✓ All movies have embeddings');
      return;
    }

    logger.info(`Found ${movies.length} movies needing embeddings\n`);

    let completed = 0;
    let failed = 0;

    for (const movie of movies) {
      try {
        const text = `${movie.title}. ${movie.overview || ''}. Genres: ${JSON.stringify(movie.genres || [])}`;
        
        const response = await openai.embeddings.create({
          model: 'text-embedding-3-small',
          input: text.substring(0, 8000)
        });
        
        const embedding = response.data[0].embedding;
        
        await supabase
          .from('movies')
          .update({
            embedding: `[${embedding.join(',')}]`,
            has_embeddings: true,
            last_embedding_at: new Date().toISOString()
          })
          .eq('id', movie.id);
        
        completed++;
        
        if (completed % 10 === 0) {
          logger.info(`  Progress: ${completed}/${movies.length}`);
        }
        
        await new Promise(resolve => setTimeout(resolve, 150));
        
      } catch (error) {
        logger.error(`  ❌ Failed: ${movie.title} - ${error.message}`);
        failed++;
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    logger.section('📊 SUMMARY');
    logger.info(`Total movies processed: ${movies.length}`);
    logger.success(`✓ Successful: ${completed}`);
    if (failed > 0) {
      logger.error(`✗ Failed: ${failed}`);
    }
    logger.info(`Duration: ${duration}s`);
    logger.success('\n✅ Embedding generation complete!');
    logger.info(`Log file: ${logger.getLogFilePath()}`);

  } catch (error) {
    logger.error('Fatal error:', { error: error.message, stack: error.stack });
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main };
