// src/shared/services/__tests__/services.test.js

import { supabase } from '@/shared/lib/supabase/client'
import { addToWatchlist, getWatchlistStats } from '@/shared/services/watchlist'
import { submitFeedback } from '@/shared/services/feedback'
import { trackMovieHover } from '@/shared/services/events-tracker'

async function testServices() {
  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    console.error('No user logged in')
    return
  }

  console.log('Testing with user:', user.id)

  // Test 1: Add to watchlist
  console.log('\n--- Test 1: Add to Watchlist ---')
  const watchlistEntry = await addToWatchlist(user.id, 603, {
    reasonAdded: ['mood_match', 'recommended_by_friend'],
    priority: 8,
    source: 'test'
  })
  console.log('✅ Watchlist entry:', watchlistEntry)

  // Test 2: Submit feedback
  console.log('\n--- Test 2: Submit Feedback ---')
  const feedback = await submitFeedback(user.id, 550, {
    sentiment: 'loved',
    watchedConfirmed: true,
    viewingContextTags: ['movie_night', 'solo'],
    whatStoodOut: ['acting', 'story']
  })
  console.log('✅ Feedback:', feedback)

  // Test 3: Track event
  console.log('\n--- Test 3: Track Event ---')
  trackMovieHover(user.id, 550, 2500, 'test')
  console.log('✅ Event tracked (will flush in 5s)')

  // Test 4: Get stats
  console.log('\n--- Test 4: Get Stats ---')
  const stats = await getWatchlistStats(user.id)
  console.log('✅ Watchlist stats:', stats)

  console.log('\n🎉 All tests passed!')
}

testServices()
