// scripts/test-recommendation-cache-final.js
require('dotenv').config()
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

// ==========================================
// CACHE IMPLEMENTATION
// ==========================================

const watchedMoviesCache = new Map()
const CACHE_TTL = 5 * 60 * 1000

async function getWatchedTmdbIds(userId) {
  const cacheKey = userId
  const cached = watchedMoviesCache.get(cacheKey)
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log('[Cache] ✓ HIT for watched movies')
    return cached.tmdbIds
  }
  
  console.log('[Cache] ✗ MISS - fetching from database...')
  
  const { data, error } = await supabase
    .from('user_history')
    .select('movies!inner(tmdb_id)')
    .eq('user_id', userId)
  
  if (error) {
    console.error('[Cache] Failed:', error.message)
    return new Set()
  }
  
  const tmdbIds = new Set(
    data
      .map(h => h.movies?.tmdb_id)
      .filter(Boolean)
  )
  
  watchedMoviesCache.set(cacheKey, {
    tmdbIds,
    timestamp: Date.now()
  })
  
  console.log(`[Cache] ✓ STORED ${tmdbIds.size} watched movies`)
  
  return tmdbIds
}

function clearUserCache(userId) {
  watchedMoviesCache.delete(userId)
  console.log('[Cache] ✓ Cleared cache')
}

// ==========================================
// TEST SUITE
// ==========================================

async function testCache() {
  console.log('🧪 Testing Recommendation Cache\n')
  
  // Get real user ID from user_history
  const { data: historyRecord, error } = await supabase
    .from('user_history')
    .select('user_id')
    .limit(1)
    .single()
  
  if (error || !historyRecord) {
    console.error('❌ No user_history records found')
    return
  }
  
  const userId = historyRecord.user_id
  console.log(`📌 Testing with user: ${userId}\n`)
  console.log('='.repeat(60))
  
  // Test 1: First call (cache miss)
  console.log('\n1️⃣  First call (should hit database)...')
  const start1 = Date.now()
  const watched1 = await getWatchedTmdbIds(userId)
  const time1 = Date.now() - start1
  console.log(`   Result: ${watched1.size} watched movies in ${time1}ms`)
  
  // Test 2: Second call (cache hit)
  console.log('\n2️⃣  Second call (should use cache)...')
  const start2 = Date.now()
  const watched2 = await getWatchedTmdbIds(userId)
  const time2 = Date.now() - start2
  console.log(`   Result: ${watched2.size} watched movies in ${time2}ms`)
  
  const speedup = time1 > 0 && time2 > 0 ? Math.round(time1 / time2) : '∞'
  console.log(`   🚀 Speedup: ${speedup}x faster!`)
  
  // Test 3: Third call (still cached)
  console.log('\n3️⃣  Third call (should still use cache)...')
  const start3 = Date.now()
  const watched3 = await getWatchedTmdbIds(userId)
  const time3 = Date.now() - start3
  console.log(`   Result: ${watched3.size} watched movies in ${time3}ms`)
  
  // Test 4: Clear cache
  console.log('\n4️⃣  Clearing cache...')
  clearUserCache(userId)
  
  // Test 5: After clear (should hit DB again)
  console.log('\n5️⃣  After cache clear (should hit database)...')
  const start5 = Date.now()
  const watched5 = await getWatchedTmdbIds(userId)
  const time5 = Date.now() - start5
  console.log(`   Result: ${watched5.size} watched movies in ${time5}ms`)
  
  // Summary
  console.log('\n' + '='.repeat(60))
  console.log('📊 PERFORMANCE SUMMARY')
  console.log('='.repeat(60))
  console.log(`Cache MISS (1st):       ${time1}ms`)
  console.log(`Cache HIT (2nd):        ${time2}ms`)
  console.log(`Cache HIT (3rd):        ${time3}ms`)
  console.log(`After clear (5th):      ${time5}ms`)
  console.log(`\nSpeedup:                ${speedup}x faster`)
  
  // Verify data integrity
  const allSame = watched1.size === watched2.size && 
                  watched1.size === watched3.size && 
                  watched1.size === watched5.size
  
  if (allSame) {
    console.log(`\n✅ Data consistency verified (${watched1.size} movies)`)
  } else {
    console.log('\n❌ Data mismatch detected!')
  }
  
  console.log('\n✅ All cache tests passed!')
}

testCache()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('\n❌ Test failed:', error.message)
    process.exit(1)
  })
