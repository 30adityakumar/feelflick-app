/**
 * Database Validation Service
 * Tests database constraints and data integrity from frontend
 * 
 * Usage:
 *   import { runAllValidationTests } from '@/shared/services/databaseValidation'
 *   await runAllValidationTests(userId, testMovieId)
 */

import { supabase } from '@/shared/lib/supabase/client'

/**
 * Test: Prevent duplicate feedback submission
 * Validates unique constraint on (user_id, movie_id)
 */
export async function testDuplicateFeedbackPrevention(userId, movieId) {
  console.log('🧪 Testing duplicate feedback prevention...')
  
  try {
    // Try to submit feedback twice
    const { error: error1 } = await supabase
      .from('user_movie_feedback')
      .insert({
        user_id: userId,
        movie_id: movieId,
        feedback_type: 'sentiment',
        feedback_value: 1
      })
    
    if (error1) {
      console.error('❌ First feedback insert failed:', error1)
      return false
    }
    
    // This should fail with unique constraint violation
    const { error: error2 } = await supabase
      .from('user_movie_feedback')
      .insert({
        user_id: userId,
        movie_id: movieId,
        feedback_type: 'sentiment',
        feedback_value: -1
      })
    
    if (error2 && error2.code === '23505') {
      console.log('✅ PASS: Duplicate feedback blocked by unique constraint')
      return true
    } else {
      console.error('❌ FAIL: Duplicate feedback was allowed!', error2)
      return false
    }
  } catch (err) {
    console.error('❌ Test error:', err)
    return false
  }
}

/**
 * Test: Prevent duplicate ratings
 * Validates unique constraint on (user_id, movie_id)
 */
export async function testDuplicateRatingPrevention(userId, movieId) {
  console.log('🧪 Testing duplicate rating prevention...')
  
  try {
    // Try to rate twice
    const { error: error1 } = await supabase
      .from('user_ratings')
      .insert({
        user_id: userId,
        movie_id: movieId,
        rating: 4.5
      })
    
    if (error1) {
      console.error('❌ First rating insert failed:', error1)
      return false
    }
    
    // This should fail
    const { error: error2 } = await supabase
      .from('user_ratings')
      .insert({
        user_id: userId,
        movie_id: movieId,
        rating: 3.0
      })
    
    if (error2 && error2.code === '23505') {
      console.log('✅ PASS: Duplicate rating blocked by unique constraint')
      return true
    } else {
      console.error('❌ FAIL: Duplicate rating was allowed!', error2)
      return false
    }
  } catch (err) {
    console.error('❌ Test error:', err)
    return false
  }
}

/**
 * Test: Watchlist status validation
 * Validates check constraint on status field
 */
export async function testWatchlistStatusValidation(userId, movieId) {
  console.log('🧪 Testing watchlist status validation...')
  
  try {
    // Try to insert invalid status
    const { error } = await supabase
      .from('user_watchlist')
      .insert({
        user_id: userId,
        movie_id: movieId,
        status: 'invalid_status' // Should fail
      })
    
    if (error && error.code === '23514') {
      console.log('✅ PASS: Invalid watchlist status blocked')
      return true
    } else {
      console.error('❌ FAIL: Invalid status was allowed!', error)
      return false
    }
  } catch (err) {
    console.error('❌ Test error:', err)
    return false
  }
}

/**
 * Test: Foreign key constraints
 * Validates movie_id references movies table
 */
export async function testForeignKeyConstraints(userId) {
  console.log('🧪 Testing foreign key constraints...')
  
  try {
    // Try to insert feedback for non-existent movie
    const { error } = await supabase
      .from('user_movie_feedback')
      .insert({
        user_id: userId,
        movie_id: 999999999, // Non-existent movie
        feedback_type: 'sentiment',
        feedback_value: 1
      })
    
    if (error && error.code === '23503') {
      console.log('✅ PASS: Foreign key constraint enforced')
      return true
    } else {
      console.error('❌ FAIL: Foreign key constraint not working!', error)
      return false
    }
  } catch (err) {
    console.error('❌ Test error:', err)
    return false
  }
}

/**
 * Test: Check constraint on feedback_value
 * Validates feedback_value is between -1 and 1
 */
