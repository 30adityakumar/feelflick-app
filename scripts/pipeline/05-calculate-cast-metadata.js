// scripts/pipeline/05-calculate-cast-metadata.js

/**
 * ============================================================================
 * STEP 05: CALCULATE CAST METADATA
 * ============================================================================
 * 
 * Purpose:
 *   Calculate aggregate cast statistics from movie_people table
 *   
 * Input:
 *   - Movies with has_credits=true (cast/crew data exists)
 *   
 * Output:
 *   - Cast statistics calculated (avg/max/min/top3 popularity)
 *   - cast_count updated
 *   - Status remains 'fetching' (ready for step 06 - external ratings)
 *   
 * Options:
 *   --limit=N     Process max N movies (default: 2000)
 *   --dry-run     Simulate without making changes
 * 
 * ============================================================================
 */

const Logger = require('../utils/logger');
const { supabase } = require('../utils/supabase');

const logger = new Logger('05-calculate-cast-metadata.log');

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  DEFAULT_LIMIT: 2000,
  BATCH_UPDATE_SIZE: 100
};

// ============================================================================
// CALCULATE CAST METADATA FOR SINGLE MOVIE
// ============================================================================

async function calculateCastMetadata(movie) {
  try {
    logger.debug(`  Calculating cast metadata for: ${movie.title} (id: ${movie.id})`);
    
    // Get all cast members (job='Acting' or 'Actor')
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
      .or('job.eq.Acting,job.eq.Actor')
      .order('billing_order', { ascending: true });
    
    if (castError) {
      throw new Error(`Failed to fetch cast: ${castError.message}`);
    }
    
    // ✅ ALWAYS UPDATE - even if no cast
    if (!castMembers || castMembers.length === 0) {
      logger.debug(`  ⚠️  No cast found for: ${movie.title}`);
      
      return {
        success: true,
        movieId: movie.id,
        updateData: {
          avg_cast_popularity: 0,
          max_cast_popularity: 0,
          min_cast_popularity: 0,
          top3_cast_avg: 0,
          cast_count: 0
        }
      };
    }
    
    // Extract popularity values
    const popularities = castMembers
      .map(c => c.people?.popularity)
      .filter(p => p != null && p > 0);
    
    // ✅ STILL UPDATE if no popularity data
    if (popularities.length === 0) {
      logger.debug(`  ⚠️  No popularity data for cast of: ${movie.title}`);
      
      return {
        success: true,
        movieId: movie.id,
        updateData: {
          avg_cast_popularity: 0,
          max_cast_popularity: 0,
          min_cast_popularity: 0,
          top3_cast_avg: 0,
          cast_count: castMembers.length
        }
      };
    }
    
    // Calculate statistics
    const avg_cast_popularity = popularities.reduce((sum, p) => sum + p, 0) / popularities.length;
    const max_cast_popularity = Math.max(...popularities);
    const min_cast_popularity = Math.min(...popularities);
    
    // Top 3 cast average
    const top3 = popularities.slice(0, Math.min(3, popularities.length));
    const top3_cast_avg = top3.reduce((sum, p) => sum + p, 0) / top3.length;
    
    logger.debug(`  ✓ Cast metadata calculated for: ${movie.title}`, {
      count: castMembers.length,
      avg: avg_cast_popularity.toFixed(2),
      max: max_cast_popularity.toFixed(2),
      top3: top3_cast_avg.toFixed(2)
    });
    
    return {
      success: true,
      movieId: movie.id,
      updateData: {
        avg_cast_popularity,
        max_cast_popularity,
        min_cast_popularity,
        top3_cast_avg,
        cast_count: castMembers.length
      }
    };
    
  } catch (error) {
    logger.error(`  ✗ Failed to calculate cast metadata for ${movie.title}:`, { error: error.message });
    return { 
      success: false, 
      movieId: movie.id,
      error: error.message 
    };
  }
}

// ============================================================================
// BATCH UPDATE MOVIES
// ============================================================================

