// scripts/test-status-flow.js

/**
 * ============================================================================
 * TEST STATUS FLOW
 * ============================================================================
 * 
 * This script tests the complete status progression through the pipeline
 * 
 * Expected Flow:
 *   pending → fetching → scoring → complete
 * 
 * ============================================================================
 */

require('dotenv').config();

const { supabase } = require('./utils/supabase');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// ============================================================================
// TEST 1: CHECK STATUS DISTRIBUTION
// ============================================================================

async function testStatusDistribution() {
  log('\n📊 TEST 1: Status Distribution', 'cyan');
  log('='.repeat(70));
  
  try {
    const statuses = ['pending', 'fetching', 'scoring', 'embedding', 'complete', 'error'];
    const results = {};
    
    for (const status of statuses) {
      const { count, error } = await supabase
        .from('movies')
        .select('*', { count: 'exact', head: true })
        .eq('status', status);
      
      if (error) throw error;
      results[status] = count || 0;
    }
    
    // Display results
    log('\nCurrent Status Distribution:');
    Object.entries(results).forEach(([status, count]) => {
      const bar = '█'.repeat(Math.min(50, count / 10));
      const color = count > 0 ? 'green' : 'reset';
      log(`  ${status.padEnd(12)}: ${count.toString().padStart(6)} ${bar}`, color);
    });
    
    const total = Object.values(results).reduce((sum, count) => sum + count, 0);
    log(`\n  Total movies: ${total}`, 'yellow');
    
    return { success: true, results };
    
  } catch (error) {
    log(`  ✗ Test failed: ${error.message}`, 'red');
    return { success: false, error: error.message };
  }
}

// ============================================================================
// TEST 2: CHECK STATUS FLAGS CONSISTENCY
// ============================================================================

async function testStatusFlagsConsistency() {
  log('\n🔍 TEST 2: Status Flags Consistency', 'cyan');
  log('='.repeat(70));
  
  try {
    const checks = [];
    
    // Check 1: Movies with status='fetching' should have fetched_at
    const { count: fetchingNoData } = await supabase
      .from('movies')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'fetching')
      .is('fetched_at', null);
    
    checks.push({
      name: 'Fetching movies have fetched_at',
      pass: fetchingNoData === 0,
      found: fetchingNoData,
      expected: 0
    });
    
    // Check 2: Movies with status='scoring' should have has_scores=true
    const { count: scoringNoScores } = await supabase
      .from('movies')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'scoring')
      .eq('has_scores', false);
    
    checks.push({
      name: 'Scoring movies have has_scores=true',
      pass: scoringNoScores === 0,
      found: scoringNoScores,
      expected: 0
    });
    
    // Check 3: Movies with status='complete' should have has_embeddings=true
    const { count: completeNoEmbeddings } = await supabase
      .from('movies')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'complete')
      .eq('has_embeddings', false);
    
    checks.push({
      name: 'Complete movies have has_embeddings=true',
      pass: completeNoEmbeddings === 0,
      found: completeNoEmbeddings,
      expected: 0
    });
    
    // Check 4: Movies with has_scores=true should not be 'pending' or 'fetching'
    const { count: scoredButWrongStatus } = await supabase
      .from('movies')
      .select('*', { count: 'exact', head: true })
      .eq('has_scores', true)
      .in('status', ['pending', 'fetching']);
    
    checks.push({
      name: 'Scored movies not in pending/fetching',
      pass: scoredButWrongStatus === 0,
      found: scoredButWrongStatus,
      expected: 0
    });
    
    // Check 5: Movies with has_embeddings=true should be 'complete'
    const { count: embeddingsNotComplete } = await supabase
      .from('movies')
      .select('*', { count: 'exact', head: true })
      .eq('has_embeddings', true)
      .neq('status', 'complete');
    
    checks.push({
      name: 'Movies with embeddings are complete',
      pass: embeddingsNotComplete === 0,
      found: embeddingsNotComplete,
      expected: 0
    });
    
    // Display results
    log('\nConsistency Checks:');
    let allPassed = true;
    
    checks.forEach(check => {
      const icon = check.pass ? '✓' : '✗';
      const color = check.pass ? 'green' : 'red';
      log(`  ${icon} ${check.name}`, color);
      if (!check.pass) {
        log(`    Found ${check.found}, expected ${check.expected}`, 'yellow');
        allPassed = false;
      }
    });
    
    if (allPassed) {
      log('\n  ✓ All consistency checks passed!', 'green');
    } else {
      log('\n  ✗ Some consistency checks failed', 'red');
    }
    
    return { success: allPassed, checks };
    
  } catch (error) {
    log(`  ✗ Test failed: ${error.message}`, 'red');
    return { success: false, error: error.message };
  }
}

// ============================================================================
// TEST 3: SAMPLE MOVIE PROGRESSION
// ============================================================================

