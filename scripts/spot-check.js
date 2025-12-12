require('dotenv').config();
const { supabase } = require('./utils/supabase');

async function spotCheck() {
  const { data, error } = await supabase
    .from('movies')
    .select('title, status, has_scores, has_embeddings, has_credits')
    .eq('status', 'complete')
    .limit(5);
  
  console.log('\n✅ Sample of completed movies:\n');
  data.forEach(m => {
    console.log(`${m.title}`);
    console.log(`  Status: ${m.status}`);
    console.log(`  Scores: ${m.has_scores ? '✓' : '✗'}`);
    console.log(`  Embeddings: ${m.has_embeddings ? '✓' : '✗'}`);
    console.log(`  Credits: ${m.has_credits ? '✓' : '✗'}`);
    console.log('');
  });
}

spotCheck();
