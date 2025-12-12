// src/shared/services/recommendation-cache.js

import { supabase } from '@/shared/lib/supabase/client'

/**
 * Cache for user's watched movie TMDB IDs
 * Reduces redundant queries across recommendation functions
 */
const watchedMoviesCache = new Map()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

/**
 * Get user's watched TMDB IDs (with caching)
 * Single optimized query with join
 */
export async function getWatchedTmdbIds(userId) {
  const cacheKey = userId
  const cached = watchedMoviesCache.get(cacheKey)
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.tmdbIds
  }
  
  // ✅ OPTIMIZED: Single query with join
  const { data, error } = await supabase
    .from('user_history')
    .select('movies!inner(tmdb_id)')
    .eq('user_id', userId)
  
  if (error) {
    console.error('[Cache] Failed to fetch watched movies:', error)
    return new Set()
  }
  
  const tmdbIds = new Set(
    data
      .map(h => h.movies?.tmdb_id)
      .filter(Boolean)
  )
  
  // Cache it
  watchedMoviesCache.set(cacheKey, {
    tmdbIds,
    timestamp: Date.now()
  })
  
  return tmdbIds
}

/**
 * Get user's genre preferences (with caching)
 */
const genrePrefsCache = new Map()

export async function getUserGenrePreferences(userId) {
  const cached = genrePrefsCache.get(userId)
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.genreIds
  }
  
  const { data, error } = await supabase
    .from('user_preferences')
    .select('genre_id')
    .eq('user_id', userId)
  
  if (error || !data) {
    return []
  }
  
  const genreIds = data.map(p => p.genre_id)
  
  genrePrefsCache.set(userId, {
    genreIds,
    timestamp: Date.now()
  })
  
  return genreIds
}

/**
 * Clear cache for a specific user (call after watch history updates)
 */
export function clearUserCache(userId) {
  watchedMoviesCache.delete(userId)
  genrePrefsCache.delete(userId)
}
