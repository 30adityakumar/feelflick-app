// scripts/utils/pipeline-logger.js
const fs = require('fs');
const path = require('path');

// Setup logger for pipeline
function setupLogger(scriptName) {
  const logDir = path.join(__dirname, '../../logs');
  
  // Create logs directory if it doesn't exist
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  
  const logFile = path.join(logDir, `${scriptName}.log`);
  const logStream = fs.createWriteStream(logFile, { flags: 'a' });
  
  const log = (level, message) => {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level}] ${message}\n`;
    logStream.write(logMessage);
    
    // Also log to console with color
    const colors = {
      INFO: '\x1b[36m',   // Cyan
      SUCCESS: '\x1b[32m', // Green
      WARNING: '\x1b[33m', // Yellow
      ERROR: '\x1b[31m',   // Red
      RESET: '\x1b[0m'
    };
    
    const color = colors[level] || colors.RESET;
    console.log(`${color}[${timestamp}] [${level}] ${message}${colors.RESET}`);
  };
  
  return {
    info: (msg) => log('INFO', msg),
    success: (msg) => log('SUCCESS', msg),
    warning: (msg) => log('WARNING', msg),
    error: (msg) => log('ERROR', msg),
    close: () => logStream.end()
  };
}

// Log update run to database
async function logUpdateRun(params) {
  const { supabase } = require('./supabase');
  
  const { data, error } = await supabase
    .from('update_runs')
    .insert({
      type: params.type,
      status: 'running',
      started_at: new Date().toISOString(),
      config: params.config || {}
    })
    .select()
    .single();
  
  if (error) {
    console.error('Error logging update run:', error);
    return null;
  }
  
  return data;
}

// Update run status
async function updateRunStatus(runId, status, stats = {}) {
  const { supabase } = require('./supabase');
  
  const updates = {
    status,
    completed_at: new Date().toISOString(),
    ...stats
  };
  
  const { error } = await supabase
    .from('update_runs')
    .update(updates)
    .eq('id', runId);
  
  if (error) {
    console.error('Error updating run status:', error);
  }
}

module.exports = {
  setupLogger,
  logUpdateRun,
  updateRunStatus
};