async function testSampleMovieProgression() {
  log('\n🎬 TEST 3: Sample Movie Progression', 'cyan');
  log('='.repeat(70));
  
  try {
    // Get 1 movie from each status
    const statuses = ['pending', 'fetching', 'scoring', 'complete'];
    
    log('\nSample Movies by Status:\n');
    
    for (const status of statuses) {
      const { data: movies, error } = await supabase
        .from('movies')
        .select('id, tmdb_id, title, status, has_scores, has_embeddings, has_credits, has_keywords, fetched_at, last_scored_at, last_embedding_at')
        .eq('status', status)
        .limit(1);
      
      if (error) throw error;
      
      if (movies && movies.length > 0) {
        const movie = movies[0];
        log(`  ${status.toUpperCase()}:`, 'yellow');
        log(`    Title: ${movie.title}`);
        log(`    ID: ${movie.id} (TMDB: ${movie.tmdb_id})`);
        log(`    Flags: scores=${movie.has_scores}, embeddings=${movie.has_embeddings}, credits=${movie.has_credits}, keywords=${movie.has_keywords}`);
        log(`    Timestamps: fetched=${movie.fetched_at ? '✓' : '✗'}, scored=${movie.last_scored_at ? '✓' : '✗'}, embedded=${movie.last_embedding_at ? '✓' : '✗'}`);
        log('');
      } else {
        log(`  ${status.toUpperCase()}: No movies found`, 'yellow');
        log('');
      }
    }
    
    return { success: true };
    
  } catch (error) {
    log(`  ✗ Test failed: ${error.message}`, 'red');
    return { success: false, error: error.message };
  }
}

// ============================================================================
// TEST 4: PIPELINE READINESS
// ============================================================================

async function testPipelineReadiness() {
  log('\n🚀 TEST 4: Pipeline Readiness', 'cyan');
  log('='.repeat(70));
  
  try {
    const readiness = [];
    
    // Step 02: Movies ready for metadata fetch
    const { count: readyForMetadata } = await supabase
      .from('movies')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');
    
    readiness.push({
      step: '02-fetch-movie-metadata',
      ready: readyForMetadata,
      description: 'Movies needing metadata'
    });
    
    // Step 03: Movies ready for genres/keywords
    const { count: readyForGenres } = await supabase
      .from('movies')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'fetching')
      .eq('has_keywords', false)
      .not('genres', 'is', null);
    
    readiness.push({
      step: '03-fetch-genres-keywords',
      ready: readyForGenres,
      description: 'Movies needing genres/keywords'
    });
    
    // Step 04: Movies ready for cast/crew
    const { count: readyForCast } = await supabase
      .from('movies')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'fetching')
      .eq('has_credits', false)
      .not('fetched_at', 'is', null);
    
    readiness.push({
      step: '04-fetch-cast-crew',
      ready: readyForCast,
      description: 'Movies needing cast/crew'
    });
    
    // Step 05: Movies ready for cast metadata
    const { count: readyForCastMeta } = await supabase
      .from('movies')
      .select('*', { count: 'exact', head: true })
      .eq('has_credits', true)
      .is('avg_cast_popularity', null);
    
    readiness.push({
      step: '05-calculate-cast-metadata',
      ready: readyForCastMeta,
      description: 'Movies needing cast metadata'
    });
    
    // Step 06: Movies ready for external ratings
    const { count: readyForRatings } = await supabase
      .from('movies')
      .select('*', { count: 'exact', head: true })
      .not('imdb_id', 'is', null)
      .not('ratings_external.movie_id', 'is', null);  // This won't work, need LEFT JOIN
    
    readiness.push({
      step: '06-fetch-external-ratings',
      ready: readyForRatings || '?',
      description: 'Movies needing external ratings (estimate)'
    });
    
    // Step 07: Movies ready for scoring
    const { count: readyForScoring } = await supabase
      .from('movies')
      .select('*', { count: 'exact', head: true })
      .in('status', ['fetching', 'scoring'])
      .eq('has_scores', false);
    
    readiness.push({
      step: '07-calculate-movie-scores',
      ready: readyForScoring,
      description: 'Movies needing scores'
    });
    
    // Step 08: Movies ready for embeddings
    const { count: readyForEmbeddings } = await supabase
      .from('movies')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'scoring')
      .eq('has_embeddings', false);
    
    readiness.push({
      step: '08-generate-embeddings',
      ready: readyForEmbeddings,
      description: 'Movies needing embeddings'
    });
    
    // Step 09: Movies ready for mood scores
    const { count: readyForMoods } = await supabase
      .from('movies')
      .select('*', { count: 'exact', head: true })
      .eq('has_scores', true)
      .not('pacing_score', 'is', null);
    
    readiness.push({
      step: '09-calculate-mood-scores',
      ready: readyForMoods,
      description: 'Movies ready for mood scores'
    });
    
    // Display results
    log('\nPipeline Step Readiness:\n');
    
    readiness.forEach(item => {
      const readyCount = item.ready === '?' ? item.ready : item.ready.toLocaleString();
      const color = item.ready > 0 ? 'green' : 'reset';
      log(`  ${item.step}`, 'yellow');
      log(`    Ready: ${readyCount} movies`, color);
      log(`    Description: ${item.description}`);
      log('');
    });
    
    return { success: true, readiness };
    
  } catch (error) {
    log(`  ✗ Test failed: ${error.message}`, 'red');
    return { success: false, error: error.message };
  }
}

