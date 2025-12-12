// scripts/utils/logger.js

const fs = require('fs');
const path = require('path');

class Logger {
  constructor(logFileName) {
    this.logDir = path.join(__dirname, '../../logs');
    this.logFile = logFileName 
      ? path.join(this.logDir, logFileName)
      : path.join(this.logDir, `pipeline-${this.getTimestamp()}.log`);
    
    // Ensure logs directory exists
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  getTimestamp() {
    return new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  }

  formatMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const metaStr = Object.keys(meta).length > 0 ? ` | ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] [${level}] ${message}${metaStr}`;
  }

  log(level, message, meta = {}) {
    const formatted = this.formatMessage(level, message, meta);
    
    // Console output with colors
    const colors = {
      INFO: '\x1b[36m',    // Cyan
      SUCCESS: '\x1b[32m', // Green
      WARN: '\x1b[33m',    // Yellow
      ERROR: '\x1b[31m',   // Red
      DEBUG: '\x1b[90m',   // Gray
    };
    const reset = '\x1b[0m';
    console.log(`${colors[level] || ''}${formatted}${reset}`);
    
    // File output
    fs.appendFileSync(this.logFile, formatted + '\n');
  }

  info(message, meta) {
    this.log('INFO', message, meta);
  }

  success(message, meta) {
    this.log('SUCCESS', message, meta);
  }

  warn(message, meta) {
    this.log('WARN', message, meta);
  }

  error(message, meta) {
    this.log('ERROR', message, meta);
  }

  debug(message, meta) {
    this.log('DEBUG', message, meta);
  }

  section(title) {
    const line = '='.repeat(80);
    this.info('\n' + line);
    this.info(title);
    this.info(line + '\n');
  }

  getLogFilePath() {
    return this.logFile;
  }
}

module.exports = Logger;
