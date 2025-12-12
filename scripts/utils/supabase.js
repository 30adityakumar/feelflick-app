// scripts/utils/supabase.js
// Only load dotenv if not in CI environment
if (!process.env.GITHUB_ACTIONS) {
  require('dotenv').config();
}

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase credentials. Check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.');
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

/**
 * Log a new update run to the database
 */
async function logUpdateRun(params) {
  const { data, error } = await supabase
    .from('update_runs')
    .insert({
      run_type: params.run_type,
      status: params.status || 'running',
      started_at: params.started_at || new Date().toISOString(),
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

/**
 * Complete an update run with final status
 */
async function completeUpdateRun(runId, params) {
  const updates = {
    status: params.status || 'success',
    completed_at: new Date().toISOString(),
    errors: params.errors || []
  };
  
  const { error } = await supabase
    .from('update_runs')
    .update(updates)
    .eq('id', runId);
  
  if (error) {
    console.error('Error completing update run:', error);
  }
}

module.exports = { 
  supabase,
  logUpdateRun,
  completeUpdateRun
};
