require('dotenv').config();
const { supabase } = require('../utils/supabase');
const OpenAI = require('openai');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function generateAllMissingEmbeddings() {
  console.log('\n🤖 GENERATING ALL MISSING EMBEDDINGS\n');
  
  // Get ALL movies missing embeddings (no limit!)
  const { data: movies } = await supabase
    .from('movies')
    .select('id, title, overview, genres')
    .eq('status', 'complete')
    .is('embedding', null);
  
  console.log(`Found ${movies?.length || 0} movies needing embeddings\n`);
  
  if (!movies || movies.length === 0) {
    console.log('✅ All movies have embeddings!');
    return;
  }
  
  let completed = 0;
  let failed = 0;
  
  for (const movie of movies) {
    try {
      const text = `${movie.title}. ${movie.overview || ''}. Genres: ${JSON.stringify(movie.genres || [])}`;
      
      const response = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: text.substring(0, 8000)
      });
      
      const embedding = response.data[0].embedding;
      
      await supabase
        .from('movies')
        .update({
          embedding: `[${embedding.join(',')}]`,
          has_embeddings: true,
          last_embedding_at: new Date().toISOString()
        })
        .eq('id', movie.id);
      
      completed++;
      if (completed % 10 === 0) {
        console.log(`  Progress: ${completed}/${movies.length}`);
      }
      
      // Rate limit: ~500 req/min = 120ms between requests
      await new Promise(resolve => setTimeout(resolve, 150));
      
    } catch (error) {
      console.error(`  ❌ Failed: ${movie.title} - ${error.message}`);
      failed++;
    }
  }
  
  console.log(`\n✅ Completed: ${completed}`);
  console.log(`❌ Failed: ${failed}`);
}

generateAllMissingEmbeddings();
