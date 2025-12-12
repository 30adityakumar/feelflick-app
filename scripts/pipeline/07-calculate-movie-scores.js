// scripts/pipeline/07-calculate-movie-scores.js

const Logger = require('../utils/logger');
const { supabase, updateMovie } = require('../utils/supabase');

const logger = new Logger('07-calculate-movie-scores.log');

/**
 * Genre-based pacing mapping
 */
const GENRE_PACING = {
  'Action': 75,
  'Thriller': 70,
  'Horror': 65,
  'Comedy': 60,
  'Adventure': 65,
  'Science Fiction': 60,
  'Animation': 55,
  'Crime': 50,
  'Mystery': 50,
  'Family': 50,
  'Fantasy': 55,
  'Romance': 40,
  'Drama': 35,
  'Documentary': 30,
  'War': 45,
  'Western': 45,
  'Music': 50,
  'History': 35,
  'TV Movie': 50
};

/**
 * Genre-based intensity mapping
 */
const GENRE_INTENSITY = {
  'Horror': 85,
  'Thriller': 80,
  'War': 75,
  'Action': 70,
  'Crime': 65,
  'Mystery': 60,
  'Science Fiction': 55,
  'Adventure': 55,
  'Fantasy': 50,
  'Drama': 45,
  'Animation': 40,
  'Western': 50,
  'Comedy': 35,
  'Romance': 30,
  'Family': 25,
  'Music': 35,
  'Documentary': 40,
  'History': 45,
  'TV Movie': 40
};

/**
 * Calculate pacing score (0-100)
 */
function calculatePacing(movie) {
  let score = 50; // Default moderate

  // Runtime impact
  if (movie.runtime) {
    if (movie.runtime <= 90) {
      score += 25; // Short = fast-paced
    } else if (movie.runtime >= 150) {
      score -= 25; // Long = slower
    } else if (movie.runtime >= 120) {
      score -= 10;
    }
  }

  // Genre impact (get primary genre from movies table or parse genres JSON)
  let primaryGenre = movie.primary_genre;
  
  if (!primaryGenre && movie.genres) {
    try {
      const genresArray = typeof movie.genres === 'string' ? JSON.parse(movie.genres) : movie.genres;
      primaryGenre = Array.isArray(genresArray) && genresArray.length > 0 ? genresArray[0] : null;
    } catch (e) {
      // Ignore parse errors
    }
  }

  if (primaryGenre && GENRE_PACING[primaryGenre]) {
    score = Math.round((score + GENRE_PACING[primaryGenre]) / 2);
  }

  // Clamp to 0-100, round to nearest 5
  return Math.round(Math.max(0, Math.min(100, score)) / 5) * 5;
}

/**
 * Calculate intensity score (0-100)
 */
function calculateIntensity(movie) {
  let score = 50; // Default moderate

  // Genre impact
  let primaryGenre = movie.primary_genre;
  
  if (!primaryGenre && movie.genres) {
    try {
      const genresArray = typeof movie.genres === 'string' ? JSON.parse(movie.genres) : movie.genres;
      primaryGenre = Array.isArray(genresArray) && genresArray.length > 0 ? genresArray[0] : null;
    } catch (e) {
      // Ignore
    }
  }

  if (primaryGenre && GENRE_INTENSITY[primaryGenre]) {
    score = GENRE_INTENSITY[primaryGenre];
  }

  // Keywords boost intensity
  if (movie.keywords) {
    try {
      const keywordsArray = typeof movie.keywords === 'string' ? JSON.parse(movie.keywords) : movie.keywords;
      const intensityKeywords = ['violence', 'intense', 'suspense', 'revenge', 'war', 'murder', 'blood', 'fight'];
      
      if (Array.isArray(keywordsArray)) {
        const hasIntenseKeywords = keywordsArray.some(kw => 
          intensityKeywords.some(ik => kw.toLowerCase().includes(ik))
        );
        if (hasIntenseKeywords) score += 10;
      }
    } catch (e) {
      // Ignore
    }
  }

  // Clamp and round
  return Math.round(Math.max(0, Math.min(100, score)) / 5) * 5;
}

