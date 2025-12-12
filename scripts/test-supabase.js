require('dotenv').config();
const { supabase } = require('./utils/supabase');

async function testSupabase() {
  console.log('Testing Supabase connection...\n');
  
  try {
    // Test 1: Check connection
    console.log('1. Testing connection...');
    const { data, error } = await supabase
      .from('movies')
      .select('count')
      .limit(1);
    
    if (error) throw error;
    console.log('   ✅ Connection successful!');
    
    // Test 2: Count movies
    console.log('\n2. Counting movies...');
    const { count, error: countError } = await supabase
      .from('movies')
      .select('*', { count: 'exact', head: true });
    
    if (countError) throw countError;
    console.log(`   ✅ Found ${count || 0} movies in database`);
    
    // Test 3: Count moods
    console.log('\n3. Counting moods...');
    const { data: moods, error: moodError } = await supabase
      .from('moods')
      .select('id, name, category');
    
    if (moodError) throw moodError;
    console.log(`   ✅ Found ${moods.length} moods`);
    moods.forEach(m => console.log(`      - ${m.name} (${m.category})`));
    
    console.log('\n✅ All Supabase tests passed!');
    
  } catch (error) {
    console.error('\n❌ Supabase test failed:', error.message);
    process.exit(1);
  }
}

testSupabase();
