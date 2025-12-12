require('dotenv').config();
const { supabase } = require('../utils/supabase');

async function checkDataIntegrity() {
  console.log('\n' + '='.repeat(80));
  console.log('🔍 SUPABASE DATA INTEGRITY CHECK');
  console.log('='.repeat(80) + '\n');
  
  const issues = [];
  
  // ============================================================================
  // 1. MOVIES TABLE - Core Data (Using ACTUAL schema)
  // ============================================================================
  console.log('📽️  MOVIES TABLE\n');
  
  const { data: allMovies, error: moviesError } = await supabase
    .from('movies')
    .select(`
      id, 
      tmdb_id, 
      title, 
      overview, 
      runtime, 
      release_date, 
      status,
      cast_count,
      avg_cast_popularity,
      quality_score,
      ff_rating,
      embedding,
      genres,
      keywords,
      has_embeddings,
      has_scores,
      has_credits,
      has_keywords
    `);
  
  if (moviesError) {
    console.error('Error fetching movies:', moviesError);
    return;
  }
  
  const totalMovies = allMovies?.length || 0;
  console.log(`  Total movies: ${totalMovies.toLocaleString()}`);
  
  // Check for NULL required fields
  const missingTmdbId = allMovies?.filter(m => !m.tmdb_id).length || 0;
  const missingTitle = allMovies?.filter(m => !m.title).length || 0;
  const missingOverview = allMovies?.filter(m => !m.overview).length || 0;
  const missingRuntime = allMovies?.filter(m => !m.runtime).length || 0;
  const missingReleaseDate = allMovies?.filter(m => !m.release_date).length || 0;
  const missingStatus = allMovies?.filter(m => !m.status).length || 0;
  
  const checks = [
    { count: missingTmdbId, label: 'Missing TMDB ID', field: 'tmdb_id' },
    { count: missingTitle, label: 'Missing title', field: 'title' },
    { count: missingOverview, label: 'Missing overview', field: 'overview' },
    { count: missingRuntime, label: 'Missing runtime', field: 'runtime' },
    { count: missingReleaseDate, label: 'Missing release date', field: 'release_date' },
    { count: missingStatus, label: 'Missing status', field: 'status' }
  ];
  
  for (const check of checks) {
    if (check.count > 0) {
      console.log(`  ⚠️  ${check.label}: ${check.count} movies`);
      issues.push(`${check.count} movies have NULL ${check.field}`);
    } else {
      console.log(`  ✅ ${check.label}: 0`);
    }
  }
  
  // Check status distribution
  const statusCount = {};
  allMovies?.forEach(m => {
    statusCount[m.status] = (statusCount[m.status] || 0) + 1;
  });
  
  console.log('\n  Status distribution:');
  Object.entries(statusCount).forEach(([status, count]) => {
    const icon = status === 'complete' ? '✅' : status === 'pending' ? '⏳' : '❌';
    console.log(`    ${icon} ${status}: ${count}`);
  });
  
  // Check flags
  const flagChecks = [
    { field: 'has_embeddings', count: allMovies?.filter(m => m.has_embeddings === false).length || 0 },
    { field: 'has_scores', count: allMovies?.filter(m => m.has_scores === false).length || 0 },
    { field: 'has_credits', count: allMovies?.filter(m => m.has_credits === false).length || 0 },
    { field: 'has_keywords', count: allMovies?.filter(m => m.has_keywords === false).length || 0 }
  ];
  
  console.log('\n  Completeness flags:');
  flagChecks.forEach(check => {
    const coverage = ((totalMovies - check.count) / totalMovies * 100).toFixed(1);
    const icon = check.count === 0 ? '✅' : check.count < totalMovies * 0.05 ? '⚠️ ' : '❌';
    console.log(`    ${icon} ${check.field}: ${coverage}% (${totalMovies - check.count}/${totalMovies})`);
  });
  
  // Check scores
  const missingQualityScore = allMovies?.filter(m => m.quality_score === null).length || 0;
  const missingFfRating = allMovies?.filter(m => m.ff_rating === null).length || 0;
  
  if (missingQualityScore > 0 || missingFfRating > 0) {
    console.log(`\n  Score completeness:`);
    if (missingQualityScore > 0) {
      console.log(`    ℹ️  Missing quality_score: ${missingQualityScore}`);
    }
    if (missingFfRating > 0) {
      console.log(`    ℹ️  Missing ff_rating: ${missingFfRating}`);
    }
  }
  
  // ============================================================================
  // 2. MOVIE_PEOPLE TABLE - Cast/Crew Data
  // ============================================================================
  console.log('\n\n👥 MOVIE_PEOPLE TABLE\n');
  
  const { data: allPeople } = await supabase
    .from('movie_people')
    .select('movie_id');
  
  const totalPeople = allPeople?.length || 0;
  console.log(`  Total people records: ${totalPeople.toLocaleString()}`);
  
  // Check for orphaned records
  const movieIds = new Set(allMovies?.map(m => m.id));
  const orphanedPeople = allPeople?.filter(p => !movieIds.has(p.movie_id)).length || 0;
  
  if (orphanedPeople > 0) {
    console.log(`  ⚠️  Orphaned people records: ${orphanedPeople}`);
    issues.push(`${orphanedPeople} movie_people records reference non-existent movies`);
  } else {
    console.log(`  ✅ No orphaned records`);
  }
  
  // Check movies with no cast
  const noCast = allMovies?.filter(m => !m.cast_count || m.cast_count === 0).length || 0;
  const castCoverage = ((totalMovies - noCast) / totalMovies * 100).toFixed(1);
  console.log(`  ℹ️  Movies with cast: ${totalMovies - noCast} (${castCoverage}%)`);
  console.log(`  ℹ️  Movies with 0 cast: ${noCast} (${((noCast/totalMovies)*100).toFixed(1)}%)`);
  
  // ============================================================================
  // 3. MOVIE_GENRES TABLE
  // ============================================================================
  console.log('\n\n🎭 MOVIE_GENRES TABLE\n');
  
  const { data: allGenreLinks } = await supabase
    .from('movie_genres')
    .select('movie_id');
  
  const totalGenreLinks = allGenreLinks?.length || 0;
  console.log(`  Total genre links: ${totalGenreLinks.toLocaleString()}`);
  console.log(`  Average genres per movie: ${(totalGenreLinks / totalMovies).toFixed(1)}`);
  
  // Check movies with no genres
  const moviesWithGenresSet = new Set(allGenreLinks?.map(g => g.movie_id));
  const moviesWithoutGenres = totalMovies - moviesWithGenresSet.size;
  
  if (moviesWithoutGenres > 0) {
    console.log(`  ⚠️  Movies with no genres: ${moviesWithoutGenres}`);
    issues.push(`${moviesWithoutGenres} movies have no genres`);
  } else {
    console.log(`  ✅ All movies have genres`);
  }
  
  // ============================================================================
  // 4. MOVIE_KEYWORDS TABLE
  // ============================================================================
  console.log('\n\n🏷️  MOVIE_KEYWORDS TABLE\n');
  
  const { data: allKeywordLinks } = await supabase
    .from('movie_keywords')
    .select('movie_id');
  
  const totalKeywordLinks = allKeywordLinks?.length || 0;
  console.log(`  Total keyword links: ${totalKeywordLinks.toLocaleString()}`);
  console.log(`  Average keywords per movie: ${(totalKeywordLinks / totalMovies).toFixed(1)}`);
  
  const moviesWithKeywords = new Set(allKeywordLinks?.map(k => k.movie_id)).size;
  const moviesWithoutKeywords = totalMovies - moviesWithKeywords;
  const keywordCoverage = (moviesWithKeywords / totalMovies * 100).toFixed(1);
  
  console.log(`  Coverage: ${keywordCoverage}%`);
  if (moviesWithoutKeywords > 0) {
    console.log(`  ℹ️  Movies without keywords: ${moviesWithoutKeywords}`);
  }
  
  // ============================================================================
  // 5. RATINGS_EXTERNAL TABLE
  // ============================================================================
  console.log('\n\n⭐ RATINGS_EXTERNAL TABLE\n');
  
  const { data: allRatings } = await supabase
    .from('ratings_external')
    .select('movie_id, imdb_rating, rt_rating, metacritic_score');
  
  const totalRatings = allRatings?.length || 0;
  const ratingCoverage = ((totalRatings / totalMovies) * 100).toFixed(1);
  
  console.log(`  Total external ratings: ${totalRatings.toLocaleString()}`);
  console.log(`  Coverage: ${ratingCoverage}%`);
  
  const missingRatings = totalMovies - totalRatings;
  if (missingRatings > 0) {
    console.log(`  ℹ️  Movies without external ratings: ${missingRatings}`);
  }
  
  // Check rating sources
  const withImdb = allRatings?.filter(r => r.imdb_rating !== null).length || 0;
  const withRT = allRatings?.filter(r => r.rt_rating !== null).length || 0;
  const withMetacritic = allRatings?.filter(r => r.metacritic_score !== null).length || 0;
  
  console.log(`\n  Rating sources:`);
  console.log(`    IMDB: ${withImdb} (${((withImdb/totalMovies)*100).toFixed(1)}%)`);
  console.log(`    Rotten Tomatoes: ${withRT} (${((withRT/totalMovies)*100).toFixed(1)}%)`);
  console.log(`    Metacritic: ${withMetacritic} (${((withMetacritic/totalMovies)*100).toFixed(1)}%)`);
  
  // ============================================================================
  // 6. MOVIE_MOOD_SCORES TABLE
  // ============================================================================
  console.log('\n\n🎭 MOVIE_MOOD_SCORES TABLE\n');
  
  const { data: allMoodScores } = await supabase
    .from('movie_mood_scores')
    .select('movie_id');
  
  const totalMoodScores = allMoodScores?.length || 0;
  
  const { data: moods } = await supabase
    .from('moods')
    .select('id, name')
    .eq('active', true);
  
  const activeMoods = moods?.length || 0;
  
  console.log(`  Total mood scores: ${totalMoodScores.toLocaleString()}`);
  console.log(`  Active moods: ${activeMoods}`);
  
  const expectedScores = totalMovies * activeMoods;
  console.log(`  Expected scores: ${expectedScores.toLocaleString()}`);
  
  const coverage = expectedScores > 0 ? (totalMoodScores / expectedScores) * 100 : 0;
  console.log(`  Coverage: ${coverage.toFixed(1)}%`);
  
  if (coverage < 98) {
    const missing = expectedScores - totalMoodScores;
    console.log(`  ⚠️  Missing ${missing.toLocaleString()} mood scores`);
    issues.push(`Missing ${missing} mood scores (${coverage.toFixed(1)}% coverage)`);
  } else {
    console.log(`  ✅ Excellent coverage`);
  }
  
  // ============================================================================
  // 7. EMBEDDINGS
  // ============================================================================
  console.log('\n\n🤖 EMBEDDINGS\n');
  
  const moviesWithEmbeddings = allMovies?.filter(m => m.embedding !== null).length || 0;
  const embeddingCoverage = ((moviesWithEmbeddings / totalMovies) * 100).toFixed(1);
  
  console.log(`  Movies with embeddings: ${moviesWithEmbeddings.toLocaleString()}`);
  console.log(`  Coverage: ${embeddingCoverage}%`);
  
  if (moviesWithEmbeddings < totalMovies) {
    const missing = totalMovies - moviesWithEmbeddings;
    console.log(`  ⚠️  Missing embeddings: ${missing}`);
    issues.push(`${missing} movies missing embeddings`);
  } else {
    console.log(`  ✅ All movies have embeddings`);
  }
  
  // ============================================================================
  // 8. SUMMARY
  // ============================================================================
  console.log('\n\n' + '='.repeat(80));
  console.log('📊 SUMMARY');
  console.log('='.repeat(80) + '\n');
  
  if (issues.length === 0) {
    console.log('✅ NO CRITICAL ISSUES FOUND - Database integrity is EXCELLENT!\n');
  } else {
    console.log(`⚠️  FOUND ${issues.length} ISSUE(S):\n`);
    issues.forEach((issue, i) => {
      console.log(`  ${i + 1}. ${issue}`);
    });
    console.log();
  }
  
  // Data quality metrics
  console.log('📈 DATA QUALITY METRICS:\n');
  console.log(`  Total Movies: ${totalMovies.toLocaleString()}`);
  console.log(`  Complete Status: ${statusCount['complete'] || 0} (${(((statusCount['complete'] || 0) / totalMovies) * 100).toFixed(1)}%)`);
  console.log(`  Cast Data: ${castCoverage}%`);
  console.log(`  Genre Data: ${((moviesWithGenresSet.size / totalMovies) * 100).toFixed(1)}%`);
  console.log(`  Keyword Data: ${keywordCoverage}%`);
  console.log(`  External Ratings: ${ratingCoverage}%`);
  console.log(`  Mood Scores: ${coverage.toFixed(1)}%`);
  console.log(`  Embeddings: ${embeddingCoverage}%`);
  
  const qualityScores = [
    ((statusCount['complete'] || 0) / totalMovies) * 100,
    parseFloat(castCoverage),
    (moviesWithGenresSet.size / totalMovies) * 100,
    parseFloat(keywordCoverage),
    parseFloat(ratingCoverage),
    coverage,
    parseFloat(embeddingCoverage)
  ];
  
  const avgQuality = qualityScores.reduce((a, b) => a + b) / qualityScores.length;
  
  console.log(`\n  🎯 OVERALL DATA QUALITY: ${avgQuality.toFixed(1)}%`);
  
  if (avgQuality >= 95) {
    console.log('     ⭐⭐⭐⭐⭐ EXCELLENT!\n');
  } else if (avgQuality >= 90) {
    console.log('     ⭐⭐⭐⭐ VERY GOOD\n');
  } else if (avgQuality >= 85) {
    console.log('     ⭐⭐⭐ GOOD\n');
  } else if (avgQuality >= 75) {
    console.log('     ⭐⭐ FAIR\n');
  } else {
    console.log('     ⭐ NEEDS IMPROVEMENT\n');
  }
}

checkDataIntegrity().catch(console.error);
