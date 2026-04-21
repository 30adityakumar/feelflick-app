// scripts/pipeline/11-build-similarity.js

/**
 * ============================================================================
 * STEP 11: BUILD MOVIE SIMILARITY GRAPH
 * ============================================================================
 *
 * Purpose:
 *   Pre-compute top-K nearest neighbors for every film with an embedding.
 *   Populates movie_similarity table, replacing real-time pgvector scans.
 *
 * Input:
 *   - Movies with embedding IS NOT NULL, is_valid = true, poster_path IS NOT NULL
 *   - Incremental: only films where similarity_built_at IS NULL
 *
 * Output:
 *   - movie_similarity rows (source_id, neighbor_id, cosine, rank)
 *   - movies.similarity_built_at updated
 *
 * Options:
 *   --rebuild     Full rebuild (ignore similarity_built_at)
 *   --limit=N     Process max N films (default: all)
 *   --concurrency=N  Parallel films (default: 1 — sequential to avoid DB contention)
 *   --k=N         Neighbors per film (default: 100)
 *   --dry-run     Count films to process without writing
 *
 * Performance:
 *   Each film requires a full pgvector sequential scan (~4.7s on 6091 × 3072-dim).
 *   No vector index possible (pgvector < 0.7.0 caps at 2000 dims).
 *   Sequential processing (concurrency=1): ~6091 × 5s ≈ 8.5 hours.
 *   Concurrency=3 is safe: ~3 hours. Above 5 risks statement timeouts.
 *
 * ============================================================================
 */

require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');
const Logger = require('../utils/logger');

const logger = new Logger('11-build-similarity.log');

// ============================================================================
// SUPABASE CLIENT (long timeout for pgvector scans)
// ============================================================================

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
}

// Default supabase client (normal timeout for metadata queries)
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Long-timeout client for pgvector RPC calls (~5s per scan, need headroom)
const supabaseLong = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false },
  global: { fetch: (url, opts) => fetch(url, { ...opts, signal: AbortSignal.timeout(30000) }) },
});

// ============================================================================
// CONFIGURATION
// ============================================================================

const args = process.argv.slice(2);
const flags = Object.fromEntries(
  args.map(a => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v ?? true];
  })
);

const CONFIG = {
  K: parseInt(flags.k, 10) || 100,
  CONCURRENCY: parseInt(flags.concurrency, 10) || 1,
  LIMIT: flags.limit ? parseInt(flags.limit, 10) : null,
  REBUILD: flags.rebuild === true || flags.rebuild === 'true',
  DRY_RUN: flags['dry-run'] === true || flags['dry-run'] === 'true',
  MAX_RETRIES: 2,
  RETRY_DELAY_MS: 3000,
};

// ============================================================================
// MAIN
// ============================================================================

async function run() {
  const startTime = Date.now();
  logger.info('=== Step 11: Build Similarity Graph ===');
  logger.info(`Config: K=${CONFIG.K}, concurrency=${CONFIG.CONCURRENCY}, rebuild=${CONFIG.REBUILD}, dry-run=${CONFIG.DRY_RUN}`);

  // 1. Pick films to process
  let query = supabase
    .from('movies')
    .select('id', { count: 'exact' })
    .not('embedding', 'is', null)
    .eq('is_valid', true)
    .not('poster_path', 'is', null);

  if (!CONFIG.REBUILD) {
    // Incremental: only films never built. Use --rebuild for full refresh.
    query = query.is('similarity_built_at', null);
  }

  query = query.order('id', { ascending: true });

  if (CONFIG.LIMIT) {
    query = query.limit(CONFIG.LIMIT);
  }

  const { data: films, count, error: queryError } = await query;
  if (queryError) {
    logger.error(`Query error: ${queryError.message}`);
    process.exit(1);
  }

  const total = films?.length || 0;
  logger.info(`Films to process: ${total} (total with embeddings: ${count ?? '?'})`);

  if (CONFIG.DRY_RUN) {
    logger.info('Dry run — exiting without changes.');
    return { processed: 0, total, skipped: 0, errors: 0 };
  }

  if (total === 0) {
    logger.info('Nothing to process.');
    return { processed: 0, total: 0, skipped: 0, errors: 0 };
  }

  // 2. Process with concurrency control
  let processed = 0;
  let errors = 0;
  let skipped = 0;

  for (let i = 0; i < films.length; i += CONFIG.CONCURRENCY) {
    const batch = films.slice(i, i + CONFIG.CONCURRENCY);
    const results = await Promise.allSettled(
      batch.map(f => buildForFilm(f.id))
    );

    for (const r of results) {
      if (r.status === 'fulfilled') {
        if (r.value === 'skipped') skipped++;
        else processed++;
      } else {
        errors++;
        logger.error(`Film failed: ${r.reason?.message || r.reason}`);
      }
    }

    if ((i + batch.length) % 50 === 0 || i + batch.length === films.length) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      const rate = processed > 0 ? (processed / ((Date.now() - startTime) / 1000)).toFixed(1) : '?';
      const eta = processed > 0 ? (((total - i - batch.length) / rate) / 60).toFixed(1) : '?';
      logger.info(`Progress: ${i + batch.length}/${total} (${processed} ok, ${skipped} skip, ${errors} err) [${elapsed}s, ${rate}/s, ETA ${eta}min]`);
    }
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  logger.info(`=== Done: ${processed} processed, ${skipped} skipped, ${errors} errors in ${duration}s ===`);

  return { processed, total, skipped, errors };
}

