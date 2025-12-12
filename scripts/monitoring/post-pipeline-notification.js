// scripts/monitoring/post-pipeline-notification.js

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { sendNotification } = require('./send-notification');
const { supabase } = require('../utils/supabase');

/**
 * Find most recent pipeline log
 */
function findLatestLog() {
  const logsDir = path.join(__dirname, '../../logs');
  
  if (!fs.existsSync(logsDir)) {
    console.error('Logs directory not found');
    return null;
  }

  const logFiles = fs.readdirSync(logsDir)
    .filter(f => f.startsWith('run-pipeline-'))
    .map(f => ({
      name: f,
      path: path.join(logsDir, f),
      time: fs.statSync(path.join(logsDir, f)).mtime.getTime()
    }))
    .sort((a, b) => b.time - a.time);

  return logFiles.length > 0 ? logFiles[0].path : null;
}

/**
 * Parse log file for key information
 */
function parseLogFile(logPath) {
  try {
    const logContent = fs.readFileSync(logPath, 'utf8');
    const lines = logContent.split('\n');

    const data = {
      mode: null,
      success: false,
      summary: {},
      apiUsage: {},
      errors: [],
      topMovies: []
    };

    // Parse mode
    const modeLine = lines.find(l => l.includes('Mode:'));
    if (modeLine) {
      data.mode = modeLine.split('Mode:')[1].trim();
    }

    // Parse success/failure
    if (logContent.includes('Pipeline completed successfully')) {
      data.success = true;
    } else if (logContent.includes('Pipeline completed with errors')) {
      data.success = false;
    }

    // Parse summary stats
    const summarySection = logContent.match(/PIPELINE SUMMARY[\s\S]*?(?=\n\n|\n=|$)/);
    if (summarySection) {
      const summaryText = summarySection[0];
      
      const stepsCompleted = summaryText.match(/Steps completed:\s*(\d+)/);
      if (stepsCompleted) data.summary.stepsCompleted = parseInt(stepsCompleted[1]);
      
      const stepsFailed = summaryText.match(/Steps failed:\s*(\d+)/);
      if (stepsFailed) data.summary.stepsFailed = parseInt(stepsFailed[1]);
      
      const duration = summaryText.match(/Total duration:\s*([\d.]+)s/);
      if (duration) data.summary.duration = `${duration[1]}s (${(parseFloat(duration[1]) / 60).toFixed(1)} min)`;
    }

    // Parse API usage
    const tmdbCalls = logContent.match(/TMDB:\s*(\d+)\s*calls/);
    if (tmdbCalls) data.apiUsage.tmdb = parseInt(tmdbCalls[1]);

    const omdbCalls = logContent.match(/OMDb:\s*(\d+)\s*\/\s*1000/);
    if (omdbCalls) {
      data.apiUsage.omdb = parseInt(omdbCalls[1]);
      data.apiUsage.omdbRemaining = 1000 - parseInt(omdbCalls[1]);
    }

    const openaiCalls = logContent.match(/OpenAI:\s*(\d+)\s*requests\s*\(\$([0-9.]+)\)/);
    if (openaiCalls) {
      data.apiUsage.openai = parseInt(openaiCalls[1]);
      data.apiUsage.cost = openaiCalls[2];
    }

    // Parse errors
    const errorSection = logContent.match(/Errors encountered:[\s\S]*?(?=\n\n|\n✅|$)/);
    if (errorSection) {
      const errorLines = errorSection[0].split('\n').filter(l => l.includes('- '));
      data.errors = errorLines.map(line => {
        const match = line.match(/- ([^:]+):\s*(.+)/);
        return match ? { step: match[1], message: match[2] } : { message: line };
      });
    }

    return data;

  } catch (error) {
    console.error('Failed to parse log file:', error.message);
    return null;
  }
}

/**
 * Fetch additional data from database
 */
async function fetchDatabaseStats(runId) {
  try {
    if (!runId) return {};

    // Fetch run record
    const { data: runRecord, error } = await supabase
      .from('update_runs')
      .select('*')
      .eq('id', runId)
      .single();

    if (error) {
      console.error('Failed to fetch run record:', error.message);
      return {};
    }

    return {
      moviesAdded: runRecord.movies_added,
      moviesUpdated: runRecord.movies_updated,
      scoresCalculated: runRecord.scores_calculated,
      embeddingsGenerated: runRecord.embeddings_generated
    };

  } catch (error) {
    console.error('Failed to fetch database stats:', error.message);
    return {};
  }
}

