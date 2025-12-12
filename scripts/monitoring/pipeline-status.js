// scripts/monitoring/pipeline-status.js
// Check pipeline health and recent runs

require('dotenv').config();
const { supabase } = require('../utils/supabase');

async function checkPipelineStatus() {
  console.log('\n🔍 FEELFLICK PIPELINE STATUS');
  console.log('=' .repeat(70));
  
  // Get last 10 runs
  const { data: runs } = await supabase
    .from('update_runs')
    .select('*')
    .order('started_at', { ascending: false })
    .limit(10);

  if (!runs || runs.length === 0) {
    console.log('\n⚠️  No pipeline runs found');
    return;
  }

  console.log('\n📊 Recent Pipeline Runs:\n');
  
  runs.forEach((run, i) => {
    const startTime = new Date(run.started_at);
    const endTime = run.completed_at ? new Date(run.completed_at) : new Date();
    const duration = Math.round((endTime - startTime) / 1000);
    
    const statusIcon = run.status === 'success' ? '✅' : 
                       run.status === 'partial' ? '⚠️' : 
                       run.status === 'failed' ? '❌' : '🔄';
    
    console.log(`${i + 1}. ${statusIcon} ${run.run_type.toUpperCase()}`);
    console.log(`   Started: ${startTime.toLocaleString()}`);
    console.log(`   Status: ${run.status} (${duration}s)`);
    if (run.movies_added) console.log(`   Movies Added: ${run.movies_added}`);
    if (run.movies_updated) console.log(`   Movies Updated: ${run.movies_updated}`);
    if (run.errors && run.errors.length > 0) {
      console.log(`   Errors: ${run.errors.length}`);
    }
    console.log('');
  });

  // Calculate success rate
  const successCount = runs.filter(r => r.status === 'success').length;
  const successRate = (successCount / runs.length * 100).toFixed(1);
  
  console.log('=' .repeat(70));
  console.log(`📈 Success Rate: ${successRate}% (${successCount}/${runs.length})`);
  console.log('=' .repeat(70));
  console.log('');
}

if (require.main === module) {
  checkPipelineStatus();
}

module.exports = { checkPipelineStatus };