/**
 * Calculate emotional depth score (0-100)
 */
function calculateEmotionalDepth(movie) {
  let score = 50; // Default moderate

  // Rating impact (high-rated movies tend to have emotional depth)
  if (movie.vote_average && movie.vote_count) {
    if (movie.vote_count >= 100) { // Reliable rating
      if (movie.vote_average >= 8.0) {
        score += 30;
      } else if (movie.vote_average >= 7.5) {
        score += 20;
      } else if (movie.vote_average >= 7.0) {
        score += 10;
      } else if (movie.vote_average <= 5.5) {
        score -= 20;
      }
    }
  }

  // Genre impact
  let primaryGenre = movie.primary_genre;
  
  if (!primaryGenre && movie.genres) {
    try {
      const genresArray = typeof movie.genres === 'string' ? JSON.parse(movie.genres) : movie.genres;
      primaryGenre = Array.isArray(genresArray) && genresArray.length > 0 ? genresArray[0] : null;
    } catch (e) {
      // Ignore
    }
  }

  const deepGenres = ['Drama', 'War', 'History', 'Romance'];
  const lightGenres = ['Comedy', 'Action', 'Animation', 'Family'];
  
  if (primaryGenre) {
    if (deepGenres.includes(primaryGenre)) score += 15;
    if (lightGenres.includes(primaryGenre)) score -= 15;
  }

  // Runtime impact (longer films often have more depth)
  if (movie.runtime && movie.runtime >= 150) {
    score += 10;
  }

  // Clamp and round
  return Math.round(Math.max(0, Math.min(100, score)) / 5) * 5;
}

/**
 * Calculate dialogue density (0-100)
 */
function calculateDialogueDensity(movie) {
  let score = 50; // Default moderate

  // Genre-based estimates
  let primaryGenre = movie.primary_genre;
  
  if (!primaryGenre && movie.genres) {
    try {
      const genresArray = typeof movie.genres === 'string' ? JSON.parse(movie.genres) : movie.genres;
      primaryGenre = Array.isArray(genresArray) && genresArray.length > 0 ? genresArray[0] : null;
    } catch (e) {
      // Ignore
    }
  }

  const highDialogueGenres = ['Drama', 'Comedy', 'Crime', 'Mystery', 'Thriller'];
  const lowDialogueGenres = ['Action', 'Horror', 'Science Fiction', 'Documentary'];
  
  if (primaryGenre) {
    if (highDialogueGenres.includes(primaryGenre)) score += 20;
    if (lowDialogueGenres.includes(primaryGenre)) score -= 20;
  }

  // Runtime impact (shorter films often have denser dialogue)
  if (movie.runtime) {
    if (movie.runtime <= 90) score += 10;
    if (movie.runtime >= 150) score -= 10;
  }

  // Clamp and round
  return Math.round(Math.max(0, Math.min(100, score)) / 5) * 5;
}

/**
 * Calculate attention demand (0-100)
 */
function calculateAttentionDemand(movie) {
  let score = 50; // Default moderate

  // Runtime impact (longer = more demanding)
  if (movie.runtime) {
    if (movie.runtime >= 180) {
      score += 30;
    } else if (movie.runtime >= 150) {
      score += 20;
    } else if (movie.runtime <= 90) {
      score -= 20;
    }
  }

  // Popularity impact (obscure films = more demanding)
  if (movie.popularity) {
    if (movie.popularity < 5) {
      score += 15;
    } else if (movie.popularity > 20) {
      score -= 10;
    }
  }

  // Genre impact
  let primaryGenre = movie.primary_genre;
  
  if (!primaryGenre && movie.genres) {
    try {
      const genresArray = typeof movie.genres === 'string' ? JSON.parse(movie.genres) : movie.genres;
      primaryGenre = Array.isArray(genresArray) && genresArray.length > 0 ? genresArray[0] : null;
    } catch (e) {
      // Ignore
    }
  }

  const demandingGenres = ['Mystery', 'Thriller', 'Science Fiction', 'Crime'];
  const easyGenres = ['Comedy', 'Family', 'Animation', 'Romance'];
  
  if (primaryGenre) {
    if (demandingGenres.includes(primaryGenre)) score += 10;
    if (easyGenres.includes(primaryGenre)) score -= 10;
  }

  // Clamp and round
  return Math.round(Math.max(0, Math.min(100, score)) / 5) * 5;
}

