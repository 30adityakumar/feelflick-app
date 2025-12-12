// scripts/get-user-id.js
require('dotenv').config()
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

async function getUserId() {
  console.log('🔍 Finding a real user ID from user_history...\n')
  
  const { data, error } = await supabase
    .from('user_history')
    .select('user_id')
    .limit(1)
    .single()
  
  if (error) {
    console.error('❌ Error:', error.message)
    return
  }
  
  console.log('✅ Found user ID:', data.user_id)
  console.log('\nUse this ID for testing!\n')
  
  return data.user_id
}

getUserId().then(process.exit).catch(console.error)
