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
  
  const { count: totalMovies } = await supabase
    .from('movies')
    .select('*', { count: 'exact', head: true });
  
  console.log(`  Total movies: ${totalMovies}`);
  
  // Check for NULL required fields
  const checks = [
    { field: 'tmdb_id', label: 'Missing TMDB ID' },
    { field: 'title', label: 'Missing title' },
    { field: 'overview', label: 'Missing overview' },
    { field: 'runtime', label: 'Missing runtime' },
    { field: 'release_date', label: 'Missing release date' },
    { field: 'status', label: 'Missing status' }
  ];
  
  for (const check of checks) {
    const { count } = await supabase
      .from('movies')
      .select('*', { count: 'exact', head: true })
      .is(check.field, null);
    
    if (count > 0) {
      console.log(`  ⚠️  ${check.label}: ${count} movies`);
      issues.push(`${count} movies have NULL ${check.field}`);
    } else {
      console.log(`  ✅ ${check.label}: 0`);
    }
  }
  
  // Check status distribution
  const { data: statusData } = await supabase
    .from('movies')
    .select('status');
  
  const statusCount = {};
  statusData?.forEach(m => {
    statusCount[m.status] = (statusCount[m.status] || 0) + 1;
  });
  
  console.log('\n  Status distribution:');
  Object.entries(statusCount).forEach(([status, count]) => {
    const icon = status === 'complete' ? '✅' : status === 'pending' ? '⏳' : '❌';
    console.log(`    ${icon} ${status}: ${count}`);
  });
  
  // Check for invalid scores
  const { count: invalidScores } = await supabase
    .from('movies')
    .select('*', { count: 'exact', head: true })
    .or('overall_score.lt.0,overall_score.gt.100');
  
  if (invalidScores > 0) {
    console.log(`  ⚠️  Invalid overall_score (not 0-100): ${invalidScores}`);
    issues.push(`${invalidScores} movies have invalid overall_score`);
  }
  
  // ============================================================================
  // 2. MOVIE_PEOPLE TABLE - Cast/Crew Data
  // ============================================================================
  console.log('\n\n👥 MOVIE_PEOPLE TABLE\n');
  
  const { count: totalPeople } = await supabase
    .from('movie_people')
    .select('*', { count: 'exact', head: true });
  
  console.log(`  Total people records: ${totalPeople}`);
  
  // Check for orphaned records
  const { data: orphanedPeople } = await supabase.rpc('check_orphaned_people', {});
  
  if (orphanedPeople === null) {
    // Function doesn't exist, check manually
    const { data: movieIds } = await supabase
      .from('movies')
      .select('id');
    
    const validIds = new Set(movieIds?.map(m => m.id));
    
    const { data: peopleMovieIds } = await supabase
      .from('movie_people')
      .select('movie_id')
      .limit(1000);
    
    const orphaned = peopleMovieIds?.filter(p => !validIds.has(p.movie_id)).length || 0;
    
    if (orphaned > 0) {
      console.log(`  ⚠️  Orphaned people records: ~${orphaned}`);
      issues.push(`${orphaned} movie_people records reference non-existent movies`);
    } else {
      console.log(`  ✅ No orphaned records found`);
    }
  }
  
  // Check movies with no cast
  const { count: noCast } = await supabase
    .from('movies')
    .select('*', { count: 'exact', head: true })
    .eq('cast_count', 0);
  
  console.log(`  ℹ️  Movies with 0 cast: ${noCast} (${((noCast/totalMovies)*100).toFixed(1)}%)`);
  
  // ============================================================================
  // 3. MOVIE_GENRES TABLE
  // ============================================================================
  console.log('\n\n🎭 MOVIE_GENRES TABLE\n');
  
  const { count: totalGenreLinks } = await supabase
    .from('movie_genres')
    .select('*', { count: 'exact', head: true });
  
  console.log(`  Total genre links: ${totalGenreLinks}`);
  console.log(`  Average genres per movie: ${(totalGenreLinks / totalMovies).toFixed(1)}`);
  
  // Check movies with no genres
  const { data: moviesWithGenres } = await supabase
    .from('movie_genres')
    .select('movie_id');
  
  const moviesWithGenresSet = new Set(moviesWithGenres?.map(g => g.movie_id));
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
  
  const { count: totalKeywordLinks } = await supabase
    .from('movie_keywords')
    .select('*', { count: 'exact', head: true });
  
  console.log(`  Total keyword links: ${totalKeywordLinks}`);
  console.log(`  Average keywords per movie: ${(totalKeywordLinks / totalMovies).toFixed(1)}`);
  
  // ============================================================================
  // 5. RATINGS_EXTERNAL TABLE
  // ============================================================================
  console.log('\n\n⭐ RATINGS_EXTERNAL TABLE\n');
  
  const { count: totalRatings } = await supabase
    .from('ratings_external')
    .select('*', { count: 'exact', head: true });
  
  console.log(`  Total external ratings: ${totalRatings}`);
  console.log(`  Coverage: ${((totalRatings / totalMovies) * 100).toFixed(1)}%`);
  
  // Check for invalid ratings
  const { count: invalidImdb } = await supabase
    .from('ratings_external')
    .select('*', { count: 'exact', head: true })
    .or('imdb_rating.lt.0,imdb_rating.gt.10');
  
  if (invalidImdb > 0) {
    console.log(`  ⚠️  Invalid IMDB ratings: ${invalidImdb}`);
    issues.push(`${invalidImdb} movies have invalid IMDB ratings`);
  }
  
  // ============================================================================
  // 6. MOVIE_MOOD_SCORES TABLE
  // ============================================================================
  console.log('\n\n🎭 MOVIE_MOOD_SCORES TABLE\n');
  
  const { count: totalMoodScores } = await supabase
    .from('movie_mood_scores')
    .select('*', { count: 'exact', head: true });
  
  const { count: activeMoods } = await supabase
    .from('moods')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true);
  
  console.log(`  Total mood scores: ${totalMoodScores}`);
  console.log(`  Active moods: ${activeMoods}`);
  console.log(`  Expected scores: ${totalMovies * activeMoods}`);
  
  const expectedScores = totalMovies * activeMoods;
  const coverage = (totalMoodScores / expectedScores) * 100;
  
  if (coverage < 99) {
    console.log(`  ⚠️  Coverage: ${coverage.toFixed(1)}%`);
    issues.push(`Mood scores coverage is only ${coverage.toFixed(1)}%`);
  } else {
    console.log(`  ✅ Coverage: ${coverage.toFixed(1)}%`);
  }
  
  // ============================================================================
  // 7. EMBEDDINGS
  // ============================================================================
  console.log('\n\n🤖 EMBEDDINGS\n');
  
  const { count: moviesWithEmbeddings } = await supabase
    .from('movies')
    .select('*', { count: 'exact', head: true })
    .not('embedding', 'is', null);
  
  console.log(`  Movies with embeddings: ${moviesWithEmbeddings}`);
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
    console.log('✅ NO ISSUES FOUND - Database integrity is EXCELLENT!\n');
  } else {
    console.log(`⚠️  FOUND ${issues.length} ISSUE(S):\n`);
    issues.forEach((issue, i) => {
      console.log(`  ${i + 1}. ${issue}`);
    });
    console.log();
  }
  
  // Data quality metrics
  console.log('📈 DATA QUALITY METRICS:\n');
  console.log(`  Total Movies: ${totalMovies}`);
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
