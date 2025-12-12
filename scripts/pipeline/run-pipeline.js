// scripts/pipeline/run-pipeline.js

require('dotenv').config();
const Logger = require('../utils/logger');
const { logUpdateRun, completeUpdateRun } = require('../utils/supabase');
const tmdbClient = require('../utils/tmdb-client');
const omdbClient = require('../utils/omdb-client');
const openaiClient = require('../utils/openai-client');
const { spawn } = require('child_process');
const path = require('path');

const logger = new Logger('run-pipeline.log');

/**
 * Run modes configuration
 */
const RUN_MODES = {
  discover: {
    description: 'Discover and process new movies (daily)',
    steps: [
      { name: '01-discover-new-movies', enabled: true },
      { name: '02-fetch-movie-metadata', enabled: true },
      { name: '03-fetch-genres-keywords', enabled: true },
      { name: '04-fetch-cast-crew', enabled: true },
      { name: '05-calculate-cast-metadata', enabled: true },
      { name: '06-fetch-external-ratings', enabled: true, options: { limit: 100 } },
      { name: '07-calculate-movie-scores', enabled: true },
      { name: '08-generate-embeddings', enabled: true },
      { name: '09-calculate-mood-scores', enabled: true }
    ]
  },
  refresh: {
    description: 'Refresh stale movie data (weekly)',
    steps: [
      { name: '01-discover-new-movies', enabled: false },
      { name: '02-fetch-movie-metadata', enabled: true, options: { updateType: 'stale_metadata', limit: 500 } },
      { name: '03-fetch-genres-keywords', enabled: false },
      { name: '04-fetch-cast-crew', enabled: false },
      { name: '05-calculate-cast-metadata', enabled: false },
      { name: '06-fetch-external-ratings', enabled: true, options: { limit: 200 } },
      { name: '07-calculate-movie-scores', enabled: true },
      { name: '08-generate-embeddings', enabled: true, options: { limit: 200 } },
      { name: '09-calculate-mood-scores', enabled: true }
    ]
  },
  'deep-refresh': {
    description: 'Deep refresh all external ratings (monthly)',
    steps: [
      { name: '01-discover-new-movies', enabled: false },
      { name: '02-fetch-movie-metadata', enabled: false },
      { name: '03-fetch-genres-keywords', enabled: false },
      { name: '04-fetch-cast-crew', enabled: false },
      { name: '05-calculate-cast-metadata', enabled: false },
      { name: '06-fetch-external-ratings', enabled: true, options: { limit: 1000 } },
      { name: '07-calculate-movie-scores', enabled: true },
      { name: '08-generate-embeddings', enabled: false },
      { name: '09-calculate-mood-scores', enabled: false }
    ]
  },
  full: {
    description: 'Full pipeline - all steps (initial setup)',
    steps: [
      { name: '01-discover-new-movies', enabled: true },
      { name: '02-fetch-movie-metadata', enabled: true },
      { name: '03-fetch-genres-keywords', enabled: true },
      { name: '04-fetch-cast-crew', enabled: true },
      { name: '05-calculate-cast-metadata', enabled: true },
      { name: '06-fetch-external-ratings', enabled: true, options: { limit: 500 } },
      { name: '07-calculate-movie-scores', enabled: true },
      { name: '08-generate-embeddings', enabled: true },
      { name: '09-calculate-mood-scores', enabled: true }
    ]
  }
};

/**
 * Execute a single pipeline step by spawning the script
 */
