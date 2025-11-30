// src/shared/services/recommendations.js
/**
 * FeelFlick Recommendation Engine
 * 
 * Strategy:
 * 1. Genre-based personalization using user preferences
 * 2. Similar movies from watch history
 * 3. Hybrid scoring for quality results
 * 
 * @module recommendations
 */

import { supabase } from '@/shared/lib/supabase/client'
import * as tmdb from '@/shared/api/tmdb'

/**
 * Get personalized movie recommendations for a user
 * @param {string} userId - User UUID
 * @param {Object} options - Configuration options
 * @returns {Promise<Object>} Recommendation sets
 */
export async function getPersonalizedRecommendations(userId, options = {}) {
  const {
    limit = 20,
    includeGenreBased = true,
    includeHistoryBased = true,
    signal,
  } = options

  try {
    // Run recommendations in parallel for speed
    const [genreRecs, historyRecs] = await Promise.all([
      includeGenreBased ? getGenreBasedRecommendations(userId, { limit, signal }) : null,
      includeHistoryBased ? getHistoryBasedRecommendations(userId, { limit, signal }) : null,
    ])

    return {
      genreBased: genreRecs || [],
      historyBased: historyRecs || [],
      timestamp: new Date().toISOString(),
    }
  } catch (error) {
    console.error('[Recommendations] Failed to get personalized recommendations:', error)
    throw error
  }
}

/**
 * Get recommendations based on user's genre preferences
 * Uses TMDB discover with weighted genre sorting
 */
export async function getGenreBasedRecommendations(userId, options = {}) {
  const { limit = 20, signal } = options

  try {
    // 1. Fetch user's preferred genres
    const { data: preferences, error: prefError } = await supabase
      .from('user_preferences')
      .select('genre_id')
      .eq('user_id', userId)

    if (prefError) throw prefError

    if (!preferences || preferences.length === 0) {
      console.warn('[Recommendations] No genre preferences found for user')
      return []
    }

    const genreIds = preferences.map(p => p.genre_id)
    console.log('[Recommendations] User preferred genres:', genreIds)

    // 2. Get movies the user has already watched (to exclude)
    const { data: watchedMovies } = await supabase
      .from('user_history')
      .select('movie_id')
      .eq('user_id', userId)

    const watchedTmdbIds = new Set()
    if (watchedMovies && watchedMovies.length > 0) {
      // Get TMDB IDs for watched movies
      const { data: movies } = await supabase
        .from('movies')
        .select('tmdb_id')
        .in('id', watchedMovies.map(m => m.movie_id))
      
      if (movies) {
        movies.forEach(m => watchedTmdbIds.add(m.tmdb_id))
      }
    }

    // 3. Fetch multiple pages from TMDB to get enough unwatched movies
    const allResults = []
    const maxPages = 3
    
    for (let page = 1; page <= maxPages && allResults.length < limit; page++) {
      const response = await tmdb.discoverMovies({
        genreIds: genreIds.join(','),
        sortBy: 'popularity.desc',
        voteAverageGte: 6.5, // Quality filter
        page,
        signal,
      })

      if (response.results && response.results.length > 0) {
        // Filter out watched movies
        const unwatched = response.results.filter(
          movie => !watchedTmdbIds.has(movie.id) && movie.poster_path
        )
        allResults.push(...unwatched)
      }

      if (!response.results || response.results.length === 0) break
    }

    // 4. Return top results
    return allResults.slice(0, limit)
  } catch (error) {
    console.error('[Recommendations] Genre-based recommendations failed:', error)
    return []
  }
}

/**
 * Get recommendations based on user's watch history
 * Finds similar movies to what they've watched
 */
