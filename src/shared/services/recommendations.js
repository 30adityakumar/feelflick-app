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
  const { limit = 20, signal, excludeTmdbIds = [] } = options

  const excludeSet = new Set(
    (excludeTmdbIds || []).filter(Boolean).map((n) => Number(n))
  )

  try {
    const response = await tmdb.getPopularMovies({ page: 1, signal })

    if (!response.results) return []

    return response.results
      .filter(
        (movie) =>
          movie.poster_path &&
          movie.vote_average &&
          movie.vote_average >= 7.0 &&
          !excludeSet.has(Number(movie.id))
      )
      .slice(0, limit)
  } catch (error) {
    console.error('[Recommendations] Fallback recommendations failed:', error)
    return []
  }
}


// src/shared/services/recommendations.js

export async function getTopPickForUser(userId, options = {}) {
  const { signal, excludeTmdbIds = [] } = options

  const excludeSet = new Set(
    (excludeTmdbIds || []).filter(Boolean).map((n) => Number(n))
  )

  try {
    // 1. Start with history-based recs
    const historyRecs = await getHistoryBasedRecommendations(userId, {
      limit: 20,
      signal,
    })

    const goodHistory = (historyRecs || []).filter(
      (m) =>
        m &&
        m.vote_average &&
        m.vote_average >= 7.0 &&
        !excludeSet.has(Number(m.id))
    )

    let topPick = null

    if (goodHistory.length > 0) {
      topPick = goodHistory[0]
    } else {
      // 2. Fallback to genre recs
      const genreRecs = await getGenreBasedRecommendations(userId, {
        limit: 20,
        signal,
      })

      const goodGenre = (genreRecs || []).filter(
        (m) =>
          m &&
          m.vote_average &&
          m.vote_average >= 7.0 &&
          !excludeSet.has(Number(m.id))
      )

      if (goodGenre.length > 0) {
        topPick = goodGenre[0]
      } else {
        // 3. Fallback popular/high quality
        const fallback = await getFallbackRecommendations({
          limit: 20,
          signal,
          excludeTmdbIds: Array.from(excludeSet),
        })

        if (fallback && fallback.length > 0) {
          topPick = fallback[0]
        }
      }
    }

    // If nothing at all, just bail
    if (!topPick) {
      return null
    }

    // 4. Hydrate genres from Supabase movies table
    try {
      if (!topPick.genres || !Array.isArray(topPick.genres)) {
        const { data: dbMovie, error: dbErr } = await supabase
          .from('movies')
          .select('genres')
          .eq('tmdb_id', topPick.id)
          .maybeSingle()

        if (dbErr) {
          console.warn('[Recommendations] hero genres lookup error', dbErr)
        } else if (dbMovie && Array.isArray(dbMovie.genres)) {
          topPick = {
            ...topPick,
            genres: dbMovie.genres,
          }
        }
      }
    } catch (dbErr) {
      console.warn('[Recommendations] hero genres hydrate failed', dbErr)
    }

    return topPick
  } catch (error) {
    console.error('[Recommendations] getTopPickForUser failed:', error)
    return null
  }
}



export async function getQuickPicksForUser(userId, options = {}) {
  const { limit = 20, excludeTmdbId = null, signal } = options

  try {
    const [historyRecs, genreRecs] = await Promise.all([
      getHistoryBasedRecommendations(userId, { limit: 30, signal }),
      getGenreBasedRecommendations(userId, { limit: 30, signal }),
    ])

    const poolMap = new Map()

    function addToPool(list, baseScore = 1) {
      if (!list) return
      list.forEach((movie, idx) => {
        if (!movie || !movie.id) return
        const existing = poolMap.get(movie.id) || {
          movie,
          score: 0,
        }
        const rankBoost = 1 / (idx + 1)
        existing.score += baseScore * rankBoost
        poolMap.set(movie.id, existing)
      })
    }

    addToPool(historyRecs, 2) // history a bit more important
    addToPool(genreRecs, 1)

    let items = Array.from(poolMap.values())
      .map(entry => entry.movie)

    if (excludeTmdbId) {
      items = items.filter(m => m.id !== excludeTmdbId)
    }

    // Filter by basic quality
    items = items.filter(m => m.poster_path && (m.vote_average || 0) >= 6.0)

    return items.slice(0, limit)
  } catch (error) {
    console.error('[Recommendations] getQuickPicksForUser failed:', error)
    return []
  }
}

