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
 *   - Embeddings generated using OpenAI text-embedding-3-large (3072 dims)
 *   - has_embeddings=true
 *   - Status updated to 'complete'
 *
 * Options:
 *   --limit=N              Process max N movies (default: 10000)
 *   --dry-run              Simulate without making changes
 *   --rebuild              Re-embed already-embedded movies (ignores has_embeddings)
 *   --stale-enrichment     Re-embed movies where llm_enriched_at > last_embedding_at
 *   --model=NAME           Override embedding model
 *
 * ============================================================================
 */

require('dotenv').config();

const Logger = require('../utils/logger');
const { supabase } = require('../utils/supabase');
const OpenAI = require('openai');

const logger = new Logger('08-generate-embeddings.log');

// ============================================================================
// SINGLE SOURCE OF TRUTH — model & cost constants
// ============================================================================

const EMBEDDING_MODEL = 'text-embedding-3-large';
const EMBEDDING_DIMENSIONS = 3072;
const EMBEDDING_COST_PER_1K = 0.00013; // OpenAI public pricing

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  MODEL: EMBEDDING_MODEL,
  DIMENSIONS: EMBEDDING_DIMENSIONS,
  MAX_TEXT_LENGTH: 16000,
  BATCH_API_SIZE: 100,         // OpenAI inputs per request
  MAX_MOVIES: 10000,
  BATCH_UPDATE_SIZE: 50,
  RATE_LIMIT_DELAY_MS: 500,    // between batched API calls, not per movie
  MAX_RETRIES: 3,
  RETRY_DELAY_MS: 2000,
};

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// ============================================================================
// BUILD EMBEDDING TEXT
// ============================================================================

function buildEmbeddingText(movie) {
  const parts = [];

  // Title with year disambiguates remakes
  if (movie.title) {
    const year = movie.release_date ? new Date(movie.release_date).getFullYear() : null;
    parts.push(year ? `${movie.title} (${year})` : movie.title);
  }

  // Overview
  if (movie.overview) parts.push(movie.overview);

  // Tagline
  if (movie.tagline && movie.tagline !== movie.overview) parts.push(movie.tagline);

  // Genres (JSONB array of strings)
  if (movie.genres) {
    try {
      const genres = Array.isArray(movie.genres) ? movie.genres : JSON.parse(movie.genres);
      if (genres.length > 0) parts.push(`Genres: ${genres.join(', ')}`);
    } catch (_) {}
  }

  // Keywords — extract .name from {id, name} objects (REGRESSION FIX)
  if (movie.keywords) {
    try {
      const raw = Array.isArray(movie.keywords) ? movie.keywords : JSON.parse(movie.keywords);
      const names = raw
        .map(k => typeof k === 'string' ? k : (k?.name || ''))
        .filter(Boolean)
        .slice(0, 10);
      if (names.length > 0) parts.push(`Keywords: ${names.join(', ')}`);
    } catch (_) {}
  }

  // Collection / franchise
  if (movie.collection_name) parts.push(`Part of: ${movie.collection_name}`);

  // Production countries
  if (movie.production_countries?.length > 0) {
    parts.push(`Country: ${movie.production_countries.slice(0, 3).join(', ')}`);
  }

  // Crew
  if (movie.director_name) parts.push(`Directed by ${movie.director_name}`);
  if (movie.writer_name && movie.writer_name !== movie.director_name) {
    parts.push(`Written by ${movie.writer_name}`);
  }
  if (movie.cinematographer_name) parts.push(`Cinematography: ${movie.cinematographer_name}`);

  // Mood signals from LLM enrichment (step 07b) — improves semantic clustering
  if (Array.isArray(movie.mood_tags) && movie.mood_tags.length > 0) {
    parts.push(`Mood: ${movie.mood_tags.join(', ')}`);
  }
  if (Array.isArray(movie.tone_tags) && movie.tone_tags.length > 0) {
    parts.push(`Tone: ${movie.tone_tags.join(', ')}`);
  }
  if (movie.fit_profile) {
    parts.push(`Type: ${movie.fit_profile.replace(/_/g, ' ')}`);
  }

  return parts.join('. ');
}

