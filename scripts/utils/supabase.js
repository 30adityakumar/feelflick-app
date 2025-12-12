// scripts/utils/supabase.js

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

/**
 * Create a new movie record
 */
async function createMovie(tmdbId) {
  const { data, error } = await supabase
    .from('movies')
    .insert({ tmdb_id: tmdbId })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create movie: ${error.message}`);
  }

  return data;
}

/**
 * Update movie with proper JSON handling
 */
async function updateMovie(movieId, updateData) {
  // Clean the data - ensure arrays stay as arrays, not stringified
  const cleanedData = {};
  
  for (const [key, value] of Object.entries(updateData)) {
    // Skip null/undefined
    if (value === null || value === undefined) {
      cleanedData[key] = value;
      continue;
    }
    
    // Handle specific JSON fields that should remain as native JSON
    if (['genres', 'keywords', 'cast', 'crew', 'json_data', 'embedding'].includes(key)) {
      // If it's already an array/object, keep it as is
      // If it's a string, try to parse it
      if (typeof value === 'string') {
        try {
          cleanedData[key] = JSON.parse(value);
        } catch {
          // If parse fails, it's just a string - keep it
          cleanedData[key] = value;
        }
      } else {
        // Already an array/object, keep as is
        cleanedData[key] = value;
      }
    } else {
      // For non-JSON fields, use as is
      cleanedData[key] = value;
    }
  }

  const { data, error } = await supabase
    .from('movies')
    .update(cleanedData)
    .eq('id', movieId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update movie ${movieId}: ${error.message}`);
  }

  return data;
}

/**
 * Get movie by TMDB ID
 */
async function getMovieByTmdbId(tmdbId) {
  const { data, error } = await supabase
    .from('movies')
    .select('*')
    .eq('tmdb_id', tmdbId)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to get movie: ${error.message}`);
  }

  return data;
}

/**
 * Log pipeline run
 */
async function logUpdateRun(runData) {
  const { data, error } = await supabase
    .from('update_runs')
    .insert(runData)
    .select()
    .single();

  if (error) {
    console.error('Failed to log run:', error.message);
    return null;
  }

  return data;
}

/**
 * Complete pipeline run
 */
async function completeUpdateRun(runId, updateData) {
  const { data, error } = await supabase
    .from('update_runs')
    .update({
      ...updateData,
      completed_at: new Date().toISOString()
    })
    .eq('id', runId)
    .select()
    .single();

  if (error) {
    console.error('Failed to complete run:', error.message);
    return null;
  }

  return data;
}

module.exports = {
  supabase,
  createMovie,
  updateMovie,
  getMovieByTmdbId,
  logUpdateRun,
  completeUpdateRun
};
