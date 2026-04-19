// scripts/pipeline/10-aggregate-user-satisfaction.js

/**
 * User Satisfaction Aggregation — Step 10
 *
 * Aggregates per-movie satisfaction signals from user_ratings,
 * user_movie_feedback (thumbs + sentiment), and user_history (completion).
 * Writes a 0-100 score to movies.user_satisfaction_score.
 *
 * Flags:
 *   --limit=N          Max movies to process (default 10000).
 *   --dry-run          Log results but make no DB writes.
 *   --min-samples=N    Minimum signals to write a score (default 3).
 */

require('dotenv').config();
const { supabase } = require('../utils/supabase');
const Logger = require('../utils/logger');

const logger = new Logger('10-aggregate-user-satisfaction.log');

// === CONFIG ===

const CONFIG = {
  DEFAULT_LIMIT: 10000,
  MIN_SAMPLE_SIZE: 3,
  RATING_WEIGHT: 3.0,
  COMPLETION_WEIGHT: 2.0,
  FEEDBACK_WEIGHT: 1.5,
  SENTIMENT_WEIGHT: 2.5,
  BATCH_SIZE: 100,
};

// === AGGREGATION ===

/**
 * Fetch aggregated signals per movie across all signal sources.
 * @returns {Map<number, object>} movie_id → aggregated signals
 */
async function fetchAggregatedSignals() {
  const signals = new Map();

  // 1. Ratings: avg + count per movie
  const { data: ratings, error: ratingsErr } = await supabase
    .from('user_ratings')
    .select('movie_id, rating')
    .gt('rating', 0);

  if (ratingsErr) {
    logger.warn(`Failed to fetch ratings: ${ratingsErr.message}`);
  } else {
    for (const r of (ratings || [])) {
      if (!signals.has(r.movie_id)) signals.set(r.movie_id, makeEmpty());
      const s = signals.get(r.movie_id);
      s.ratingSum += r.rating;
      s.ratingCount++;
    }
  }

  // 2. Feedback: thumbs up/down (feedback_value: 1 = up, -1 = down)
  const { data: feedback, error: feedbackErr } = await supabase
    .from('user_movie_feedback')
    .select('movie_id, feedback_value')
    .neq('feedback_value', 0);

  if (feedbackErr) {
    logger.warn(`Failed to fetch feedback: ${feedbackErr.message}`);
  } else {
    for (const f of (feedback || [])) {
      if (!signals.has(f.movie_id)) signals.set(f.movie_id, makeEmpty());
      const s = signals.get(f.movie_id);
      if (f.feedback_value > 0) s.thumbsUp++;
      else s.thumbsDown++;
    }
  }

  // 3. Sentiment: loved/liked/disliked/hated (from user_movie_feedback.sentiment)
  const { data: sentiment, error: sentimentErr } = await supabase
    .from('user_movie_feedback')
    .select('movie_id, sentiment')
    .in('sentiment', ['loved', 'liked', 'disliked', 'hated']);

  if (sentimentErr) {
    logger.warn(`Failed to fetch sentiment: ${sentimentErr.message}`);
  } else {
    for (const s of (sentiment || [])) {
      if (!signals.has(s.movie_id)) signals.set(s.movie_id, makeEmpty());
      const sig = signals.get(s.movie_id);
      sig[s.sentiment]++;
    }
  }

  // 4. Completion: watch_duration_minutes / runtime
  const { data: history, error: historyErr } = await supabase
    .from('user_history')
    .select('movie_id, watch_duration_minutes, movies!inner(runtime)')
    .not('watch_duration_minutes', 'is', null)
    .gt('watch_duration_minutes', 0);

  if (historyErr) {
    logger.warn(`Failed to fetch completion data: ${historyErr.message}`);
  } else {
    for (const h of (history || [])) {
      const runtime = h.movies?.runtime;
      if (!runtime || runtime <= 0) continue;
      const completion = Math.min(1.0, h.watch_duration_minutes / runtime);
      if (!signals.has(h.movie_id)) signals.set(h.movie_id, makeEmpty());
      const s = signals.get(h.movie_id);
      s.completionSum += completion;
      s.completionCount++;
    }
  }

  return signals;
}

function makeEmpty() {
  return {
    ratingSum: 0, ratingCount: 0,
    completionSum: 0, completionCount: 0,
    thumbsUp: 0, thumbsDown: 0,
    loved: 0, liked: 0, disliked: 0, hated: 0,
  };
}

