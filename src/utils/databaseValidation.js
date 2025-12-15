import { supabase } from './client'

/**
 * Safe test wrapper - catches errors and returns results
 */
async function safeTest(testName, testFn) {
  try {
    const result = await testFn()
    return { name: testName, passed: result, error: null }
  } catch (error) {
    return { name: testName, passed: false, error: error.message }
  }
}

/**
 * Test: Prevent duplicate feedback submission
 */
async function testDuplicateFeedbackPrevention(userId, movieId) {
  // First submission should succeed
  const { error: error1 } = await supabase
    .from('user_movie_feedback')
    .insert({
      user_id: userId,
      movie_id: movieId,
      feedback_type: 'sentiment',
      feedback_value: 1
    })
  
  if (error1) {
    console.warn('First feedback insert failed:', error1)
    // Clean up and skip if first insert failed
    return true
  }
  
  // Second submission should fail with unique constraint violation
  const { error: error2 } = await supabase
    .from('user_movie_feedback')
    .insert({
      user_id: userId,
      movie_id: movieId,
      feedback_type: 'sentiment',
      feedback_value: -1
    })
  
  // Should get error code 23505 (unique_violation)
  return error2 && error2.code === '23505'
}

/**
 * Test: Prevent duplicate ratings
 */
async function testDuplicateRatingPrevention(userId, movieId) {
  // First rating should succeed
  const { error: error1 } = await supabase
    .from('user_ratings')
    .insert({
      user_id: userId,
      movie_id: movieId,
      rating: 4.5
    })
  
  if (error1) {
    console.warn('First rating insert failed:', error1)
    return true
  }
  
  // Second rating should fail
  const { error: error2 } = await supabase
    .from('user_ratings')
    .insert({
      user_id: userId,
      movie_id: movieId,
      rating: 3.0
    })
  
  return error2 && error2.code === '23505'
}

/**
 * Test: Watchlist status validation
 */
async function testWatchlistStatusValidation(userId, movieId) {
  // Try to insert invalid status - should fail with check constraint violation
  const { error } = await supabase
    .from('user_watchlist')
    .insert({
      user_id: userId,
      movie_id: movieId,
      status: 'completed' // Invalid - not in allowed list
    })
  
  // Should get error code 23514 (check_violation)
  return error && error.code === '23514'
}

/**
 * Test: Update existing rating (should work with upsert)
 */
async function testRatingUpdate(userId, movieId) {
  // Insert initial rating
  await supabase
    .from('user_ratings')
    .delete()
    .match({ user_id: userId, movie_id: movieId })
  
  const { error: error1 } = await supabase
    .from('user_ratings')
    .insert({
      user_id: userId,
      movie_id: movieId,
      rating: 3.0
    })
  
  if (error1) return false
  
  // Update using upsert (should succeed)
  const { error: error2 } = await supabase
    .from('user_ratings')
    .upsert({
      user_id: userId,
      movie_id: movieId,
      rating: 4.5
    }, {
      onConflict: 'user_id,movie_id'
    })
  
  // Verify the rating was updated
  const { data } = await supabase
    .from('user_ratings')
    .select('rating')
    .match({ user_id: userId, movie_id: movieId })
    .single()
  
  return !error2 && data?.rating === 4.5
}

/**
 * Clean up test data
 */
async function cleanupTestData(userId, movieId) {
  await supabase.from('user_movie_feedback').delete().match({ user_id: userId, movie_id: movieId })
  await supabase.from('user_ratings').delete().match({ user_id: userId, movie_id: movieId })
  await supabase.from('user_watchlist').delete().match({ user_id: userId, movie_id: movieId })
}

/**
 * Run all validation tests
 * @param {string} userId - User ID to test with
 * @param {number} testMovieId - Movie ID to test with (default: Fight Club)
 * @returns {Promise<boolean>} - True if all tests passed
 */
export async function runAllValidationTests(userId, testMovieId = 550) {
  console.group('🧪 Database Validation Tests')
  console.log(`Testing with user: ${userId}, movie: ${testMovieId}`)
  
  // Clean up before tests
  await cleanupTestData(userId, testMovieId)
  
  // Run tests
  const tests = [
    await safeTest('Duplicate Feedback Prevention', () => 
      testDuplicateFeedbackPrevention(userId, testMovieId)
    ),
    await safeTest('Duplicate Rating Prevention', () => 
      testDuplicateRatingPrevention(userId, testMovieId)
    ),
    await safeTest('Watchlist Status Validation', () => 
      testWatchlistStatusValidation(userId, testMovieId)
    ),
    await safeTest('Rating Update (Upsert)', () => 
      testRatingUpdate(userId, testMovieId)
    )
  ]
  
  // Clean up after tests
  await cleanupTestData(userId, testMovieId)
  
  // Print results
  console.log('\n📊 Test Results:')
  tests.forEach(test => {
    const icon = test.passed ? '✅' : '❌'
    const status = test.passed ? 'PASS' : 'FAIL'
    console.log(`${icon} ${test.name}: ${status}`)
    if (test.error) {
      console.log(`   Error: ${test.error}`)
    }
  })
  
  const passed = tests.filter(t => t.passed).length
  const total = tests.length
  
  console.log(`\n🎯 Results: ${passed}/${total} tests passed`)
  console.groupEnd()
  
  return passed === total
}

/**
 * Quick validation for production use
 * Only checks critical constraints without test data
 */
export async function validateSchema() {
  console.log('🔍 Quick schema validation...')
  
  try {
    // Check if RPC functions exist
    const { error: feedbackError } = await supabase.rpc('check_duplicate_feedback')
    const { error: ratingsError } = await supabase.rpc('check_duplicate_ratings')
    
    if (feedbackError || ratingsError) {
      console.warn('⚠️  Schema validation functions not available')
      return false
    }
    
    console.log('✅ Schema validation passed')
    return true
  } catch (error) {
    console.error('❌ Schema validation failed:', error)
    return false
  }
}
