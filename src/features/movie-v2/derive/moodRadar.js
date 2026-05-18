// src/features/movie-v2/derive/moodRadar.js
// Pure derivation: a per-film mood radar from the LLM enrichment columns
// already populated on the movies table. No user input, no network call.
//
// Source columns (see supabase migrations/20260424000000_add_llm_mood_enrichment.sql):
//   llm_pacing, llm_intensity, llm_emotional_depth, llm_dialogue_density,
//   llm_attention_demand (each 0–100 smallint), mood_tags (text[])

const clamp01 = (n) => Math.max(0, Math.min(1, n))

const AXIS_TEMPLATE = [
  { name: 'Intensity',  key: 'llm_intensity',         hex: '#EF4444' },
  { name: 'Pace',       key: 'llm_pacing',            hex: '#A78BFA' },
  { name: 'Depth',      key: 'llm_emotional_depth',   hex: '#34D399' },
  { name: 'Dialogue',   key: 'llm_dialogue_density',  hex: '#7DD3FC' },
  { name: 'Focus',      key: 'llm_attention_demand',  hex: '#F472B6' },
]

const MOOD_SPREAD_HEX = '#FBBF24'

/**
 * Derive a 6-axis radar for the mood fingerprint visual.
 * Returns null when no LLM signal is available — caller can hide the section.
 *
 * @param {object} filmRow - subset of the movies row with the llm_* + mood_tags columns
 * @returns {Array<{ name: string, weight: number, hex: string }> | null}
 */
export function deriveMoodAxes(filmRow) {
  if (!filmRow) return null

  const numericAxes = AXIS_TEMPLATE.map(({ name, key, hex }) => {
    const raw = filmRow[key]
    return Number.isFinite(raw)
      ? { name, weight: clamp01(raw / 100), hex }
      : null
  }).filter(Boolean)

  // If none of the 5 LLM numerics are present, the radar would be all zeros —
  // hide the section instead of showing an empty hexagon.
  if (numericAxes.length === 0) return null

  // 6th synthesized axis: how broad the mood palette is. Films with many
  // mood_tags read as "tonally varied"; saturates at 8 tags.
  const moodCount = Array.isArray(filmRow.mood_tags) ? filmRow.mood_tags.length : 0
  const breadthAxis = {
    name: 'Range',
    weight: clamp01(moodCount / 8),
    hex: MOOD_SPREAD_HEX,
  }

  return [...numericAxes, breadthAxis]
}
