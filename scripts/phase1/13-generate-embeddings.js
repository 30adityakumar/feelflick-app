// scripts/phase1/13-generate-embeddings.js
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function generateEmbedding(text) {
  try {
    const response = await axios.post(
      'https://api.openai.com/v1/embeddings',
      {
        model: 'text-embedding-3-small',
        input: text
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error.message);
    return null;
  }
}

async function generateMovieEmbeddings() {
  console.log('🧠 Generating embeddings for movies...\n');
  console.log('⚠️  This will use OpenAI API credits (~$0.50 for 2,600 movies)\n');

  // Get movies without embeddings
  const { data: movies, error } = await supabase
    .from('movies')
    .select('id, title, overview, genres:movie_genres(genre_id)')
    .is('embedding', null)
    .limit(2600); // Start with 100 for testing

  if (error) {
    console.error('❌ Error fetching movies:', error.message);
    return;
  }

  console.log(`Found ${movies.length} movies to process\n`);

  let processed = 0;

  for (const movie of movies) {
    // Create rich text for embedding
    const text = `${movie.title}. ${movie.overview || ''}`;

    const embedding = await generateEmbedding(text);

    if (embedding) {
      const { error: updateError } = await supabase
        .from('movies')
        .update({ embedding })
        .eq('id', movie.id);

      if (updateError) {
        console.error(`❌ Error updating ${movie.title}:`, updateError.message);
      } else {
        processed++;
        if (processed % 10 === 0) {
          console.log(`✅ Processed ${processed}/${movies.length}...`);
        }
      }
    }

    await delay(100); // Rate limiting (10 req/sec max)
  }

  console.log(`\n✨ Complete! Generated ${processed} embeddings`);
  console.log('\nTo process all movies, increase limit in script and run again.');
}

generateMovieEmbeddings().catch(console.error);