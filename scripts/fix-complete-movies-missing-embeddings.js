// scripts/fix-complete-movies-missing-embeddings.js

require('dotenv').config();
const { supabase } = require('./utils/supabase');

async function fixCompleteMissingEmbeddings() {
  console.log('🔧 Fixing complete movies missing embeddings...\n');
  
  // Find the problematic movies
  const { data: movies, error } = await supabase
    .from('movies')
    .select('id, title, tmdb_id, status, has_embeddings')
    .eq('status', 'complete')
    .eq('has_embeddings', false);
  
  if (error) {
    console.error('Error:', error.message);
    return;
  }
  
  console.log(`Found ${movies.length} movies:\n`);
  
  movies.forEach((m, i) => {
    console.log(`${i + 1}. ID ${m.id}: ${m.title || `TMDB ${m.tmdb_id}`}`);
  });
  
  console.log('\n📝 These movies should have status=\'scoring\' (not complete)\n');
  
  // Fix: Change status back to 'scoring' so step 08 can process them
  const { error: updateError } = await supabase
    .from('movies')
    .update({ status: 'scoring' })
    .in('id', movies.map(m => m.id));
  
  if (updateError) {
    console.error('Update failed:', updateError.message);
    return;
  }
  
  console.log('✅ Fixed! Status changed to \'scoring\'');
  console.log('   Run step 08 to generate their embeddings\n');
}

fixCompleteMissingEmbeddings();
