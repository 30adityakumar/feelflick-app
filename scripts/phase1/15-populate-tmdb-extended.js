// populate-tmdb-extended.js
// Fetches runtime, vote_count, original_language from TMDB API
// Run with: node populate-tmdb-extended.js

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const TMDB_API_KEY = process.env.VITE_TMDB_API_KEY;
const RATE_LIMIT_DELAY = 30; // ms between requests (40 req/sec = 25ms, add buffer)

/**
 * Fetch movie details from TMDB API
 */
async function fetchMovieDetails(tmdbId) {
  try {
    const response = await fetch(
      `https://api.themoviedb.org/3/movie/${tmdbId}?api_key=${TMDB_API_KEY}`
    );
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Failed to fetch TMDB ${tmdbId}:`, error.message);
    return null;
  }
}

/**
 * Update movie with extended TMDB data
 */
async function updateMovieData(movie, details) {
  if (!details) return false;

  const { error } = await supabase
    .from('movies')
    .update({
      runtime: details.runtime || null,
      vote_count: details.vote_count || 0,
      original_language: details.original_language || null,
      budget: details.budget || 0,
      revenue: details.revenue || 0
    })
    .eq('id', movie.id);

  if (error) {
    console.error(`Error updating movie ${movie.id}:`, error.message);
    return false;
  }

  return true;
}

/**
 * Main function to populate extended data
 */
async function populateExtendedData() {
  console.log('📡 Fetching extended TMDB data for all movies...\n');
  console.log('⏱️  Estimated time: ~2 hours for 2616 movies\n');

  // Get movies missing extended data
  const { data: movies, error } = await supabase
    .from('movies')
    .select('id, tmdb_id, title')
    .or('runtime.is.null,vote_count.is.null,vote_count.eq.0')
    .order('popularity', { ascending: false }); // Process popular first

  if (error) {
    console.error('❌ Error fetching movies:', error.message);
    return;
  }

  if (!movies || movies.length === 0) {
    console.log('✅ All movies already have extended data!');
    return;
  }

  console.log(`📊 Processing ${movies.length} movies\n`);
  console.log('Priority: Popular movies first (better to have partial data than none)\n');

  let processed = 0;
  let updated = 0;
  let failed = 0;
  const startTime = Date.now();

  for (const movie of movies) {
    // Fetch from TMDB
    const details = await fetchMovieDetails(movie.tmdb_id);
    
    // Update database
    const success = await updateMovieData(movie, details);
    
    if (success) {
      updated++;
    } else {
      failed++;
    }

    processed++;

    // Progress logging
    if (processed % 100 === 0) {
      const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
      const rate = (processed / elapsed).toFixed(1);
      const remaining = ((movies.length - processed) / parseFloat(rate)).toFixed(0);
      
      console.log(`✅ ${processed}/${movies.length} | ` +
                  `Updated: ${updated} | Failed: ${failed} | ` +
                  `Rate: ${rate}/min | ETA: ${remaining} min`);
    }

    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY));
  }

  const totalTime = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
  
  console.log(`\n✨ Complete!`);
  console.log(`📊 Results:`);
  console.log(`   - Total processed: ${processed}`);
  console.log(`   - Successfully updated: ${updated}`);
  console.log(`   - Failed: ${failed}`);
  console.log(`   - Time taken: ${totalTime} minutes`);
  console.log(`\n🔍 Running validation query...`);

  // Validation
  const { data: stats, error: statsError } = await supabase.rpc('exec', {
    query: `
      SELECT 
        COUNT(*) as total_movies,
        COUNT(runtime) as has_runtime,
        COUNT(CASE WHEN vote_count > 0 THEN 1 END) as has_votes,
        COUNT(original_language) as has_language,
        ROUND(100.0 * COUNT(runtime) / COUNT(*), 1) as runtime_pct,
        ROUND(100.0 * COUNT(CASE WHEN vote_count > 0 THEN 1 END) / COUNT(*), 1) as votes_pct
      FROM movies;
    `
  });

  if (!statsError && stats && stats.length > 0) {
    const s = stats[0];
    console.log(`\n📈 Data Coverage:`);
    console.log(`   - Total movies: ${s.total_movies}`);
    console.log(`   - Has runtime: ${s.has_runtime} (${s.runtime_pct}%)`);
    console.log(`   - Has vote_count: ${s.has_votes} (${s.votes_pct}%)`);
    console.log(`   - Has language: ${s.has_language}`);
  }

  console.log(`\n✅ Next step: Run calculate-metadata.js`);
}

// Run if called directly
if (require.main === module) {
  populateExtendedData()
    .then(() => {
      console.log('\n✨ Script completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { populateExtendedData };