/**
 * Calculate quality score (0-100)
 */
function calculateQualityScore(movie) {
  let score = 50;

  // TMDB vote average (0-10 scale)
  if (movie.vote_average && movie.vote_count) {
    // Weight by vote count (more votes = more reliable)
    let weight = 1.0;
    if (movie.vote_count < 50) weight = 0.3;
    else if (movie.vote_count < 100) weight = 0.5;
    else if (movie.vote_count < 500) weight = 0.7;
    else if (movie.vote_count < 1000) weight = 0.85;

    // Convert 0-10 rating to 0-100 contribution
    const ratingContribution = (movie.vote_average / 10) * 50 * weight;
    score = Math.round(50 + (ratingContribution - 25)); // Center around 50
  }

  // Popularity boost (slightly)
  if (movie.popularity) {
    if (movie.popularity > 50) score += 5;
    else if (movie.popularity > 100) score += 10;
  }

  // Clamp to 0-100
  return Math.round(Math.max(0, Math.min(100, score)));
}

/**
 * Calculate star power category
 */
function calculateStarPower(movie) {
  const top3Avg = movie.top3_cast_avg || 0;

  if (top3Avg >= 50) return 'mega_stars';
  if (top3Avg >= 30) return 'a_list';
  if (top3Avg >= 15) return 'b_list';
  if (top3Avg >= 5) return 'character_actors';
  return 'no_stars';
}

/**
 * Calculate starpower score (0-100)
 */
function calculateStarpowerScore(movie) {
  const top3Avg = movie.top3_cast_avg || 0;
  
  // Map popularity to 0-100 scale
  // Mega stars (50+) -> 90-100
  // A-list (30-50) -> 70-90
  // B-list (15-30) -> 50-70
  // Character actors (5-15) -> 30-50
  // No stars (0-5) -> 0-30
  
  if (top3Avg >= 50) return Math.round(90 + (Math.min(top3Avg - 50, 50) / 50) * 10);
  if (top3Avg >= 30) return Math.round(70 + ((top3Avg - 30) / 20) * 20);
  if (top3Avg >= 15) return Math.round(50 + ((top3Avg - 15) / 15) * 20);
  if (top3Avg >= 5) return Math.round(30 + ((top3Avg - 5) / 10) * 20);
  return Math.round((top3Avg / 5) * 30);
}

/**
 * Calculate VFX level category
 */
function calculateVFXLevel(movie) {
  let score = 0;

  // Genre-based estimates
  let genres = [];
  try {
    genres = typeof movie.genres === 'string' ? JSON.parse(movie.genres) : (movie.genres || []);
  } catch (e) {
    // Ignore
  }

  const heavyVFXGenres = ['Science Fiction', 'Fantasy', 'Animation', 'Action', 'Adventure'];
  const hasHeavyVFX = Array.isArray(genres) && genres.some(g => heavyVFXGenres.includes(g));
  
  if (hasHeavyVFX) score += 2;

  // Budget-based estimates
  if (movie.budget) {
    if (movie.budget >= 200000000) score += 3; // $200M+ = spectacle
    else if (movie.budget >= 100000000) score += 2; // $100M+ = high
    else if (movie.budget >= 50000000) score += 1; // $50M+ = moderate
  }

  // Keywords
  if (movie.keywords) {
    try {
      const keywordsArray = typeof movie.keywords === 'string' ? JSON.parse(movie.keywords) : movie.keywords;
      const vfxKeywords = ['cgi', 'visual effects', 'special effects', 'animation', '3d'];
      
      if (Array.isArray(keywordsArray)) {
        const hasVFXKeywords = keywordsArray.some(kw => 
          vfxKeywords.some(vk => kw.toLowerCase().includes(vk))
        );
        if (hasVFXKeywords) score += 1;
      }
    } catch (e) {
      // Ignore
    }
  }

  // Map score to category
  if (score >= 5) return 'spectacle';
  if (score >= 3) return 'high';
  if (score >= 2) return 'moderate';
  if (score >= 1) return 'low';
  return 'minimal';
}

