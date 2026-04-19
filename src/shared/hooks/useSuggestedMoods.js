import { useEffect, useState } from 'react'
import { supabase } from '@/shared/lib/supabase/client'
import { computeUserProfile } from '@/shared/services/recommendations'

// Module-level cache for mood genre weights (all 12 discover moods, loaded once per session)
let allWeightsCache = null
let allWeightsInflight = null

/** @internal — test use only */
export function _resetWeightsCache() {
  allWeightsCache = null
  allWeightsInflight = null
}

async function loadAllMoodWeights() {
  if (allWeightsCache) return allWeightsCache
  if (allWeightsInflight) return allWeightsInflight

  allWeightsInflight = supabase
    .from('discover_mood_genre_weights')
    .select('mood_id, genre_id, weight')
    .then(({ data, error }) => {
      allWeightsInflight = null
      if (error || !data) return {}
      // Group by mood_id → Map<moodId, Array<{genre_id, weight}>>
      const map = {}
      for (const row of data) {
        if (!map[row.mood_id]) map[row.mood_id] = []
        map[row.mood_id].push({ genre_id: row.genre_id, weight: Number(row.weight) })
      }
      allWeightsCache = map
      return map
    })

  return allWeightsInflight
}

// Time-of-day → discover mood ID sets that get a +10 bonus
const TIME_OF_DAY_MOODS = {
  morning:   [1, 5, 10],   // Cozy, Whimsical, Silly
  afternoon: [2, 3, 6],    // Adventurous, Futuristic, Enlightened
  evening:   [4, 7, 8, 12],// Thoughtful, Musical, Romantic, Nostalgic
  night:     [9, 11],      // Suspenseful, Dark & Intense
}

// Day-of-week context bonuses (dayOfWeek is JS getDay(): 0=Sun,1=Mon,...,6=Sat)
function getDayBonus(moodId, dayOfWeek) {
  const isFriSat = dayOfWeek === 5 || dayOfWeek === 6
  const isSun    = dayOfWeek === 0
  const isWeekday = !isFriSat && !isSun

  if (isFriSat && [2, 6, 10].includes(moodId)) return 8   // Adventurous, Enlightened, Silly
  if (isSun    && [1, 5, 12].includes(moodId)) return 8   // Cozy, Whimsical, Nostalgic
  if (isWeekday && [4, 9].includes(moodId))   return 5   // Thoughtful, Suspenseful
  return 0
}

// Content profile bonuses — avgIntensity and avgPacing are on a 1–10 scale
// (computed from movie.intensity_score / pacing_score in computeContentProfile)
function getContentBonus(moodId, avgIntensity, avgPacing) {
  let bonus = 0
  if (avgIntensity >= 6.5 && [11, 2, 6].includes(moodId))  bonus += 8
  if (avgIntensity <= 3.5 && [1, 12, 7].includes(moodId))  bonus += 8
  if (avgPacing    >= 6.5 && [2, 6].includes(moodId))       bonus += 5
  if (avgPacing    <= 3.5 && [4, 11].includes(moodId))      bonus += 5
  return bonus
}

/**
 * Deterministic heuristic: suggests 2–3 mood IDs for the current user context.
 * Reads the cached user profile + discover_mood_genre_weights — no LLM call.
 *
 * @param {string|null} userId
 * @param {string} timeOfDay - 'morning'|'afternoon'|'evening'|'night'
 * @param {number} dayOfWeek - JS Date.getDay() value (0=Sun … 6=Sat)
 * @returns {{ suggestedMoodIds: number[], loading: boolean }}
 */
export function useSuggestedMoods(userId, timeOfDay, dayOfWeek) {
  const [suggestedMoodIds, setSuggestedMoodIds] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!userId) return

    let cancelled = false

    async function compute() {
      setLoading(true)
      try {
        const [profile, allWeights] = await Promise.all([
          computeUserProfile(userId),
          loadAllMoodWeights(),
        ])

        if (cancelled) return

        // New users have no signal — skip chips entirely
        if (!profile || profile.meta?.confidence === 'none') {
          setSuggestedMoodIds([])
          return
        }

        const preferredGenres = new Set(profile.genres?.preferred || [])
        const avgIntensity    = profile.contentProfile?.avgIntensity ?? 5
        const avgPacing       = profile.contentProfile?.avgPacing    ?? 5

        const scores = []

        for (let moodId = 1; moodId <= 12; moodId++) {
          const weights = allWeights[moodId] || []
          if (weights.length === 0) continue

          // 1. Genre overlap score (0–60)
          const totalWeight = weights.reduce((sum, w) => sum + w.weight, 0)
          const matchedWeight = weights
            .filter(w => preferredGenres.has(w.genre_id))
            .reduce((sum, w) => sum + w.weight, 0)
          const genreScore = totalWeight > 0
            ? (matchedWeight / totalWeight) * 60
            : 0

          // 2. Time of day bonus (+10)
          const todBonus = (TIME_OF_DAY_MOODS[timeOfDay] || []).includes(moodId) ? 10 : 0

          // 3. Day of week bonus (+8 or +5)
          const dayBonus = getDayBonus(moodId, dayOfWeek)

          // 4. Content profile bonus (+5 or +8)
          const contentBonus = getContentBonus(moodId, avgIntensity, avgPacing)

          scores.push({ moodId, total: genreScore + todBonus + dayBonus + contentBonus })
        }

        scores.sort((a, b) => b.total - a.total)

        const topScore = scores[0]?.total ?? 0

        // Suppress chips if signal is too weak
        if (topScore < 15) {
          setSuggestedMoodIds([])
          return
        }

        // Number of chips scales with confidence: 2 if modest signal, 3 if strong
        const count = topScore >= 40 ? 3 : 2
        setSuggestedMoodIds(scores.slice(0, count).map(s => s.moodId))
      } catch {
        // Silent fallback — suggestions are non-critical
        setSuggestedMoodIds([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    compute()
    return () => { cancelled = true }
  }, [userId, timeOfDay, dayOfWeek])

  return { suggestedMoodIds, loading }
}
