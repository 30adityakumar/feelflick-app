require('dotenv').config();
const { supabase } = require('../utils/supabase');

async function checkDataIntegrity() {
  console.log('\n' + '='.repeat(80));
  console.log('🔍 SUPABASE DATA INTEGRITY CHECK');
  console.log('='.repeat(80) + '\n');
  
  const issues = [];
  
  // ============================================================================
  // 1. MOVIES TABLE - Core Data
  // ============================================================================
  console.log('📽️  MOVIES TABLE\n');
  
  // FIX: Get actual data instead of just count
  const { data: allMovies, error: moviesError } = await supabase
    .from('movies')
    .select('id, tmdb_id, title, overview, runtime, release_date, status, overall_score, cast_count, embedding');
  
  if (moviesError) {
    console.error('Error fetching movies:', moviesError);
    return;
  }
  
  const totalMovies = allMovies?.length || 0;
  console.log(`  Total movies: ${totalMovies}`);
  
  // Check for NULL required fields
  const missingTmdbId = allMovies?.filter(m => !m.tmdb_id).length || 0;
  const missingTitle = allMovies?.filter(m => !m.title).length || 0;
  const missingOverview = allMovies?.filter(m => !m.overview).length || 0;
  const missingRuntime = allMovies?.filter(m => !m.runtime).length || 0;
  const missingReleaseDate = allMovies?.filter(m => !m.release_date).length || 0;
  const missingStatus = allMovies?.filter(m => !m.status).length || 0;
  
  const checks = [
    { count: missingTmdbId, label: 'Missing TMDB ID' },
    { count: missingTitle, label: 'Missing title' },
    { count: missingOverview, label: 'Missing overview' },
    { count: missingRuntime, label: 'Missing runtime' },
    { count: missingReleaseDate, label: 'Missing release date' },
    { count: missingStatus, label: 'Missing status' }
  ];
  
  for (const check of checks) {
    if (check.count > 0) {
      console.log(`  ⚠️  ${check.label}: ${check.count} movies`);
      issues.push(`${check.count} movies have NULL ${check.label.toLowerCase()}`);
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
  
  // Check for invalid scores
  const invalidScores = allMovies?.filter(m => 
    m.overall_score !== null && (m.overall_score < 0 || m.overall_score > 100)
  ).length || 0;
  
  if (invalidScores > 0) {
    console.log(`  ⚠️  Invalid overall_score (not 0-100): ${invalidScores}`);
    issues.push(`${invalidScores} movies have invalid overall_score`);
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
    console.log(`  ✅ No orphaned records found`);
  }
  
  // Check movies with no cast
  const noCast = allMovies?.filter(m => m.cast_count === 0).length || 0;
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
  
  if (moviesWithoutKeywords > 0) {
    console.log(`  ℹ️  Movies with no keywords: ${moviesWithoutKeywords} (${((moviesWithoutKeywords/totalMovies)*100).toFixed(1)}%)`);
  }
  
  // ============================================================================
  // 5. RATINGS_EXTERNAL TABLE
  // ============================================================================
  console.log('\n\n⭐ RATINGS_EXTERNAL TABLE\n');
  
  const { data: allRatings } = await supabase
    .from('ratings_external')
    .select('movie_id, imdb_rating');
  
  const totalRatings = allRatings?.length || 0;
  console.log(`  Total external ratings: ${totalRatings.toLocaleString()}`);
  console.log(`  Coverage: ${((totalRatings / totalMovies) * 100).toFixed(1)}%`);
  
  const missingRatings = totalMovies - totalRatings;
  if (missingRatings > 0) {
    console.log(`  ℹ️  Movies without external ratings: ${missingRatings}`);
  }
  
  // Check for invalid ratings
  const invalidImdb = allRatings?.filter(r => 
    r.imdb_rating !== null && (r.imdb_rating < 0 || r.imdb_rating > 10)
  ).length || 0;
  
  if (invalidImdb > 0) {
    console.log(`  ⚠️  Invalid IMDB ratings: ${invalidImdb}`);
    issues.push(`${invalidImdb} movies have invalid IMDB ratings`);
  }
  
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
    .select('id')
    .eq('is_active', true);
  
  const activeMoods = moods?.length || 0;
  
  console.log(`  Total mood scores: ${totalMoodScores.toLocaleString()}`);
  console.log(`  Active moods: ${activeMoods}`);
  console.log(`  Expected scores: ${(totalMovies * activeMoods).toLocaleString()}`);
  
  const expectedScores = totalMovies * activeMoods;
  const coverage = expectedScores > 0 ? (totalMoodScores / expectedScores) * 100 : 0;
  
  if (coverage < 99) {
    console.log(`  ⚠️  Coverage: ${coverage.toFixed(1)}%`);
    const missing = expectedScores - totalMoodScores;
    issues.push(`Missing ${missing} mood scores (${coverage.toFixed(1)}% coverage)`);
  } else {
    console.log(`  ✅ Coverage: ${coverage.toFixed(1)}%`);
  }
  
  // ============================================================================
  // 7. EMBEDDINGS
  // ============================================================================
  console.log('\n\n🤖 EMBEDDINGS\n');
  
  const moviesWithEmbeddings = allMovies?.filter(m => m.embedding !== null).length || 0;
  
  console.log(`  Movies with embeddings: ${moviesWithEmbeddings.toLocaleString()}`);
  console.log(`  Coverage: ${((moviesWithEmbeddings / totalMovies) * 100).toFixed(1)}%`);
  
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
  console.log(`  Complete Movies: ${statusCount['complete'] || 0} (${((statusCount['complete'] / totalMovies) * 100).toFixed(1)}%)`);
  console.log(`  Cast Coverage: ${((totalMovies - noCast) / totalMovies * 100).toFixed(1)}%`);
  console.log(`  Genre Coverage: ${((moviesWithGenresSet.size / totalMovies) * 100).toFixed(1)}%`);
  console.log(`  External Ratings: ${((totalRatings / totalMovies) * 100).toFixed(1)}%`);
  console.log(`  Mood Scores: ${coverage.toFixed(1)}%`);
  console.log(`  Embeddings: ${((moviesWithEmbeddings / totalMovies) * 100).toFixed(1)}%`);
  
  const avgQuality = [
    (statusCount['complete'] / totalMovies) * 100,
    ((totalMovies - noCast) / totalMovies) * 100,
    (moviesWithGenresSet.size / totalMovies) * 100,
    (totalRatings / totalMovies) * 100,
    coverage,
    (moviesWithEmbeddings / totalMovies) * 100
  ].reduce((a, b) => a + b) / 6;
  
  console.log(`\n  🎯 OVERALL DATA QUALITY: ${avgQuality.toFixed(1)}%`);
  
  if (avgQuality >= 95) {
    console.log('     ⭐⭐⭐⭐⭐ EXCELLENT!');
  } else if (avgQuality >= 85) {
    console.log('     ⭐⭐⭐⭐ GOOD');
  } else if (avgQuality >= 75) {
    console.log('     ⭐⭐⭐ FAIR');
  } else {
    console.log('     ⭐⭐ NEEDS IMPROVEMENT');
  }
  
  console.log();
}

checkDataIntegrity().catch(console.error);