/**
 * Calculate VFX level score (0-100)
 */
function calculateVFXLevelScore(vfxLevel) {
  const mapping = {
    'minimal': 10,
    'low': 30,
    'moderate': 50,
    'high': 75,
    'spectacle': 95
  };
  return mapping[vfxLevel] || 10;
}

/**
 * Calculate cult status
 */
function calculateCultStatus(movie) {
  // Cult films: moderate vote count (500-5000), high rating (>7.5), low-moderate popularity
  if (!movie.vote_count || !movie.vote_average || !movie.popularity) {
    return false;
  }

  const isCult = 
    movie.vote_count >= 500 && 
    movie.vote_count <= 5000 && 
    movie.vote_average >= 7.5 && 
    movie.popularity < 20;

  return isCult;
}

/**
 * Calculate cult status score (0-100)
 */
function calculateCultStatusScore(movie) {
  if (!movie.vote_count || !movie.vote_average || !movie.popularity) {
    return 0;
  }

  let score = 0;

  // Vote count sweet spot (500-5000)
  if (movie.vote_count >= 500 && movie.vote_count <= 5000) {
    score += 40;
  } else if (movie.vote_count > 5000 && movie.vote_count <= 10000) {
    score += 20;
  }

  // High rating
  if (movie.vote_average >= 7.5) {
    score += 30;
  } else if (movie.vote_average >= 7.0) {
    score += 15;
  }

  // Low-moderate popularity
  if (movie.popularity < 10) {
    score += 30;
  } else if (movie.popularity < 20) {
    score += 15;
  }

  return Math.min(100, score);
}

/**
 * Calculate FeelFlick rating (0-10 scale)
 * Combines TMDB rating with external ratings
 */
function calculateFFRating(movie, externalRatings) {
  const ratings = [];
  const weights = [];

  // TMDB rating (weight by vote count)
  if (movie.vote_average && movie.vote_count) {
    let weight = Math.min(movie.vote_count / 1000, 3); // Max weight 3
    ratings.push(movie.vote_average);
    weights.push(weight);
  }

  // IMDb rating
  if (externalRatings?.imdb_rating) {
    let weight = Math.min((externalRatings.imdb_votes || 1000) / 10000, 2); // Max weight 2
    ratings.push(externalRatings.imdb_rating);
    weights.push(weight);
  }

  // Metacritic (convert 0-100 to 0-10)
  if (externalRatings?.metacritic_score) {
    ratings.push(externalRatings.metacritic_score / 10);
    weights.push(1);
  }

  // RT (convert percentage to 0-10)
  if (externalRatings?.rt_rating) {
    const rtScore = parseInt(externalRatings.rt_rating.replace('%', '')) / 10;
    ratings.push(rtScore);
    weights.push(1);
  }

  if (ratings.length === 0) return null;

  // Weighted average
  const weightedSum = ratings.reduce((sum, rating, i) => sum + rating * weights[i], 0);
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  const ffRating = weightedSum / totalWeight;

  return Math.round(ffRating * 10) / 10; // Round to 1 decimal
}

/**
 * Calculate FF confidence (0-100)
 * Based on how many rating sources we have
 */
function calculateFFConfidence(movie, externalRatings) {
  let confidence = 0;
  let sources = 0;

  // TMDB (0-40 points based on vote count)
  if (movie.vote_count) {
    if (movie.vote_count >= 10000) confidence += 40;
    else if (movie.vote_count >= 5000) confidence += 30;
    else if (movie.vote_count >= 1000) confidence += 20;
    else if (movie.vote_count >= 100) confidence += 10;
    sources++;
  }

  // IMDb (20 points)
  if (externalRatings?.imdb_rating) {
    confidence += 20;
    sources++;
  }

  // Metacritic (20 points)
  if (externalRatings?.metacritic_score) {
    confidence += 20;
    sources++;
  }

  // RT (20 points)
  if (externalRatings?.rt_rating) {
    confidence += 20;
    sources++;
  }

  return Math.min(100, confidence);
}