/**
 * Fetch top new movies
 */
async function fetchTopNewMovies(limit = 5) {
  try {
    // Get movies added in the last 24 hours
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data: movies, error } = await supabase
      .from('movies')
      .select('title, vote_average, vote_count')
      .gte('inserted_at', yesterday)
      .order('vote_count', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Failed to fetch top movies:', error.message);
      return [];
    }

    return movies.map(m => ({
      title: m.title,
      rating: m.vote_average?.toFixed(1),
      votes: m.vote_count?.toLocaleString()
    }));

  } catch (error) {
    console.error('Failed to fetch top movies:', error.message);
    return [];
  }
}

/**
 * Determine next run schedule
 */
function getNextRunSchedule(mode) {
  const now = new Date();
  
  switch (mode) {
    case 'discover':
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setUTCHours(6, 0, 0, 0);
      return tomorrow.toLocaleString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit',
        timeZone: 'UTC',
        timeZoneName: 'short'
      });
    
    case 'refresh':
      const nextSunday = new Date(now);
      nextSunday.setDate(nextSunday.getDate() + (7 - nextSunday.getDay()));
      nextSunday.setUTCHours(2, 0, 0, 0);
      return nextSunday.toLocaleString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit',
        timeZone: 'UTC',
        timeZoneName: 'short'
      });
    
    case 'deep-refresh':
      const nextMonth = new Date(now);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      nextMonth.setDate(1);
      nextMonth.setUTCHours(3, 0, 0, 0);
      return nextMonth.toLocaleString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric',
        hour: '2-digit', 
        minute: '2-digit',
        timeZone: 'UTC',
        timeZoneName: 'short'
      });
    
    default:
      return 'Manual trigger';
  }
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2);

  console.log('📧 Preparing pipeline notification...\n');

  // Find latest log
  const logPath = args.includes('--log') 
    ? args[args.indexOf('--log') + 1]
    : findLatestLog();

  if (!logPath) {
    console.error('❌ No log file found');
    process.exit(1);
  }

  console.log(`📄 Using log: ${path.basename(logPath)}`);

  // Parse log
  const logData = parseLogFile(logPath);
  if (!logData) {
    console.error('❌ Failed to parse log file');
    process.exit(1);
  }

  // Fetch additional data
  const dbStats = await fetchDatabaseStats(args.includes('--run-id') ? args[args.indexOf('--run-id') + 1] : null);
  const topMovies = logData.mode === 'discover' ? await fetchTopNewMovies(5) : [];

  // Build notification data
  const notificationData = {
    mode: logData.mode || 'unknown',
    date: new Date().toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    }),
    runId: args.includes('--run-id') ? args[args.indexOf('--run-id') + 1] : null,
    summary: {
      ...logData.summary,
      ...dbStats
    },
    apiUsage: logData.apiUsage,
    errors: logData.errors,
    topMovies: topMovies,
    nextRun: getNextRunSchedule(logData.mode),
    logUrl: process.env.GITHUB_SERVER_URL && process.env.GITHUB_RUN_ID
      ? `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
      : null
  };

  // Determine notification type
  let notificationType = 'success';
  if (logData.errors.length > 0) {
    notificationType = logData.summary.stepsCompleted > 0 ? 'partial' : 'failure';
  }

  console.log(`📊 Summary:`, {
    type: notificationType,
    mode: notificationData.mode,
    stepsCompleted: notificationData.summary.stepsCompleted,
    stepsFailed: notificationData.summary.stepsFailed
  });

  // Send notification
  if (args.includes('--dry-run')) {
    console.log('\n🔍 DRY RUN - Would send notification:');
    console.log(JSON.stringify(notificationData, null, 2));
    return;
  }

  console.log(`\n📤 Sending ${notificationType} notification...`);
  const result = await sendNotification(notificationType, notificationData);

  if (result.success) {
    console.log('✅ Notification sent successfully!');
  } else {
    console.error('❌ Failed to send notification:', result.error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { parseLogFile, fetchTopNewMovies, getNextRunSchedule };
