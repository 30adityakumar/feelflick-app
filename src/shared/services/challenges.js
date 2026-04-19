// src/shared/services/challenges.js

import { supabase } from '@/shared/lib/supabase/client'

const FIT_PROFILES = [
  'prestige_drama', 'arthouse', 'challenging_art', 'festival_discovery',
  'cult_classic', 'crowd_pleaser', 'comfort_watch', 'genre_popcorn',
  'franchise_entry', 'niche_world_cinema',
]

const MOOD_CHALLENGES = [
  { key: 'haunting', label: 'Haunting', description: 'Films that linger. Unsettling, somber, hard to shake.' },
  { key: 'mind-bending', label: 'Mind-Bending', description: 'Films that demand you think about them after.' },
  { key: 'devastating', label: 'Devastating', description: 'Emotionally gutting films. For when you want to feel.' },
  { key: 'contemplative', label: 'Contemplative', description: 'Slow, meditative cinema. Reflection over plot.' },
  { key: 'whimsical', label: 'Whimsical', description: 'Playful, imaginative, heart-forward films.' },
  { key: 'provocative', label: 'Provocative', description: 'Films built to start conversations.' },
]

// === HELPERS ===

function fitTitle(fp) {
  const titles = {
    prestige_drama: 'Prestige Drama',
    arthouse: 'Arthouse Cinema',
    challenging_art: 'Challenging Art Films',
    festival_discovery: 'Festival Discoveries',
    cult_classic: 'Cult Classics',
    crowd_pleaser: 'Crowd-Pleasers',
    comfort_watch: 'Comfort Watches',
    genre_popcorn: 'Genre Films',
    franchise_entry: 'Franchise Films',
    niche_world_cinema: 'World Cinema',
  }
  return titles[fp] || fp
}

function fitDescription(fp) {
  const descs = {
    prestige_drama: 'Awards-circuit dramas — deliberate pacing, weighty themes, performance-driven.',
    arthouse: 'Films prioritizing vision over convention. Director-driven, formally distinct.',
    challenging_art: 'Demanding cinema that rewards attention and rewatching.',
    festival_discovery: 'Small films that earned critical acclaim through festival circuits.',
    cult_classic: 'Films that found devoted audiences off the mainstream path.',
    crowd_pleaser: 'Accessible, entertaining films built to connect broadly.',
    comfort_watch: 'Warm, reliable films you can return to without friction.',
    genre_popcorn: 'Films that deliver on genre promise — no pretension, pure execution.',
    franchise_entry: 'Sequels, reboots, and shared-universe entries.',
    niche_world_cinema: 'International films with specific cultural contexts.',
  }
  return descs[fp] || ''
}

async function getWatchedMovieIds(userId) {
  if (!userId) return new Set()
  const { data } = await supabase.from('user_history').select('movie_id').eq('user_id', userId)
  return new Set((data || []).map(d => d.movie_id))
}

// === PUBLIC API ===

/**
 * Identifies gaps in user's watch profile. Returns array of challenges.
 * @param {string} userId
 * @returns {Promise<Array<{id: string, type: string, key: string, title: string, description: string, reason: string, severity: string}>>}
 */
export async function getChallengesForUser(userId) {
  if (!userId) return []

  const { data: history } = await supabase
    .from('user_history')
    .select('movies(fit_profile, mood_tags)')
    .eq('user_id', userId)

  if (!history || history.length < 5) return []

  const fitCounts = {}
  const moodCounts = {}
  let totalWithFit = 0

  for (const h of history) {
    const m = h.movies
    if (!m) continue
    if (m.fit_profile) {
      fitCounts[m.fit_profile] = (fitCounts[m.fit_profile] || 0) + 1
      totalWithFit++
    }
    ;(m.mood_tags || []).forEach(t => { moodCounts[t] = (moodCounts[t] || 0) + 1 })
  }

  const challenges = []

  // Fit profile gaps: profiles with <3% share OR zero watches
  for (const fp of FIT_PROFILES) {
    const count = fitCounts[fp] || 0
    const share = totalWithFit > 0 ? count / totalWithFit : 0
    if (count === 0 && totalWithFit >= 10) {
      challenges.push({
        id: `fit-${fp}`,
        type: 'fit',
        key: fp,
        title: fitTitle(fp),
        description: fitDescription(fp),
        reason: `You haven't watched any ${fp.replace(/_/g, ' ')} films yet.`,
        severity: 'unexplored',
      })
    } else if (share < 0.03 && count < 3 && totalWithFit >= 20) {
      challenges.push({
        id: `fit-${fp}`,
        type: 'fit',
        key: fp,
        title: fitTitle(fp),
        description: fitDescription(fp),
        reason: `Only ${count} in your history. Worth exploring more.`,
        severity: 'underexplored',
      })
    }
  }

  // Mood gaps: moods with zero occurrences in history
  for (const mc of MOOD_CHALLENGES) {
    const count = moodCounts[mc.key] || 0
    if (count === 0 && history.length >= 10) {
      challenges.push({
        id: `mood-${mc.key}`,
        type: 'mood',
        key: mc.key,
        title: mc.label,
        description: mc.description,
        reason: `Nothing in your history feels ${mc.key}. Try something new.`,
        severity: 'unexplored',
      })
    }
  }

  return challenges.slice(0, 6)
}

/**
 * Fetch 6 curated films for a specific challenge — high quality, accessible entry points.
 * @param {{type: string, key: string}} challenge
 * @param {string} userId
 * @returns {Promise<Array>}
 */
export async function getChallengeFilms(challenge, userId) {
  const watchedIds = await getWatchedMovieIds(userId)

  let query = supabase
    .from('movies')
    .select(`
      id, tmdb_id, title, poster_path, release_year, runtime, primary_genre,
      ff_audience_rating, ff_audience_confidence,
      ff_critic_rating, ff_critic_confidence,
      ff_rating_genre_normalized, mood_tags, tone_tags, fit_profile
    `)
    .eq('is_valid', true)
    .not('poster_path', 'is', null)
    .gte('ff_audience_confidence', 60)

  if (challenge.type === 'fit') {
    query = query.eq('fit_profile', challenge.key).gte('ff_audience_rating', 72)
  } else if (challenge.type === 'mood') {
    query = query.contains('mood_tags', [challenge.key]).gte('ff_audience_rating', 70)
  }

  query = query.order('ff_rating_genre_normalized', { ascending: false, nullsFirst: false }).limit(20)

  const { data } = await query
  const filtered = (data || []).filter(m => !watchedIds.has(m.id)).slice(0, 6)
  return filtered
}
