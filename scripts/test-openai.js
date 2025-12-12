require('dotenv').config();
const openaiClient = require('./utils/openai-client');

async function testOpenAI() {
  console.log('Testing OpenAI API...\n');
  
  try {
    // Test: Generate embedding for a sample movie
    console.log('1. Generating embedding for sample text...');
    
    const sampleText = "An epic sci-fi thriller about dreams within dreams. " +
                       "Action-packed with mind-bending plot twists.";
    
    console.log(`   Text: "${sampleText}"`);
    console.log('   Generating...');
    
    const embedding = await openaiClient.generateEmbedding(sampleText);
    
    console.log(`   ✅ Embedding generated!`);
    console.log(`      Dimensions: ${embedding.length}`);
    console.log(`      First 5 values: [${embedding.slice(0, 5).map(v => v.toFixed(4)).join(', ')}...]`);
    
    // Check cost
    console.log('\n2. Checking API usage...');
    console.log(`   ✅ Requests made: ${openaiClient.getRequestCount()}`);
    console.log(`   Cost so far: $${openaiClient.getTotalCost()}`);
    
    console.log('\n✅ All OpenAI tests passed!');
    
  } catch (error) {
    console.error('\n❌ OpenAI test failed:', error.message);
    console.error('   This might be due to:');
    console.error('   - Invalid API key');
    console.error('   - Insufficient credits');
    console.error('   - Network issues');
    process.exit(1);
  }
}

testOpenAI();