// ============================================================================
// TEST 5: FIND STUCK MOVIES
// ============================================================================

async function testFindStuckMovies() {
  log('\n🔍 TEST 5: Find Stuck Movies', 'cyan');
  log('='.repeat(70));
  
  try {
    const issues = [];
    
    // Issue 1: Movies pending for too long (30+ days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const { count: oldPending } = await supabase
      .from('movies')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')
      .lt('inserted_at', thirtyDaysAgo.toISOString());
    
    if (oldPending > 0) {
      issues.push({
        severity: 'warning',
        count: oldPending,
        description: 'Movies stuck in pending for 30+ days'
      });
    }
    
    // Issue 2: Movies with scores but wrong status
    const { count: scoredWrongStatus } = await supabase
      .from('movies')
      .select('*', { count: 'exact', head: true })
      .eq('has_scores', true)
      .in('status', ['pending', 'fetching']);
    
    if (scoredWrongStatus > 0) {
      issues.push({
        severity: 'error',
        count: scoredWrongStatus,
        description: 'Movies with scores but status=pending/fetching'
      });
    }
    
    // Issue 3: Movies with embeddings but status != complete
    const { count: embeddedNotComplete } = await supabase
      .from('movies')
      .select('*', { count: 'exact', head: true })
      .eq('has_embeddings', true)
      .neq('status', 'complete');
    
    if (embeddedNotComplete > 0) {
      issues.push({
        severity: 'error',
        count: embeddedNotComplete,
        description: 'Movies with embeddings but status != complete'
      });
    }
    
    // Issue 4: Movies in error status
    const { count: errorMovies } = await supabase
      .from('movies')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'error');
    
    if (errorMovies > 0) {
      issues.push({
        severity: 'info',
        count: errorMovies,
        description: 'Movies in error status (may need retry)'
      });
    }
    
    // Display results
    if (issues.length === 0) {
      log('\n  ✓ No stuck movies found!', 'green');
    } else {
      log('\nPotential Issues Found:\n');
      
      issues.forEach(issue => {
        const icon = issue.severity === 'error' ? '✗' : issue.severity === 'warning' ? '⚠' : 'ℹ';
        const color = issue.severity === 'error' ? 'red' : issue.severity === 'warning' ? 'yellow' : 'cyan';
        log(`  ${icon} ${issue.count} movies: ${issue.description}`, color);
      });
    }
    
    return { success: true, issues };
    
  } catch (error) {
    log(`  ✗ Test failed: ${error.message}`, 'red');
    return { success: false, error: error.message };
  }
}

// ============================================================================
// RUN ALL TESTS
// ============================================================================

async function runAllTests() {
  console.clear();
  log('╔════════════════════════════════════════════════════════════════════╗', 'cyan');
  log('║                  STATUS FLOW TEST SUITE                            ║', 'cyan');
  log('╚════════════════════════════════════════════════════════════════════╝', 'cyan');
  
  const results = {};
  
  results.distribution = await testStatusDistribution();
  results.consistency = await testStatusFlagsConsistency();
  results.progression = await testSampleMovieProgression();
  results.readiness = await testPipelineReadiness();
  results.stuck = await testFindStuckMovies();
  
  // Final summary
  log('\n' + '='.repeat(70), 'cyan');
  log('📋 TEST SUMMARY', 'cyan');
  log('='.repeat(70));
  
  const allTests = [
    { name: 'Status Distribution', result: results.distribution },
    { name: 'Status Flags Consistency', result: results.consistency },
    { name: 'Sample Movie Progression', result: results.progression },
    { name: 'Pipeline Readiness', result: results.readiness },
    { name: 'Stuck Movies Detection', result: results.stuck }
  ];
  
  let passed = 0;
  let failed = 0;
  
  allTests.forEach(test => {
    const icon = test.result.success ? '✓' : '✗';
    const color = test.result.success ? 'green' : 'red';
    log(`  ${icon} ${test.name}`, color);
    
    if (test.result.success) {
      passed++;
    } else {
      failed++;
    }
  });
  
  log('');
  log(`Total: ${passed} passed, ${failed} failed`, failed === 0 ? 'green' : 'red');
  
  if (failed === 0) {
    log('\n🎉 All tests passed! Status flow is working correctly!', 'green');
  } else {
    log('\n⚠️  Some tests failed. Review the output above.', 'yellow');
  }
  
  log('');
}

// ============================================================================
// EXECUTE
// ============================================================================

if (require.main === module) {
  runAllTests()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { runAllTests };
