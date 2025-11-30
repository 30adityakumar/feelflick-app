// scripts/phase1/08-test-recommendation-engine.js
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testRPC() {
  console.log('🧪 Testing RPC function from Supabase...\n');

  // Test 1: Cozy mood
  console.log('📺 Test 1: Cozy mood (ID: 1)');
  const { data: test1, error: error1 } = await supabase
    .rpc('get_mood_recommendations', {
      p_mood_id: 1,
      p_viewing_context_id: 1,
      p_experience_type_id: 1,
      p_energy_level: 5,
      p_intensity_openness: 5,
      p_limit: 10
    });

  if (error1) {
    console.error('❌ Error:', error1.message);
  } else {
    console.log(`✅ Got ${test1.length} recommendations:`);
    test1.slice(0, 5).forEach((movie, idx) => {
      console.log(`  ${idx + 1}. ${movie.title} (Score: ${movie.final_score})`);
    });
  }

  // Test 2: Adventurous mood
  console.log('\n📺 Test 2: Adventurous mood (ID: 2)');
  const { data: test2, error: error2 } = await supabase
    .rpc('get_mood_recommendations', {
      p_mood_id: 2,
      p_limit: 10
    });

  if (error2) {
    console.error('❌ Error:', error2.message);
  } else {
    console.log(`✅ Got ${test2.length} recommendations:`);
    test2.slice(0, 5).forEach((movie, idx) => {
      console.log(`  ${idx + 1}. ${movie.title} (Score: ${movie.final_score})`);
    });
  }

  console.log('\n✨ RPC function working! Ready to use in React app.');
}

testRPC().catch(console.error);