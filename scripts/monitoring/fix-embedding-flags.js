require('dotenv').config();
const { supabase } = require('../utils/supabase');

async function fixEmbeddingFlags() {
  console.log('\n🔧 FIXING EMBEDDING FLAGS\n');
  
  // Update all movies that have embeddings but flag is false
  const { data: updated, error } = await supabase
    .from('movies')
    .update({ has_embeddings: true })
    .not('embedding', 'is', null)
    .eq('has_embeddings', false)
    .select('id, title');
  
  if (error) {
    console.error('Error:', error);
  } else {
    console.log(`✅ Fixed ${updated?.length || 0} movies\n`);
    if (updated && updated.length > 0) {
      console.log('Sample fixed movies:');
      updated.slice(0, 5).forEach(m => console.log(`  - ${m.title}`));
    }
  }
}

fixEmbeddingFlags();
