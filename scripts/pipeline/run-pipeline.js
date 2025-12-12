// scripts/pipeline/run-pipeline.js

const Logger = require('../utils/logger');
const { logUpdateRun, completeUpdateRun } = require('../utils/supabase');
const tmdbClient = require('../utils/tmdb-client');
const omdbClient = require('../utils/omdb-client');
const openaiClient = require('../utils/openai-client');

// Import all pipeline scripts
const { discoverFromEndpoint } = require('./01-discover-new-movies');
const { fetchMovieMetadata } = require('./02-fetch-movie-metadata');
const { processGenresKeywords, syncGenres } = require('./03-fetch-genres-keywords');
const { processCastCrew } = require('./04-fetch-cast-crew');
const { calculateCastMetadata } = require('./05-calculate-cast-metadata');
const { fetchExternalRatings } = require('./06-fetch-external-ratings');
const { calculateScores } = require('./07-calculate-movie-scores');
const { generateEmbedding, generateEmbeddingsBatch } = require('./08-generate-embeddings');
const { calculateMovieMoodScores } = require('./09-calculate-mood-scores');

const logger = new Logger('run-pipeline.log');

/**
 * Run modes configuration
 */
const RUN_MODES = {
  // Daily discovery - find and process new movies
  discover: {
    description: 'Discover and process new movies (daily)',
    steps: [
      { name: '01-discover', enabled: true },
      { name: '02-metadata', enabled: true },
      { name: '03-genres', enabled: true },
      { name: '04-cast', enabled: true },
      { name: '05-cast-metadata', enabled: true },
      { name: '06-ratings', enabled: true, options: { limit: 100 } },
      { name: '07-scores', enabled: true },
      { name: '08-embeddings', enabled: true },
      { name: '09-mood-scores', enabled: true }
    ],
    config: {
      discover_pages: 3,
      omdb_limit: 100
    }
  },

  // Weekly refresh - update stale data
  refresh: {
    description: 'Refresh stale movie data (weekly)',
    steps: [
      { name: '01-discover', enabled: false },
      { name: '02-metadata', enabled: true, options: { updateType: 'stale_metadata', limit: 500 } },
      { name: '03-genres', enabled: false },
      { name: '04-cast', enabled: false },
      { name: '05-cast-metadata', enabled: false },
      { name: '06-ratings', enabled: true, options: { limit: 200 } },
      { name: '07-scores', enabled: true },
      { name: '08-embeddings', enabled: true, options: { limit: 200 } },
      { name: '09-mood-scores', enabled: true }
    ]
  },

  // Monthly deep refresh - update all external ratings
  'deep-refresh': {
    description: 'Deep refresh all external ratings (monthly)',
    steps: [
      { name: '01-discover', enabled: false },
      { name: '02-metadata', enabled: false },
      { name: '03-genres', enabled: false },
      { name: '04-cast', enabled: false },
      { name: '05-cast-metadata', enabled: false },
      { name: '06-ratings', enabled: true, options: { limit: 1000, forceRefresh: false } },
      { name: '07-scores', enabled: true },
      { name: '08-embeddings', enabled: false },
      { name: '09-mood-scores', enabled: false }
    ]
  },

  // Full pipeline - process everything (initial setup or major update)
  full: {
    description: 'Full pipeline - all steps (initial setup)',
    steps: [
      { name: '01-discover', enabled: true },
      { name: '02-metadata', enabled: true },
      { name: '03-genres', enabled: true },
      { name: '04-cast', enabled: true },
      { name: '05-cast-metadata', enabled: true },
      { name: '06-ratings', enabled: true, options: { limit: 500 } },
      { name: '07-scores', enabled: true },
      { name: '08-embeddings', enabled: true },
      { name: '09-mood-scores', enabled: true }
    ]
  }
};

/**
 * Execute a single pipeline step
 */
