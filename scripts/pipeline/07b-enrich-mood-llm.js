// scripts/pipeline/07b-enrich-mood-llm.js

/**
 * LLM Mood Enrichment — Step 07b
 *
 * Calls OpenAI structured output to classify each movie's mood, tone,
 * fit_profile, and dimension scores (pacing/intensity/emotional_depth/
 * dialogue_density/attention_demand) on a 0-100 scale.
 *
 * Modes:
 *   --mode=new    (default) Enrich movies that have never been LLM-tagged.
 *   --mode=stale  Also re-enrich movies last tagged > 180 days ago.
 *   --mode=all    Force re-enrich all scored movies.
 *
 * Flags:
 *   --limit=N        Max movies to process (default 250).
 *   --model=NAME     Override default model.
 *   --dry-run        Log prompts but make no API calls or DB writes.
 *   --batch          Use OpenAI Batch API (50% cheaper, up to 24h latency).
 *                    For backfills. Daily incremental should use realtime.
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { supabase } = require('../utils/supabase');
const Logger = require('../utils/logger');
const {
  enrichMovieRealtime,
  submitBatch,
  getBatchStatus,
  getBatchResults,
  buildUserPrompt,
  getStats,
  resetStats,
  MOOD_VOCAB,
  TONE_VOCAB,
  FIT_PROFILES,
} = require('../utils/llm-enrichment-client');

const logger = new Logger('07b-enrich-mood-llm.log');

// === CONFIG ===

const CONFIG = {
  MODEL: 'gpt-5.4-mini',
  STALE_THRESHOLD_DAYS: 180,
  DEFAULT_LIMIT: 250,
  BATCH_POLL_INTERVAL_MS: 5 * 60 * 1000, // 5 minutes
  BATCH_MAX_POLL_ATTEMPTS: 300,           // 25 hours max
  MAX_TOKENS_PER_BATCH: 1_800_000,        // stay under 2M org limit
  ESTIMATED_TOKENS_PER_MOVIE: 1_400,      // ~1300 input + ~100 output buffer
};

const MAX_MOVIES_PER_BATCH = Math.floor(CONFIG.MAX_TOKENS_PER_BATCH / CONFIG.ESTIMATED_TOKENS_PER_MOVIE);

// === CANDIDATE FETCHING ===

/**
 * Fetch movies that need LLM enrichment.
 * @param {number} limit
 * @param {'new'|'stale'|'all'} mode
 * @param {{ tmdbIds?: number[] }} options
 * @returns {object[]} Array of movie rows
 */
