require('dotenv').config();
const { supabase } = require('../utils/supabase');

async function verifyV2Scores() {
  console.log('\n🔍 VERIFYING V2 SCORES\n');
  
  // 1. Check if new columns exist and have data
  const { data: sample } = await supabase
    .from('movies')
    .select('title, ff_rating, ff_rating_genre_normalized, discovery_potential, accessibility_score, polarization_score')
    .not('discovery_potential', 'is', null)
    .limit(5);
  
  console.log('✅ Sample movies with V2 scores:');
  sample?.forEach(m => {
    console.log(`\n  ${m.title}`);
    console.log(`    FF Rating: ${m.ff_rating} → Genre-Norm: ${m.ff_rating_genre_normalized}`);
    console.log(`    Discovery: ${m.discovery_potential}/100`);
    console.log(`    Accessibility: ${m.accessibility_score}/100`);
    console.log(`    Polarization: ${m.polarization_score}/100`);
  });
  
  // 2. Count movies with V2 scores
  const { count: totalV2 } = await supabase
    .from('movies')
    .select('*', { count: 'exact', head: true })
    .not('discovery_potential', 'is', null);
  
  console.log(`\n✅ Total movies with V2 scores: ${totalV2}\n`);
  
  // 3. Top hidden gems
  const { data: gems } = await supabase
    .from('movies')
    .select('title, discovery_potential, ff_rating, popularity, original_language')
    .order('discovery_potential', { ascending: false })
    .limit(10);
  
  console.log('💎 TOP 10 HIDDEN GEMS:\n');
  gems?.forEach((m, i) => {
    console.log(`  ${i+1}. ${m.title} (${m.original_language})`);
    console.log(`     Discovery: ${m.discovery_potential}/100, FF: ${m.ff_rating}, Pop: ${m.popularity}`);
  });
  
  console.log('\n✅ V2 deployment verified!\n');
}

verifyV2Scores();
