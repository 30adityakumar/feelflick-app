import { useState } from 'react'

const TIMEOUT_MS = 3000

// Canonical vocabularies — must match edge function + llm-enrichment-client.js
const MOOD_VOCAB = new Set([
  'exhilarating','tense','cozy','melancholic','uplifting','whimsical','haunting',
  'meditative','romantic','gritty','heartwarming','suspenseful','nostalgic',
  'empowering','bittersweet','devastating','playful','contemplative','thrilling',
  'serene','unsettling','inspiring','dreamy','intense','tender','dark',
  'lighthearted','provocative','euphoric','somber','mysterious','enigmatic','mind-bending',
])
const TONE_VOCAB = new Set([
  'satirical','earnest','ironic','deadpan','poetic','raw','polished','absurdist',
  'sentimental','cynical','whimsical','urgent','detached','intimate','grandiose',
  'minimalist','operatic','dry','warm','cold',
])

/**
 * Filter an array to only valid vocabulary entries.
 * @param {Array} arr
 * @param {Set} vocabSet
 * @param {number} max
 * @returns {string[]}
 */
function filterVocab(arr, vocabSet, max) {
  if (!Array.isArray(arr)) return []
  return arr.filter(t => typeof t === 'string' && vocabSet.has(t)).slice(0, max)
}

/**
 * One-shot imperative hook for parsing a freetext mood description into dial values
 * and tag preferences.
 *
 * Returns a `parse(moodName, freeText)` function.
 * On success: returns `{ intensity, pacing, viewingContext, experienceType,
 *   preferredMoodTags, avoidedMoodTags, preferredToneTags }`.
 * On failure / timeout: returns `null` (caller should keep current dial values).
 *
 * @returns {{ parse: function, loading: boolean }}
 */
export function useNLMoodParse() {
  const [loading, setLoading] = useState(false)

  /**
   * @param {string} moodName
   * @param {string} freeText
   * @returns {Promise<{intensity:number,pacing:number,viewingContext:number,experienceType:number}|null>}
   */
  async function parse(moodName, freeText) {
    if (!freeText?.trim()) return null

    // Read env lazily so test stubs applied before call take effect
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
    const edgeFnUrl = supabaseUrl ? `${supabaseUrl}/functions/v1/ai-mood-context` : null

    if (!edgeFnUrl) return null

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

    setLoading(true)
    try {
      const res = await fetch(edgeFnUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${anonKey}`,
        },
        body: JSON.stringify({ action: 'parse', mood: moodName, freeText }),
        signal: controller.signal,
      })

      if (!res.ok) return null

      const data = await res.json()
      if (!data || typeof data !== 'object') return null

      // Clamp and validate each field — model output is untrusted
      function clamp(v, fallback = 3) {
        const n = Number(v)
        if (isNaN(n)) return fallback
        return Math.max(1, Math.min(5, Math.round(n)))
      }

      return {
        intensity:         clamp(data.intensity),
        pacing:            clamp(data.pacing),
        viewingContext:    clamp(data.viewingContext),
        experienceType:    clamp(data.experienceType),
        preferredMoodTags: filterVocab(data.preferredMoodTags, MOOD_VOCAB, 4),
        avoidedMoodTags:   filterVocab(data.avoidedMoodTags, MOOD_VOCAB, 3),
        preferredToneTags: filterVocab(data.preferredToneTags, TONE_VOCAB, 3),
      }
    } catch {
      return null
    } finally {
      clearTimeout(timer)
      setLoading(false)
    }
  }

  return { parse, loading }
}
