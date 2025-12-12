// scripts/pipeline/09-calculate-mood-scores.js

const Logger = require('../utils/logger');
const { supabase } = require('../utils/supabase');

const logger = new Logger('09-calculate-mood-scores.log');

/**
 * Calculate compatibility score between a movie and a mood
 */
function calculateMoodScore(movie, mood) {
  let score = 50; // Base score
  let genreMatchScore = 0;
  let pacingMatchScore = 0;
  let intensityMatchScore = 0;

  // Genre match score (0-40 points)
  if (movie.primary_genre && mood.preferred_genres) {
    const preferredGenres = Array.isArray(mood.preferred_genres) ? mood.preferred_genres : [];
    if (preferredGenres.includes(movie.primary_genre)) {
      genreMatchScore = 40;
    } else if (preferredGenres.length > 0) {
      // Check all movie genres
      try {
        const movieGenres = typeof movie.genres === 'string' ? JSON.parse(movie.genres) : (movie.genres || []);
        const hasMatch = Array.isArray(movieGenres) && movieGenres.some(g => preferredGenres.includes(g));
        if (hasMatch) genreMatchScore = 25;
      } catch (e) {
        // Ignore parse errors
      }
    }
  }

  // Pacing match score (0-30 points)
  if (movie.pacing_score != null && mood.pacing_preference != null) {
    const difference = Math.abs(movie.pacing_score - mood.pacing_preference);
    // Perfect match = 30 points, decreases with difference
    pacingMatchScore = Math.max(0, 30 - (difference / 100) * 30);
  }

  // Intensity match score (0-30 points)
  if (movie.intensity_score != null && mood.intensity_level != null) {
    // Mood intensity_level is 1-10, convert to 0-100
    const moodIntensity = mood.intensity_level * 10;
    const difference = Math.abs(movie.intensity_score - moodIntensity);
    intensityMatchScore = Math.max(0, 30 - (difference / 100) * 30);
  }

  // Total score
  score = genreMatchScore + pacingMatchScore + intensityMatchScore;

  // Quality bonus (up to +20 points)
  if (movie.quality_score) {
    const qualityBonus = (movie.quality_score / 100) * 20;
    score += qualityBonus;
  }

  // Clamp to 0-100
  score = Math.max(0, Math.min(100, score));

  return {
    score: Math.round(score * 100) / 100, // Round to 2 decimals
    genreMatchScore: Math.round(genreMatchScore * 100) / 100,
    pacingMatchScore: Math.round(pacingMatchScore * 100) / 100,
    intensityMatchScore: Math.round(intensityMatchScore * 100) / 100
  };
}

/**
 * Calculate mood scores for a single movie across all moods
 */
async function calculateMovieMoodScores(movie, moods) {
  try {
    const moodScores = [];

    for (const mood of moods) {
      const { score, genreMatchScore, pacingMatchScore, intensityMatchScore } = calculateMoodScore(movie, mood);

      moodScores.push({
        movie_id: movie.id,
        mood_id: mood.id,
        score,
        genre_match_score: genreMatchScore,
        pacing_match_score: pacingMatchScore,
        intensity_match_score: intensityMatchScore,
        user_feedback_score: null, // Will be updated later based on user interactions
        times_recommended: 0,
        success_rate: null,
        last_updated_at: new Date().toISOString()
      });
    }

    // Batch upsert mood scores
    const { error } = await supabase
      .from('movie_mood_scores')
      .upsert(moodScores, {
        onConflict: 'movie_id,mood_id',
        ignoreDuplicates: false
      });

    if (error) {
      throw new Error(`Failed to upsert mood scores: ${error.message}`);
    }

    return { success: true, count: moodScores.length };

  } catch (error) {
    logger.error(`✗ Failed to calculate mood scores for ${movie.title}:`, { error: error.message });
    return { success: false, error: error.message };
  }
}

/**
 * Main execution
 */
