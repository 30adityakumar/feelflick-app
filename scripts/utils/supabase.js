// scripts/utils/supabase.js

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment');
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Helper: Get movies that need updates
 */
async function getMoviesNeedingUpdate(updateType, limit = 1000) {
  let query = supabase.from('movies').select('id, tmdb_id, title, vote_count, popularity');

  switch (updateType) {
    case 'new': // Movies without basic metadata
      query = query.is('status', null).or('status.eq.pending');
      break;

    case 'stale_metadata': // Metadata older than 90 days
      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
      query = query.lt('last_tmdb_sync', ninetyDaysAgo);
      break;

    case 'no_scores': // Missing scores
      query = query.eq('has_scores', false);
      break;

    case 'no_embeddings': // Missing embeddings
      query = query.eq('has_embeddings', false).eq('has_scores', true);
      break;

    case 'stale_embeddings': // Embeddings older than scores
      query = query
        .not('last_scored_at', 'is', null)
        .not('last_embedding_at', 'is', null)
        .filter('last_embedding_at', 'lt', 'last_scored_at');
      break;

    case 'stale_ratings': // External ratings older than 30 days
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      query = query
        .select('id, tmdb_id, title, vote_count, ratings_external(fetched_at)')
        .or(`ratings_external.is.null,ratings_external.fetched_at.lt.${thirtyDaysAgo}`);
      break;
  }

  query = query.order('vote_count', { ascending: false }).limit(limit);

  const { data, error } = await query;
  
  if (error) {
    throw new Error(`Failed to fetch movies: ${error.message}`);
  }

  return data || [];
}

/**
 * Helper: Update movie metadata
 */
async function updateMovie(movieId, updates) {
  const { data, error } = await supabase
    .from('movies')
    .update(updates)
    .eq('id', movieId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update movie ${movieId}: ${error.message}`);
  }

  return data;
}

/**
 * Helper: Get movie by TMDB ID
 */
async function getMovieByTmdbId(tmdbId) {
  const { data, error } = await supabase
    .from('movies')
    .select('*')
    .eq('tmdb_id', tmdbId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch movie with tmdb_id ${tmdbId}: ${error.message}`);
  }

  return data;
}

/**
 * Helper: Create new movie
 */
async function createMovie(tmdbId) {
  const { data, error } = await supabase
    .from('movies')
    .insert({ 
      tmdb_id: tmdbId, 
      status: 'pending',
      inserted_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create movie with tmdb_id ${tmdbId}: ${error.message}`);
  }

  return data;
}

/**
 * Helper: Add to retry queue
 */
async function addToRetryQueue(tmdbId, action, error, priority = 3) {
  const { error: queueError } = await supabase
    .from('movie_update_queue')
    .upsert({
      tmdb_id: tmdbId,
      action,
      priority,
      last_error: error.message || error,
      attempts: 1,
      added_at: new Date().toISOString()
    }, {
      onConflict: 'tmdb_id',
      ignoreDuplicates: false
    });

  if (queueError) {
    console.error(`Failed to add to retry queue: ${queueError.message}`);
  }
}

/**
 * Helper: Log update run
 */
async function logUpdateRun(runData) {
  const { data, error } = await supabase
    .from('update_runs')
    .insert(runData)
    .select()
    .single();

  if (error) {
    console.error(`Failed to log update run: ${error.message}`);
    return null;
  }

  return data;
}

/**
 * Helper: Update run completion
 */
async function completeUpdateRun(runId, updates) {
  const { error } = await supabase
    .from('update_runs')
    .update({
      ...updates,
      completed_at: new Date().toISOString()
    })
    .eq('id', runId);

  if (error) {
    console.error(`Failed to complete update run: ${error.message}`);
  }
}

module.exports = {
  supabase,
  getMoviesNeedingUpdate,
  updateMovie,
  getMovieByTmdbId,
  createMovie,
  addToRetryQueue,
  logUpdateRun,
  completeUpdateRun
};