/**
 * Compute satisfaction score from aggregated signals.
 * @param {object} sig - Aggregated signal counts
 * @returns {{score: number, confidence: number, sampleSize: number}|null}
 */
function computeScore(sig, minSamples) {
  const sampleSize = sig.ratingCount + sig.completionCount
    + sig.thumbsUp + sig.thumbsDown
    + sig.loved + sig.liked + sig.disliked + sig.hated;

  if (sampleSize < minSamples) return null;

  let deltaSum = 0;
  let weightSum = 0;

  // Rating delta: ratings are on 1-10 scale, neutral midpoint = 5.5
  if (sig.ratingCount > 0) {
    const avgRating = sig.ratingSum / sig.ratingCount;
    deltaSum += (avgRating - 5.5) * 7 * CONFIG.RATING_WEIGHT;
    weightSum += CONFIG.RATING_WEIGHT;
  }

  // Completion delta: (avg_completion - 0.5) * 40 * weight
  if (sig.completionCount > 0) {
    const avgCompletion = sig.completionSum / sig.completionCount;
    deltaSum += (avgCompletion - 0.5) * 40 * CONFIG.COMPLETION_WEIGHT;
    weightSum += CONFIG.COMPLETION_WEIGHT;
  }

  // Feedback delta: (thumbs_up - thumbs_down * 1.2) * 3 * weight
  if (sig.thumbsUp > 0 || sig.thumbsDown > 0) {
    deltaSum += (sig.thumbsUp - sig.thumbsDown * 1.2) * 3 * CONFIG.FEEDBACK_WEIGHT;
    weightSum += CONFIG.FEEDBACK_WEIGHT;
  }

  // Sentiment delta: (loved*3.5 + liked*2 - disliked*2.5 - hated*3.5) * weight
  if (sig.loved > 0 || sig.liked > 0 || sig.disliked > 0 || sig.hated > 0) {
    deltaSum += (sig.loved * 3.5 + sig.liked * 2 - sig.disliked * 2.5 - sig.hated * 3.5) * CONFIG.SENTIMENT_WEIGHT;
    weightSum += CONFIG.SENTIMENT_WEIGHT;
  }

  const rawScore = weightSum > 0 ? 50 + deltaSum / weightSum : 50;
  const score = Math.max(0, Math.min(100, Math.round(rawScore)));
  const confidence = Math.min(100, Math.round(sampleSize * 8));

  return { score, confidence, sampleSize };
}

// === MAIN ===