async function main() {
  const startTime = Date.now();
  
  logger.section('🎭 CALCULATE MOOD SCORES');
  logger.info('Started at: ' + new Date().toISOString());

  try {
    // Fetch all active moods
    const { data: moods, error: moodsError } = await supabase
      .from('moods')
      .select('id, name, pacing_preference, intensity_level, category')
      .eq('active', true)
      .order('id');

    if (moodsError) {
      throw new Error(`Failed to fetch moods: ${moodsError.message}`);
    }

    if (!moods || moods.length === 0) {
      logger.error('No active moods found in database');
      return;
    }

    logger.info(`Found ${moods.length} active moods: ${moods.map(m => m.name).join(', ')}`);

    // Get preferred genres for each mood (from experience_types via mood category)
    const { data: experienceTypes, error: expError } = await supabase
      .from('experience_types')
      .select('name, preferred_genres, avoid_genres');

    if (expError) {
      logger.warn('Could not fetch experience types:', expError.message);
    } else {
      // Map experience types to moods based on category matching
      for (const mood of moods) {
        const matchingExp = experienceTypes?.find(et => 
          et.name.toLowerCase().includes(mood.category?.toLowerCase() || 'none')
        );
        if (matchingExp) {
          mood.preferred_genres = matchingExp.preferred_genres;
          mood.avoid_genres = matchingExp.avoid_genres;
        }
      }
    }

    // Get movies that have scores but need mood score calculation
    const { data: movies, error: moviesError } = await supabase
      .from('movies')
      .select('id, tmdb_id, title, primary_genre, genres, pacing_score, intensity_score, quality_score')
      .eq('has_scores', true)
      .not('pacing_score', 'is', null)
      .order('vote_count', { ascending: false })
      .limit(5000);

    if (moviesError) {
      throw new Error(`Failed to fetch movies: ${moviesError.message}`);
    }

    // Filter movies that don't have mood scores yet
    const { data: existingScores, error: scoresError } = await supabase
      .from('movie_mood_scores')
      .select('movie_id')
      .in('movie_id', movies.map(m => m.id));

    if (scoresError) {
      logger.warn('Could not fetch existing mood scores:', scoresError.message);
    }

    const moviesWithScores = new Set(existingScores?.map(s => s.movie_id) || []);
    const moviesToProcess = movies.filter(m => !moviesWithScores.has(m.id));

    if (moviesToProcess.length === 0) {
      logger.info('✓ All movies already have mood scores');
      return;
    }

    logger.info(`Found ${moviesToProcess.length} movies needing mood score calculations`);
    logger.info(`Calculating ${moviesToProcess.length} movies × ${moods.length} moods = ${moviesToProcess.length * moods.length} total scores\n`);

    // Process movies
    let successCount = 0;
    let failCount = 0;
    let totalScoresCalculated = 0;

    for (let i = 0; i < moviesToProcess.length; i++) {
      const movie = moviesToProcess[i];
      
      if (i > 0 && i % 100 === 0) {
        logger.info(`Progress: ${i}/${moviesToProcess.length} (${successCount} success, ${failCount} failed, ${totalScoresCalculated} scores)`);
      }

      const result = await calculateMovieMoodScores(movie, moods);
      
      if (result.success) {
        successCount++;
        totalScoresCalculated += result.count;
      } else {
        failCount++;
      }
    }

    // Summary
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    logger.section('📊 SUMMARY');
    logger.info(`Total movies processed: ${moviesToProcess.length}`);
    logger.success(`✓ Successful: ${successCount}`);
    if (failCount > 0) {
      logger.error(`✗ Failed: ${failCount}`);
    }
    logger.info(`Total mood scores calculated: ${totalScoresCalculated}`);
    logger.info(`Average scores per movie: ${(totalScoresCalculated / successCount).toFixed(1)}`);
    logger.info(`Duration: ${duration}s`);
    logger.info(`Average: ${(successCount / (duration / 60)).toFixed(1)} movies/minute`);

    logger.success('\n✅ Mood score calculation complete!');
    logger.info(`Log file: ${logger.getLogFilePath()}`);

  } catch (error) {
    logger.error('Fatal error:', { error: error.message, stack: error.stack });
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { calculateMovieMoodScores, calculateMoodScore };