async function executeStep(stepName, options = {}, dryRun = false) {
  const stepStart = Date.now();
  
  logger.info(`\n${'='.repeat(80)}`);
  logger.info(`STEP: ${stepName}`);
  logger.info('='.repeat(80));

  if (dryRun) {
    logger.warn('[DRY RUN] Simulating step execution...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { success: true, stats: {}, duration: 1.0 };
  }

  try {
    let result = {};

    switch (stepName) {
      case '01-discover':
        const discover01 = require('./01-discover-new-movies');
        result = await discover01.main(options);
        break;

      case '02-metadata':
        const metadata02 = require('./02-fetch-movie-metadata');
        result = await metadata02.main(options);
        break;

      case '03-genres':
        const genres03 = require('./03-fetch-genres-keywords');
        result = await genres03.main(options);
        break;

      case '04-cast':
        const cast04 = require('./04-fetch-cast-crew');
        result = await cast04.main(options);
        break;

      case '05-cast-metadata':
        const castMeta05 = require('./05-calculate-cast-metadata');
        result = await castMeta05.main(options);
        break;

      case '06-ratings':
        const ratings06 = require('./06-fetch-external-ratings');
        result = await ratings06.main(options);
        break;

      case '07-scores':
        const scores07 = require('./07-calculate-movie-scores');
        result = await scores07.main(options);
        break;

      case '08-embeddings':
        const embeddings08 = require('./08-generate-embeddings');
        result = await embeddings08.main(options);
        break;

      case '09-mood-scores':
        const moodScores09 = require('./09-calculate-mood-scores');
        result = await moodScores09.main(options);
        break;

      default:
        throw new Error(`Unknown step: ${stepName}`);
    }

    const duration = ((Date.now() - stepStart) / 1000).toFixed(2);
    logger.success(`✓ Step ${stepName} completed in ${duration}s`);

    return { success: true, stats: result || {}, duration: parseFloat(duration) };

  } catch (error) {
    const duration = ((Date.now() - stepStart) / 1000).toFixed(2);
    logger.error(`✗ Step ${stepName} failed after ${duration}s:`, { error: error.message });
    
    return { success: false, error: error.message, duration: parseFloat(duration) };
  }
}

/**
 * Main pipeline orchestrator
 */
async function runPipeline(mode = 'discover', options = {}) {
  const pipelineStart = Date.now();
  
  logger.section('🚀 FEELFLICK UPDATE PIPELINE');
  logger.info(`Mode: ${mode}`);
  logger.info(`Started at: ${new Date().toISOString()}`);
  logger.info(`Dry run: ${options.dryRun ? 'YES' : 'NO'}`);

  // Validate mode
  if (!RUN_MODES[mode]) {
    logger.error(`Invalid mode: ${mode}`);
    logger.info(`Available modes: ${Object.keys(RUN_MODES).join(', ')}`);
    process.exit(1);
  }

  const modeConfig = RUN_MODES[mode];
  logger.info(`Description: ${modeConfig.description}\n`);

  // Log run to database
  let runId = null;
  if (!options.dryRun) {
    const runRecord = await logUpdateRun({
      run_type: mode,
      started_at: new Date().toISOString(),
      status: 'running',
      movies_added: 0,
      movies_updated: 0,
      scores_calculated: 0,
      embeddings_generated: 0,
      api_calls_used: {},
      errors: []
    });
    runId = runRecord?.id;
    if (runId) {
      logger.info(`Run ID: ${runId}\n`);
    }
  }

  // Track overall stats
  const pipelineStats = {
    stepsCompleted: 0,
    stepsFailed: 0,
    stepsSkipped: 0,
    totalDuration: 0,
    errors: []
  };

  const apiUsage = {
    tmdb: 0,
    omdb: 0,
    openai: 0,
    openai_cost: 0
  };

  // Execute steps
  for (const step of modeConfig.steps) {
    if (!step.enabled) {
      logger.info(`\n⊘ Skipping step: ${step.name} (disabled for this mode)`);
      pipelineStats.stepsSkipped++;
      continue;
    }

    // Merge options
    const stepOptions = { ...step.options, ...options.stepOptions };

    // Execute step
    const result = await executeStep(step.name, stepOptions, options.dryRun);

    if (result.success) {
      pipelineStats.stepsCompleted++;
      pipelineStats.totalDuration += result.duration;
    } else {
      pipelineStats.stepsFailed++;
      pipelineStats.errors.push({
        step: step.name,
        error: result.error
      });

      // Decide whether to continue or stop
      if (options.stopOnError) {
        logger.error('\n🛑 Stopping pipeline due to error (--stop-on-error flag)');
        break;
      } else {
        logger.warn('⚠️  Continuing pipeline despite error...');
      }
    }
  }

  // Collect API usage stats
  apiUsage.tmdb = tmdbClient.getRequestCount();
  apiUsage.omdb = omdbClient.getRequestCount();
  apiUsage.openai = openaiClient.getRequestCount();
  apiUsage.openai_cost = parseFloat(openaiClient.getTotalCost());

  // Calculate total duration
  const totalDuration = ((Date.now() - pipelineStart) / 1000).toFixed(2);

  // Print summary
  logger.section('📊 PIPELINE SUMMARY');
  logger.info(`Mode: ${mode}`);
  logger.info(`Steps completed: ${pipelineStats.stepsCompleted}`);
  if (pipelineStats.stepsFailed > 0) {
    logger.error(`Steps failed: ${pipelineStats.stepsFailed}`);
  }
  if (pipelineStats.stepsSkipped > 0) {
    logger.info(`Steps skipped: ${pipelineStats.stepsSkipped}`);
  }
  
  logger.info(`\nAPI Usage:`);
  logger.info(`  - TMDB: ${apiUsage.tmdb} calls`);
  logger.info(`  - OMDb: ${apiUsage.omdb} / 1000 calls (${omdbClient.getQuotaRemaining()} remaining)`);
  logger.info(`  - OpenAI: ${apiUsage.openai} requests ($${apiUsage.openai_cost})`);
  
  logger.info(`\nTotal duration: ${totalDuration}s (${(totalDuration / 60).toFixed(1)} minutes)`);

  if (pipelineStats.errors.length > 0) {
    logger.warn('\nErrors encountered:');
    pipelineStats.errors.forEach(e => {
      logger.warn(`  - ${e.step}: ${e.error}`);
    });
  }

  // Update run record
  if (runId && !options.dryRun) {
    await completeUpdateRun(runId, {
      status: pipelineStats.stepsFailed === 0 ? 'success' : 'partial',
      api_calls_used: apiUsage,
      errors: pipelineStats.errors
    });
  }

  // Final status
  if (pipelineStats.stepsFailed === 0) {
    logger.success('\n✅ Pipeline completed successfully!');
  } else if (pipelineStats.stepsCompleted > 0) {
    logger.warn('\n⚠️  Pipeline completed with errors');
  } else {
    logger.error('\n❌ Pipeline failed');
  }

  logger.info(`\nLog file: ${logger.getLogFilePath()}`);

  return {
    success: pipelineStats.stepsFailed === 0,
    stats: pipelineStats,
    apiUsage,
    duration: parseFloat(totalDuration)
  };
}

/**
 * CLI interface
 */
async function main() {
  const args = process.argv.slice(2);

  // Parse arguments
  let mode = 'discover'; // Default mode
  const options = {
    dryRun: false,
    stopOnError: false,
    stepOptions: {}
  };

  // Parse mode
  if (args.includes('--mode')) {
    const modeIndex = args.indexOf('--mode');
    mode = args[modeIndex + 1] || 'discover';
  } else if (args[0] && !args[0].startsWith('--')) {
    mode = args[0];
  }

  // Parse flags
  if (args.includes('--dry-run')) {
    options.dryRun = true;
  }

  if (args.includes('--stop-on-error')) {
    options.stopOnError = true;
  }

  // Show help
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
┌─────────────────────────────────────────────────────────────────┐
│                 FeelFlick Update Pipeline                       │
└─────────────────────────────────────────────────────────────────┘

USAGE:
  node scripts/pipeline/run-pipeline.js [mode] [options]

MODES:
  discover       Daily discovery - find and process new movies
  refresh        Weekly refresh - update stale movie data
  deep-refresh   Monthly deep refresh - update all external ratings
  full           Full pipeline - process everything (initial setup)

OPTIONS:
  --dry-run           Simulate pipeline without executing
  --stop-on-error     Stop pipeline if any step fails
  --help, -h          Show this help message

EXAMPLES:
  # Run daily discovery
  node scripts/pipeline/run-pipeline.js discover

  # Run weekly refresh
  node scripts/pipeline/run-pipeline.js refresh

  # Dry run to see what would happen
  node scripts/pipeline/run-pipeline.js discover --dry-run

  # Full pipeline with stop on error
  node scripts/pipeline/run-pipeline.js full --stop-on-error

RUN MODES DETAILS:

  discover (Daily - ~10-15 minutes):
    - Discover new movies from TMDB
    - Fetch metadata, genres, cast
    - Calculate cast metadata
    - Fetch external ratings (100 movies)
    - Calculate all scores
    - Generate embeddings
    - Calculate mood scores

  refresh (Weekly - ~30-45 minutes):
    - Update stale metadata (>90 days)
    - Update stale ratings (>30 days, 200 movies)
    - Re-calculate scores
    - Re-generate embeddings for updated movies
    - Update mood scores

  deep-refresh (Monthly - ~60 minutes):
    - Refresh ALL external ratings (1000 movies/day)
    - Re-calculate all scores
    - (Split over multiple days if needed)

  full (Initial Setup - ~2-3 hours):
    - Complete pipeline for all movies
    - Use for initial setup or major updates

API QUOTAS:
  - TMDB: 50 requests/second (generous)
  - OMDb: 1,000 calls/day (FREE tier)
  - OpenAI: ~$0.00001 per movie embedding

LOGS:
  All runs are logged to: logs/run-pipeline-[timestamp].log
  Database tracking: update_runs table
`);
    process.exit(0);
  }

  // Show available modes
  if (args.includes('--list-modes')) {
    console.log('\nAvailable pipeline modes:\n');
    Object.entries(RUN_MODES).forEach(([key, config]) => {
      console.log(`  ${key.padEnd(15)} - ${config.description}`);
      console.log(`    Steps: ${config.steps.filter(s => s.enabled).map(s => s.name).join(', ')}`);
      console.log('');
    });
    process.exit(0);
  }

  // Run pipeline
  try {
    await runPipeline(mode, options);
    process.exit(0);
  } catch (error) {
    logger.error('Pipeline failed:', { error: error.message, stack: error.stack });
    process.exit(1);
  }
}

// Export for use as module
module.exports = { runPipeline, executeStep, RUN_MODES };

// Run if called directly
if (require.main === module) {
  main();
}
