require('dotenv').config();
const { supabase } = require('../utils/supabase');

async function checkDataIntegrity() {
  console.log('\n' + '='.repeat(80));
  console.log('🔍 SUPABASE DATA INTEGRITY CHECK');
  console.log('='.repeat(80) + '\n');
  
  const issues = [];
  
  // ============================================================================
  // 1. MOVIES TABLE - Core Data (OPTIMIZED - NO embedding field)
  // ============================================================================
  console.log('📽️  MOVIES TABLE\n');
  
  // Fetch WITHOUT embedding to avoid timeout
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
  
  let hasBasicIssues = false;
  for (const check of checks) {
    if (check.count > 0) {
      console.log(`  ⚠️  ${check.label}: ${check.count} movies`);
      issues.push(`${check.count} movies have NULL ${check.field}`);
      hasBasicIssues = true;
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
  
  // Check flags (pipeline completeness)
  const flagChecks = [
    { field: 'has_embeddings', label: 'Embeddings', count: allMovies?.filter(m => m.has_embeddings !== true).length || 0 },
    { field: 'has_scores', label: 'Scores', count: allMovies?.filter(m => m.has_scores !== true).length || 0 },
    { field: 'has_credits', label: 'Credits', count: allMovies?.filter(m => m.has_credits !== true).length || 0 },
    { field: 'has_keywords', label: 'Keywords', count: allMovies?.filter(m => m.has_keywords !== true).length || 0 }
  ];
  
  console.log('\n  Pipeline completeness:');
  flagChecks.forEach(check => {
    const coverage = ((totalMovies - check.count) / totalMovies * 100).toFixed(1);
    const icon = check.count === 0 ? '✅' : check.count < totalMovies * 0.05 ? '⚠️ ' : '❌';
    console.log(`    ${icon} ${check.label.padEnd(12)}: ${coverage}% (${totalMovies - check.count}/${totalMovies})`);
    
    if (check.count > 0 && check.count > totalMovies * 0.05) {
      issues.push(`${check.count} movies missing ${check.field}`);
    }
  });
  
  // ============================================================================
  // 2. MOVIE_PEOPLE TABLE - Cast/Crew Data
  // ============================================================================
  console.log('\n\n👥 MOVIE_PEOPLE TABLE\n');
  
  // Just count, don't fetch all data
  const { count: totalPeople } = await supabase
    .from('movie_people')
    .select('*', { count: 'exact', head: true });
  
  console.log(`  Total people records: ${totalPeople?.toLocaleString() || 0}`);
  
  // Check movies with no cast
  const noCast = allMovies?.filter(m => !m.cast_count || m.cast_count === 0).length || 0;
  const castCoverage = ((totalMovies - noCast) / totalMovies * 100).toFixed(1);
  console.log(`  Movies with cast: ${totalMovies - noCast} (${castCoverage}%)`);
  console.log(`  Movies with 0 cast: ${noCast} (${((noCast/totalMovies)*100).toFixed(1)}%)`);
  
  // ============================================================================
  // 3. MOVIE_GENRES TABLE
  // ============================================================================
  console.log('\n\n🎭 MOVIE_GENRES TABLE\n');
  
  const { count: totalGenreLinks } = await supabase
    .from('movie_genres')
    .select('*', { count: 'exact', head: true });
  
  console.log(`  Total genre links: ${totalGenreLinks?.toLocaleString() || 0}`);
  console.log(`  Average genres per movie: ${(totalGenreLinks / totalMovies).toFixed(1)}`);
  
  // ============================================================================
  // 4. MOVIE_KEYWORDS TABLE
  // ============================================================================
  console.log('\n\n🏷️  MOVIE_KEYWORDS TABLE\n');
  
  const { count: totalKeywordLinks } = await supabase
    .from('movie_keywords')
    .select('*', { count: 'exact', head: true });
  
  console.log(`  Total keyword links: ${totalKeywordLinks?.toLocaleString() || 0}`);
  console.log(`  Average keywords per movie: ${(totalKeywordLinks / totalMovies).toFixed(1)}`);
  
  // ============================================================================
  // 5. RATINGS_EXTERNAL TABLE
  // ============================================================================
  console.log('\n\n⭐ RATINGS_EXTERNAL TABLE\n');
  
  const { count: totalRatings } = await supabase
    .from('ratings_external')
    .select('*', { count: 'exact', head: true });
  
  const ratingCoverage = ((totalRatings / totalMovies) * 100).toFixed(1);
  
  console.log(`  Total external ratings: ${totalRatings?.toLocaleString() || 0}`);
  console.log(`  Coverage: ${ratingCoverage}%`);
  
  const missingRatings = totalMovies - totalRatings;
  if (missingRatings > 0) {
    console.log(`  ℹ️  Movies without external ratings: ${missingRatings}`);
  }
  
  // ============================================================================
  // 6. MOVIE_MOOD_SCORES TABLE
  // ============================================================================
  console.log('\n\n🎭 MOVIE_MOOD_SCORES TABLE\n');
  
  const { count: totalMoodScores } = await supabase
    .from('movie_mood_scores')
    .select('*', { count: 'exact', head: true });
  
  const { data: moods } = await supabase
    .from('moods')
    .select('id, name')
    .eq('active', true);
  
  const activeMoods = moods?.length || 0;
  
  console.log(`  Total mood scores: ${totalMoodScores?.toLocaleString() || 0}`);
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
  // 7. SUMMARY
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
  
  const completePercent = (((statusCount['complete'] || 0) / totalMovies) * 100).toFixed(1);
  const genreCoverage = totalGenreLinks > 0 ? ((totalGenreLinks / totalMovies / 2.6) * 100).toFixed(1) : '0.0'; // Assuming avg 2.6 genres
  const keywordCoverage = totalKeywordLinks > 0 ? ((totalKeywordLinks / totalMovies / 13.9) * 100).toFixed(1) : '0.0'; // Assuming avg 13.9 keywords
  const embeddingCoverage = ((totalMovies - flagChecks[0].count) / totalMovies * 100).toFixed(1);
  
  console.log(`  Total Movies: ${totalMovies.toLocaleString()}`);
  console.log(`  Complete Status: ${statusCount['complete'] || 0} (${completePercent}%)`);
  console.log(`  Cast Data: ${castCoverage}%`);
  console.log(`  Genre Coverage: ~${genreCoverage}%`);
  console.log(`  Keyword Coverage: ~${keywordCoverage}%`);
  console.log(`  External Ratings: ${ratingCoverage}%`);
  console.log(`  Mood Scores: ${coverage.toFixed(1)}%`);
  console.log(`  Embeddings: ${embeddingCoverage}%`);
  
  const qualityScores = [
    parseFloat(completePercent),
    parseFloat(castCoverage),
    Math.min(parseFloat(genreCoverage), 100),
    Math.min(parseFloat(keywordCoverage), 100),
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
  
  console.log('='.repeat(80));
  console.log(`Check completed at: ${new Date().toLocaleString()}`);
  console.log('='.repeat(80) + '\n');
}

checkDataIntegrity().catch(console.error);
