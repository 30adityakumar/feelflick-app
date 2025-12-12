require('dotenv').config();
const { supabase } = require('../utils/supabase');

async function investigate() {
  console.log('\n🔍 INVESTIGATING MISSING DATA\n');
  
  // ============================================================================
  // 1. CHECK EMBEDDINGS MISMATCH
  // ============================================================================
  console.log('1️⃣  EMBEDDINGS MISMATCH:\n');
  
  // Count movies where has_embeddings = false
  const { count: flagFalse } = await supabase
    .from('movies')
    .select('*', { count: 'exact', head: true })
    .eq('has_embeddings', false);
  
  console.log(`   Movies with has_embeddings = false: ${flagFalse}`);
  
  // Check if script is looking at a LIMIT
  const { data: sample } = await supabase
    .from('movies')
    .select('id, title, has_embeddings')
    .eq('has_embeddings', false)
    .limit(5);
  
  if (sample && sample.length > 0) {
    console.log('   Sample movies missing embeddings:');
    sample.forEach(m => console.log(`     - ${m.title} (ID: ${m.id})`));
  }
  
  // ============================================================================
  // 2. CHECK MOOD SCORES MISMATCH
  // ============================================================================
  console.log('\n\n2️⃣  MOOD SCORES MISMATCH:\n');
  
  // Get total movies
  const { data: allMovies } = await supabase
    .from('movies')
    .select('id')
    .eq('status', 'complete');
  
  const totalMovies = allMovies?.length || 0;
  console.log(`   Total complete movies: ${totalMovies}`);
  
  // Get movies with mood scores (using DISTINCT)
  const { data: moviesWithScores } = await supabase
    .from('movie_mood_scores')
    .select('movie_id')
    .limit(10000);
  
  const uniqueMoviesWithScores = new Set(moviesWithScores?.map(s => s.movie_id)).size;
  console.log(`   Unique movies WITH mood scores: ${uniqueMoviesWithScores}`);
  console.log(`   Movies MISSING mood scores: ${totalMovies - uniqueMoviesWithScores}`);
  
  // Check if the script is using a LIMIT of 5000
  console.log('\n   🔍 Script Analysis:');
  console.log('   The script says "Checking 5000 movies"');
  console.log(`   But we have ${totalMovies} total movies`);
  console.log(`   The script might be missing ${totalMovies - 5000} movies!`);
  
  // Get sample of movies without mood scores
  const movieIdsWithScores = new Set(moviesWithScores?.map(s => s.movie_id));
  const moviesWithoutScores = allMovies?.filter(m => !movieIdsWithScores.has(m.id)).slice(0, 10);
  
  if (moviesWithoutScores && moviesWithoutScores.length > 0) {
    console.log('\n   Sample movies WITHOUT mood scores:');
    
    for (const movie of moviesWithoutScores.slice(0, 5)) {
      const { data: movieData } = await supabase
        .from('movies')
        .select('id, title')
        .eq('id', movie.id)
        .single();
      
      console.log(`     - ID ${movieData?.id}: ${movieData?.title}`);
    }
  }
  
  // ============================================================================
  // 3. CHECK SCRIPT QUERY
  // ============================================================================
  console.log('\n\n3️⃣  SCRIPT QUERY ANALYSIS:\n');
  
  console.log('   The embedding script checks:');
  console.log('     WHERE status = complete');
  console.log('     AND has_embeddings IS NOT TRUE');
  console.log('     LIMIT 5000\n');
  
  console.log('   The mood score script checks:');
  console.log('     First 5000 movies by ID\n');
  
  console.log('   🔴 PROBLEM: Scripts have hardcoded LIMIT 5000');
  console.log(`   🔴 But we have ${totalMovies} movies`);
  console.log(`   🔴 So ${totalMovies - 5000} movies are NEVER checked!\n`);
}

investigate();