/**
 * Calculate all scores for a single movie
 */
async function calculateScores(movie) {
  try {
    logger.debug(`Calculating scores for: ${movie.title}`);

    // Fetch external ratings if available
    const { data: externalRatings } = await supabase
      .from('ratings_external')
      .select('*')
      .eq('movie_id', movie.id)
      .maybeSingle();

    // Calculate all scores
    const pacing_score = calculatePacing(movie);
    const intensity_score = calculateIntensity(movie);
    const emotional_depth_score = calculateEmotionalDepth(movie);
    const dialogue_density = calculateDialogueDensity(movie);
    const attention_demand = calculateAttentionDemand(movie);
    const quality_score = calculateQualityScore(movie);
    
    const star_power = calculateStarPower(movie);
    const starpower_score = calculateStarpowerScore(movie);
    
    const vfx_level = calculateVFXLevel(movie);
    const vfx_level_score = calculateVFXLevelScore(vfx_level);
    
    const cult_status = calculateCultStatus(movie);
    const cult_status_score = calculateCultStatusScore(movie);
    
    const ff_rating = calculateFFRating(movie, externalRatings);
    const ff_confidence = calculateFFConfidence(movie, externalRatings);

    // Update movie with all scores
    await updateMovie(movie.id, {
      pacing_score,
      intensity_score,
      emotional_depth_score,
      dialogue_density,
      attention_demand,
      quality_score,
      star_power,
      starpower_score,
      vfx_level,
      vfx_level_score,
      cult_status,
      cult_status_score,
      ff_rating,
      ff_confidence,
      has_scores: true,
      last_scored_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    logger.debug(`✓ Scores calculated for: ${movie.title}`, {
      pacing: pacing_score,
      intensity: intensity_score,
      quality: quality_score,
      ff_rating
    });

    return { success: true, scores: { pacing_score, intensity_score, quality_score, ff_rating } };

  } catch (error) {
    logger.error(`✗ Failed to calculate scores for ${movie.title}:`, { error: error.message });
    return { success: false, error: error.message };
  }
}

/**
 * Main execution
 */
async function main() {
  const startTime = Date.now();
  
  logger.section('📊 CALCULATE MOVIE SCORES');
  logger.info('Started at: ' + new Date().toISOString());

  try {
    // Get movies needing scores
    const { data: movies, error } = await supabase
      .from('movies')
      .select('*')
      .eq('has_scores', false)
      .not('runtime', 'is', null) // Need basic metadata
      .order('vote_count', { ascending: false })
      .limit(2000);

    if (error) {
      throw new Error(`Failed to fetch movies: ${error.message}`);
    }

    if (!movies || movies.length === 0) {
      logger.info('✓ No movies need score calculations');
      return;
    }

    logger.info(`Found ${movies.length} movies needing score calculations\n`);

    // Process movies
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < movies.length; i++) {
      const movie = movies[i];
      
      if (i > 0 && i % 100 === 0) {
        logger.info(`Progress: ${i}/${movies.length} (${successCount} success, ${failCount} failed)`);
      }

      const result = await calculateScores(movie);
      
      if (result.success) {
        successCount++;
      } else {
        failCount++;
      }
    }

    // Summary
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    logger.section('📊 SUMMARY');
    logger.info(`Total movies processed: ${movies.length}`);
    logger.success(`✓ Successful: ${successCount}`);
    if (failCount > 0) {
      logger.error(`✗ Failed: ${failCount}`);
    }
    logger.info(`Duration: ${duration}s`);
    logger.info(`Average: ${(movies.length / (duration / 60)).toFixed(1)} movies/minute`);

    logger.success('\n✅ Score calculation complete!');
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

module.exports = { calculateScores };
