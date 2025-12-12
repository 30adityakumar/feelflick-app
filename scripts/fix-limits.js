require('dotenv').config();
const fs = require('fs');

console.log('\n🔧 FIXING HARDCODED LIMITS IN PIPELINE SCRIPTS\n');

const files = [
  'scripts/pipeline/08-generate-embeddings.js',
  'scripts/pipeline/09-calculate-mood-scores.js'
];

for (const file of files) {
  try {
    let content = fs.readFileSync(file, 'utf8');
    const originalContent = content;
    
    // Replace limit(5000) with limit(10000)
    content = content.replace(/\.limit\(5000\)/g, '.limit(10000)');
    
    // Replace maxMovies: 5000 with maxMovies: 10000
    content = content.replace(/maxMovies:\s*5000/g, 'maxMovies: 10000');
    
    // Replace const MAX = 5000 with const MAX = 10000
    content = content.replace(/const\s+MAX[A-Z_]*\s*=\s*5000/g, 'const MAX = 10000');
    
    if (content !== originalContent) {
      fs.writeFileSync(file, content, 'utf8');
      console.log(`✅ Fixed: ${file}`);
    } else {
      console.log(`⚠️  No changes needed: ${file}`);
    }
  } catch (error) {
    console.error(`❌ Error with ${file}:`, error.message);
  }
}

console.log('\n✅ Done! Now run the pipeline again.\n');
