// scripts/pipeline/08-generate-embeddings.js

/**
 * ============================================================================
 * STEP 08: GENERATE EMBEDDINGS (OpenAI)
 * ============================================================================
 * 
 * Purpose:
 *   Generate text embeddings for movie semantic search
 *   
 * Input:
 *   - Movies with status='scoring' and has_embeddings=false
 *   
 * Output:
 *   - Embeddings generated using OpenAI text-embedding-3-small
 *   - has_embeddings=true
 *   - Status updated to 'complete' ✅ FULLY PROCESSED
 *   
 * Model:
 *   text-embedding-3-small (1536 dimensions, $0.02/1M tokens)
 *   
 * Rate Limits:
 *   OpenAI: 3,000 RPM (requests per minute)
 *   Script enforces: ~400/minute with 150ms delay
 * 
 * ============================================================================
 */

require('dotenv').config();

const Logger = require('../utils/logger');
const { supabase } = require('../utils/supabase');
const OpenAI = require('openai');

const logger = new Logger('08-generate-embeddings.log');

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  MAX_MOVIES: 10000,           // Process up to 10k movies per run
  BATCH_UPDATE_SIZE: 50,       // Update DB every 50 embeddings
  RATE_LIMIT_DELAY_MS: 150,    // 150ms = ~400 requests/minute
  MAX_TEXT_LENGTH: 8000,       // OpenAI limit
  MAX_RETRIES: 3,
  RETRY_DELAY_MS: 2000
};

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

// ============================================================================
// GENERATE EMBEDDING WITH RETRY
// ============================================================================

async function generateEmbeddingWithRetry(text, movieTitle, retryCount = 0) {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-large',  // ✅ Generates 3072 dimensions
    input: text.substring(0, CONFIG.MAX_TEXT_LENGTH)
  });
    
    return {
      success: true,
      embedding: response.data[0].embedding
    };
    
  } catch (error) {
    // Handle rate limits
    if (error.status === 429 && retryCount < CONFIG.MAX_RETRIES) {
      const delay = CONFIG.RETRY_DELAY_MS * Math.pow(2, retryCount);
      logger.warn(`  Rate limited for "${movieTitle}", waiting ${delay}ms... (retry ${retryCount + 1}/${CONFIG.MAX_RETRIES})`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      return generateEmbeddingWithRetry(text, movieTitle, retryCount + 1);
    }
    
    // Handle other errors
    return {
      success: false,
      error: error.message
    };
  }
}

// ============================================================================
// BATCH UPDATE MOVIES
// ============================================================================