async function main() {
  const args = process.argv.slice(2);
  const limitArg = args.find(a => a.startsWith('--limit='));
  const minSamplesArg = args.find(a => a.startsWith('--min-samples='));
  const dryRun = args.includes('--dry-run');
  const limit = limitArg ? parseInt(limitArg.split('=')[1], 10) : CONFIG.DEFAULT_LIMIT;
  const minSamples = minSamplesArg ? parseInt(minSamplesArg.split('=')[1], 10) : CONFIG.MIN_SAMPLE_SIZE;

  logger.info('');
  logger.info('================================================================================');
  logger.info('📊 USER SATISFACTION AGGREGATION — Step 10');
  logger.info('================================================================================');
  logger.info('');
  logger.info(`Started at: ${new Date().toISOString()}`);
  logger.info(`Limit: ${limit} | Min samples: ${minSamples}`);
  logger.info(`Dry run: ${dryRun ? 'YES' : 'NO'}`);
  logger.info('');

  const startTime = Date.now();

  // 1. Fetch all signals
  logger.info('Fetching aggregated signals...');
  const signals = await fetchAggregatedSignals();
  logger.info(`Found signals for ${signals.size} unique movies`);

  // 2. Compute scores
  const results = [];
  for (const [movieId, sig] of signals) {
    const result = computeScore(sig, minSamples);
    if (result) {
      results.push({ movieId, ...result });
    }
  }

  // Fetch ff_audience_rating for ff_final_rating blend
  const movieIds = results.map(r => r.movieId);
  const movieDataMap = new Map();
  const FETCH_BATCH = 1000;
  for (let i = 0; i < movieIds.length; i += FETCH_BATCH) {
    const batch = movieIds.slice(i, i + FETCH_BATCH);
    const { data } = await supabase
      .from('movies')
      .select('id, ff_audience_rating, ff_rating')
      .in('id', batch);
    for (const m of (data || [])) {
      movieDataMap.set(m.id, m);
    }
  }

  // Enforce limit
  const toProcess = results.slice(0, limit);

  const highSat = toProcess.filter(r => r.score >= 75).length;
  const lowSat = toProcess.filter(r => r.score <= 30).length;
  const confidences = toProcess.map(r => r.confidence).sort((a, b) => a - b);
  const medianConf = confidences.length > 0 ? confidences[Math.floor(confidences.length / 2)] : 0;

  logger.info('');
  logger.info(`Movies qualifying (>= ${minSamples} signals): ${toProcess.length}`);
  logger.info(`  High satisfaction (>= 75): ${highSat}`);
  logger.info(`  Low satisfaction (<= 30): ${lowSat}`);
  logger.info(`  Median confidence: ${medianConf}`);

  if (dryRun) {
    logger.info('');
    logger.info(`🔍 DRY RUN — Would score ${toProcess.length} movies, ${highSat} with satisfaction >= 75`);

    // Log a few samples
    const samples = toProcess.slice(0, 10);
    if (samples.length > 0) {
      logger.info('');
      logger.info('Sample scores:');
      for (const s of samples) {
        logger.info(`  movie_id=${s.movieId}: score=${s.score}, confidence=${s.confidence}, samples=${s.sampleSize}`);
      }
    }
  } else {
    // 3. Batch upsert
    logger.info('');
    logger.info(`Writing ${toProcess.length} scores in batches of ${CONFIG.BATCH_SIZE}...`);
    let written = 0;
    let errors = 0;

    for (let i = 0; i < toProcess.length; i += CONFIG.BATCH_SIZE) {
      const batch = toProcess.slice(i, i + CONFIG.BATCH_SIZE);
      const now = new Date().toISOString();

      for (const item of batch) {
        // Blend audience + community for ff_final_rating (DEPRECATED — kept for back-compat)
        const movieData = movieDataMap.get(item.movieId);
        const audience = movieData?.ff_audience_rating ?? (movieData?.ff_rating != null ? movieData.ff_rating * 10 : null);

        let ffFinalRating = null;
        if (audience != null) {
          const commWeight = Math.min(0.40, (item.confidence / 100) * 0.40);
          const finalBlend = Math.round(audience * (1 - commWeight) + item.score * commWeight);
          ffFinalRating = Math.round(Math.max(10, Math.min(100, finalBlend))) / 10;
        }

        const payload = {
          // Legacy columns (keep for Phase 4 deprecation)
          user_satisfaction_score: item.score,
          user_satisfaction_confidence: item.confidence,
          user_satisfaction_sample_size: item.sampleSize,
          user_satisfaction_computed_at: now,
          // First-class community columns
          ff_community_rating: item.score,
          ff_community_confidence: item.confidence,
          ff_community_votes: item.sampleSize,
        };
        if (ffFinalRating != null) {
          payload.ff_final_rating = ffFinalRating;
        }

        const { error } = await supabase
          .from('movies')
          .update(payload)
          .eq('id', item.movieId);

        if (error) {
          logger.error(`  ✗ movie_id=${item.movieId}: ${error.message}`);
          errors++;
        } else {
          written++;
        }
      }

      if (i + CONFIG.BATCH_SIZE < toProcess.length) {
        logger.info(`  Progress: ${Math.min(i + CONFIG.BATCH_SIZE, toProcess.length)}/${toProcess.length}`);
      }
    }

    logger.success(`✓ Written: ${written} | Errors: ${errors}`);
  }

  // 4. Summary
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  logger.info('');
  logger.info('================================================================================');
  logger.info('📊 SUMMARY');
  logger.info('================================================================================');
  logger.info('');
  logger.info(`Movies scored: ${toProcess.length}`);
  logger.info(`  High satisfaction (>= 75): ${highSat}`);
  logger.info(`  Low satisfaction (<= 30): ${lowSat}`);
  logger.info(`  Median confidence: ${medianConf}`);
  logger.info(`Duration: ${duration}s`);
  logger.success('');
  logger.success('✅ User satisfaction aggregation complete!');
  logger.info(`Log file: ${logger.logPath || 'logs/10-aggregate-user-satisfaction.log'}`);
}

main().catch((error) => {
  logger.error(`Fatal error: ${error.message}`);
  console.error(error);
  process.exit(1);
});