export async function getBecauseYouWatchedRows(userId, options = {}) {
  const { maxSeeds = 2, limitPerSeed = 20, signal } = options

  try {
    // Get recent history with movies.join to get tmdb_ids
    const { data: history, error } = await supabase
      .from('user_history')
      .select(`
        movie_id,
        watched_at,
        movies!inner (tmdb_id, title)
      `)
      .eq('user_id', userId)
      .order('watched_at', { ascending: false })
      .limit(20)

    if (error) throw error
    if (!history || history.length === 0) return []

    // Deduplicate seeds by movie_id
    const seenMovies = new Set()
    const seeds = []
    for (const item of history) {
      if (!item.movies?.tmdb_id) continue
      if (seenMovies.has(item.movie_id)) continue
      seeds.push(item)
      seenMovies.add(item.movie_id)
      if (seeds.length >= maxSeeds) break
    }

    if (seeds.length === 0) return []

    const rows = []

    for (const seed of seeds) {
      try {
        const tmdbId = seed.movies.tmdb_id
        const [similar, recommended] = await Promise.all([
          tmdb.getSimilarMovies(tmdbId, { page: 1, signal }),
          tmdb.getMovieRecommendations(tmdbId, { page: 1, signal }),
        ])

        const combined = [
          ...(similar.results || []),
          ...(recommended.results || []),
        ]

        // Get watched ids to exclude
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
          if (movies) movies.forEach(m => watchedTmdbIds.add(m.tmdb_id))
        }

        const filtered = combined
          .filter(m => m.poster_path && !watchedTmdbIds.has(m.id))

        const uniqueMap = new Map()
        filtered.forEach(m => {
          if (!uniqueMap.has(m.id)) uniqueMap.set(m.id, m)
        })

        const movies = Array.from(uniqueMap.values()).slice(0, limitPerSeed)

        if (movies.length > 0) {
          rows.push({
            seedTitle: seed.movies.title,
            seedTmdbId: tmdbId,
            movies,
          })
        }
      } catch (innerErr) {
        console.warn('[Recommendations] seed row failed:', innerErr)
      }
    }

    return rows
  } catch (error) {
    console.error('[Recommendations] getBecauseYouWatchedRows failed:', error)
    return []
  }
}

export async function getTopGenresForUser(userId, options = {}) {
  const { limit = 3 } = options

  try {
    const { data: prefs, error } = await supabase
      .from('user_preferences')
      .select('genre_id')
      .eq('user_id', userId)

    if (error) throw error
    if (!prefs || prefs.length === 0) return []

    const counts = new Map()
    prefs.forEach(p => {
      counts.set(p.genre_id, (counts.get(p.genre_id) || 0) + 1)
    })

    const sorted = Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(entry => entry[0])

    return sorted
  } catch (error) {
    console.error('[Recommendations] getTopGenresForUser failed:', error)
    return []
  }
}

export async function getTrendingForUser(userId, options = {}) {
  const { limit = 20, signal } = options

  try {
    // Get user's preferred genres
    const { data: prefs } = await supabase
      .from('user_preferences')
      .select('genre_id')
      .eq('user_id', userId)

    const preferredGenres = prefs ? prefs.map(p => p.genre_id) : []

    // Watched exclusion
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

    // Start from popular/trending
    const response = await tmdb.getPopularMovies({ page: 1, signal })
    if (!response.results) return []

    const filtered = response.results
      .filter(m => {
        if (!m.poster_path) return false
        if (watchedTmdbIds.has(m.id)) return false
        if (!preferredGenres || preferredGenres.length === 0) return true
        // Some overlap in genres (if genres array present in m)
        if (!m.genre_ids) return true
        return m.genre_ids.some(g => preferredGenres.includes(g))
      })
      .slice(0, limit)

    return filtered
  } catch (error) {
    console.error('[Recommendations] getTrendingForUser failed:', error)
    return []
  }
}

