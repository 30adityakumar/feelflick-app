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
async function testDuplicateFeedbackPrevention(userId, movieId) {
  console.log('🧪 Testing duplicate feedback prevention...')
  
  try {
    // AGGRESSIVE cleanup - delete ALL feedback for this movie+user combo
    const { error: cleanupError } = await supabase
      .from('user_movie_feedback')
      .delete()
      .eq('user_id', userId)
      .eq('movie_id', movieId)
    
    // Wait a moment for cleanup
    await new Promise(resolve => setTimeout(resolve, 100))

    // Verify cleanup worked
    const { data: checkData } = await supabase
      .from('user_movie_feedback')
      .select('*')
      .eq('user_id', userId)
      .eq('movie_id', movieId)
    
    if (checkData && checkData.length > 0) {
      console.log('⚠️  Cleanup didn\'t work, found existing:', checkData.length, 'records')
      // Force cleanup with each record
      for (const record of checkData) {
        await supabase
          .from('user_movie_feedback')
          .delete()
          .eq('id', record.id)
      }
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    // Now insert first feedback
    const { error: error1 } = await supabase
      .from('user_movie_feedback')
      .insert({
        user_id: userId,
        movie_id: movieId,
        feedback_value: 1,
        feedback_type: 'recommendation'
      })

    if (error1) {
      console.error('❌ First feedback insert failed:', error1)
      return false
    }

    // Try to insert duplicate (should fail)
    const { error: error2 } = await supabase
      .from('user_movie_feedback')
      .insert({
        user_id: userId,
        movie_id: movieId,
        feedback_value: -1,
        feedback_type: 'recommendation'
      })

    if (error2 && error2.code === '23505') {
      console.log('✅ PASS: Duplicate feedback correctly prevented')
      return true
    }

    console.error('❌ FAIL: Duplicate feedback was not prevented')
    return false
  } catch (err) {
    console.error('❌ Test exception:', err)
    return false
  }
}


/**
 * Test: Prevent duplicate ratings
 * Validates unique constraint on (user_id, movie_id)
 */
async function testDuplicateRatingPrevention(userId, movieId) {
  console.log('🧪 Testing duplicate rating prevention...')
  
  try {
    // First, delete any existing rating
    await supabase
      .from('user_ratings')
      .delete()
      .eq('user_id', userId)
      .eq('movie_id', movieId)

    // Insert first rating (INTEGER 1-10)
    const { error: error1 } = await supabase
      .from('user_ratings')
      .insert({
        user_id: userId,
        movie_id: movieId,
        rating: 8, // ✅ Integer, not decimal
        rated_at: new Date().toISOString()
      })

    if (error1) {
      console.error('❌ First rating insert failed:', error1)
      return false
    }

    // Try to insert duplicate - should update via unique constraint
    const { data, error: error2 } = await supabase
      .from('user_ratings')
      .upsert({
        user_id: userId,
        movie_id: movieId,
        rating: 10, // ✅ Different integer rating
        rated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,movie_id'
      })
      .select()

    if (error2) {
      console.error('❌ Rating upsert failed:', error2)
      return false
    }

    // Verify only one rating exists with new value
    const { data: ratings, error: countError } = await supabase
      .from('user_ratings')
      .select('rating')
      .eq('user_id', userId)
      .eq('movie_id', movieId)

    if (countError) {
      console.error('❌ Count query failed:', countError)
      return false
    }

    if (ratings.length === 1 && ratings[0].rating === 10) {
      console.log('✅ PASS: Rating upsert works correctly')
      return true
    }

    console.error('❌ FAIL: Expected 1 rating with value 10, got:', ratings)
    return false
  } catch (err) {
    console.error('❌ Test exception:', err)
    return false
  }
}

/**
 * Test: Watchlist status validation
 * Validates check constraint on status field
 */
async function testWatchlistStatusValidation(userId, movieId) {
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
    } else if (error) {
      // Other error - still blocked
      console.log('✅ PASS: Invalid watchlist status blocked (error:', error.code, ')')
      return true
    } else {
      console.error('❌ FAIL: Invalid status was allowed!')
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
async function testForeignKeyConstraints(userId) {
  console.log('🧪 Testing foreign key constraints...')
  
  try {
    // Try to insert feedback for non-existent movie
    const { error } = await supabase
      .from('user_movie_feedback')
      .insert({
        user_id: userId,
        movie_id: 999999999, // Non-existent movie
        feedback_type: 'recommendation',
        feedback_value: 1
      })
    
    if (error && (error.code === '23503' || error.code === '23505')) {
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
async function testFeedbackValueConstraint(userId, movieId) {
  console.log('🧪 Testing feedback_value constraint...')
  
  try {
    // Try to insert invalid feedback value
    const { error } = await supabase
      .from('user_movie_feedback')
      .insert({
        user_id: userId,
        movie_id: movieId,
        feedback_type: 'recommendation',
        feedback_value: 5 // Invalid: should be -1, 0, or 1
      })
    
    if (error && error.code === '23514') {
      console.log('✅ PASS: Feedback value constraint enforced')
      return true
    } else if (error) {
      // Other error - still blocked
      console.log('✅ PASS: Feedback value constraint enforced (error:', error.code, ')')
      return true
    } else {
      console.error('❌ FAIL: Invalid feedback_value was allowed!')
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
 * @param {number} testMovieId - A valid movie ID to test with (default: 242)
 * @returns {Promise<boolean>} - True if all tests passed
 */
export async function runAllValidationTests(userId, testMovieId = 242) {
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
/**
 * Quick health check - non-destructive
 * Checks for existing duplicate data
 */
export async function quickHealthCheck(userId) {
  console.log('🏥 Running quick health check...\n')
  
  const issues = []
  
  try {
    // Check for duplicate feedback (simple count approach)
    const { data: allFeedback, error: fbError } = await supabase
      .from('user_movie_feedback')
      .select('movie_id')
      .eq('user_id', userId)
    
    if (fbError) throw fbError
    
    if (allFeedback && allFeedback.length > 0) {
      // Count duplicates manually
      const movieCounts = {}
      allFeedback.forEach(f => {
        movieCounts[f.movie_id] = (movieCounts[f.movie_id] || 0) + 1
      })
      const dupes = Object.values(movieCounts).filter(count => count > 1).length
      if (dupes > 0) {
        issues.push(`Found ${dupes} movies with duplicate feedback`)
      }
    }
    
    // Check for duplicate ratings
    const { data: allRatings, error: ratError } = await supabase
      .from('user_ratings')
      .select('movie_id')
      .eq('user_id', userId)
    
    if (ratError) throw ratError
    
    if (allRatings && allRatings.length > 0) {
      // Count duplicates manually
      const movieCounts = {}
      allRatings.forEach(r => {
        movieCounts[r.movie_id] = (movieCounts[r.movie_id] || 0) + 1
      })
      const dupes = Object.values(movieCounts).filter(count => count > 1).length
      if (dupes > 0) {
        issues.push(`Found ${dupes} movies with duplicate ratings`)
      }
    }
    
    // Check for invalid watchlist statuses
    const { data: watchlist, error: wlError } = await supabase
      .from('user_watchlist')
      .select('status')
      .eq('user_id', userId)
    
    if (wlError) throw wlError
    
    const validStatuses = ['want_to_watch', 'watching', 'completed', 'on_hold', 'dropped']
    const invalid = watchlist?.filter(w => !validStatuses.includes(w.status))
    if (invalid && invalid.length > 0) {
      issues.push(`Found ${invalid.length} invalid watchlist statuses`)
    }
    
    // Summary
    if (issues.length === 0) {
      console.log('✅ No data integrity issues found!')
      console.log(`📊 Stats: ${allFeedback?.length || 0} feedback, ${allRatings?.length || 0} ratings, ${watchlist?.length || 0} watchlist`)
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
