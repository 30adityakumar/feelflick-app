// scripts/pipeline/01-discover-new-movies.js

const Logger = require('../utils/logger');
const tmdbClient = require('../utils/tmdb-client');
const { supabase } = require('../utils/supabase');

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
  },

  // ── Korean cinema ────────────────────────────────────────────────────────────
  {
    name: 'Korean Cinema — By Rating',
    description: 'Top-rated Korean films (all eras)',
    fetch: async () => {
      const results = [];
      for (let page = 1; page <= 10; page++) {
        const data = await tmdbClient.discoverMovies({
          with_original_language: 'ko',
          'vote_average.gte': 6.5,
          'vote_count.gte': 100,
          sort_by: 'vote_average.desc',
          page
        });
        results.push(...data.results);
      }
      return results;
    }
  },
  {
    name: 'Korean Cinema — By Popularity',
    description: 'Popular Korean films sorted by popularity',
    fetch: async () => {
      const results = [];
      for (let page = 1; page <= 8; page++) {
        const data = await tmdbClient.discoverMovies({
          with_original_language: 'ko',
          'vote_average.gte': 6.0,
          'vote_count.gte': 50,
          sort_by: 'popularity.desc',
          page
        });
        results.push(...data.results);
      }
      return results;
    }
  },

  // ── Genre gap fills ──────────────────────────────────────────────────────────
  {
    name: 'Thriller — By Rating',
    description: 'Top-rated thrillers (TMDB genre 53), all eras',
    fetch: async () => {
      const results = [];
      for (let page = 1; page <= 10; page++) {
        const data = await tmdbClient.discoverMovies({
          with_genres: '53',
          'vote_average.gte': 6.5,
          'vote_count.gte': 100,
          sort_by: 'vote_average.desc',
          page
        });
        results.push(...data.results);
      }
      return results;
    }
  },
  {
    name: 'Thriller — By Popularity',
    description: 'Popular thrillers sorted by popularity (finds different films than rating sort)',
    fetch: async () => {
      const results = [];
      for (let page = 1; page <= 10; page++) {
        const data = await tmdbClient.discoverMovies({
          with_genres: '53',
          'vote_average.gte': 6.0,
          'vote_count.gte': 100,
          sort_by: 'popularity.desc',
          page
        });
        results.push(...data.results);
      }
      return results;
    }
  },
  {
    name: 'Mystery — By Rating',
    description: 'Top-rated mystery films (TMDB genre 9648), all eras',
    fetch: async () => {
      const results = [];
      for (let page = 1; page <= 10; page++) {
        const data = await tmdbClient.discoverMovies({
          with_genres: '9648',
          'vote_average.gte': 6.5,
          'vote_count.gte': 100,
          sort_by: 'vote_average.desc',
          page
        });
        results.push(...data.results);
      }
      return results;
    }
  },
  {
    name: 'Mystery — By Popularity',
    description: 'Popular mystery films sorted by popularity',
    fetch: async () => {
      const results = [];
      for (let page = 1; page <= 10; page++) {
        const data = await tmdbClient.discoverMovies({
          with_genres: '9648',
          'vote_average.gte': 6.0,
          'vote_count.gte': 100,
          sort_by: 'popularity.desc',
          page
        });
        results.push(...data.results);
      }
      return results;
    }
  },
  {
    name: 'Science Fiction — By Rating',
    description: 'Top-rated sci-fi films (TMDB genre 878), all eras',
    fetch: async () => {
      const results = [];
      for (let page = 1; page <= 10; page++) {
        const data = await tmdbClient.discoverMovies({
          with_genres: '878',
          'vote_average.gte': 6.5,
          'vote_count.gte': 100,
          sort_by: 'vote_average.desc',
          page
        });
        results.push(...data.results);
      }
      return results;
    }
  },
  {
    name: 'Science Fiction — By Popularity',
    description: 'Popular sci-fi films sorted by popularity',
    fetch: async () => {
      const results = [];
      for (let page = 1; page <= 10; page++) {
        const data = await tmdbClient.discoverMovies({
          with_genres: '878',
          'vote_average.gte': 6.0,
          'vote_count.gte': 100,
          sort_by: 'popularity.desc',
          page
        });
        results.push(...data.results);
      }
      return results;
    }
  },

  // ── South Asian language fills ───────────────────────────────────────────────
  {
    name: 'Hindi Cinema — By Rating',
    description: 'Top-rated Hindi films, all eras (Bollywood + arthouse)',
    fetch: async () => {
      const results = [];
      for (let page = 1; page <= 15; page++) {
        const data = await tmdbClient.discoverMovies({
          with_original_language: 'hi',
          'vote_average.gte': 6.0,
          'vote_count.gte': 50,
          sort_by: 'vote_average.desc',
          page
        });
        results.push(...data.results);
      }
      return results;
    }
  },
  {
    name: 'Hindi Cinema — By Popularity',
    description: 'Popular Hindi films sorted by popularity',
    fetch: async () => {
      const results = [];
      for (let page = 1; page <= 10; page++) {
        const data = await tmdbClient.discoverMovies({
          with_original_language: 'hi',
          'vote_average.gte': 5.5,
          'vote_count.gte': 50,
          sort_by: 'popularity.desc',
          page
        });
        results.push(...data.results);
      }
      return results;
    }
  },
  {
    name: 'Tamil Cinema — By Rating',
    description: 'Top-rated Tamil films (Kollywood + arthouse)',
    fetch: async () => {
      const results = [];
      for (let page = 1; page <= 10; page++) {
        const data = await tmdbClient.discoverMovies({
          with_original_language: 'ta',
          'vote_average.gte': 6.0,
          'vote_count.gte': 50,
          sort_by: 'vote_average.desc',
          page
        });
        results.push(...data.results);
      }
      return results;
    }
  },
  {
    name: 'Tamil Cinema — By Popularity',
    description: 'Popular Tamil films sorted by popularity',
    fetch: async () => {
      const results = [];
      for (let page = 1; page <= 8; page++) {
        const data = await tmdbClient.discoverMovies({
          with_original_language: 'ta',
          'vote_average.gte': 5.5,
          'vote_count.gte': 50,
          sort_by: 'popularity.desc',
          page
        });
        results.push(...data.results);
      }
      return results;
    }
  },
  {
    name: 'Telugu Cinema — By Rating',
    description: 'Top-rated Telugu films (Tollywood)',
    fetch: async () => {
      const results = [];
      for (let page = 1; page <= 8; page++) {
        const data = await tmdbClient.discoverMovies({
          with_original_language: 'te',
          'vote_average.gte': 6.0,
          'vote_count.gte': 50,
          sort_by: 'vote_average.desc',
          page
        });
        results.push(...data.results);
      }
      return results;
    }
  },
  {
    name: 'Telugu Cinema — By Popularity',
    description: 'Popular Telugu films sorted by popularity',
    fetch: async () => {
      const results = [];
      for (let page = 1; page <= 8; page++) {
        const data = await tmdbClient.discoverMovies({
          with_original_language: 'te',
          'vote_average.gte': 5.5,
          'vote_count.gte': 50,
          sort_by: 'popularity.desc',
          page
        });
        results.push(...data.results);
      }
      return results;
    }
  },
  {
    name: 'Malayalam Cinema — By Rating',
    description: 'Top-rated Malayalam films (Mollywood)',
    fetch: async () => {
      const results = [];
      for (let page = 1; page <= 8; page++) {
        const data = await tmdbClient.discoverMovies({
          with_original_language: 'ml',
          'vote_average.gte': 6.0,
          'vote_count.gte': 50,
          sort_by: 'vote_average.desc',
          page
        });
        results.push(...data.results);
      }
      return results;
    }
  },
  {
    name: 'Malayalam Cinema — By Popularity',
    description: 'Popular Malayalam films sorted by popularity',
    fetch: async () => {
      const results = [];
      for (let page = 1; page <= 8; page++) {
        const data = await tmdbClient.discoverMovies({
          with_original_language: 'ml',
          'vote_average.gte': 5.5,
          'vote_count.gte': 50,
          sort_by: 'popularity.desc',
          page
        });
        results.push(...data.results);
      }
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

  // Coverage audit — log catalog distribution so gaps are visible in daily logs
  logger.section('🗺️  CATALOG COVERAGE AUDIT');
  try {
    const { data: genreRows } = await supabase
      .from('movies')
      .select('primary_genre')
      .eq('is_valid', true)
      .not('primary_genre', 'is', null);

    const { data: langRows } = await supabase
      .from('movies')
      .select('original_language')
      .eq('is_valid', true)
      .not('original_language', 'is', null);

    const genreCounts = {};
    for (const r of genreRows || []) {
      genreCounts[r.primary_genre] = (genreCounts[r.primary_genre] || 0) + 1;
    }
    const langCounts = {};
    for (const r of langRows || []) {
      langCounts[r.original_language] = (langCounts[r.original_language] || 0) + 1;
    }

    const GENRE_TARGETS = { Thriller: 400, Mystery: 200, 'Science Fiction': 350, Horror: 400 };
    const LANG_TARGETS  = { hi: 200, ta: 150, te: 150, ml: 150, ko: 300 };

    logger.info('Genre coverage:');
    for (const [genre, target] of Object.entries(GENRE_TARGETS)) {
      const count = genreCounts[genre] || 0;
      const flag = count < target ? '⚠️ ' : '✅';
      logger.info(`  ${flag} ${genre}: ${count} / ${target} target`);
    }
    logger.info('Language coverage:');
    for (const [lang, target] of Object.entries(LANG_TARGETS)) {
      const count = langCounts[lang] || 0;
      const flag = count < target ? '⚠️ ' : '✅';
      logger.info(`  ${flag} ${lang}: ${count} / ${target} target`);
    }
  } catch (auditErr) {
    logger.warn(`Coverage audit failed: ${auditErr.message}`);
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
