// Add to top of existing script

const MAX_RETRIES = 3;
const RETRY_DELAY = 5000; // 5 seconds

async function fetchWithRetry(tmdbId, retryCount = 0) {
  try {
    const movie = await tmdbClient.getMovieDetails(tmdbId);
    return movie;
  } catch (error) {
    if (retryCount < MAX_RETRIES) {
      logger.warn(`Retry ${retryCount + 1}/${MAX_RETRIES} for tmdb_id ${tmdbId}`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return fetchWithRetry(tmdbId, retryCount + 1);
    }
    throw error;
  }
}

// In your main loop, update status properly:
async function processMovie(movie) {
  try {
    // Mark as fetching
    await supabase.from('movies').update({ status: 'fetching' }).eq('id', movie.id);
    
    // Fetch data
    const details = await fetchWithRetry(movie.tmdb_id);
    
    // Update with data AND mark as complete
    await updateMovie(movie.id, {
      ...details,
      fetched_at: new Date().toISOString(),
      status: 'scoring', // Move to next stage
      last_error: null,
      error_type: null
    });
    
  } catch (error) {
    // Mark as error with details
    await supabase.from('movies').update({
      status: 'error',
      error_type: classifyError(error),
      last_error: error.message,
      last_error_at: new Date().toISOString(),
      retry_count: (movie.retry_count || 0) + 1
    }).eq('id', movie.id);
  }
}

function classifyError(error) {
  if (error.message.includes('404')) return 'tmdb_not_found';
  if (error.message.includes('429')) return 'tmdb_rate_limit';
  if (error.message.includes('timeout')) return 'timeout';
  if (error.message.includes('validation')) return 'validation_error';
  return 'unknown';
}
