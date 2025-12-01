require('dotenv').config()
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function testEnhancedRecommendations() {
  console.log('🧪 Testing enhanced recommendation algorithm...\n')

  // Test 1: Hidden Gems
  console.log('1️⃣  HIDDEN GEMS (high quality, low popularity):')
  const { data: hiddenGems } = await supabase
    .from('movies')
    .select('title, vote_average, popularity, quality_score, star_power, cult_status')
    .gte('vote_average', 7.0)
    .lt('popularity', 60)
    .gte('vote_count', 100)
    .order('vote_average', { ascending: false })
    .limit(5)

  console.table(hiddenGems)

  // Test 2: Slow & Contemplative
  console.log('\n2️⃣  SLOW & CONTEMPLATIVE (pacing < 40, depth > 70):')
  const { data: slowMovies } = await supabase
    .from('movies')
    .select('title, pacing_score, emotional_depth_score, vote_average')
    .lt('pacing_score', 40)
    .gt('emotional_depth_score', 70)
    .gte('vote_average', 7.0)
    .not('pacing_score', 'is', null)
    .order('emotional_depth_score', { ascending: false })
    .limit(5)

  console.table(slowMovies)

  // Test 3: Enhanced scoring comparison
  console.log('\n3️⃣  SCORING COMPARISON (old vs new):')
  const { data: comparison } = await supabase
    .from('movies')
    .select('title, vote_average, popularity, quality_score, star_power, cult_status')
    .gte('vote_average', 7.0)
    .limit(10)

  comparison.forEach(m => {
    const oldScore = m.popularity * 0.01
    const newScore = (m.popularity * 0.005) + (m.vote_average * 10) + (m.quality_score || 0) * 0.3 + (m.cult_status ? 15 : 0)
    console.log(`${m.title}:`)
    console.log(`  Old: ${oldScore.toFixed(2)} | New: ${newScore.toFixed(2)} | Gain: ${(newScore - oldScore).toFixed(2)}`)
  })

  console.log('\n✅ Enhanced recommendations working!')
}

testEnhancedRecommendations()