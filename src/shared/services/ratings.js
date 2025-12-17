/**
 * FeelFlick Ratings Service - PRODUCTION VERSION
 * Handles 1-10 integer ratings only
 */

import { supabase } from '@/shared/lib/supabase/client'

/**
 * Get user's rating for a movie
 * @param {string} userId 
 * @param {number} movieId - Internal movie ID (NOT TMDB ID!)
 * @returns {Promise<number|null>} Rating 1-10 or null
 */
/**
 * Get user's rating for a movie
 */
export async function getUserRating(userId, movieId) {
  if (!userId || !movieId) return null

  try {
    const { data, error } = await supabase
      .from('user_ratings')
      .select('rating')
      .eq('user_id', userId)
      .eq('movie_id', movieId)
      .maybeSingle()

    if (error) {
      if (error.code !== 'PGRST116') {
        console.error('[getUserRating] Error:', error)
      }
      return null
    }

    return data?.rating || null
  } catch (err) {
    console.error('[getUserRating] Exception:', err)
    return null
  }
}

/**
 * Set or update user's rating
 */
export async function setUserRating(userId, movieId, rating) {
  if (!userId || !movieId) {
    console.error('[setUserRating] Missing userId or movieId')
    return false
  }

  if (!Number.isInteger(rating) || rating < 1 || rating > 10) {
    console.error('[setUserRating] Rating must be integer 1-10, got:', rating)
    return false
  }

  try {
    // First verify movie exists
    const { data: movieExists, error: checkError } = await supabase
      .from('movies')
      .select('id')
      .eq('id', movieId)
      .maybeSingle()

    if (checkError || !movieExists) {
      console.error('[setUserRating] Movie not in database:', movieId)
      return false
    }

    // Upsert rating (NO 'source' field!)
    const { error } = await supabase
      .from('user_ratings')
      .upsert({
        user_id: userId,
        movie_id: movieId,
        rating: rating,
        rated_at: new Date().toISOString()
        // ❌ REMOVED: source: source
      }, {
        onConflict: 'user_id,movie_id',
        ignoreDuplicates: false
      })

    if (error) {
      console.error('[setUserRating] Upsert error:', error)
      return false
    }

    console.log(`[setUserRating] ✅ Saved: ${rating}/10 for movie ${movieId}`)
    return true
  } catch (err) {
    console.error('[setUserRating] Exception:', err)
    return false
  }
}


/**
 * Set or update user's rating
 * @param {string} userId 
 * @param {number} movieId - Internal movie ID (NOT TMDB ID!)
 * @param {number} rating - Integer 1-10
 * @param {string} source - Where rating came from
 * @returns {Promise<boolean>}
 */
export async function setUserRating(userId, movieId, rating, source = 'movie_detail') {
  // Validate
  if (!userId || !movieId) {
    console.error('[setUserRating] Missing userId or movieId')
    return false
  }

  if (!Number.isInteger(rating) || rating < 1 || rating > 10) {
    console.error('[setUserRating] Rating must be integer 1-10, got:', rating)
    return false
  }

  try {
    // First verify movie exists in database
    const { data: movieExists, error: checkError } = await supabase
      .from('movies')
      .select('id')
      .eq('id', movieId)
      .maybeSingle()

    if (checkError || !movieExists) {
      console.error('[setUserRating] Movie not in database:', movieId)
      return false
    }

    // Now safe to insert/update rating
    const { error } = await supabase
      .from('user_ratings')
      .upsert({
        user_id: userId,
        movie_id: movieId,
        rating: rating,
        rated_at: new Date().toISOString(),
        source: source
      }, {
        onConflict: 'user_id,movie_id',
        ignoreDuplicates: false
      })

    if (error) {
      console.error('[setUserRating] Upsert error:', error)
      return false
    }

    console.log(`[setUserRating] ✅ Saved: ${rating}/10 for movie ${movieId}`)
    return true
  } catch (err) {
    console.error('[setUserRating] Exception:', err)
    return false
  }
}

/**
 * Delete user's rating
 * @param {string} userId 
 * @param {number} movieId 
 * @returns {Promise<boolean>}
 */
export async function deleteRating(userId, movieId) {
  if (!userId || !movieId) return false

  try {
    const { error } = await supabase
      .from('user_ratings')
      .delete()
      .eq('user_id', userId)
      .eq('movie_id', movieId)

    if (error) {
      console.error('[deleteRating] Error:', error)
      return false
    }

    console.log(`[deleteRating] ✅ Deleted rating for movie ${movieId}`)
    return true
  } catch (err) {
    console.error('[deleteRating] Exception:', err)
    return false
  }
}

// Remove all old 1-5 star functions - they're obsolete!
