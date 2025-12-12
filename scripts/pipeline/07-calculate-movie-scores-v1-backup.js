// scripts/pipeline/07-calculate-movie-scores-v2-integrated.js

require('dotenv').config();
const Logger = require('../utils/logger');
const { supabase, updateMovie } = require('../utils/supabase');

const logger = new Logger('07-calculate-movie-scores.log');

// [PASTE ENTIRE V2 CODE HERE - all the CONFIG, GENRE_STATS, KEYWORD_MODIFIERS, etc.]

// MODIFY the fetchAllMovieData() function to use logger:
async function fetchAllMovieData() {
  logger.info('📦 Fetching all movie data...\n');
  
  try {
    // ... existing fetch logic ...
    
    logger.info(`✅ ${movies.length} valid movies`);
    logger.info(`✅ ${genreMap.size} movies with genres`);
    logger.info(`✅ ${ratingsMap.size} movies with external ratings\n`);
    
    return { movies, genreMap, ratingsMap };
  } catch (error) {
    logger.error('❌ Error fetching data:', error.message);
    throw error;
  }
}

// MODIFY the calculateMovieScores() main function to use logger and integrate with pipeline:
async function calculateMovieScores() {
  logger.section('🎬 FeelFlick Movie Scoring Engine V2');
  logger.info('='.repeat(70));
  logger.info('\n');
  
  const startTime = Date.now();
  
  try {
    const { movies, genreMap, ratingsMap } = await fetchAllMovieData();
    
    if (movies.length === 0) {
      logger.info('⚠️ No valid movies found to score');
      return;
    }

    let updated = 0;
    let errors = 0;
    const updates = [];

    logger.info('🧮 Calculating scores...\n');

    for (let i = 0; i < movies.length; i++) {
      const movie = movies[i];
      
      try {
        // [KEEP ALL YOUR V2 CALCULATION LOGIC]
        
        // Build update object with V2 fields
        const updateData = {
          // Core ratings
          ff_rating: ffResult.rating,
          ff_confidence: ffResult.confidence,
          ff_rating_genre_normalized: genreNormalizedRating,
          
          // Mood dimensions
          pacing_score: moodScores.pacing,
          intensity_score: moodScores.intensity,
          emotional_depth_score: moodScores.emotional_depth,
          dialogue_density: moodScores.dialogue_density,
          attention_demand: moodScores.attention_demand,
          
          // Quality metrics
          quality_score: qualityScore,
          vfx_level_score: vfxLevel,
          cult_status_score: cultStatus,
          starpower_score: starpower,
          
          // NEW V2 scores
          polarization_score: polarization,
          discovery_potential: discoveryPotential,
          accessibility_score: accessibility,
          
          // Legacy enum fields
          vfx_level: vfxEnum,
          star_power: starpowerEnum,
          cult_status: cultStatus >= 50,
          
          // Metadata
          has_scores: true,
          last_scored_at: new Date().toISOString()
        };
        
        // Use pipeline's updateMovie function
        await updateMovie(movie.id, updateData);
        updated++;
        
        // Log progress
        if (updated % 100 === 0) {
          const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
          const rate = (updated / (Date.now() - startTime) * 1000).toFixed(1);
          const pct = ((updated / movies.length) * 100).toFixed(1);
          logger.info(` ✓ ${updated.toLocaleString()}/${movies.length.toLocaleString()} (${pct}%) • ${rate} movies/sec • ${elapsed}s elapsed`);
        }
        
      } catch (error) {
        logger.error(`❌ Error scoring movie ${movie.id} (${movie.title}):`, error.message);
        errors++;
      }
    }

    const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
    const avgRate = (updated / (Date.now() - startTime) * 1000).toFixed(1);

    logger.section('📊 SUMMARY');
    logger.info(`Total movies processed: ${movies.length.toLocaleString()}`);
    logger.success(`✓ Successful: ${updated.toLocaleString()}`);
    if (errors > 0) {
      logger.error(`✗ Failed: ${errors}`);
    }
    logger.info(`Duration: ${totalTime}s`);
    logger.info(`Average: ${avgRate} movies/second`);
    
    logger.info(`\n🎯 V2 Scores calculated:`);
    logger.info(` ✓ ff_rating (0-10) - PURE quality`);
    logger.info(` ✓ ff_rating_genre_normalized (0-10) - NEW`);
    logger.info(` ✓ discovery_potential (0-100) - NEW`);
    logger.info(` ✓ accessibility_score (0-100) - NEW`);
    logger.info(` ✓ polarization_score (0-100) - NEW`);
    logger.info(` ✓ Enhanced mood scores with keywords`);
    logger.success('\n✅ Score calculation complete!');
    logger.info(`Log file: ${logger.getLogFilePath()}`);

  } catch (error) {
    logger.error('\n❌ Fatal error:', error.message);
    logger.error(error.stack);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  calculateMovieScores();
}

module.exports = { calculateMovieScores };