export async function testFeedbackValueConstraint(userId, movieId) {
  console.log('🧪 Testing feedback_value constraint...')
  
  try {
    // Try to insert invalid feedback value
    const { error } = await supabase
      .from('user_movie_feedback')
      .insert({
        user_id: userId,
        movie_id: movieId,
        feedback_type: 'sentiment',
        feedback_value: 5 // Invalid: should be -1, 0, or 1
      })
    
    if (error && error.code === '23514') {
      console.log('✅ PASS: Feedback value constraint enforced')
      return true
    } else {
      console.error('❌ FAIL: Invalid feedback_value was allowed!', error)
      return false
    }
  } catch (err) {
    console.error('❌ Test error:', err)
    return false
  }
}

/**
 * Clean up test data
 */
async function cleanupTestData(userId, testMovieId) {
  console.log('🧹 Cleaning up test data...')
  
  await Promise.all([
    supabase
      .from('user_movie_feedback')
      .delete()
      .match({ user_id: userId, movie_id: testMovieId }),
    
    supabase
      .from('user_ratings')
      .delete()
      .match({ user_id: userId, movie_id: testMovieId }),
    
    supabase
      .from('user_watchlist')
      .delete()
      .match({ user_id: userId, movie_id: testMovieId })
  ])
  
  console.log('✅ Cleanup complete')
}

/**
 * Run all validation tests
 * 
 * @param {string} userId - Current user ID
 * @param {number} testMovieId - A valid movie ID to test with (default: 550 = Fight Club)
 * @returns {Promise<boolean>} - True if all tests passed
 */
export async function runAllValidationTests(userId, testMovieId = 550) {
  console.log('🚀 Starting database validation tests...\n')
  console.log(`   User ID: ${userId}`)
  console.log(`   Test Movie ID: ${testMovieId}\n`)
  
  const results = []
  
  try {
    // Clean up before tests
    await cleanupTestData(userId, testMovieId)
    
    // Run tests
    results.push(await testDuplicateFeedbackPrevention(userId, testMovieId))
    await cleanupTestData(userId, testMovieId)
    
    results.push(await testDuplicateRatingPrevention(userId, testMovieId))
    await cleanupTestData(userId, testMovieId)
    
    results.push(await testWatchlistStatusValidation(userId, testMovieId))
    await cleanupTestData(userId, testMovieId)
    
    results.push(await testForeignKeyConstraints(userId))
    await cleanupTestData(userId, testMovieId)
    
    results.push(await testFeedbackValueConstraint(userId, testMovieId))
    
    // Final cleanup
    await cleanupTestData(userId, testMovieId)
    
    const passed = results.filter(r => r).length
    const total = results.length
    
    console.log(`\n${'='.repeat(60)}`)
    console.log(`✅ Tests passed: ${passed}/${total}`)
    console.log('='.repeat(60))
    
    return passed === total
  } catch (error) {
    console.error('❌ Fatal test error:', error)
    await cleanupTestData(userId, testMovieId)
    return false
  }
}

/**
 * Quick health check - non-destructive
 * Checks for existing duplicate data
 */
export async function quickHealthCheck(userId) {
  console.log('🏥 Running quick health check...\n')
  
  const issues = []
  
  try {
    // Check for duplicate feedback
    const { data: feedbackDupes } = await supabase
      .rpc('check_duplicate_feedback')
      .eq('user_id', userId)
    
    if (feedbackDupes && feedbackDupes.length > 0) {
      issues.push(`Found ${feedbackDupes.length} duplicate feedback entries`)
    }
    
    // Check for duplicate ratings
    const { data: ratingDupes } = await supabase
      .rpc('check_duplicate_ratings')
      .eq('user_id', userId)
    
    if (ratingDupes && ratingDupes.length > 0) {
      issues.push(`Found ${ratingDupes.length} duplicate rating entries`)
    }
    
    // Check for invalid watchlist statuses
    const { data: invalidStatuses } = await supabase
      .rpc('check_invalid_watchlist_statuses')
      .eq('user_id', userId)
    
    if (invalidStatuses && invalidStatuses.length > 0) {
      issues.push(`Found ${invalidStatuses.length} invalid watchlist statuses`)
    }
    
    if (issues.length === 0) {
      console.log('✅ No data integrity issues found!')
      return true
    } else {
      console.log('⚠️  Issues found:')
      issues.forEach(issue => console.log(`   • ${issue}`))
      return false
    }
  } catch (error) {
    console.error('❌ Health check failed:', error)
    return false
  }
}
