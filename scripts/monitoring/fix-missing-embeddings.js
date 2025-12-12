require('dotenv').config();
const { supabase } = require('../utils/supabase');

async function checkMissingEmbeddings() {
  console.log('\n🤖 CHECKING MISSING EMBEDDINGS\n');
  
  const { data: missing } = await supabase
    .from('movies')
    .select('id, title, has_embeddings')
    .eq('has_embeddings', false)
    .limit(10);
  
  console.log(`Movies missing embeddings: ${missing?.length || 0}\n`);
  
  if (missing && missing.length > 0) {
    console.log('Sample movies:');
    missing.forEach(m => console.log(`  - ${m.title} (ID: ${m.id})`));
    
    console.log('\n\nTo fix, run:\n');
    console.log('  node scripts/pipeline/08-generate-embeddings.js\n');
  }
}

checkMissingEmbeddings();
