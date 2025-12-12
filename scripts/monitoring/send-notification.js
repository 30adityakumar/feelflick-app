// scripts/monitoring/send-notification.js

require('dotenv').config();
const { Resend } = require('resend');
const fs = require('fs');
const path = require('path');

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.NOTIFICATION_FROM_EMAIL || 'pipeline@feelflick.app';
const TO_EMAIL = process.env.NOTIFICATION_TO_EMAIL || 'aditya@feelflick.app';

if (!RESEND_API_KEY) {
  console.error('Missing RESEND_API_KEY in environment');
  process.exit(1);
}

const resend = new Resend(RESEND_API_KEY);

/**
 * Email templates
 */
const templates = {
  success: (data) => ({
    subject: `✅ FeelFlick Pipeline Success - ${data.mode} (${data.date})`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      background-color: white;
      border-radius: 8px;
      padding: 30px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      padding-bottom: 20px;
      border-bottom: 2px solid #10b981;
    }
    .header h1 {
      color: #10b981;
      margin: 0;
      font-size: 24px;
    }
    .header p {
      color: #666;
      margin: 5px 0 0 0;
      font-size: 14px;
    }
    .section {
      margin: 25px 0;
    }
    .section h2 {
      color: #333;
      font-size: 18px;
      margin-bottom: 15px;
      border-bottom: 1px solid #e5e7eb;
      padding-bottom: 8px;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
      margin: 15px 0;
    }
    .stat-box {
      background: #f9fafb;
      padding: 15px;
      border-radius: 6px;
      border-left: 3px solid #10b981;
    }
    .stat-label {
      color: #6b7280;
      font-size: 12px;
      text-transform: uppercase;
      font-weight: 600;
    }
    .stat-value {
      color: #111827;
      font-size: 24px;
      font-weight: bold;
      margin-top: 5px;
    }
    .movie-list {
      background: #f9fafb;
      padding: 15px;
      border-radius: 6px;
      margin: 10px 0;
    }
    .movie-item {
      padding: 8px 0;
      border-bottom: 1px solid #e5e7eb;
    }
    .movie-item:last-child {
      border-bottom: none;
    }
    .api-usage {
      background: #eff6ff;
      padding: 15px;
      border-radius: 6px;
      border-left: 3px solid #3b82f6;
    }
    .api-item {
      display: flex;
      justify-content: space-between;
      padding: 5px 0;
    }
    .footer {
      text-align: center;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      color: #6b7280;
      font-size: 12px;
    }
    .badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
      background: #d1fae5;
      color: #065f46;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✅ Pipeline Successful</h1>
      <p>${data.mode} mode • ${data.date}</p>
      ${data.runId ? `<p style="font-size: 11px; color: #999;">Run ID: ${data.runId}</p>` : ''}
    </div>

    ${data.summary ? `
    <div class="section">
      <h2>📊 Summary</h2>
      <div class="stats-grid">
        ${data.summary.moviesAdded ? `
        <div class="stat-box">
          <div class="stat-label">Movies Added</div>
          <div class="stat-value">${data.summary.moviesAdded}</div>
        </div>
        ` : ''}
        
        ${data.summary.moviesUpdated ? `
        <div class="stat-box">
          <div class="stat-label">Movies Updated</div>
          <div class="stat-value">${data.summary.moviesUpdated}</div>
        </div>
        ` : ''}
        
        ${data.summary.scoresCalculated ? `
        <div class="stat-box">
          <div class="stat-label">Scores Calculated</div>
          <div class="stat-value">${data.summary.scoresCalculated}</div>
        </div>
        ` : ''}
        
        ${data.summary.embeddingsGenerated ? `
        <div class="stat-box">
          <div class="stat-label">Embeddings Generated</div>
          <div class="stat-value">${data.summary.embeddingsGenerated}</div>
        </div>
        ` : ''}
      </div>
      
      ${data.summary.duration ? `
      <p style="color: #6b7280; font-size: 14px; margin-top: 15px;">
        ⏱️ Duration: <strong>${data.summary.duration}</strong>
      </p>
      ` : ''}
    </div>
    ` : ''}

    ${data.topMovies && data.topMovies.length > 0 ? `
    <div class="section">
      <h2>🎬 Top New Movies</h2>
      <div class="movie-list">
        ${data.topMovies.map((movie, i) => `
          <div class="movie-item">
            <strong>${i + 1}. ${movie.title}</strong>
            ${movie.rating ? `<span style="color: #f59e0b;"> ⭐ ${movie.rating}</span>` : ''}
            ${movie.votes ? `<span style="color: #6b7280; font-size: 12px;"> (${movie.votes} votes)</span>` : ''}
          </div>
        `).join('')}
      </div>
    </div>
    ` : ''}

    ${data.apiUsage ? `
    <div class="section">
      <h2>📈 API Usage</h2>
      <div class="api-usage">
        ${data.apiUsage.tmdb ? `
        <div class="api-item">
          <span>TMDB</span>
          <strong>${data.apiUsage.tmdb} calls</strong>
        </div>
        ` : ''}
        
        ${data.apiUsage.omdb !== undefined ? `
        <div class="api-item">
          <span>OMDb</span>
          <strong>${data.apiUsage.omdb} / 1,000 ${data.apiUsage.omdbRemaining ? `(${data.apiUsage.omdbRemaining} remaining)` : ''}</strong>
        </div>
        ` : ''}
        
        ${data.apiUsage.openai ? `
        <div class="api-item">
          <span>OpenAI</span>
          <strong>${data.apiUsage.openai} requests ${data.apiUsage.cost ? `($${data.apiUsage.cost})` : ''}</strong>
        </div>
        ` : ''}
      </div>
    </div>
    ` : ''}

    ${data.nextRun ? `
    <div class="section">
      <p style="color: #6b7280; font-size: 14px;">
        ⏭️ Next scheduled run: <strong>${data.nextRun}</strong>
      </p>
    </div>
    ` : ''}

    <div class="footer">
      <p>FeelFlick Movie Data Pipeline</p>
      <p>${new Date().toISOString()}</p>
    </div>
  </div>
</body>
</html>
    `
  }),

  failure: (data) => ({
    subject: `❌ FeelFlick Pipeline Failed - ${data.mode} (${data.date})`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      background-color: white;
      border-radius: 8px;
      padding: 30px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      padding-bottom: 20px;
      border-bottom: 2px solid #ef4444;
    }
    .header h1 {
      color: #ef4444;
      margin: 0;
      font-size: 24px;
    }
    .header p {
      color: #666;
      margin: 5px 0 0 0;
      font-size: 14px;
    }
    .section {
      margin: 25px 0;
    }
    .section h2 {
      color: #333;
      font-size: 18px;
      margin-bottom: 15px;
      border-bottom: 1px solid #e5e7eb;
      padding-bottom: 8px;
    }
    .error-box {
      background: #fef2f2;
      border-left: 3px solid #ef4444;
      padding: 15px;
      border-radius: 6px;
      margin: 10px 0;
    }
    .error-step {
      font-weight: 600;
      color: #dc2626;
      margin-bottom: 5px;
    }
    .error-message {
      color: #991b1b;
      font-size: 14px;
      font-family: 'Courier New', monospace;
      background: #fee2e2;
      padding: 10px;
      border-radius: 4px;
      margin-top: 8px;
    }
    .stats {
      background: #f9fafb;
      padding: 15px;
      border-radius: 6px;
      margin: 10px 0;
    }
    .stat-item {
      display: flex;
      justify-content: space-between;
      padding: 5px 0;
    }
    .footer {
      text-align: center;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      color: #6b7280;
      font-size: 12px;
    }
    .action-button {
      display: inline-block;
      background: #3b82f6;
      color: white;
      padding: 10px 20px;
      border-radius: 6px;
      text-decoration: none;
      margin-top: 15px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>❌ Pipeline Failed</h1>
      <p>${data.mode} mode • ${data.date}</p>
      ${data.runId ? `<p style="font-size: 11px; color: #999;">Run ID: ${data.runId}</p>` : ''}
    </div>

    ${data.errors && data.errors.length > 0 ? `
    <div class="section">
      <h2>🚨 Errors</h2>
      ${data.errors.map(error => `
        <div class="error-box">
          <div class="error-step">${error.step || 'Unknown step'}</div>
          <div class="error-message">${error.message || error.error || 'No error message provided'}</div>
        </div>
      `).join('')}
    </div>
    ` : ''}

    ${data.summary ? `
    <div class="section">
      <h2>📊 Partial Results</h2>
      <div class="stats">
        ${data.summary.stepsCompleted !== undefined ? `
        <div class="stat-item">
          <span>Steps Completed</span>
          <strong>${data.summary.stepsCompleted}</strong>
        </div>
        ` : ''}
        
        ${data.summary.stepsFailed !== undefined ? `
        <div class="stat-item">
          <span>Steps Failed</span>
          <strong style="color: #ef4444;">${data.summary.stepsFailed}</strong>
        </div>
        ` : ''}
        
        ${data.summary.duration ? `
        <div class="stat-item">
          <span>Duration</span>
          <strong>${data.summary.duration}</strong>
        </div>
        ` : ''}
      </div>
    </div>
    ` : ''}

    ${data.logUrl ? `
    <div class="section" style="text-align: center;">
      <a href="${data.logUrl}" class="action-button">View Full Logs</a>
    </div>
    ` : ''}

    <div class="footer">
      <p>FeelFlick Movie Data Pipeline</p>
      <p>${new Date().toISOString()}</p>
    </div>
  </div>
</body>
</html>
    `
  }),

  partial: (data) => ({
    subject: `⚠️ FeelFlick Pipeline Partial Success - ${data.mode} (${data.date})`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      background-color: white;
      border-radius: 8px;
      padding: 30px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      padding-bottom: 20px;
      border-bottom: 2px solid #f59e0b;
    }
    .header h1 {
      color: #f59e0b;
      margin: 0;
      font-size: 24px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⚠️ Pipeline Partially Successful</h1>
      <p>${data.mode} mode • ${data.date}</p>
    </div>
    <div style="margin: 25px 0;">
      <p>The pipeline completed with some errors. Check logs for details.</p>
      ${data.summary ? `
      <p><strong>Steps Completed:</strong> ${data.summary.stepsCompleted}</p>
      <p><strong>Steps Failed:</strong> ${data.summary.stepsFailed}</p>
      ` : ''}
    </div>
  </div>
</body>
</html>
    `
  })
};

/**
 * Send email notification
 */
async function sendNotification(type, data) {
  try {
    console.log(`Sending ${type} notification...`);

    // Get template
    const template = templates[type];
    if (!template) {
      throw new Error(`Unknown notification type: ${type}`);
    }

    const { subject, html } = template(data);

    // Send email via Resend
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: TO_EMAIL,
      subject,
      html
    });

    console.log(`✓ Notification sent successfully (ID: ${result.id})`);
    return { success: true, id: result.id };

  } catch (error) {
    console.error(`✗ Failed to send notification:`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Parse run data from file or object
 */
function parseRunData(runDataPath) {
  try {
    if (typeof runDataPath === 'object') {
      return runDataPath;
    }

    if (!fs.existsSync(runDataPath)) {
      console.error(`Run data file not found: ${runDataPath}`);
      return null;
    }

    const rawData = fs.readFileSync(runDataPath, 'utf8');
    return JSON.parse(rawData);
  } catch (error) {
    console.error('Failed to parse run data:', error.message);
    return null;
  }
}

/**
 * CLI interface
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
FeelFlick Notification System

USAGE:
  node scripts/monitoring/send-notification.js [type] [options]

TYPES:
  success       Send success notification
  failure       Send failure notification
  partial       Send partial success notification

OPTIONS:
  --data FILE   Path to JSON file with run data
  --mode MODE   Pipeline mode (discover, refresh, etc.)
  --dry-run     Test without sending email

EXAMPLES:
  # Send success notification
  node scripts/monitoring/send-notification.js success --data run-data.json

  # Send failure notification with inline data
  node scripts/monitoring/send-notification.js failure --mode discover

  # Test notification
  node scripts/monitoring/send-notification.js success --dry-run
    `);
    return;
  }

  const type = args[0] || 'success';
  const dryRun = args.includes('--dry-run');

  // Get data
  let data = {};
  
  if (args.includes('--data')) {
    const dataIndex = args.indexOf('--data');
    const dataPath = args[dataIndex + 1];
    data = parseRunData(dataPath) || {};
  }

  // Override with CLI args
  if (args.includes('--mode')) {
    const modeIndex = args.indexOf('--mode');
    data.mode = args[modeIndex + 1];
  }

  // Add defaults
  data.date = data.date || new Date().toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });

  if (dryRun) {
    console.log('DRY RUN - Would send notification:');
    console.log('Type:', type);
    console.log('Data:', JSON.stringify(data, null, 2));
    return;
  }

  // Send notification
  await sendNotification(type, data);
}

// Export for use as module
module.exports = { sendNotification, templates };

// Run if called directly
if (require.main === module) {
  main();
}