function executeStep(stepName, options = {}, dryRun = false) {
  return new Promise((resolve) => {
    const stepStart = Date.now();
    
    logger.info(`\n${'='.repeat(80)}`);
    logger.info(`STEP: ${stepName}`);
    logger.info('='.repeat(80));

    if (dryRun) {
      logger.warn('[DRY RUN] Simulating step execution...');
      setTimeout(() => {
        resolve({ success: true, stats: {}, duration: 1.0 });
      }, 1000);
      return;
    }

    const scriptPath = path.join(__dirname, `${stepName}.js`);
    
    // Build arguments for the script
    const args = [];
    if (options.limit) args.push('--limit', options.limit.toString());
    if (options.updateType) args.push('--' + options.updateType);
    
    // Spawn the script as a child process
    const child = spawn('node', [scriptPath, ...args], {
      stdio: 'inherit',
      env: process.env
    });

    child.on('close', (code) => {
      const duration = ((Date.now() - stepStart) / 1000).toFixed(2);
      
      if (code === 0) {
        logger.success(`✓ Step ${stepName} completed in ${duration}s`);
        resolve({ success: true, stats: {}, duration: parseFloat(duration) });
      } else {
        logger.error(`✗ Step ${stepName} failed with code ${code} after ${duration}s`);
        resolve({ success: false, error: `Exit code ${code}`, duration: parseFloat(duration) });
      }
    });

    child.on('error', (error) => {
      const duration = ((Date.now() - stepStart) / 1000).toFixed(2);
      logger.error(`✗ Step ${stepName} error: ${error.message}`);
      resolve({ success: false, error: error.message, duration: parseFloat(duration) });
    });
  });
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
      status: 'running'
    });
    runId = runRecord?.id;
    if (runId) {
      logger.info(`Run ID: ${runId}\n`);
    }
  }

  const pipelineStats = {
    stepsCompleted: 0,
    stepsFailed: 0,
    stepsSkipped: 0,
    errors: []
  };

  // Execute steps
  for (const step of modeConfig.steps) {
    if (!step.enabled) {
      logger.info(`\n⊘ Skipping step: ${step.name} (disabled for this mode)`);
      pipelineStats.stepsSkipped++;
      continue;
    }

    const stepOptions = { ...step.options, ...options.stepOptions };
    const result = await executeStep(step.name, stepOptions, options.dryRun);

    if (result.success) {
      pipelineStats.stepsCompleted++;
    } else {
      pipelineStats.stepsFailed++;
      pipelineStats.errors.push({
        step: step.name,
        error: result.error
      });

      if (options.stopOnError) {
        logger.error('\n🛑 Stopping pipeline due to error (--stop-on-error flag)');
        break;
      } else {
        logger.warn('⚠️  Continuing pipeline despite error...');
      }
    }
  }

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
  logger.info(`  - TMDB: ${tmdbClient.getRequestCount()} calls`);
  logger.info(`  - OMDb: ${omdbClient.getRequestCount()} / 1000 calls (${omdbClient.getQuotaRemaining()} remaining)`);
  logger.info(`  - OpenAI: ${openaiClient.getRequestCount()} requests ($${openaiClient.getTotalCost()})`);
  
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
      errors: pipelineStats.errors
    });
  }

  if (pipelineStats.stepsFailed === 0) {
    logger.success('\n✅ Pipeline completed successfully!');
  } else if (pipelineStats.stepsCompleted > 0) {
    logger.warn('\n⚠️  Pipeline completed with errors');
  } else {
    logger.error('\n❌ Pipeline failed');
  }

  logger.info(`\nLog file: ${logger.getLogFilePath()}`);
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);

  let mode = 'discover';
  const options = { dryRun: false, stopOnError: false, stepOptions: {} };

  if (args.includes('--mode')) {
    const modeIndex = args.indexOf('--mode');
    mode = args[modeIndex + 1] || 'discover';
  } else if (args[0] && !args[0].startsWith('--')) {
    mode = args[0];
  }

  if (args.includes('--dry-run')) options.dryRun = true;
  if (args.includes('--stop-on-error')) options.stopOnError = true;

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
`);
    return;
  }

  await runPipeline(mode, options);
}

if (require.main === module) {
  main();
}

module.exports = { runPipeline, executeStep, RUN_MODES };
