// validate-scores.js
// Validates calculated scores against expected values for known movies
// Run with: node validate-scores.js

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Test cases: movies with known characteristics
const TEST_CASES = [
  {
    title: 'The Man from Earth',
    expected: {
      pacing_score: { min: 30, max: 45, reason: 'Slow, one-location dialogue' },
      intensity_score: { min: 35, max: 55, reason: 'Moderate, debate creates tension' },
      emotional_depth_score: { min: 85, max: 100, reason: 'Extremely philosophical' },
      dialogue_density: { min: 85, max: 100, reason: 'Almost 100% dialogue' },
      star_power: 'no_stars'
    }
  },
  {
    title: 'Mad Max: Fury Road',
    expected: {
      pacing_score: { min: 90, max: 100, reason: 'Nonstop action' },
      intensity_score: { min: 85, max: 100, reason: 'Extremely intense violence' },
      emotional_depth_score: { min: 15, max: 35, reason: 'Action spectacle' },
      dialogue_density: { min: 10, max: 25, reason: 'Minimal dialogue' }
    }
  },
  {
    title: '12 Angry Men',
    expected: {
      pacing_score: { min: 35, max: 50, reason: 'Slow burn, single location' },
      intensity_score: { min: 40, max: 60, reason: 'Tension but not violent' },
      emotional_depth_score: { min: 80, max: 95, reason: 'Deep character study' },
      dialogue_density: { min: 90, max: 100, reason: 'All dialogue, no action' }
    }
  },
  {
    title: 'Inception',
    expected: {
      pacing_score: { min: 70, max: 85, reason: 'Fast but complex' },
      intensity_score: { min: 70, max: 85, reason: 'High-stakes action' },
      emotional_depth_score: { min: 60, max: 75, reason: 'Philosophical but spectacle' },
      star_power: 'mega_stars'
    }
  },
  {
    title: 'Primer',
    expected: {
      pacing_score: { min: 35, max: 50, reason: 'Slow, cerebral' },
      emotional_depth_score: { min: 75, max: 90, reason: 'Complex, thought-provoking' },
      star_power: 'no_stars',
      cult_status: true
    }
  },
  {
    title: 'Paddington',
    expected: {
      pacing_score: { min: 50, max: 70, reason: 'Family-friendly pace' },
      intensity_score: { min: 10, max: 30, reason: 'Very light, wholesome' },
      emotional_depth_score: { min: 40, max: 60, reason: 'Heartwarming but simple' }
    }
  },
  {
    title: 'Coherence',
    expected: {
      pacing_score: { min: 40, max: 60, reason: 'Slow build, cerebral' },
      intensity_score: { min: 50, max: 70, reason: 'Psychological tension' },
      emotional_depth_score: { min: 70, max: 85, reason: 'Mind-bending concepts' },
      dialogue_density: { min: 70, max: 90, reason: 'Dialogue-driven mystery' },
      star_power: 'no_stars',
      cult_status: true
    }
  },
  {
    title: 'The Avengers',
    expected: {
      pacing_score: { min: 75, max: 90, reason: 'Fast action sequences' },
      intensity_score: { min: 60, max: 80, reason: 'High stakes but PG-13' },
      emotional_depth_score: { min: 25, max: 45, reason: 'Popcorn entertainment' },
      star_power: 'mega_stars'
    }
  }
];

/**
 * Check if value is within expected range
 */
function isWithinRange(actual, expected) {
  if (actual === null || actual === undefined) return false;
  return actual >= expected.min && actual <= expected.max;
}

/**
 * Validate a single movie's scores
 */
async function validateMovie(testCase) {
  const { data: movie, error } = await supabase
    .from('movies')
    .select('*')
    .ilike('title', testCase.title)
    .single();

  if (error || !movie) {
    return {
      title: testCase.title,
      status: 'NOT_FOUND',
      message: 'Movie not in database'
    };
  }

  const results = {
    title: movie.title,
    status: 'PASS',
    scores: {},
    issues: []
  };

  // Check each expected score
  for (const [scoreType, expected] of Object.entries(testCase.expected)) {
    const actual = movie[scoreType];

    if (scoreType === 'star_power' || scoreType === 'cult_status') {
      // Direct comparison
      const matches = actual === expected;
      results.scores[scoreType] = {
        actual,
        expected,
        pass: matches
      };
      if (!matches) {
        results.status = 'FAIL';
        results.issues.push(`${scoreType}: expected ${expected}, got ${actual}`);
      }
    } else {
      // Range comparison
      const pass = isWithinRange(actual, expected);
      results.scores[scoreType] = {
        actual,
        expected: `${expected.min}-${expected.max}`,
        reason: expected.reason,
        pass
      };
      if (!pass) {
        results.status = 'FAIL';
        results.issues.push(
          `${scoreType}: expected ${expected.min}-${expected.max}, got ${actual} (${expected.reason})`
        );
      }
    }
  }

  return results;
}