export async function getHistoryBasedRecommendations(userId, options = {}) {
  const { limit = 20, signal } = options

  try {
    // 1. Get user's recent watch history (last 10 movies)
    const { data: history, error: historyError } = await supabase
      .from('user_history')
      .select(`
        movie_id,
        watched_at,
        movies!inner(tmdb_id, title)
      `)
      .eq('user_id', userId)
      .order('watched_at', { ascending: false })
      .limit(10)

    if (historyError) throw historyError

    if (!history || history.length === 0) {
      console.warn('[Recommendations] No watch history found for user')
      return []
    }

    console.log(`[Recommendations] Found ${history.length} movies in watch history`)

    // 2. Get all watched TMDB IDs for exclusion
    const { data: allWatched } = await supabase
      .from('user_history')
      .select('movie_id')
      .eq('user_id', userId)

    const watchedTmdbIds = new Set()
    if (allWatched && allWatched.length > 0) {
      const { data: movies } = await supabase
        .from('movies')
        .select('tmdb_id')
        .in('id', allWatched.map(m => m.movie_id))
      
      if (movies) {
        movies.forEach(m => watchedTmdbIds.add(m.tmdb_id))
      }
    }

    // 3. For each watched movie, get similar movies from TMDB
    const similarMoviesPromises = history.slice(0, 5).map(async (item) => {
      try {
        const tmdbId = item.movies.tmdb_id
        
        // Get both similar and recommended movies
        const [similar, recommended] = await Promise.all([
          tmdb.getSimilarMovies(tmdbId, { page: 1, signal }),
          tmdb.getMovieRecommendations(tmdbId, { page: 1, signal }),
        ])

        const combined = [
          ...(similar.results || []),
          ...(recommended.results || []),
        ]

        return {
          sourceMovie: item.movies.title,
          sourceTmdbId: tmdbId,
          watchedAt: item.watched_at,
          movies: combined.filter(m => m.poster_path),
        }
      } catch (error) {
        console.warn(`[Recommendations] Failed to get similar movies for ${item.movies.title}:`, error)
        return { sourceMovie: item.movies.title, movies: [] }
      }
    })

    const similarResults = await Promise.all(similarMoviesPromises)

    // 4. Aggregate and score all similar movies
    const movieScores = new Map()

    similarResults.forEach((result, idx) => {
      const recencyWeight = 1 / (idx + 1) // More recent watches have higher weight
      
      result.movies.forEach((movie) => {
        // Skip if already watched
        if (watchedTmdbIds.has(movie.id)) return

        if (!movieScores.has(movie.id)) {
          movieScores.set(movie.id, {
            movie,
            score: 0,
            sources: [],
          })
        }

        const entry = movieScores.get(movie.id)
        entry.score += recencyWeight * (movie.popularity || 0) * 0.01
        entry.sources.push(result.sourceMovie)
      })
    })

    // 5. Sort by score and return top results
    const rankedMovies = Array.from(movieScores.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(entry => ({
        ...entry.movie,
        _recommendationMeta: {
          sources: entry.sources,
          score: entry.score,
        },
      }))

    console.log(`[Recommendations] Generated ${rankedMovies.length} history-based recommendations`)
    
    return rankedMovies
  } catch (error) {
    console.error('[Recommendations] History-based recommendations failed:', error)
    return []
  }
}

/**
 * Get mood-personalized recommendations
 * Combines mood genre mapping with user preferences
 */
export async function getMoodRecommendations(userId, moodId, options = {}) {
  const { limit = 20, signal } = options

  try {
    // 1. Get mood-genre mapping
    const moodGenres = MOOD_GENRE_MAP[moodId]
    if (!moodGenres) {
      console.warn(`[Recommendations] No genre mapping for mood ${moodId}`)
      return []
    }

    // 2. Get user preferences to personalize within mood
    const { data: preferences } = await supabase
      .from('user_preferences')
      .select('genre_id')
      .eq('user_id', userId)

    const userGenres = preferences ? preferences.map(p => p.genre_id) : []

    // 3. Find intersection of mood genres and user preferences
    const personalizedGenres = moodGenres.filter(g => userGenres.includes(g))
    const genresToUse = personalizedGenres.length > 0 ? personalizedGenres : moodGenres

    console.log(`[Recommendations] Mood ${moodId} using genres:`, genresToUse)

    // 4. Get watched movies for exclusion
    const { data: watchedMovies } = await supabase
      .from('user_history')
      .select('movie_id')
      .eq('user_id', userId)

    const watchedTmdbIds = new Set()
    if (watchedMovies && watchedMovies.length > 0) {
      const { data: movies } = await supabase
        .from('movies')
        .select('tmdb_id')
        .in('id', watchedMovies.map(m => m.movie_id))
      
      if (movies) {
        movies.forEach(m => watchedTmdbIds.add(m.tmdb_id))
      }
    }

    // 5. Fetch from TMDB
    const response = await tmdb.discoverMovies({
      genreIds: genresToUse.join(','),
      sortBy: 'popularity.desc',
      voteAverageGte: 6.0,
      page: 1,
      signal,
    })

    if (!response.results || response.results.length === 0) {
      return []
    }

    // 6. Filter and return
    const recommendations = response.results
      .filter(movie => !watchedTmdbIds.has(movie.id) && movie.poster_path)
      .slice(0, limit)

    console.log(`[Recommendations] Generated ${recommendations.length} mood-based recommendations`)
    
    return recommendations
  } catch (error) {
    console.error('[Recommendations] Mood recommendations failed:', error)
    return []
  }
}

/**
 * Mood to Genre mapping
 * Maps mood IDs to TMDB genre IDs for personalized filtering
 */
export const MOOD_GENRE_MAP = {
  1: [35, 10751, 10749], // Cozy Tonight = Comedy + Family + Romance
  2: [12, 28, 14], // Adventurous = Adventure + Action + Fantasy
  8: [10749, 18], // Romantic = Romance + Drama
  10: [35, 16, 10751], // Silly & Fun = Comedy + Animation + Family
  11: [27, 53, 80, 9648], // Dark & Intense = Horror + Thriller + Crime + Mystery
  3: [878, 14, 12], // Futuristic = Sci-Fi + Fantasy + Adventure
  4: [18, 36, 10752], // Thoughtful = Drama + History + War
  5: [16, 10751, 14], // Whimsical = Animation + Family + Fantasy
  6: [99, 36], // Documentary + History
  7: [10402, 18], // Musical + Drama
  9: [53, 9648, 80], // Suspenseful = Thriller + Mystery + Crime
}

/**
 * Get fallback recommendations when user has no data
 * Returns curated popular movies
 */
export async function getFallbackRecommendations(options = {}) {
  const { limit = 20, signal } = options

  try {
    const response = await tmdb.getPopularMovies({ page: 1, signal })
    
    if (!response.results) return []
    
    return response.results
      .filter(movie => movie.poster_path && movie.vote_average >= 7.0)
      .slice(0, limit)
  } catch (error) {
    console.error('[Recommendations] Fallback recommendations failed:', error)
    return []
  }
}
