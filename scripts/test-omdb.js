require('dotenv').config();
const omdbClient = require('./utils/omdb-client');

async function testOMDb() {
  console.log('Testing OMDb API...\n');
  
  try {
    // Test 1: Fetch by IMDb ID
    console.log('1. Fetching ratings for The Shawshank Redemption (tt0111161)...');
    const ratings = await omdbClient.getRatings('tt0111161');
    
    console.log('   ✅ Ratings received:');
    console.log(`      IMDb: ${ratings.imdb_rating}/10 (${ratings.imdb_votes} votes)`);
    console.log(`      Rotten Tomatoes: ${ratings.rotten_tomatoes || 'N/A'}`);
    console.log(`      Metacritic: ${ratings.metacritic || 'N/A'}`);
    
    // Test 2: Check quota
    console.log('\n2. Checking API quota...');
    console.log(`   ✅ Requests used today: ${omdbClient.getRequestCount()}`);
    console.log(`   Quota remaining: ${omdbClient.getQuotaRemaining()}/1000`);
    
    console.log('\n✅ All OMDb tests passed!');
    
  } catch (error) {
    console.error('\n❌ OMDb test failed:', error.message);
    process.exit(1);
  }
}

testOMDb();
