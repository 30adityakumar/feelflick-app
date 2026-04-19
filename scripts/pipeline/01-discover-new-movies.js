// scripts/pipeline/01-discover-new-movies.js

const Logger = require('../utils/logger');
const tmdbClient = require('../utils/tmdb-client');
const { supabase } = require('../utils/supabase');

const logger = new Logger('01-discover-new-movies.log');

const PAGES_PER_RUN = 5;

// ── Strategy builders ──────────────────────────────────────────────────────

/**
 * Build rating + popularity strategy pair for a language
 * @param {string} langCode - ISO 639-1 language code
 * @param {string} label - Human-readable label (e.g. 'Japanese Cinema')
 * @returns {Array} Two strategy objects
 */
function buildLanguageStrategies(langCode, label) {
  return [
    {
      name: `${label} — By Rating`,
      description: `Top-rated ${label.toLowerCase()} films, all eras`,
      fetch: async (startPage = 1) => {
        const results = [];
        for (let page = startPage; page < startPage + PAGES_PER_RUN; page++) {
          const data = await tmdbClient.discoverMovies({
            with_original_language: langCode,
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
      name: `${label} — By Popularity`,
      description: `Popular ${label.toLowerCase()} films sorted by popularity`,
      fetch: async (startPage = 1) => {
        const results = [];
        for (let page = startPage; page < startPage + PAGES_PER_RUN; page++) {
          const data = await tmdbClient.discoverMovies({
            with_original_language: langCode,
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
}

/**
 * Build rating + popularity strategy pair for a genre
 * @param {string} genreId - TMDB genre ID
 * @param {string} label - Human-readable label (e.g. 'Drama')
 * @returns {Array} Two strategy objects
 */
function buildGenreStrategies(genreId, label) {
  return [
    {
      name: `${label} — By Rating`,
      description: `Top-rated ${label.toLowerCase()} films (TMDB genre ${genreId}), all eras`,
      fetch: async (startPage = 1) => {
        const results = [];
        for (let page = startPage; page < startPage + PAGES_PER_RUN; page++) {
          const data = await tmdbClient.discoverMovies({
            with_genres: genreId,
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
      name: `${label} — By Popularity`,
      description: `Popular ${label.toLowerCase()} films sorted by popularity`,
      fetch: async (startPage = 1) => {
        const results = [];
        for (let page = startPage; page < startPage + PAGES_PER_RUN; page++) {
          const data = await tmdbClient.discoverMovies({
            with_genres: genreId,
            'vote_average.gte': 6.0,
            'vote_count.gte': 100,
            sort_by: 'popularity.desc',
            page
          });
          results.push(...data.results);
        }
        return results;
      }
    }
  ];
}

// ── Cursor management ─────────────────────────────────────────────────────

const CURSOR_COOLDOWN_DAYS = 30;

/**
 * Read the discovery cursor for a strategy. Returns { lastPage, exhausted }.
 * @param {string} strategyName
 * @returns {Promise<{lastPage: number, exhausted: boolean}>}
 */
async function getCursor(strategyName) {
  const { data, error } = await supabase
    .from('discovery_cursors')
    .select('last_page_fetched, exhausted, last_run_at')
    .eq('strategy_name', strategyName)
    .maybeSingle();

  if (error) {
    logger.warn(`Cursor read failed for "${strategyName}": ${error.message}`);
    return { lastPage: 0, exhausted: false };
  }
  if (!data) return { lastPage: 0, exhausted: false };

  // If exhausted, check if cooldown has passed
  if (data.exhausted && data.last_run_at) {
    const daysSince = (Date.now() - new Date(data.last_run_at).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSince >= CURSOR_COOLDOWN_DAYS) {
      // Reset cursor after cooldown
      await supabase
        .from('discovery_cursors')
        .update({ exhausted: false, last_page_fetched: 0 })
        .eq('strategy_name', strategyName);
      return { lastPage: 0, exhausted: false };
    }
  }

  return { lastPage: data.last_page_fetched, exhausted: data.exhausted };
}

/**
 * Update the discovery cursor after fetching pages.
 * @param {string} strategyName
 * @param {number} lastPage - Last page successfully fetched
 * @param {boolean} exhausted - Whether the strategy returned an empty page
 */
async function updateCursor(strategyName, lastPage, exhausted) {
  const { error } = await supabase
    .from('discovery_cursors')
    .upsert({
      strategy_name: strategyName,
      last_page_fetched: lastPage,
      exhausted,
      last_run_at: new Date().toISOString()
    });

  if (error) {
    logger.warn(`Cursor update failed for "${strategyName}": ${error.message}`);
  }
}

/**
 * Discovery strategies for finding new movies
 */
const DISCOVERY_STRATEGIES = [
  {
    name: 'Now Playing',
    description: 'Currently in theaters',
    fetch: async (startPage = 1) => {
      const results = [];
      for (let page = startPage; page < startPage + PAGES_PER_RUN; page++) {
        const data = await tmdbClient.getNowPlaying(page);
        results.push(...data.results);
      }
      return results;
    }
  },
  {
    name: 'Popular',
    description: 'Popular movies this week',
    fetch: async (startPage = 1) => {
      const results = [];
      for (let page = startPage; page < startPage + PAGES_PER_RUN; page++) {
        const data = await tmdbClient.getPopular(page);
        results.push(...data.results);
      }
      return results;
    }
  },
  {
    name: 'Trending',
    description: 'Trending movies this week',
    fetch: async (startPage = 1) => {
      const results = [];
      for (let page = startPage; page < startPage + PAGES_PER_RUN; page++) {
        const data = await tmdbClient.getTrending('week', page);
        results.push(...data.results);
      }
      return results;
    }
  },
  {
    name: 'Recent High Quality',
    description: 'Recent releases with high ratings (2024-2025)',
    paginated: false,
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
    paginated: false,
    fetch: async () => {
      const results = [];
      const data = await tmdbClient.discoverMovies({
        'primary_release_date.gte': '2023-01-01',
        'primary_release_date.lte': '2023-12-31',
        'vote_average.gte': 7.5,
        'vote_count.gte': 50,
        'vote_count.lte': 2000,
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
    fetch: async (startPage = 1) => {
      const results = [];
      for (let page = startPage; page < startPage + PAGES_PER_RUN; page++) {
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
    fetch: async (startPage = 1) => {
      const results = [];
      for (let page = startPage; page < startPage + PAGES_PER_RUN; page++) {
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
    fetch: async (startPage = 1) => {
      const results = [];
      for (let page = startPage; page < startPage + PAGES_PER_RUN; page++) {
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
    fetch: async (startPage = 1) => {
      const results = [];
      for (let page = startPage; page < startPage + PAGES_PER_RUN; page++) {
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
    fetch: async (startPage = 1) => {
      const results = [];
      for (let page = startPage; page < startPage + PAGES_PER_RUN; page++) {
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
    fetch: async (startPage = 1) => {
      const results = [];
      for (let page = startPage; page < startPage + PAGES_PER_RUN; page++) {
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
    fetch: async (startPage = 1) => {
      const results = [];
      for (let page = startPage; page < startPage + PAGES_PER_RUN; page++) {
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
    fetch: async (startPage = 1) => {
      const results = [];
      for (let page = startPage; page < startPage + PAGES_PER_RUN; page++) {
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
    fetch: async (startPage = 1) => {
      const results = [];
      for (let page = startPage; page < startPage + PAGES_PER_RUN; page++) {
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
    fetch: async (startPage = 1) => {
      const results = [];
      for (let page = startPage; page < startPage + PAGES_PER_RUN; page++) {
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
    fetch: async (startPage = 1) => {
      const results = [];
      for (let page = startPage; page < startPage + PAGES_PER_RUN; page++) {
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
    fetch: async (startPage = 1) => {
      const results = [];
      for (let page = startPage; page < startPage + PAGES_PER_RUN; page++) {
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
    fetch: async (startPage = 1) => {
      const results = [];
      for (let page = startPage; page < startPage + PAGES_PER_RUN; page++) {
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
    fetch: async (startPage = 1) => {
      const results = [];
      for (let page = startPage; page < startPage + PAGES_PER_RUN; page++) {
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
    fetch: async (startPage = 1) => {
      const results = [];
      for (let page = startPage; page < startPage + PAGES_PER_RUN; page++) {
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
    fetch: async (startPage = 1) => {
      const results = [];
      for (let page = startPage; page < startPage + PAGES_PER_RUN; page++) {
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
  },

  // ── World cinema language fills ───────────────────────────────────────────
  ...buildLanguageStrategies('ja', 'Japanese Cinema'),
  ...buildLanguageStrategies('zh', 'Chinese Cinema'),
  ...buildLanguageStrategies('fr', 'French Cinema'),
  ...buildLanguageStrategies('es', 'Spanish Cinema'),
  ...buildLanguageStrategies('de', 'German Cinema'),
  ...buildLanguageStrategies('it', 'Italian Cinema'),
  ...buildLanguageStrategies('fa', 'Persian Cinema'),
  ...buildLanguageStrategies('pt', 'Portuguese Cinema'),

  // ── Additional genre fills ────────────────────────────────────────────────
  ...buildGenreStrategies('18', 'Drama'),
  ...buildGenreStrategies('35', 'Comedy'),
  ...buildGenreStrategies('99', 'Documentary'),
  ...buildGenreStrategies('16', 'Animation'),

  // ── Era strategies ────────────────────────────────────────────────────────
  {
    name: 'Classic Cinema — Pre-1980',
    description: 'Top-rated films released before 1980',
    fetch: async (startPage = 1) => {
      const results = [];
      for (let page = startPage; page < startPage + PAGES_PER_RUN; page++) {
        const data = await tmdbClient.discoverMovies({
          'primary_release_date.lte': '1979-12-31',
          'vote_average.gte': 7.2,
          'vote_count.gte': 300,
          sort_by: 'vote_average.desc',
          page
        });
        results.push(...data.results);
      }
      return results;
    }
  },
  {
    name: '1980s Cinema',
    description: 'Top-rated films from the 1980s',
    fetch: async (startPage = 1) => {
      const results = [];
      for (let page = startPage; page < startPage + PAGES_PER_RUN; page++) {
        const data = await tmdbClient.discoverMovies({
          'primary_release_date.gte': '1980-01-01',
          'primary_release_date.lte': '1989-12-31',
          'vote_average.gte': 7.2,
          'vote_count.gte': 300,
          sort_by: 'vote_average.desc',
          page
        });
        results.push(...data.results);
      }
      return results;
    }
  },
  {
    name: '1990s Cinema',
    description: 'Top-rated films from the 1990s',
    fetch: async (startPage = 1) => {
      const results = [];
      for (let page = startPage; page < startPage + PAGES_PER_RUN; page++) {
        const data = await tmdbClient.discoverMovies({
          'primary_release_date.gte': '1990-01-01',
          'primary_release_date.lte': '1999-12-31',
          'vote_average.gte': 7.2,
          'vote_count.gte': 300,
          sort_by: 'vote_average.desc',
          page
        });
        results.push(...data.results);
      }
      return results;
    }
  },
  {
    name: '2000s Cinema',
    description: 'Top-rated films from the 2000s',
    fetch: async (startPage = 1) => {
      const results = [];
      for (let page = startPage; page < startPage + PAGES_PER_RUN; page++) {
        const data = await tmdbClient.discoverMovies({
          'primary_release_date.gte': '2000-01-01',
          'primary_release_date.lte': '2009-12-31',
          'vote_average.gte': 7.2,
          'vote_count.gte': 300,
          sort_by: 'vote_average.desc',
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
    strategies_skipped: 0,
    tmdb_movies_found: 0,
    already_in_db: 0,
    new_movies_added: 0,
    errors: 0
  };

  const allTmdbIds = new Set();
  const newMoviesToAdd = [];

  // Execute discovery strategies with cursor support
  for (const strategy of DISCOVERY_STRATEGIES) {
    logger.info(`\n🔍 Strategy: ${strategy.name}`);
    logger.info(`   Description: ${strategy.description}`);

    // Single-shot strategies skip cursor entirely
    const isPaginated = strategy.paginated !== false;

    let startPage = 1;
    if (isPaginated) {
      const cursor = await getCursor(strategy.name);
      if (cursor.exhausted) {
        logger.info(`   ⏭️  Skipped (exhausted, cooling down)`);
        stats.strategies_skipped++;
        continue;
      }
      startPage = cursor.lastPage > 0 ? cursor.lastPage + 1 : 1;
      logger.info(`   📖 Resuming from page ${startPage}`);
    }

    try {
      const movies = isPaginated
        ? await strategy.fetch(startPage)
        : await strategy.fetch();
      logger.success(`   Found ${movies.length} movies from TMDB`);

      if (isPaginated) {
        // WHY: empty results signal the strategy has no more pages to offer
        const isExhausted = movies.length === 0;
        const lastPage = startPage + PAGES_PER_RUN - 1;
        await updateCursor(strategy.name, lastPage, isExhausted);

        if (isExhausted) {
          logger.info(`   📭 Strategy exhausted — will skip for ${CURSOR_COOLDOWN_DAYS} days`);
        }
      }

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

    const GENRE_TARGETS = {
      Thriller: 400, Mystery: 200, 'Science Fiction': 350, Horror: 400,
      Drama: 500, Comedy: 400, Documentary: 200, Animation: 250
    };
    const LANG_TARGETS = {
      hi: 200, ta: 150, te: 150, ml: 150, ko: 300,
      ja: 200, zh: 200, fr: 200, es: 200, de: 150, it: 150, fa: 100, pt: 150
    };

    logger.info('Genre coverage:');
    for (const [genre, target] of Object.entries(GENRE_TARGETS)) {
      const count = genreCounts[genre] || 0;
      const halfTarget = Math.floor(target * 0.5);
      if (count < halfTarget) {
        const shortfall = target - count;
        logger.warn(`  🚨 NEEDS BACKFILL — ${genre}: ${count} / ${target} target (${shortfall} short)`);
      } else {
        const flag = count < target ? '⚠️ ' : '✅';
        logger.info(`  ${flag} ${genre}: ${count} / ${target} target`);
      }
    }
    logger.info('Language coverage:');
    for (const [lang, target] of Object.entries(LANG_TARGETS)) {
      const count = langCounts[lang] || 0;
      const halfTarget = Math.floor(target * 0.5);
      if (count < halfTarget) {
        const shortfall = target - count;
        logger.warn(`  🚨 NEEDS BACKFILL — ${lang}: ${count} / ${target} target (${shortfall} short)`);
      } else {
        const flag = count < target ? '⚠️ ' : '✅';
        logger.info(`  ${flag} ${lang}: ${count} / ${target} target`);
      }
    }
  } catch (auditErr) {
    logger.warn(`Coverage audit failed: ${auditErr.message}`);
  }

  // Final summary
  logger.section('📊 DISCOVERY SUMMARY');
  logger.info(`Strategies executed: ${stats.strategies_executed}/${DISCOVERY_STRATEGIES.length} (${stats.strategies_skipped} skipped — exhausted)`);
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
