const Logger = require('../utils/logger');
const { supabase, updateMovie } = require('../utils/supabase');

const logger = new Logger('05-calculate-cast-metadata.log');

/**
 * Calculate cast metadata for a single movie
 */
async function calculateCastMetadata(movie) {
  try {
    logger.debug(`Calculating cast metadata for: ${movie.title} (id: ${movie.id})`);

    // Get all cast members - FIX: Use 'job' instead of 'department'
    const { data: castMembers, error: castError } = await supabase
      .from('movie_people')
      .select(`
        person_id,
        billing_order,
        people:person_id (
          popularity
        )
      `)
      .eq('movie_id', movie.id)
      .or('job.eq.Acting,job.eq.Actor')  // ← FIX: Changed from department
      .order('billing_order', { ascending: true });

    if (castError) {
      throw new Error(`Failed to fetch cast: ${castError.message}`);
    }

    if (!castMembers || castMembers.length === 0) {
      logger.warn(`No cast found for: ${movie.title}`);
      
      // ← FIX: STILL UPDATE THE MOVIE WITH 0 VALUES
      await updateMovie(movie.id, {
        avg_cast_popularity: 0,
        max_cast_popularity: 0,
        min_cast_popularity: 0,
        top3_cast_avg: 0,
        cast_count: 0,
        updated_at: new Date().toISOString()
      });
      
      return { success: true, cast_count: 0 };
    }

    // Extract popularity values
    const popularities = castMembers
      .map(c => c.people?.popularity)
      .filter(p => p != null && p > 0);

    if (popularities.length === 0) {
      logger.warn(`No popularity data for cast of: ${movie.title}`);
      
      // ← FIX: STILL UPDATE WITH COUNTS
      await updateMovie(movie.id, {
        avg_cast_popularity: 0,
        max_cast_popularity: 0,
        min_cast_popularity: 0,
        top3_cast_avg: 0,
        cast_count: castMembers.length,
        updated_at: new Date().toISOString()
      });
      
      return { success: true, cast_count: castMembers.length };
    }

    // Calculate statistics
    const avg_cast_popularity = popularities.reduce((sum, p) => sum + p, 0) / popularities.length;
    const max_cast_popularity = Math.max(...popularities);
    const min_cast_popularity = Math.min(...popularities);
    
    // Top 3 cast average
    const top3 = popularities.slice(0, Math.min(3, popularities.length));
    const top3_cast_avg = top3.reduce((sum, p) => sum + p, 0) / top3.length;

    // Update movie with cast metadata
    await updateMovie(movie.id, {
      avg_cast_popularity,
      max_cast_popularity,
      min_cast_popularity,
      top3_cast_avg,
      cast_count: castMembers.length,  // ← FIX: Always include count
      updated_at: new Date().toISOString()
    });

    logger.debug(`✓ Cast metadata calculated for: ${movie.title}`, {
      count: castMembers.length,
      avg: avg_cast_popularity.toFixed(2),
      max: max_cast_popularity.toFixed(2),
      top3: top3_cast_avg.toFixed(2)
    });

    return {
      success: true,
      cast_count: castMembers.length,
      avg_cast_popularity,
      max_cast_popularity,
      top3_cast_avg
    };

  } catch (error) {
    logger.error(`✗ Failed to calculate cast metadata for ${movie.title}:`, { error: error.message });
    return { success: false, error: error.message };
  }
}

async function main() {
  const startTime = Date.now();
  
  logger.section('📊 CALCULATE CAST METADATA');
  logger.info('Started at: ' + new Date().toISOString());

  try {
    // Get movies that have credits but no cast metadata
    const { data: movies, error } = await supabase
      .from('movies')
      .select('id, tmdb_id, title, has_credits, avg_cast_popularity')
      .eq('has_credits', true)
      .is('avg_cast_popularity', null)
      .limit(2000);

    if (error) {
      throw new Error(`Failed to fetch movies: ${error.message}`);
    }

    if (!movies || movies.length === 0) {
      logger.info('✓ No movies need cast metadata calculation');
      return;
    }

    logger.info(`Found ${movies.length} movies needing cast metadata calculation`);

    let successCount = 0;
    let failCount = 0;
    const stats = {
      total_cast: 0,
      movies_with_stars: 0,
      movies_with_zero_cast: 0  // ← Track this
    };

    for (let i = 0; i < movies.length; i++) {
      const movie = movies[i];
      
      if (i > 0 && i % 100 === 0) {
        logger.info(`Progress: ${i}/${movies.length} (${successCount} success, ${failCount} failed)`);
      }

      const result = await calculateCastMetadata(movie);
      
      if (result.success) {
        successCount++;
        stats.total_cast += result.cast_count || 0;
        
        if (result.cast_count === 0) {
          stats.movies_with_zero_cast++;
        }
        
        if (result.avg_cast_popularity && result.avg_cast_popularity > 10) {
          stats.movies_with_stars++;
        }
      } else {
        failCount++;
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    logger.section('📊 SUMMARY');
    logger.info(`Total movies processed: ${movies.length}`);
    logger.success(`✓ Successful: ${successCount}`);
    if (failCount > 0) {
      logger.error(`✗ Failed: ${failCount}`);
    }
    logger.info(`Average cast per movie: ${(stats.total_cast / successCount).toFixed(1)}`);
    logger.info(`Movies with recognizable stars: ${stats.movies_with_stars} (${(stats.movies_with_stars / successCount * 100).toFixed(1)}%)`);
    logger.info(`Movies with zero cast: ${stats.movies_with_zero_cast}`);
    logger.info(`Duration: ${duration}s`);

    logger.success('\n✅ Cast metadata calculation complete!');
    logger.info(`Log file: ${logger.getLogFilePath()}`);

  } catch (error) {
    logger.error('Fatal error:', { error: error.message, stack: error.stack });
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { calculateCastMetadata };
