// src/shared/services/recommendations.test.js
// src/shared/services/recommendations.test.js

import { 
  computeUserProfile, 
  getTopPickForUser, 
  getQuickPicksForUser 
} from './recommendations'

// Your test user from Query 3
const TEST_USER_ID = '63e23aa9-34eb-46cb-884d-9aed19438f96'

export async function testRecommendationEngine() {
  console.log('=== TESTING RECOMMENDATION ENGINE ===\n')

  // Test 1: User Profile
  console.log('1. Computing user profile...')
  const profile = await computeUserProfile(TEST_USER_ID)
  console.log('Profile:', profile)

  // Test 2: Hero Pick
  console.log('2. Getting hero top pick...')
  const heroPick = await getTopPickForUser(TEST_USER_ID)
  console.log('Hero Pick:', heroPick.movie?.title)
  console.log('Reason:', heroPick.pickReason?.label)
  console.log('Score:', heroPick.score)
  console.log('Debug:', heroPick.debug)

  // Test 3: Quick Picks
  console.log('3. Getting quick picks...')
  const quickPicks = await getQuickPicksForUser(TEST_USER_ID, { limit: 5 })
  console.log('Quick Picks:', quickPicks.map(m => `${m.title} (${m._score})`))

  console.log('=== TEST COMPLETE ===')
  
  return { profile, heroPick, quickPicks }
}

// Auto-run if in browser dev mode
if (typeof window !== 'undefined') {
  window.testRecs = testRecommendationEngine
}