// scripts/pipeline/01-discover-new-movies.js

const Logger = require('../utils/logger');
const tmdbClient = require('../utils/tmdb-client');
const { supabase, getMovieByTmdbId, createMovie } = require('../utils/supabase');

const logger = new Logger('01-discover-new-movies.log');

/**
 * Discovery strategies for finding new movies
 */
const DISCOVERY_STRATEGIES = [
  {
    name: 'Now Playing',
    description: 'Currently in theaters',
    fetch: async () => {
      const results = [];
      for (let page = 1; page <= 3; page++) {
        const data = await tmdbClient.getNowPlaying(page);
        results.push(...data.results);
      }
      return results;
    }
  },
  {
    name: 'Popular',
    description: 'Popular movies this week',
    fetch: async () => {
      const results = [];
      for (let page = 1; page <= 3; page++) {
        const data = await tmdbClient.getPopular(page);
        results.push(...data.results);
      }
      return results;
    }
  },
  {
    name: 'Trending',
    description: 'Trending movies this week',
    fetch: async () => {
      const results = [];
      for (let page = 1; page <= 2; page++) {
        const data = await tmdbClient.getTrending('week', page);
        results.push(...data.results);
      }
      return results;
    }
  },
  {
    name: 'Recent High Quality',
    description: 'Recent releases with high ratings (2024-2025)',
    fetch: async () => {
      const results = [];
      const data = await tmdbClient.discoverMovies({
        'primary_release_date.gte': '2024-01-01',
        'vote_average.gte': 7.0,
        'vote_count.gte': 100,
        sort_by: 'vote_average.desc'
      });
      results.push(...data.results);
      return results;
    }
  },
  {
    name: 'Hidden Gems 2023',
    description: 'Quality 2023 films with low popularity',
    fetch: async () => {
      const results = [];
      const data = await tmdbClient.discoverMovies({
        'primary_release_date.gte': '2023-01-01',
        'primary_release_date.lte': '2023-12-31',
        'vote_average.gte': 7.5,
        'vote_count.gte': 50,
        'popularity.lte': 5,
        sort_by: 'vote_average.desc'
      });
      results.push(...data.results);
      return results;
    }
  }
];

/**
 * Main discovery function
 */
async function discoverNewMovies(options = {}) {
  const { limit = 500, dryRun = false } = options;

  logger.section('🎬 DISCOVER NEW MOVIES');
  logger.info(`Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}`);
  logger.info(`Target limit: ${limit} new movies`);

  const stats = {
    strategies_executed: 0,
    tmdb_movies_found: 0,
    already_in_db: 0,
    new_movies_added: 0,
    errors: 0
  };

  const allTmdbIds = new Set();
  const newMoviesToAdd = [];

  // Execute discovery strategies
  for (const strategy of DISCOVERY_STRATEGIES) {
    logger.info(`\n🔍 Strategy: ${strategy.name}`);
    logger.info(`   Description: ${strategy.description}`);

    try {
      const movies = await strategy.fetch();
      logger.success(`   Found ${movies.length} movies from TMDB`);

      for (const movie of movies) {
        allTmdbIds.add(movie.id);
      }

      stats.strategies_executed++;
      stats.tmdb_movies_found += movies.length;

    } catch (error) {
      logger.error(`   Failed: ${error.message}`);
      stats.errors++;
    }
  }

  logger.info(`\n📊 Total unique TMDB IDs found: ${allTmdbIds.size}`);

  // Check which movies already exist in database
  logger.info('🔎 Checking database for existing movies...');

  const tmdbIdsArray = Array.from(allTmdbIds);
  const batchSize = 1000;

  for (let i = 0; i < tmdbIdsArray.length; i += batchSize) {
    const batch = tmdbIdsArray.slice(i, i + batchSize);
    
    const { data: existingMovies, error } = await supabase
      .from('movies')
      .select('tmdb_id')
      .in('tmdb_id', batch);

    if (error) {
      logger.error(`Database check failed: ${error.message}`);
      continue;
    }

    const existingIds = new Set(existingMovies.map(m => m.tmdb_id));

    for (const tmdbId of batch) {
      if (existingIds.has(tmdbId)) {
        stats.already_in_db++;
      } else {
        newMoviesToAdd.push(tmdbId);
        
        // Stop if we've reached the limit
        if (newMoviesToAdd.length >= limit) {
          break;
        }
      }
    }

    if (newMoviesToAdd.length >= limit) {
      break;
    }
  }

  logger.info(`✅ Already in database: ${stats.already_in_db}`);
  logger.info(`🆕 New movies to add: ${newMoviesToAdd.length}`);

  // Add new movies to database
  if (newMoviesToAdd.length > 0 && !dryRun) {
    logger.info('\n💾 Adding new movies to database...');

    const moviesToInsert = newMoviesToAdd.map(tmdbId => ({
      tmdb_id: tmdbId,
      status: 'pending',
      inserted_at: new Date().toISOString(),
      has_scores: false,
      has_embeddings: false,
      has_credits: false,
      has_keywords: false,
      is_valid: true
    }));

    // Insert in batches of 1000
    for (let i = 0; i < moviesToInsert.length; i += 1000) {
      const batch = moviesToInsert.slice(i, i + 1000);
      
      const { error } = await supabase
        .from('movies')
        .insert(batch);

      if (error) {
        logger.error(`Failed to insert batch: ${error.message}`);
        stats.errors++;
      } else {
        stats.new_movies_added += batch.length;
        logger.success(`   Inserted ${batch.length} movies (batch ${Math.floor(i/1000) + 1})`);
      }
    }
  } else if (dryRun) {
    logger.warn('🚫 DRY RUN: Skipping database insert');
    logger.info(`Would have added ${newMoviesToAdd.length} movies`);
  }

  // Final summary
  logger.section('📊 DISCOVERY SUMMARY');
  logger.info(`Strategies executed: ${stats.strategies_executed}/${DISCOVERY_STRATEGIES.length}`);
  logger.info(`TMDB movies found: ${stats.tmdb_movies_found}`);
  logger.info(`Unique TMDB IDs: ${allTmdbIds.size}`);
  logger.info(`Already in database: ${stats.already_in_db}`);
  logger.info(`New movies added: ${stats.new_movies_added}`);
  logger.info(`Errors: ${stats.errors}`);
  logger.info(`TMDB API calls: ${tmdbClient.getRequestCount()}`);

  if (newMoviesToAdd.length > 0) {
    logger.success('\n✅ Discovery complete! Run step 02 to fetch metadata.');
  } else {
    logger.warn('\n⚠️  No new movies found. Database is up to date.');
  }

  return {
    success: stats.errors === 0,
    stats,
    newMovieIds: newMoviesToAdd
  };
}

// CLI execution
if (require.main === module) {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const limitArg = args.find(arg => arg.startsWith('--limit='));
  const limit = limitArg ? parseInt(limitArg.split('=')[1]) : 500;

  discoverNewMovies({ limit, dryRun })
    .then(result => {
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      logger.error('Fatal error:', { error: error.message });
      process.exit(1);
    });
}

module.exports = discoverNewMovies;