// ============================================================================
// PER-FILM BUILD (with retry)
// ============================================================================

async function buildForFilm(sourceId) {
  // Fetch source embedding
  const { data: src, error: srcError } = await supabase
    .from('movies')
    .select('embedding')
    .eq('id', sourceId)
    .single();

  if (srcError || !src?.embedding) {
    if (srcError) logger.warn(`Fetch embedding err for ${sourceId}: ${srcError.message}`);
    return 'skipped';
  }

  // Find top K neighbors via pgvector scan (with retry)
  let rpcData = null;
  for (let attempt = 0; attempt <= CONFIG.MAX_RETRIES; attempt++) {
    const { data, error: rpcError } = await supabaseLong.rpc('find_top_neighbors', {
      source_embedding: src.embedding,
      exclude_id: sourceId,
      k: CONFIG.K,
    });

    if (!rpcError) {
      rpcData = data;
      break;
    }

    if (attempt < CONFIG.MAX_RETRIES) {
      logger.warn(`RPC timeout for ${sourceId}, retry ${attempt + 1}/${CONFIG.MAX_RETRIES}`);
      await sleep(CONFIG.RETRY_DELAY_MS * (attempt + 1));
    } else {
      throw new Error(`RPC find_top_neighbors failed for ${sourceId} after ${CONFIG.MAX_RETRIES + 1} attempts: ${rpcError.message}`);
    }
  }

  if (!rpcData || rpcData.length === 0) {
    return 'skipped';
  }

  // Build rows
  const rows = rpcData.map((n, idx) => ({
    source_id: sourceId,
    neighbor_id: n.id,
    cosine: n.similarity,
    rank: idx + 1,
    computed_at: new Date().toISOString(),
  }));

  // Delete stale rows for this source, then insert fresh
  const { error: delError } = await supabase
    .from('movie_similarity')
    .delete()
    .eq('source_id', sourceId);

  if (delError) {
    logger.warn(`Delete stale rows err for ${sourceId}: ${delError.message}`);
  }

  // Insert in chunks (Supabase REST soft limit ~1000 rows per request)
  const CHUNK = 500;
  for (let c = 0; c < rows.length; c += CHUNK) {
    const chunk = rows.slice(c, c + CHUNK);
    const { error: insError } = await supabase
      .from('movie_similarity')
      .insert(chunk);

    if (insError) {
      throw new Error(`Insert failed for ${sourceId}: ${insError.message}`);
    }
  }

  // Mark film as built
  await supabase
    .from('movies')
    .update({ similarity_built_at: new Date().toISOString() })
    .eq('id', sourceId);

  return 'ok';
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================================
// ENTRY POINT
// ============================================================================

// Support both direct invocation and require() from run-pipeline.js
if (require.main === module) {
  run()
    .then(result => {
      if (result.errors > 0) process.exit(1);
    })
    .catch(err => {
      logger.error(`Fatal: ${err.message}`);
      process.exit(1);
    });
}

module.exports = { run };
