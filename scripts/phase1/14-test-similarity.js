// scripts/phase1/14-test-similarity.js
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testSimilarity(movieTitle) {
  console.log(`🔍 Finding movies similar to: "${movieTitle}"\n`);

  // Get target movie
  const { data: targetMovie } = await supabase
    .from('movies')
    .select('id, title, embedding')
    .ilike('title', `%${movieTitle}%`)
    .not('embedding', 'is', null)
    .limit(1)
    .single();

  if (!targetMovie) {
    console.log('❌ Movie not found or has no embedding');
    return;
  }

  console.log(`Found: ${targetMovie.title}\n`);

  // Find similar movies using vector similarity
  const { data: similar, error } = await supabase.rpc('match_movies', {
    query_embedding: targetMovie.embedding,
    match_threshold: 0.25,
    match_count: 10
  });

  if (error) {
    console.log('❌ Error (function may not exist yet):', error.message);
    console.log('\nWe need to create the similarity function next.');
    return;
  }

  console.log('Similar movies:');
  similar.forEach((movie, idx) => {
    console.log(`${idx + 1}. ${movie.title} (Similarity: ${(movie.similarity * 100).toFixed(1)}%)`);
  });
}

// testSimilarity('Creed').catch(console.error);
// First, let's find any movie with an embedding
supabase.from('movies').select('title').not('embedding', 'is', null).limit(1).single()
  .then(({data}) => testSimilarity(data.title));