export async function getHiddenGemsForUser(userId, options = {}) {
  const { limit = 20, signal } = options

  try {
    // 1. Get top genres (if none, just bail gracefully)
    const topGenres = await getTopGenresForUser(userId, { limit: 3 })
    if (!topGenres || topGenres.length === 0) {
      console.warn('[Recommendations] Hidden gems: no top genres for user')
      return []
    }

    // 2. Get watched ids to exclude
    const { data: watchedMovies, error: watchedError } = await supabase
      .from('user_history')
      .select('movie_id')
      .eq('user_id', userId)

    if (watchedError) {
      console.warn('[Recommendations] Hidden gems: user_history error', watchedError)
    }

    const watchedTmdbIds = new Set()
    if (watchedMovies && watchedMovies.length > 0) {
      const { data: movies, error: moviesError } = await supabase
        .from('movies')
        .select('tmdb_id')
        .in('id', watchedMovies.map(m => m.movie_id))

      if (moviesError) {
        console.warn('[Recommendations] Hidden gems: movies lookup error', moviesError)
      } else if (movies) {
        movies.forEach(m => {
          if (m.tmdb_id) watchedTmdbIds.add(m.tmdb_id)
        })
      }
    }

    // 3. Call TMDB discover
    const response = await tmdb.discoverMovies({
      genreIds: topGenres.join(','),
      sortBy: 'vote_average.desc',
      voteCountGte: 100,
      page: 1,
      signal,
    })

    if (!response || !response.results) {
      console.warn('[Recommendations] Hidden gems: no TMDB results')
      return []
    }

    // 4. Hidden gem heuristic
    const candidates = response.results
      .filter(m =>
        m &&
        m.poster_path &&
        (m.vote_average || 0) >= 7.0 &&
        // Not too popular – tune threshold as needed
        (m.popularity || 0) < 60 &&
        !watchedTmdbIds.has(m.id)
      )
      .slice(0, limit)

    console.log(
      `[Recommendations] Hidden gems: returning ${candidates.length} candidates`
    )

    return candidates
  } catch (error) {
    console.error('[Recommendations] getHiddenGemsForUser failed:', error)
    // Fail soft – no row rather than breaking homepage
    return []
  }
}

/**
 * Get themed row using new enhanced scoring (Phase 1-2)
 * Uses quality_score, star_power, content dimensions
 */
export async function getThemedRow(userId, rowType, options = {}) {
  const { limit = 20, signal } = options

  // Get user's preferred genres
  const { data: userPrefs } = await supabase
    .from('user_preferences')
    .select('genre_id')
    .eq('user_id', userId)

  const userGenres = userPrefs?.map(p => p.genre_id) || []

  let query = supabase
    .from('movies')
    .select('id, tmdb_id, title, poster_path, vote_average, popularity, runtime, star_power, quality_score, pacing_score, intensity_score, emotional_depth_score, dialogue_density')
    .not('vote_average', 'is', null)

  // Apply row-specific filters
  if (rowType === 'hidden_gems') {
    query = query
      .gte('vote_average', 7.0)
      .lt('popularity', 60)
      .gte('vote_count', 100)
  } else if (rowType === 'slow_contemplative') {
    query = query
      .lt('pacing_score', 40)
      .gt('emotional_depth_score', 70)
      .gte('vote_average', 7.0)
  } else if (rowType === 'high_energy') {
    query = query
      .gt('pacing_score', 70)
      .gt('intensity_score', 70)
      .gte('vote_average', 6.5)
  } else if (rowType === 'quick_watches') {
    query = query
      .lt('runtime', 90)
      .gte('vote_average', 7.0)
      .not('runtime', 'is', null)
  }

  const { data: movies, error } = await query.limit(limit * 2)

  if (error) throw error

  // Calculate enhanced scores
  const scored = movies.map(movie => {
    const score = 
      (movie.popularity * 0.005) +
      (movie.vote_average * 10) +
      (movie.quality_score || 0) * 0.3 +
      (movie.star_power === 'no_stars' && rowType === 'hidden_gems' ? 15 : 0)

    return { ...movie, score }
  })

  // Sort and return
  return scored.sort((a, b) => b.score - a.score).slice(0, limit)
}

/**
 * Get slow & contemplative films (pacing < 40, depth > 70)
 */
export async function getSlowContemplative(userId, options = {}) {
  return getThemedRow(userId, 'slow_contemplative', options)
}

/**
 * Get quick watches under 90 minutes
 */
export async function getQuickWatches(userId, options = {}) {
  return getThemedRow(userId, 'quick_watches', options)
}