// ============================================================================
// GENERATE EMBEDDINGS IN BATCH WITH RETRY
// ============================================================================

async function generateEmbeddingsBatchWithRetry(texts, model, retryCount = 0) {
  try {
    const response = await openai.embeddings.create({
      model,
      input: texts.map(t => t.substring(0, CONFIG.MAX_TEXT_LENGTH)),
    });

    return {
      success: true,
      embeddings: response.data.map(d => d.embedding),
      usage: response.usage,
    };

  } catch (error) {
    if (error.status === 429 && retryCount < CONFIG.MAX_RETRIES) {
      const delay = CONFIG.RETRY_DELAY_MS * Math.pow(2, retryCount);
      logger.warn(`  Rate limited, waiting ${delay}ms... (retry ${retryCount + 1}/${CONFIG.MAX_RETRIES})`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return generateEmbeddingsBatchWithRetry(texts, model, retryCount + 1);
    }

    return {
      success: false,
      error: error.message,
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
// QUALITY SAMPLING — spot-check nearest neighbors after embedding
// ============================================================================

async function sampleNeighborQuality(processedIds) {
  const sampleSize = Math.min(5, processedIds.length);
  const sampleIds = processedIds.slice(0, sampleSize);

  logger.info('\n🔍 Quality sampling — nearest neighbors for first embeddings:');

  for (const id of sampleIds) {
    try {
      const { data: neighbors } = await supabase.rpc('match_movies_by_seeds', {
        seed_ids: [id],
        exclude_ids: [],
        match_count: 5,
        min_ff_rating: 0,
      });
      const { data: seed } = await supabase.from('movies').select('title, mood_tags').eq('id', id).single();

      if (seed && neighbors) {
        // Fetch mood_tags for neighbors
        const neighborIds = neighbors.slice(0, 5).map(n => n.id);
        const { data: neighborMoods } = await supabase
          .from('movies')
          .select('id, mood_tags')
          .in('id', neighborIds);
        const moodMap = new Map((neighborMoods || []).map(n => [n.id, n.mood_tags]));

        const seedTags = (seed.mood_tags || []).slice(0, 3).join(',');
        const neighborStr = neighbors.slice(0, 5).map(n => {
          const tags = (moodMap.get(n.id) || []).slice(0, 2).join(',');
          return `${n.title}[${tags}]`;
        }).join(' | ');
        logger.info(`  🔍 "${seed.title}" [${seedTags}] → ${neighborStr}`);
      }
    } catch (err) {
      logger.warn(`  Neighbor query failed for movie ${id}: ${err.message}`);
    }
  }
}

// ============================================================================
// MAIN FUNCTION
// ============================================================================

async function main(options = {}) {
  const startTime = Date.now();

  const config = {
    maxMovies: options.maxMovies || CONFIG.MAX_MOVIES,
    dryRun: options.dryRun || false,
    rebuild: options.rebuild || false,
    staleEnrichment: options.staleEnrichment || false,
    model: options.model || CONFIG.MODEL,
  };

  logger.section('🤖 GENERATE EMBEDDINGS (OpenAI)');
  logger.info(`Model: ${config.model} (${EMBEDDING_DIMENSIONS} dimensions)`);
  logger.info(`Max movies: ${config.maxMovies.toLocaleString()}`);
  logger.info(`Dry run: ${config.dryRun ? 'YES' : 'NO'}`);
  logger.info(`Rebuild: ${config.rebuild ? 'YES' : 'NO'}`);
  logger.info(`Stale enrichment: ${config.staleEnrichment ? 'YES' : 'NO'}`);

  // Check API key
  if (!process.env.OPENAI_API_KEY) {
    logger.error('OPENAI_API_KEY not set in environment');
    return { success: false, error: 'Missing API key' };
  }

  logger.info('API Key: ✓\n');

  try {
    // Build query — rebuild mode ignores has_embeddings filter
    const selectCols = 'id, title, overview, tagline, genres, keywords, director_name, writer_name, cinematographer_name, collection_name, production_countries, release_date, original_language, mood_tags, tone_tags, fit_profile'
      + (config.staleEnrichment ? ', llm_enriched_at, last_embedding_at' : '');

    let query = supabase
      .from('movies')
      .select(selectCols)
      .limit(config.maxMovies);

    if (config.rebuild) {
      query = query.in('status', ['scoring', 'complete']);
    } else if (config.staleEnrichment) {
      // Fetch enriched films with existing embeddings; filter client-side
      // because PostgREST can't compare two columns directly
      query = query
        .in('status', ['scoring', 'complete'])
        .not('embedding', 'is', null)
        .not('llm_enriched_at', 'is', null);
    } else {
      query = query
        .eq('status', 'scoring')
        .eq('has_embeddings', false)
        .is('embedding', null);
    }

    let { data: movies, error } = await query;

    if (error) throw error;

    // Client-side staleness filter: keep films where enrichment is newer than embedding
    if (config.staleEnrichment && movies?.length) {
      const before = movies.length;
      movies = movies.filter(m => {
        if (!m.last_embedding_at) return true;
        return new Date(m.llm_enriched_at) > new Date(m.last_embedding_at);
      });
      logger.info(`Staleness filter: ${before} candidates → ${movies.length} stale embeddings`);
    }

    if (!movies || movies.length === 0) {
      logger.info('✓ All movies have embeddings');
      return { success: true, stats: { processed: 0, success: 0, failed: 0 } };
    }

    logger.info(`Found ${movies.length} movies needing embeddings\n`);

    // Log sample embedding text for verification
    if (movies.length > 0) {
      const sampleText = buildEmbeddingText(movies[0]);
      logger.info(`Sample embedding text (${movies[0].title}):`);
      logger.info(`  "${sampleText.substring(0, 300)}${sampleText.length > 300 ? '...' : ''}"\n`);
    }

    // Stats
    const stats = {
      total: movies.length,
      success: 0,
      failed: 0,
      totalTokens: 0,
      estimatedCost: 0,
      apiBatches: 0,
    };

    // Batch updates buffer + processed ID tracker
    const batchUpdates = [];
    const processedIds = [];

    // Process movies in API batches
    for (let batchStart = 0; batchStart < movies.length; batchStart += CONFIG.BATCH_API_SIZE) {
      const batch = movies.slice(batchStart, batchStart + CONFIG.BATCH_API_SIZE);
      const texts = batch.map(m => buildEmbeddingText(m));

      // Estimate tokens for this batch
      const batchTokens = texts.reduce((sum, t) => sum + Math.ceil(t.length / 4), 0);
      stats.totalTokens += batchTokens;

      const batchNum = Math.floor(batchStart / CONFIG.BATCH_API_SIZE) + 1;
      const totalBatches = Math.ceil(movies.length / CONFIG.BATCH_API_SIZE);
      logger.debug(`Batch ${batchNum}/${totalBatches}: ${batch.length} movies (~${batchTokens} tokens)`);

      if (config.dryRun) {
        stats.success += batch.length;
        continue;
      }

      // Call OpenAI
      const result = await generateEmbeddingsBatchWithRetry(texts, config.model);
      stats.apiBatches++;

      if (!result.success) {
        logger.error(`  ✗ Batch ${batchNum} failed: ${result.error}`);
        stats.failed += batch.length;
        continue;
      }

      // Use actual token count from API response when available
      if (result.usage?.total_tokens) {
        // Replace estimate with real count for this batch
        stats.totalTokens = stats.totalTokens - batchTokens + result.usage.total_tokens;
      }

      // Map embeddings back to movies
      for (let j = 0; j < batch.length; j++) {
        const movie = batch[j];
        const embedding = result.embeddings[j];

        if (!embedding) {
          logger.error(`  ✗ No embedding returned for ${movie.title}`);
          stats.failed++;
          continue;
        }

        batchUpdates.push({
          id: movie.id,
          embedding: `[${embedding.join(',')}]`,
          has_embeddings: true,
          last_embedding_at: new Date().toISOString(),
          status: 'complete',
          updated_at: new Date().toISOString()
        });

        processedIds.push(movie.id);
        stats.success++;

        logger.debug(`  ✓ ${movie.title}`);
      }

      // Flush DB updates when buffer is full
      if (batchUpdates.length >= CONFIG.BATCH_UPDATE_SIZE) {
        const updateResult = await batchUpdateMovies(batchUpdates);
        if (updateResult.success) {
          logger.info(`  💾 Batch updated: ${updateResult.count} movies`);
        }
        batchUpdates.length = 0;
      }

      // Progress logging
      const processed = batchStart + batch.length;
      if (processed % 200 === 0 || processed === movies.length) {
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        const rate = (stats.success / (elapsed / 60)).toFixed(1);
        const pct = (processed / movies.length * 100).toFixed(1);
        logger.info(`Progress: ${processed}/${movies.length} (${pct}%) | ${rate} embeddings/min | ${elapsed}s`);
      }

      // Rate limiting between API batches
      if (batchStart + CONFIG.BATCH_API_SIZE < movies.length) {
        await new Promise(resolve => setTimeout(resolve, CONFIG.RATE_LIMIT_DELAY_MS));
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

    // Calculate cost
    stats.estimatedCost = (stats.totalTokens / 1000) * EMBEDDING_COST_PER_1K;

    // Summary
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    logger.section('📊 SUMMARY');
    logger.info(`Total movies: ${stats.total}`);
    logger.success(`✓ Successfully generated: ${stats.success}`);

    if (stats.failed > 0) {
      logger.error(`✗ Failed: ${stats.failed}`);
    }

    logger.info(`\nAPI Calls:`);
    logger.info(`  Batches: ${stats.apiBatches} (up to ${CONFIG.BATCH_API_SIZE} inputs each)`);

    logger.info(`\nTokens & Cost:`);
    logger.info(`  Total tokens: ${stats.totalTokens.toLocaleString()}`);
    logger.info(`  Estimated cost: $${stats.estimatedCost.toFixed(4)} (${EMBEDDING_MODEL} @ $${EMBEDDING_COST_PER_1K}/1k tokens)`);

    logger.info(`\nPerformance:`);
    logger.info(`  Duration: ${duration}s`);
    logger.info(`  Average: ${stats.success > 0 ? (stats.success / (duration / 60)).toFixed(1) : 0} embeddings/minute`);

    if (stats.success > 0) {
      logger.success('\n✅ Embedding generation complete!');
      logger.success('   Movies are now status=\'complete\' and ready for recommendations!');
    }

    // Quality sampling — spot-check nearest neighbors
    if (stats.success > 0 && !config.dryRun && processedIds.length > 0) {
      try {
        await sampleNeighborQuality(processedIds);
      } catch (err) {
        logger.warn(`Quality sampling failed: ${err.message}`);
      }
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
    rebuild: args.includes('--rebuild'),
    staleEnrichment: args.includes('--stale-enrichment'),
    maxMovies: CONFIG.MAX_MOVIES
  };

  // Parse --limit=N or --max-movies=N
  const limitArg = args.find(arg => arg.startsWith('--limit=') || arg.startsWith('--max-movies='));
  if (limitArg) {
    options.maxMovies = parseInt(limitArg.split('=')[1]) || CONFIG.MAX_MOVIES;
  }

  // Parse --model=NAME
  const modelArg = args.find(a => a.startsWith('--model='));
  if (modelArg) options.model = modelArg.split('=')[1];

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
  --dry-run              Simulate without making changes
  --rebuild              Re-embed already-embedded movies
  --stale-enrichment     Re-embed where llm_enriched_at > last_embedding_at
  --model=NAME           Override embedding model (default: ${EMBEDDING_MODEL})
  --help, -h         Show this help message

MODEL:
  ${EMBEDDING_MODEL}
  - ${EMBEDDING_DIMENSIONS} dimensions
  - $${EMBEDDING_COST_PER_1K} per 1k tokens
  - Batched: ${CONFIG.BATCH_API_SIZE} inputs per API call

EXAMPLES:
  # Generate embeddings for up to 10k movies
  node scripts/pipeline/08-generate-embeddings.js

  # Generate for 1000 movies
  node scripts/pipeline/08-generate-embeddings.js --limit=1000

  # Re-embed existing movies
  node scripts/pipeline/08-generate-embeddings.js --rebuild --limit=100

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
