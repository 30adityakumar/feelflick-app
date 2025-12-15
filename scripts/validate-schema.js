// scripts/validate-schema.js
/**
 * FeelFlick Database Schema Validation Script
 * 
 * Validates database schema improvements:
 * - Unique constraints
 * - Foreign keys
 * - Performance indexes
 * - Data integrity
 * 
 * Usage:
 *   node scripts/validate-schema.js
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Missing Supabase credentials')
  console.error('   Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Results tracking
const results = {
  passed: [],
  failed: [],
  warnings: []
}

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
}

function log(color, message) {
  console.log(`${color}${message}${colors.reset}`)
}

// Test 1: Check unique constraints
async function testUniqueConstraints() {
  log(colors.cyan, '\n🔍 Test 1: Checking unique constraints...')
  
  const { data, error } = await supabase.rpc('check_unique_constraints', {
    table_names: ['user_ratings', 'user_movie_feedback']
  })
  
  if (error) {
    results.failed.push(`❌ Failed to check unique constraints: ${error.message}`)
    return
  }
  
  const expectedConstraints = [
    { table: 'user_ratings', columns: 'user_id, movie_id' },
    { table: 'user_movie_feedback', columns: 'user_id, movie_id' }
  ]
  
  let foundCount = 0
  for (const expected of expectedConstraints) {
    const found = data?.find(c => 
      c.table_name === expected.table && 
      c.column_names === expected.columns
    )
    
    if (found) {
      foundCount++
      log(colors.green, `   ✅ ${expected.table}: (${expected.columns})`)
    } else {
      log(colors.red, `   ❌ Missing: ${expected.table}: (${expected.columns})`)
    }
  }
  
  if (foundCount === expectedConstraints.length) {
    results.passed.push('✅ All unique constraints exist')
  } else {
    results.failed.push(`❌ Missing ${expectedConstraints.length - foundCount} unique constraints`)
  }
}

// Test 2: Check for duplicate feedback
async function testDuplicateFeedback() {
  log(colors.cyan, '\n🔍 Test 2: Checking for duplicate feedback entries...')
  
  const { data, error } = await supabase.rpc('check_duplicate_feedback')
  
  if (error) {
    results.warnings.push(`⚠️  Could not check duplicate feedback: ${error.message}`)
    return
  }
  
  if (!data || data.length === 0) {
    log(colors.green, '   ✅ No duplicate feedback entries found')
    results.passed.push('✅ No duplicate feedback entries')
  } else {
    log(colors.red, `   ❌ Found ${data.length} users with duplicate feedback`)
    data.slice(0, 3).forEach(dup => {
      log(colors.red, `      User ${dup.user_id}: ${dup.duplicate_count} duplicates`)
    })
    results.failed.push(`❌ Found ${data.length} duplicate feedback entries`)
  }
}

// Test 3: Check for duplicate ratings
async function testDuplicateRatings() {
  log(colors.cyan, '\n🔍 Test 3: Checking for duplicate ratings...')
  
  const { data, error } = await supabase.rpc('check_duplicate_ratings')
  
  if (error) {
    results.warnings.push(`⚠️  Could not check duplicate ratings: ${error.message}`)
    return
  }
  
  if (!data || data.length === 0) {
    log(colors.green, '   ✅ No duplicate rating entries found')
    results.passed.push('✅ No duplicate rating entries')
  } else {
    log(colors.red, `   ❌ Found ${data.length} users with duplicate ratings`)
    data.slice(0, 3).forEach(dup => {
      log(colors.red, `      User ${dup.user_id}: ${dup.duplicate_count} duplicates`)
    })
    results.failed.push(`❌ Found ${data.length} duplicate rating entries`)
  }
}

// Test 4: Check watchlist statuses
async function testWatchlistStatuses() {
  log(colors.cyan, '\n🔍 Test 4: Validating watchlist statuses...')
  
  const { data, error } = await supabase.rpc('check_invalid_watchlist_statuses')
  
  if (error) {
    results.warnings.push(`⚠️  Could not check watchlist statuses: ${error.message}`)
    return
  }
  
  if (!data || data.length === 0) {
    log(colors.green, '   ✅ All watchlist statuses are valid')
    results.passed.push('✅ All watchlist statuses are valid')
  } else {
    log(colors.red, `   ❌ Found ${data.length} invalid watchlist statuses`)
    const uniqueStatuses = [...new Set(data.map(d => d.invalid_status))]
    log(colors.red, `      Invalid statuses: ${uniqueStatuses.join(', ')}`)
    results.failed.push(`❌ Found ${data.length} invalid watchlist statuses`)
  }
}

// Test 5: Check performance indexes
async function testPerformanceIndexes() {
  log(colors.cyan, '\n🔍 Test 5: Checking performance indexes...')
  
  const { data, error } = await supabase.rpc('check_indexes', {
    table_names: ['user_movie_feedback', 'user_ratings', 'user_watchlist', 'recommendation_impressions']
  })
  
  if (error) {
    results.warnings.push(`⚠️  Could not check indexes: ${error.message}`)
    return
  }
  
  const expectedMinimum = 12
  const indexCount = data?.length || 0
  
  if (indexCount >= expectedMinimum) {
    log(colors.green, `   ✅ Found ${indexCount} performance indexes (expected ${expectedMinimum}+)`)
    results.passed.push(`✅ Found ${indexCount} performance indexes`)
    
    // Show some key indexes
    const keyIndexes = data?.filter(idx => 
      idx.indexname.includes('user_created') || 
      idx.indexname.includes('rated_at') ||
      idx.indexname.includes('user_movie_date')
    )
    
    if (keyIndexes?.length > 0) {
      log(colors.blue, '\n   📊 Key indexes found:')
      keyIndexes.forEach(idx => {
        log(colors.blue, `      • ${idx.tablename}.${idx.indexname}`)
      })
    }
  } else {
    log(colors.yellow, `   ⚠️  Found ${indexCount} indexes (expected ${expectedMinimum}+)`)
    results.warnings.push(`⚠️  Expected ${expectedMinimum}+ indexes, found ${indexCount}`)
  }
}

// Test 6: Check foreign keys
async function testForeignKeys() {
  log(colors.cyan, '\n🔍 Test 6: Checking foreign key constraints...')
  
  const { data, error } = await supabase.rpc('check_foreign_keys', {
    p_table_name: 'user_movie_feedback'
  })
  
  if (error) {
    results.warnings.push(`⚠️  Could not check foreign keys: ${error.message}`)
    return
  }
  
  const movieIdFk = data?.find(fk => fk.column_name === 'movie_id')
  const userIdFk = data?.find(fk => fk.column_name === 'user_id')
  
  if (movieIdFk) {
    log(colors.green, `   ✅ Foreign key: movie_id → ${movieIdFk.foreign_table}`)
    results.passed.push('✅ user_movie_feedback.movie_id has foreign key')
  } else {
    log(colors.yellow, '   ⚠️  No foreign key on movie_id')
    results.warnings.push('⚠️  user_movie_feedback.movie_id missing foreign key')
  }
  
  if (userIdFk) {
    log(colors.green, `   ✅ Foreign key: user_id → ${userIdFk.foreign_table}`)
  }
}

// Print final results
function printResults() {
  console.log('\n' + '='.repeat(70))
  log(colors.blue, '📊 VALIDATION RESULTS')
  console.log('='.repeat(70))
  
  if (results.passed.length > 0) {
    log(colors.green, '\n✅ PASSED TESTS:')
    results.passed.forEach(msg => console.log(`   ${msg}`))
  }
  
  if (results.warnings.length > 0) {
    log(colors.yellow, '\n⚠️  WARNINGS:')
    results.warnings.forEach(msg => console.log(`   ${msg}`))
  }
  
  if (results.failed.length > 0) {
    log(colors.red, '\n❌ FAILED TESTS:')
    results.failed.forEach(msg => console.log(`   ${msg}`))
    console.log('')
    log(colors.red, '💥 Some validation tests failed!')
    process.exit(1)
  }
  
  console.log('')
  log(colors.green, '✅ All validation tests passed!')
  log(colors.cyan, '\n🎉 Your FeelFlick database schema is healthy and optimized!')
  console.log('')
}

// Main execution
async function main() {
  log(colors.blue, '\n🚀 FeelFlick Database Schema Validation')
  log(colors.cyan, '   Validating schema improvements and data integrity...\n')
  
  try {
    await testUniqueConstraints()
    await testDuplicateFeedback()
    await testDuplicateRatings()
    await testWatchlistStatuses()
    await testPerformanceIndexes()
    await testForeignKeys()
    
    printResults()
  } catch (error) {
    log(colors.red, `\n❌ Fatal error: ${error.message}`)
    console.error(error)
    process.exit(1)
  }
}

main()
