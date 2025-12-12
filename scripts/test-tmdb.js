require('dotenv').config();
const tmdbClient = require('./utils/tmdb-client');

async function testTMDB() {
  console.log('Testing TMDB API...\n');
  
  try {
    // Test 1: Get trending movies
    console.log('1. Fetching trending movies...');
    const trending = await tmdbClient.getTrending('week', 1);
    console.log(`   ✅ Found ${trending.results.length} trending movies`);
    console.log(`   Top movie: ${trending.results[0].title}`);
    
    // Test 2: Get specific movie details
    console.log('\n2. Fetching movie details (The Shawshank Redemption - ID: 278)...');
    const movie = await tmdbClient.getMovie(278);
    console.log(`   ✅ Title: ${movie.title}`);
    console.log(`   Rating: ${movie.vote_average}/10 (${movie.vote_count} votes)`);
    console.log(`   Runtime: ${movie.runtime} minutes`);
    
    // Test 3: Search for a movie
    console.log('\n3. Searching for "Inception"...');
    const searchResults = await tmdbClient.searchMovies('Inception');
    console.log(`   ✅ Found ${searchResults.results.length} results`);
    console.log(`   First result: ${searchResults.results[0].title} (${searchResults.results[0].release_date})`);
    
    console.log(`\n✅ All TMDB tests passed!`);
    console.log(`Total API calls made: ${tmdbClient.getRequestCount()}`);
    
  } catch (error) {
    console.error('\n❌ TMDB test failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

testTMDB();