/**
 * Run validation on all test cases
 */
async function runValidation() {
  console.log('🧪 Validating calculated scores against known movies...\n');
  console.log(`Testing ${TEST_CASES.length} movies with expected characteristics\n`);

  const results = [];
  
  for (const testCase of TEST_CASES) {
    const result = await validateMovie(testCase);
    results.push(result);
    
    // Print individual result
    const statusEmoji = result.status === 'PASS' ? '✅' : result.status === 'NOT_FOUND' ? '⚠️' : '❌';
    console.log(`${statusEmoji} ${result.title}: ${result.status}`);
    
    if (result.issues && result.issues.length > 0) {
      result.issues.forEach(issue => {
        console.log(`   ⚠️  ${issue}`);
      });
    }
    console.log('');
  }

  // Summary statistics
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const notFound = results.filter(r => r.status === 'NOT_FOUND').length;
  
  console.log('═'.repeat(60));
  console.log('📊 Validation Summary');
  console.log('═'.repeat(60));
  console.log(`Total test cases: ${TEST_CASES.length}`);
  console.log(`✅ Passed: ${passed} (${((passed / TEST_CASES.length) * 100).toFixed(1)}%)`);
  console.log(`❌ Failed: ${failed} (${((failed / TEST_CASES.length) * 100).toFixed(1)}%)`);
  console.log(`⚠️  Not found: ${notFound}`);
  console.log('═'.repeat(60));

  if (passed / TEST_CASES.length >= 0.8) {
    console.log('\n✨ Validation PASSED! Scores are reasonably accurate (≥80%)');
    console.log('You can proceed with confidence.');
  } else if (passed / TEST_CASES.length >= 0.6) {
    console.log('\n⚠️  Validation MARGINAL (60-79% pass rate)');
    console.log('Consider adjusting algorithm weights in calculate-content-scores.js');
    console.log('Focus on the failed cases above to identify patterns.');
  } else {
    console.log('\n❌ Validation FAILED (<60% pass rate)');
    console.log('Algorithm needs significant tuning.');
    console.log('Review failed cases and adjust weights in calculate-content-scores.js');
  }

  // Detailed breakdown by score type
  console.log('\n📈 Accuracy by Score Type:');
  const scoreTypes = ['pacing_score', 'intensity_score', 'emotional_depth_score', 'dialogue_density'];
  
  for (const scoreType of scoreTypes) {
    const relevantTests = results.filter(r => r.scores[scoreType]);
    if (relevantTests.length === 0) continue;
    
    const passedForType = relevantTests.filter(r => r.scores[scoreType].pass).length;
    const accuracy = (passedForType / relevantTests.length * 100).toFixed(1);
    
    console.log(`   ${scoreType}: ${passedForType}/${relevantTests.length} (${accuracy}%)`);
  }

  // Examples for manual review
  console.log('\n🔍 Sample Movies for Manual Review:');
  const sampleMovies = results.filter(r => r.status !== 'NOT_FOUND').slice(0, 3);
  
  for (const sample of sampleMovies) {
    console.log(`\n${sample.title}:`);
    for (const [scoreType, scoreData] of Object.entries(sample.scores)) {
      if (typeof scoreData.actual === 'number') {
        console.log(`   ${scoreType}: ${scoreData.actual} (expected ${scoreData.expected})`);
      } else {
        console.log(`   ${scoreType}: ${scoreData.actual} (expected ${scoreData.expected})`);
      }
    }
  }

  console.log('\n💡 Next Steps:');
  if (failed > 0) {
    console.log('1. Review failed cases above');
    console.log('2. Adjust weights in calculate-content-scores.js');
    console.log('3. Re-run: node calculate-content-scores.js');
    console.log('4. Re-run this validation: node validate-scores.js');
  } else {
    console.log('1. Proceed with frontend integration');
    console.log('2. Deploy new algorithm to 50% of users (A/B test)');
    console.log('3. Monitor engagement metrics');
  }
}

// Run validation
if (require.main === module) {
  runValidation()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('\n❌ Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { validateMovie, runValidation };