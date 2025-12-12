require('dotenv').config();
const { supabase } = require('./utils/supabase');

async function checkStatus() {
  const { data, error } = await supabase
    .from('movies')
    .select('status')
    .order('status');
  
  if (error) throw error;
  
  const counts = {};
  data.forEach(m => {
    counts[m.status] = (counts[m.status] || 0) + 1;
  });
  
  console.log('\n📊 Current Movie Status:\n');
  Object.entries(counts).forEach(([status, count]) => {
    const bar = '█'.repeat(Math.floor(count / 10));
    console.log(`${status.padEnd(15)} ${count.toString().padStart(4)} ${bar}`);
  });
  console.log('\n');
}

checkStatus();
