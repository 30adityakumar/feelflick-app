const { supabase } = require('../utils/supabase');

async function checkHealth() {
  console.log('🏥 PIPELINE HEALTH CHECK\n');
  
  // Total movies
  const { count: total } = await supabase.from('movies').select('*', { count: 'exact', head: true });
  console.log(`📽️  Total movies: ${total}\n`);
  
  // Missing data breakdown
  const checks = [
    ['🎬 Missing titles', 'title.is.null'],
    ['📅 Missing release dates', 'release_date.is.null'],
    ['📝 Missing overviews', 'overview.is.null'],
    ['🖼️  Missing posters', 'poster_path.is.null'],
    ['⭐ Missing scores', 'ff_rating.is.null'],
    ['🧠 Missing embeddings', 'has_embeddings.eq.false'],
    ['👥 Missing cast', 'has_cast_metadata.eq.false'],
    ['🏷️  Missing keywords', 'has_keywords.eq.false'],
    ['📊 Missing mood scores', 'pacing_score.is.null']
  ];
  
  for (const [label, filter] of checks) {
    const { count } = await supabase.from('movies').select('*', { count: 'exact', head: true }).or(filter);
    console.log(`${label}: ${count}`);
  }
  
  // Status breakdown
  console.log('\n📈 STATUS BREAKDOWN:');
  const { data: statuses } = await supabase.from('movies').select('status').not('status', 'is', null);
  const statusCounts = {};
  statuses.forEach(s => statusCounts[s.status] = (statusCounts[s.status] || 0) + 1);
  Object.entries(statusCounts).forEach(([status, count]) => {
    console.log(`  ${status}: ${count}`);
  });
}

checkHealth().then(() => process.exit(0));