async function fetchCandidates(limit, mode, options = {}) {
  const CANDIDATE_SELECT = `
      id, tmdb_id, title, release_date, runtime, overview, tagline,
      director_name, primary_genre, genres, keywords,
      collection_name, production_countries, original_language,
      llm_enriched_at
  `;

  // Calibration mode: fetch explicit TMDB IDs, no mode/limit filtering
  if (options.tmdbIds && options.tmdbIds.length > 0) {
    const { data, error } = await supabase
      .from('movies')
      .select(CANDIDATE_SELECT)
      .in('tmdb_id', options.tmdbIds);

    if (error) throw new Error(`Failed to fetch calibration movies: ${error.message}`);
    if (!data || data.length === 0) {
      logger.warn(`No movies found for tmdb_ids: ${options.tmdbIds.join(',')}`);
      return [];
    }

    const foundIds = new Set(data.map(m => m.tmdb_id));
    const missing = options.tmdbIds.filter(id => !foundIds.has(id));
    if (missing.length > 0) {
      logger.warn(`TMDB IDs not in catalog: ${missing.join(',')}`);
    }

    logger.info(`Loaded ${data.length} movies by explicit tmdb_ids (calibration mode)`);
    return data;
  }

  let query = supabase
    .from('movies')
    .select(CANDIDATE_SELECT)
    .eq('is_valid', true)
    .in('status', ['scoring', 'complete'])
    .order('vote_count', { ascending: false })
    .limit(limit);

  if (mode === 'new') {
    query = query.is('llm_enriched_at', null);
  } else if (mode === 'stale') {
    // New OR stale (enriched > STALE_THRESHOLD_DAYS ago)
    const staleDate = new Date();
    staleDate.setDate(staleDate.getDate() - CONFIG.STALE_THRESHOLD_DAYS);
    query = query.or(`llm_enriched_at.is.null,llm_enriched_at.lt.${staleDate.toISOString()}`);
  }
  // mode === 'all' — no enrichment filter, just scored movies

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch candidates: ${error.message}`);
  }

  return data || [];
}

// === VALIDATION ===

/**
 * Validate and coerce LLM output. Returns cleaned object or null if unsalvageable.
 * @param {object} raw - Parsed LLM JSON output
 * @param {object} movie - Movie row (for logging context)
 * @returns {object|null}
 */
function validateAndCoerce(raw, movie) {
  if (!raw || typeof raw !== 'object') {
    logger.warn(`  ⚠ Invalid output shape for "${movie.title}" (id ${movie.id})`);
    return null;
  }

  // Validate and filter mood_tags
  const moodTagSet = new Set(MOOD_VOCAB);
  const moodTags = (raw.mood_tags || []).filter(tag => {
    if (moodTagSet.has(tag)) return true;
    logger.warn(`  ⚠ Dropping invalid mood_tag "${tag}" for "${movie.title}"`);
    return false;
  });

  if (moodTags.length === 0) {
    logger.warn(`  ⚠ No valid mood_tags for "${movie.title}" — skipping`);
    return null;
  }

  // Validate and filter tone_tags
  const toneTagSet = new Set(TONE_VOCAB);
  const toneTags = (raw.tone_tags || []).filter(tag => {
    if (toneTagSet.has(tag)) return true;
    logger.warn(`  ⚠ Dropping invalid tone_tag "${tag}" for "${movie.title}"`);
    return false;
  });

  // Validate fit_profile
  const fitProfile = FIT_PROFILES.includes(raw.fit_profile) ? raw.fit_profile : null;
  if (!fitProfile) {
    logger.warn(`  ⚠ Invalid fit_profile "${raw.fit_profile}" for "${movie.title}", setting null`);
  }

  // Clamp dimension values to 0-100
  const clamp = (val, name) => {
    const n = parseInt(val, 10);
    if (isNaN(n)) {
      logger.warn(`  ⚠ Non-numeric ${name} for "${movie.title}", defaulting to 50`);
      return 50;
    }
    return Math.max(0, Math.min(100, n));
  };

  return {
    mood_tags: moodTags,
    tone_tags: toneTags,
    fit_profile: fitProfile,
    llm_pacing: clamp(raw.pacing, 'pacing'),
    llm_intensity: clamp(raw.intensity, 'intensity'),
    llm_emotional_depth: clamp(raw.emotional_depth, 'emotional_depth'),
    llm_dialogue_density: clamp(raw.dialogue_density, 'dialogue_density'),
    llm_attention_demand: clamp(raw.attention_demand, 'attention_demand'),
    llm_confidence: clamp(raw.confidence, 'confidence'),
  };
}

// === DB WRITE ===

/**
 * Save enrichment data to the movies table.
 * @param {number} movieId
 * @param {object} enrichment - Validated enrichment object
 * @param {string} modelVersion
 */
async function saveEnrichment(movieId, enrichment, modelVersion) {
  const { error } = await supabase
    .from('movies')
    .update({
      mood_tags: enrichment.mood_tags,
      tone_tags: enrichment.tone_tags,
      fit_profile: enrichment.fit_profile,
      llm_pacing: enrichment.llm_pacing,
      llm_intensity: enrichment.llm_intensity,
      llm_emotional_depth: enrichment.llm_emotional_depth,
      llm_dialogue_density: enrichment.llm_dialogue_density,
      llm_attention_demand: enrichment.llm_attention_demand,
      llm_confidence: enrichment.llm_confidence,
      llm_enriched_at: new Date().toISOString(),
      llm_model_version: modelVersion,
    })
    .eq('id', movieId);

  if (error) {
    throw new Error(`Failed to save enrichment for movie ${movieId}: ${error.message}`);
  }
}

// === BATCH MODE ===

const TERMINAL_STATUSES = new Set(['completed', 'failed', 'expired', 'cancelled']);

/**
 * Process results from a single completed batch.
 * Downloads output, validates, and saves enrichments.
 * @returns {{ enriched: number, invalid: number, lowConfidence: number }}
 */
async function processBatchResults(batchId, movieMap, model) {
  const results = await getBatchResults(batchId);
  logger.info(`  Got ${results.size} results from batch ${batchId}.`);

  let enriched = 0;
  let invalid = 0;
  let lowConfidence = 0;

  for (const [movieId, raw] of results) {
    const movie = movieMap.get(movieId);
    if (!movie) continue;

    const validated = validateAndCoerce(raw, movie);
    if (!validated) {
      invalid++;
      continue;
    }

    if (validated.llm_confidence < 40) {
      lowConfidence++;
      logger.warn(`  ⚠ Low confidence (${validated.llm_confidence}) for "${movie.title}" — saving anyway`);
    }

    try {
      await saveEnrichment(movieId, validated, model);
      enriched++;
    } catch (error) {
      logger.error(`  ✗ Save failed for "${movie.title}": ${error.message}`);
      invalid++;
    }
  }

  return { enriched, invalid, lowConfidence };
}

/**
 * Poll a single batch until it reaches a terminal state.
 * @returns {string} Terminal status ('completed', 'failed', 'expired', 'cancelled')
 */
async function pollUntilDone(batchId, chunkLabel) {
  let attempts = 0;

  while (attempts < CONFIG.BATCH_MAX_POLL_ATTEMPTS) {
    if (attempts > 0) {
      await new Promise(resolve => setTimeout(resolve, CONFIG.BATCH_POLL_INTERVAL_MS));
    }
    attempts++;

    try {
      const batch = await getBatchStatus(batchId);
      const progress = batch.request_counts;

      logger.info(
        `  [Poll ${attempts}] ${chunkLabel}: ${batch.status} ` +
        `(completed: ${progress?.completed || 0}, failed: ${progress?.failed || 0}, total: ${progress?.total || 0})`
      );

      if (TERMINAL_STATUSES.has(batch.status)) {
        return batch.status;
      }
    } catch (error) {
      logger.warn(`  ⚠ Poll error for ${chunkLabel}: ${error.message}`);
    }
  }

  return 'timeout';
}

/**
 * Run enrichment using OpenAI Batch API.
 * Auto-splits into sub-batches and processes them sequentially to stay
 * under the org-level enqueued-token limit (2M tokens across all in-flight batches).
 */
async function runBatchMode(movies, model) {
  const totalChunks = Math.ceil(movies.length / MAX_MOVIES_PER_BATCH);
  const movieMap = new Map(movies.map(m => [m.id, m]));

  logger.info(`\n📦 Batch run: ${movies.length} movies → ${totalChunks} sub-batch(es) of up to ${MAX_MOVIES_PER_BATCH} movies`);
  logger.info(`  Token budget per sub-batch: ~${CONFIG.MAX_TOKENS_PER_BATCH.toLocaleString()} tokens`);
  logger.info(`  Sub-batches run sequentially to respect org-level enqueued-token limit.\n`);

  // Write batch IDs to a run-scoped log file
  const batchLogPath = path.join(__dirname, '..', '..', 'logs', `07b-batch-ids-${Date.now()}.txt`);

  let enriched = 0;
  let invalid = 0;
  let lowConfidence = 0;

  for (let i = 0; i < totalChunks; i++) {
    const chunk = movies.slice(i * MAX_MOVIES_PER_BATCH, (i + 1) * MAX_MOVIES_PER_BATCH);
    const estTokens = chunk.length * CONFIG.ESTIMATED_TOKENS_PER_MOVIE;
    const chunkLabel = `Sub-batch ${i + 1}/${totalChunks}`;

    logger.info(`\n${chunkLabel}: submitting ${chunk.length} movies (est ${estTokens.toLocaleString()} tokens)...`);

    // Submit
    let batchId;
    try {
      const result = await submitBatch(chunk, model);
      batchId = result.batchId;
      logger.info(`  ✓ Submitted: ${batchId} (${result.count} movies)`);
      fs.appendFileSync(batchLogPath, `${batchId}  sub-batch ${i + 1}/${totalChunks}  ${result.count} movies\n`);
    } catch (error) {
      logger.error(`  ✗ ${chunkLabel} submission failed: ${error.message}`);
      invalid += chunk.length;
      continue;
    }

    // Poll until done
    const status = await pollUntilDone(batchId, chunkLabel);

    if (status === 'completed') {
      logger.info(`  ✓ ${chunkLabel} completed. Processing results...`);
      const result = await processBatchResults(batchId, movieMap, model);
      enriched += result.enriched;
      invalid += result.invalid;
      lowConfidence += result.lowConfidence;
      logger.info(`  ${chunkLabel} done: ${result.enriched} enriched, ${result.invalid} invalid`);
    } else {
      logger.error(`  ✗ ${chunkLabel} ended with status: ${status}`);
      invalid += chunk.length;
    }

    logger.info(`  Running totals: ${enriched} enriched, ${invalid} failed, ${lowConfidence} low confidence`);
  }

  logger.info(`\nBatch IDs logged to: ${batchLogPath}`);
  return { enriched, failed: invalid, lowConfidence };
}

// === REALTIME MODE ===

/**
 * Run enrichment using realtime (synchronous) API calls.
 */
async function runRealtimeMode(movies, model, dryRun) {
  let enriched = 0;
  let invalid = 0;
  let lowConfidence = 0;
  let quotaErrors = 0;

  for (let i = 0; i < movies.length; i++) {
    const movie = movies[i];
    const label = `[${i + 1}/${movies.length}] "${movie.title}" (id ${movie.id})`;

    if (dryRun) {
      logger.info(`${label} — DRY RUN`);
      if (i === 0) {
        logger.info(`\n--- Sample prompt ---\n${buildUserPrompt(movie)}\n--- End sample ---\n`);
      }
      enriched++;
      continue;
    }

    try {
      const raw = await enrichMovieRealtime(movie, model);

      if (!raw) {
        logger.warn(`  ${label} — empty response, skipping`);
        invalid++;
        continue;
      }

      const validated = validateAndCoerce(raw, movie);
      if (!validated) {
        invalid++;
        continue;
      }

      if (validated.llm_confidence < 40) {
        lowConfidence++;
        logger.warn(`  ⚠ Low confidence (${validated.llm_confidence}) for "${movie.title}" — saving anyway`);
      }

      await saveEnrichment(movie.id, validated, model);
      enriched++;

      // Log progress
      const tags = validated.mood_tags.join(', ');
      logger.info(`  ✓ ${label} → [${tags}] | ${validated.fit_profile} | conf=${validated.llm_confidence}`);

    } catch (error) {
      if (error.message?.includes('429') || error.status === 429) {
        quotaErrors++;
        logger.error(`  ✗ ${label} — quota exceeded, stopping early`);
        break;
      }
      logger.error(`  ✗ ${label} — ${error.message}`);
      invalid++;
    }
  }

  return { enriched, failed: invalid, lowConfidence, quotaErrors };
}

// === COVERAGE REPORT ===

async function logCoverage() {
  const { count: totalScored } = await supabase
    .from('movies')
    .select('id', { count: 'exact', head: true })
    .in('status', ['scoring', 'complete'])
    .eq('is_valid', true);

  const { count: enriched } = await supabase
    .from('movies')
    .select('id', { count: 'exact', head: true })
    .not('llm_enriched_at', 'is', null);

  const pct = totalScored > 0 ? ((enriched / totalScored) * 100).toFixed(1) : '0.0';
  logger.info(`\n📊 Coverage: ${enriched}/${totalScored} scored movies have LLM mood tags (${pct}%)`);
}

// === MAIN ===

async function main() {
  const startTime = Date.now();
  const args = process.argv.slice(2);

  // Parse CLI flags
  const limitArg = args.find(a => a.startsWith('--limit='));
  const modeArg = args.find(a => a.startsWith('--mode='));
  const modelArg = args.find(a => a.startsWith('--model='));
  const tmdbIdsArg = args.find(a => a.startsWith('--tmdb-ids='));
  const dryRun = args.includes('--dry-run');
  const useBatch = args.includes('--batch');

  const limit = limitArg ? parseInt(limitArg.split('=')[1], 10) : CONFIG.DEFAULT_LIMIT;
  const mode = modeArg ? modeArg.split('=')[1] : 'new';
  const model = modelArg ? modelArg.split('=')[1] : CONFIG.MODEL;

  let tmdbIds = null;
  if (tmdbIdsArg) {
    tmdbIds = tmdbIdsArg.split('=')[1]
      .split(',')
      .map(s => parseInt(s.trim(), 10))
      .filter(n => !isNaN(n));
  }

  const isCalibration = tmdbIds && tmdbIds.length > 0;

  if (!isCalibration && !['new', 'stale', 'all'].includes(mode)) {
    logger.error(`Invalid mode: ${mode}. Must be new, stale, or all.`);
    process.exit(1);
  }

  logger.section('🧠 LLM MOOD ENRICHMENT — Step 07b');
  logger.info(`Started at: ${new Date().toISOString()}`);
  if (isCalibration) {
    logger.info(`Calibration mode: processing ${tmdbIds.length} explicit tmdb_ids (--mode and --limit ignored)`);
  } else {
    logger.info(`Mode: ${mode} | Limit: ${limit} | Model: ${model}`);
  }
  logger.info(`Dry run: ${dryRun ? 'YES' : 'NO'} | Batch API: ${useBatch ? 'YES' : 'NO'}`);
  logger.info('');

  resetStats();

  // Fetch candidates
  logger.info('Fetching candidate movies...');
  const movies = await fetchCandidates(limit, mode, { tmdbIds });

  if (movies.length === 0) {
    logger.info('✓ No movies need enrichment');
    await logCoverage();
    return;
  }

  logger.info(`Found ${movies.length} movies to enrich\n`);

  // Log sample prompt for first movie
  if (!dryRun && movies.length > 0) {
    logger.info('--- Sample prompt (movie 1) ---');
    logger.info(buildUserPrompt(movies[0]));
    logger.info('--- End sample ---\n');
  }

  // Run enrichment
  let result;
  if (useBatch && movies.length > 0) {
    if (dryRun) {
      const chunks = Math.ceil(movies.length / MAX_MOVIES_PER_BATCH);
      logger.info(`[DRY RUN] Would submit ${chunks} sub-batch(es) of ~${MAX_MOVIES_PER_BATCH} movies (${movies.length} total)`);
      result = { enriched: 0, failed: 0, lowConfidence: 0 };
    } else {
      result = await runBatchMode(movies, model);
    }
  } else {
    result = await runRealtimeMode(movies, model, dryRun);
  }

  // Summary
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  const apiStats = getStats();

  logger.section('📊 SUMMARY');
  logger.info(`Movies processed: ${movies.length}`);
  logger.success(`✓ Enriched: ${result.enriched}`);
  if (result.failed > 0) logger.error(`✗ Failed/Invalid: ${result.failed}`);
  if (result.lowConfidence > 0) logger.warn(`⚠ Low confidence: ${result.lowConfidence}`);
  if (result.quotaErrors > 0) logger.error(`⚡ Quota errors: ${result.quotaErrors}`);
  logger.info(`\nAPI stats:`);
  logger.info(`  Requests: ${apiStats.requestCount}`);
  logger.info(`  Input tokens: ${apiStats.totalInputTokens.toLocaleString()}`);
  logger.info(`  Output tokens: ${apiStats.totalOutputTokens.toLocaleString()}`);
  logger.info(`  Estimated cost: $${apiStats.totalCostUsd.toFixed(4)}`);
  logger.info(`\nDuration: ${duration}s`);
  logger.info(`Model: ${model}`);

  await logCoverage();

  logger.success('\n✅ LLM mood enrichment complete!');
  logger.info(`Log file: ${logger.getLogFilePath()}`);
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    logger.error('Fatal error:', { error: error.message, stack: error.stack });
    process.exit(1);
  });
}

module.exports = { fetchCandidates, validateAndCoerce, saveEnrichment, main };