async function batchUpdateMovies(updates) {
  if (updates.length === 0) return { success: true, count: 0 };
  
  try {
    const { error } = await supabase
      .from('movies')
      .upsert(updates, { 
        onConflict: 'id',
        ignoreDuplicates: false 
      });
    
    if (error) throw error;
    
    return { success: true, count: updates.length };
    
  } catch (error) {
    logger.error(`Batch update failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// ============================================================================
// BUILD EMBEDDING TEXT
// ============================================================================

function buildEmbeddingText(movie) {
  const parts = [];
  
  // Title (most important)
  if (movie.title) {
    parts.push(movie.title);
  }
  
  // Overview/description
  if (movie.overview) {
    parts.push(movie.overview);
  }
  
  // Tagline
  if (movie.tagline && movie.tagline !== movie.overview) {
    parts.push(movie.tagline);
  }
  
  // Genres
  if (movie.genres) {
    try {
      const genres = Array.isArray(movie.genres) 
        ? movie.genres 
        : JSON.parse(movie.genres);
      
      if (genres.length > 0) {
        parts.push(`Genres: ${genres.join(', ')}`);
      }
    } catch (e) {
      // Ignore parse errors
    }
  }
  
  // Keywords (top 10 for relevance)
  if (movie.keywords) {
    try {
      const keywords = Array.isArray(movie.keywords)
        ? movie.keywords
        : JSON.parse(movie.keywords);
      
      if (keywords.length > 0) {
        const topKeywords = keywords.slice(0, 10);
        parts.push(`Keywords: ${topKeywords.join(', ')}`);
      }
    } catch (e) {
      // Ignore parse errors
    }
  }
  
  // Director
  if (movie.director_name) {
    parts.push(`Directed by ${movie.director_name}`);
  }
  
  return parts.join('. ');
}

// ============================================================================
// MAIN FUNCTION
// ============================================================================

async function main(options = {}) {
  const startTime = Date.now();
  
  const config = {
    maxMovies: options.maxMovies || CONFIG.MAX_MOVIES,
    dryRun: options.dryRun || false
  };
  
  logger.section('🤖 GENERATE EMBEDDINGS (OpenAI)');
  logger.info(`Model: text-embedding-3-small (1536 dimensions)`);
  logger.info(`Max movies: ${config.maxMovies.toLocaleString()}`);
  logger.info(`Dry run: ${config.dryRun ? 'YES' : 'NO'}`);
  
  // Check API key
  if (!process.env.OPENAI_API_KEY) {
    logger.error('OPENAI_API_KEY not set in environment');
    return { success: false, error: 'Missing API key' };
  }
  
  logger.info('API Key: ✓\n');
  
  try {
    // ✅ UPDATED QUERY: Get movies with status='scoring'
    const { data: movies, error } = await supabase
      .from('movies')
      .select('id, title, overview, tagline, genres, keywords, director_name')
      .eq('status', 'scoring')           // ← NEW: Only movies ready for embeddings
      .eq('has_embeddings', false)
      .is('embedding', null)
      .limit(config.maxMovies);
    
    if (error) throw error;
    
    if (!movies || movies.length === 0) {
      logger.info('✓ All movies have embeddings');
      return { success: true, stats: { processed: 0, success: 0, failed: 0 } };
    }
    
    logger.info(`Found ${movies.length} movies needing embeddings\n`);
    
    // Stats
    const stats = {
      total: movies.length,
      success: 0,
      failed: 0,
      totalTokens: 0,
      estimatedCost: 0
    };
    
    // Batch updates buffer
    const batchUpdates = [];
    
    // Process each movie
    for (let i = 0; i < movies.length; i++) {
      const movie = movies[i];
      
      try {
        // Build embedding text
        const text = buildEmbeddingText(movie);
        
        // Estimate tokens (rough: ~4 chars per token)
        const estimatedTokens = Math.ceil(text.length / 4);
        stats.totalTokens += estimatedTokens;
        
        logger.debug(`${i + 1}/${movies.length} Generating embedding: ${movie.title} (~${estimatedTokens} tokens)`);
        
        if (config.dryRun) {
          stats.success++;
          continue;
        }
        
        // Generate embedding with retry
        const result = await generateEmbeddingWithRetry(text, movie.title);
        
        if (result.success) {
          // Prepare update
          batchUpdates.push({
            id: movie.id,
            embedding: `[${result.embedding.join(',')}]`,
            has_embeddings: true,
            last_embedding_at: new Date().toISOString(),
            
            // ✅ CRITICAL: Update status to 'complete'
            status: 'complete',  // ← Movie is now FULLY PROCESSED!
            
            updated_at: new Date().toISOString()
          });
          
          stats.success++;
          
          logger.success(`  ✓ ${movie.title}`);
          
          // Batch flush
          if (batchUpdates.length >= CONFIG.BATCH_UPDATE_SIZE) {
            const updateResult = await batchUpdateMovies(batchUpdates);
            if (updateResult.success) {
              logger.info(`  💾 Batch updated: ${updateResult.count} movies`);
            }
            batchUpdates.length = 0;
          }
          
        } else {
          logger.error(`  ✗ Failed: ${movie.title} - ${result.error}`);
          stats.failed++;
        }
        
        // Rate limiting
        if (i < movies.length - 1) {
          await new Promise(resolve => setTimeout(resolve, CONFIG.RATE_LIMIT_DELAY_MS));
        }
        
        // Progress logging
        if ((i + 1) % 50 === 0) {
          const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
          const rate = (stats.success / (elapsed / 60)).toFixed(1);
          const pct = ((i + 1) / movies.length * 100).toFixed(1);
          logger.info(`\nProgress: ${i + 1}/${movies.length} (${pct}%) | ${rate} embeddings/min | ${elapsed}s`);
        }
        
      } catch (error) {
        logger.error(`  ✗ Unexpected error for ${movie.title}: ${error.message}`);
        stats.failed++;
      }
    }
    
    // Flush remaining updates
    if (batchUpdates.length > 0 && !config.dryRun) {
      logger.info('\nFlushing final batch...');
      const result = await batchUpdateMovies(batchUpdates);
      if (result.success) {
        logger.success(`✓ Final batch updated: ${result.count} movies`);
      }
    }
    
    // Calculate cost (text-embedding-3-small: $0.02/1M tokens)
    stats.estimatedCost = (stats.totalTokens / 1000000) * 0.02;
    
    // Summary
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    logger.section('📊 SUMMARY');
    logger.info(`Total movies: ${stats.total}`);
    logger.success(`✓ Successfully generated: ${stats.success}`);
    
    if (stats.failed > 0) {
      logger.error(`✗ Failed: ${stats.failed}`);
    }
    
    logger.info(`\nTokens & Cost:`);
    logger.info(`  Total tokens: ${stats.totalTokens.toLocaleString()}`);
    logger.info(`  Estimated cost: $${stats.estimatedCost.toFixed(4)}`);
    
    logger.info(`\nPerformance:`);
    logger.info(`  Duration: ${duration}s`);
    logger.info(`  Average: ${(stats.success / (duration / 60)).toFixed(1)} embeddings/minute`);
    
    if (stats.success > 0) {
      logger.success('\n✅ Embedding generation complete!');
      logger.success('   Movies are now status=\'complete\' and ready for recommendations! 🎉');
    }
    
    logger.info(`\nLog file: ${logger.getLogFilePath()}`);
    
    return {
      success: stats.failed === 0 || stats.success > 0,
      stats
    };
    
  } catch (error) {
    logger.error('Fatal error:', { error: error.message, stack: error.stack });
    return { success: false, error: error.message };
  }
}

// ============================================================================
// CLI EXECUTION
// ============================================================================

if (require.main === module) {
  const args = process.argv.slice(2);
  
  const options = {
    dryRun: args.includes('--dry-run'),
    maxMovies: CONFIG.MAX_MOVIES
  };
  
  // Parse --limit=N (legacy) or --max-movies=N
  const limitArg = args.find(arg => arg.startsWith('--limit=') || arg.startsWith('--max-movies='));
  if (limitArg) {
    options.maxMovies = parseInt(limitArg.split('=')[1]) || CONFIG.MAX_MOVIES;
  }
  
  // Help
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
┌─────────────────────────────────────────────────────────────────┐
│ Step 08: Generate Embeddings (OpenAI)                          │
└─────────────────────────────────────────────────────────────────┘

USAGE:
  node scripts/pipeline/08-generate-embeddings.js [options]

OPTIONS:
  --limit=N          Process max N movies (default: ${CONFIG.MAX_MOVIES.toLocaleString()})
  --max-movies=N     Alias for --limit
  --dry-run          Simulate without making changes
  --help, -h         Show this help message

MODEL:
  text-embedding-3-small
  - 1536 dimensions
  - $0.02 per 1M tokens
  - ~400 requests/minute rate limit

EXAMPLES:
  # Generate embeddings for up to 10k movies
  node scripts/pipeline/08-generate-embeddings.js
  
  # Generate for 1000 movies
  node scripts/pipeline/08-generate-embeddings.js --limit=1000
  
  # Dry run to estimate cost
  node scripts/pipeline/08-generate-embeddings.js --dry-run --limit=100

NOTE:
  Requires OPENAI_API_KEY in .env file
  Get your key at: https://platform.openai.com/api-keys
`);
    process.exit(0);
  }
  
  // Execute
  main(options)
    .then(result => {
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      logger.error('Fatal error:', { error: error.message });
      process.exit(1);
    });
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = { main };
