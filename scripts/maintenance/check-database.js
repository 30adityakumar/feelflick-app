// scripts/check-database.js
require('dotenv').config()
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

async function checkDatabase() {
  console.log('🔍 Checking Database Connection\n')
  
  console.log('Environment:')
  console.log(`  SUPABASE_URL: ${process.env.VITE_SUPABASE_URL ? '✓ Set' : '✗ Missing'}`)
  console.log(`  SUPABASE_KEY: ${process.env.VITE_SUPABASE_ANON_KEY ? '✓ Set' : '✗ Missing'}`)
  console.log('')
  
  // Test 1: Check users table
  console.log('1️⃣  Checking users table...')
  const { data: users, error: usersError, count: usersCount } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: false })
    .limit(5)
  
  if (usersError) {
    console.error('   ❌ Error:', usersError.message)
  } else {
    console.log(`   ✓ Found ${users?.length || 0} users`)
    if (users && users.length > 0) {
      console.log(`   First user ID: ${users[0].id}`)
    }
  }
  console.log('')
  
  // Test 2: Check movies table
  console.log('2️⃣  Checking movies table...')
  const { data: movies, error: moviesError } = await supabase
    .from('movies')
    .select('id, title')
    .limit(3)
  
  if (moviesError) {
    console.error('   ❌ Error:', moviesError.message)
  } else {
    console.log(`   ✓ Found ${movies?.length || 0} movies`)
    if (movies && movies.length > 0) {
      movies.forEach(m => console.log(`   - ${m.title}`))
    }
  }
  console.log('')
  
  // Test 3: Check user_history table
  console.log('3️⃣  Checking user_history table...')
  const { data: history, error: historyError } = await supabase
    .from('user_history')
    .select('user_id, movie_id')
    .limit(5)
  
  if (historyError) {
    console.error('   ❌ Error:', historyError.message)
  } else {
    console.log(`   ✓ Found ${history?.length || 0} history records`)
  }
  console.log('')
  
  // Test 4: Check auth.users (if accessible)
  console.log('4️⃣  Checking auth.users...')
  const { data: { users: authUsers }, error: authError } = await supabase.auth.admin.listUsers()
  
  if (authError) {
    console.log('   ⚠️  Cannot access auth.users (need service role key)')
    console.log('   This is normal with anon key')
  } else {
    console.log(`   ✓ Found ${authUsers?.length || 0} auth users`)
  }
  
  console.log('\n' + '='.repeat(60))
  console.log('📊 SUMMARY')
  console.log('='.repeat(60))
  
  if (users && users.length > 0) {
    console.log('✅ Database connection working!')
    console.log(`✅ Found ${users.length} users`)
    console.log('\n🚀 You can run the cache test with:')
    console.log('   node scripts/test-recommendation-cache-simple.js')
  } else {
    console.log('⚠️  Database connected but no users found')
    console.log('\nPossible reasons:')
    console.log('1. Users table is empty (need to sign up via app)')
    console.log('2. RLS policies blocking access')
    console.log('3. Wrong database/project selected')
    console.log('\n💡 Try creating a test user first')
  }
}

checkDatabase()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ Fatal error:', err.message)
    process.exit(1)
  })
