#!/bin/bash
cd "$(dirname "$0")"
set -a
source .env 2>/dev/null
set +a

node << 'NODEJS'
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function quickCheck() {
  const { count: total } = await supabase
    .from('movies')
    .select('*', { count: 'exact', head: true });
  
  const { count: pending } = await supabase
    .from('movies')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending');
  
  const { count: noKeywords } = await supabase
    .from('movies')
    .select('*', { count: 'exact', head: true })
    .eq('has_keywords', false);
  
  console.log('📊 QUICK STATUS:');
  console.log(`Total movies: ${total}`);
  console.log(`Pending: ${pending}`);
  console.log(`Missing keywords: ${noKeywords}`);
}

quickCheck().then(() => process.exit(0));
NODEJS
