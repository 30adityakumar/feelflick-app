require('dotenv').config();
const { supabase } = require('../utils/supabase');

async function fixKeywordFlags() {
  console.log('\n🔧 FIXING KEYWORD FLAGS\n');
  
  // Get movies with has_keywords = false
  const { data: moviesNeedingFix } = await supabase
    .from('movies')
    .select('id, title')
    .eq('has_keywords', false);
  
  console.log(`Found ${moviesNeedingFix?.length || 0} movies with has_keywords = false\n`);
  
  if (!moviesNeedingFix || moviesNeedingFix.length === 0) {
    console.log('✅ No issues found!');
    return;
  }
  
  // Check which ones actually have keywords
  let fixed = 0;
  let noKeywords = 0;
  
  for (const movie of moviesNeedingFix) {
    const { count } = await supabase
      .from('movie_keywords')
      .select('*', { count: 'exact', head: true })
      .eq('movie_id', movie.id);
    
    if (count > 0) {
      // Has keywords, update flag
      await supabase
        .from('movies')
        .update({ has_keywords: true })
        .eq('id', movie.id);
      
      fixed++;
      if (fixed <= 10) console.log(`  ✅ Fixed: ${movie.title} (${count} keywords)`);
    } else {
      noKeywords++;
    }
  }
  
  console.log(`\n📊 Results:`);
  console.log(`  Fixed: ${fixed}`);
  console.log(`  Actually have no keywords: ${noKeywords}`);
}

fixKeywordFlags();