async function batchUpdateMovies(updates) {
  if (updates.length === 0) return { success: true, count: 0 };
  
  try {
    // Add updated_at to all updates
    const updatesWithTimestamp = updates.map(u => ({
      id: u.movieId,
      ...u.updateData,
      updated_at: new Date().toISOString()
      // Status stays 'fetching' - ready for step 06 (external ratings)
    }));
    
    const { error } = await supabase
      .from('movies')
      .upsert(updatesWithTimestamp, { 
        onConflict: 'id',
        ignoreDuplicates: false 
      });
    
    if (error) throw error;
    
    return { success: true, count: updates.length };
    
  } catch (error) {
    logger.error(`Batch update failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// ============================================================================
// MAIN FUNCTION
// ============================================================================

async function main(options = {}) {
  const startTime = Date.now();
  
  const config = {
    limit: options.limit || CONFIG.DEFAULT_LIMIT,
    dryRun: options.dryRun || false
  };
  
  logger.section('📊 CALCULATE CAST METADATA');
  logger.info(`Limit: ${config.limit} movies`);
  logger.info(`Dry run: ${config.dryRun ? 'YES' : 'NO'}\n`);
  
  try {
    // Get movies that have credits but no cast metadata
    const { data: movies, error } = await supabase
      .from('movies')
      .select('id, tmdb_id, title')
      .eq('has_credits', true)
      .is('avg_cast_popularity', null)
      .limit(config.limit);
    
    if (error) {
      throw new Error(`Failed to fetch movies: ${error.message}`);
    }
    
    if (!movies || movies.length === 0) {
      logger.info('✓ No movies need cast metadata calculation');
      return { success: true, stats: { processed: 0, success: 0, failed: 0 } };
    }
    
    logger.info(`Found ${movies.length} movies needing cast metadata calculation\n`);
    
    // Stats
    const stats = {
      total: movies.length,
      success: 0,
      failed: 0,
      total_cast: 0,
      movies_with_stars: 0,
      movies_with_zero_cast: 0
    };
    
    // Batch updates buffer
    const batchUpdates = [];
    
    // Process each movie
    for (let i = 0; i < movies.length; i++) {
      const movie = movies[i];
      
      // Progress logging
      if (i > 0 && i % 100 === 0) {
        logger.info(`Progress: ${i}/${movies.length} (${stats.success} success, ${stats.failed} failed)`);
        
        // Flush batch updates
        if (batchUpdates.length > 0 && !config.dryRun) {
          await batchUpdateMovies(batchUpdates);
          batchUpdates.length = 0;
        }
      }
      
      if (config.dryRun) {
        stats.success++;
        continue;
      }
      
      const result = await calculateCastMetadata(movie);
      
      if (result.success) {
        batchUpdates.push(result);
        stats.success++;
        stats.total_cast += result.updateData.cast_count || 0;
        
        if (result.updateData.cast_count === 0) {
          stats.movies_with_zero_cast++;
        }
        
        if (result.updateData.avg_cast_popularity && result.updateData.avg_cast_popularity > 10) {
          stats.movies_with_stars++;
        }
        
      } else {
        stats.failed++;
      }
    }
    
    // Flush remaining batch updates
    if (batchUpdates.length > 0 && !config.dryRun) {
      logger.info('\nFlushing final batch updates...');
      const result = await batchUpdateMovies(batchUpdates);
      if (result.success) {
        logger.success(`✓ Updated ${result.count} movies`);
      }
    }
    
    // Summary
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    logger.section('📊 SUMMARY');
    logger.info(`Total movies: ${stats.total}`);
    logger.success(`✓ Successfully processed: ${stats.success}`);
    
    if (stats.failed > 0) {
      logger.error(`✗ Failed: ${stats.failed}`);
    }
    
    logger.info(`\nCast Statistics:`);
    logger.info(`  Average cast per movie: ${(stats.total_cast / stats.success).toFixed(1)}`);
    logger.info(`  Movies with recognizable stars: ${stats.movies_with_stars} (${(stats.movies_with_stars / stats.success * 100).toFixed(1)}%)`);
    logger.info(`  Movies with zero cast: ${stats.movies_with_zero_cast}`);
    
    logger.info(`\nDuration: ${duration}s`);
    logger.info(`Average: ${(stats.success / (duration / 60)).toFixed(1)} movies/minute`);
    
    if (stats.success > 0) {
      logger.success('\n✅ Cast metadata calculation complete! Run step 06 to fetch external ratings.');
    }
    
    logger.info(`\nLog file: ${logger.getLogFilePath()}`);
    
    return {
      success: stats.failed === 0 || stats.success > 0,
      stats
    };
    
  } catch (error) {
    logger.error('Fatal error:', { error: error.message, stack: error.stack });
    return { success: false, error: error.message };
  }
}

// ============================================================================
// CLI EXECUTION
// ============================================================================

if (require.main === module) {
  const args = process.argv.slice(2);
  
  const options = {
    dryRun: args.includes('--dry-run'),
    limit: CONFIG.DEFAULT_LIMIT
  };
  
  // Parse --limit=N
  const limitArg = args.find(arg => arg.startsWith('--limit='));
  if (limitArg) {
    options.limit = parseInt(limitArg.split('=')[1]) || CONFIG.DEFAULT_LIMIT;
  }
  
  // Help
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
┌─────────────────────────────────────────────────────────────────┐
│ Step 05: Calculate Cast Metadata                               │
└─────────────────────────────────────────────────────────────────┘

USAGE:
  node scripts/pipeline/05-calculate-cast-metadata.js [options]

OPTIONS:
  --limit=N     Process max N movies (default: ${CONFIG.DEFAULT_LIMIT})
  --dry-run     Simulate without making changes
  --help, -h    Show this help message

EXAMPLES:
  # Calculate cast metadata for 2000 movies
  node scripts/pipeline/05-calculate-cast-metadata.js
  
  # Calculate for 500 movies
  node scripts/pipeline/05-calculate-cast-metadata.js --limit=500
  
  # Dry run
  node scripts/pipeline/05-calculate-cast-metadata.js --dry-run
`);
    process.exit(0);
  }
  
  // Execute
  main(options)
    .then(result => {
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      logger.error('Fatal error:', { error: error.message });
      process.exit(1);
    });
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = { main, calculateCastMetadata };
