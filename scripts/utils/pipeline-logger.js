
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

module.exports = {
  setupLogger,
  logUpdateRun
};
