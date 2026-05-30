// src/features/profile/archetype.js
// Deterministic archetype taxonomy. Maps a taste fingerprint
// (topMoodTags + topFitProfiles + topToneTags) → a [primary, secondary,
// tertiary] triplet rendered in the profile masthead's Archetype card.
//
// No LLM, no Supabase — pure mapping. The summary + signature are still
// LLM-generated (see generate-taste-summary edge function); only the
// 3-word archetype is deterministic so it's stable across regenerations
// and free to compute on every page load.

const FALLBACK = ['The Explorer', 'The Open', 'The Curious']

// Top mood → primary archetype.
// Keys are the canonical mood_tags stored on movies.mood_tags.
// Anything missing falls back to 'The Explorer'.
const PRIMARY_BY_MOOD = {
  tense:       'The Slow-Burner',
  uneasy:      'The Slow-Burner',
  dark:        'The Slow-Burner',
  melancholy:  'The Bittersweet',
  bittersweet: 'The Bittersweet',
  reflective:  'The Bittersweet',
  tender:      'The Tender',
  warm:        'The Tender',
  cozy:        'The Tender',
  playful:     'The Playful',
  joyful:      'The Playful',
  whimsical:   'The Playful',
  uplifting:   'The Optimist',
  hopeful:     'The Optimist',
  cathartic:   'The Cathartic',
  devastating: 'The Cathartic',
  haunting:    'The Haunted',
  eerie:       'The Haunted',
  romantic:    'The Romantic',
  longing:     'The Romantic',
  thrilling:   'The Pulse-Chaser',
  intense:     'The Pulse-Chaser',
  cerebral:    'The Cerebral',
  meditative:  'The Cerebral',
  surreal:     'The Surrealist',
  dreamlike:   'The Surrealist',
}

// Top fit_profile → secondary archetype.
// Canonical vocabulary from src/shared/services/fitAdjacency.js.
const SECONDARY_BY_FIT = {
  prestige_drama:      'The Class-Conscious',
  arthouse:            'The Auteurist',
  challenging_art:     'The Devoted Reader',
  festival_discovery:  'The Festival Hopper',
  cult_classic:        'The Cult Initiate',
  comfort_watch:       'The Comfort-Seeker',
  crowd_pleaser:       'The Crowd-Pleaser',
  genre_popcorn:       'The Genre Loyalist',
  franchise_entry:     'The Long-Hauler',
  niche_world_cinema:  'The Subtitle-Reader',
}

// Top tone_tag → tertiary archetype.
// tone_tags are looser than mood_tags; this covers the common ones and
// degrades gracefully when the tag is unknown.
const TERTIARY_BY_TONE = {
  restrained:   'The Restrained',
  patient:      'The Patient',
  spare:        'The Minimalist',
  minimal:      'The Minimalist',
  ornate:       'The Ornate',
  maximal:      'The Maximalist',
  ironic:       'The Ironist',
  dry:          'The Dry-Witted',
  earnest:      'The Earnest',
  sincere:      'The Earnest',
  brooding:     'The Brooding',
  introspective:'The Introspective',
  visceral:     'The Visceral',
  kinetic:      'The Kinetic',
  observational:'The Observer',
  poetic:       'The Lyric',
  literary:     'The Lyric',
  pulpy:        'The Pulp-Lover',
  stylized:     'The Stylist',
  formal:       'The Formalist',
  documentary:  'The Documentarian',
  experimental: 'The Experimentalist',
}

// Fallback tertiaries keyed off the SECOND mood tag, when no tone_tag
// is available. Keeps the third line distinct from the first.
const TERTIARY_BY_SECOND_MOOD = {
  tense:       'The Coiled',
  uneasy:      'The Vigilant',
  dark:        'The Shadow-Watcher',
  melancholy:  'The Melancholic',
  bittersweet: 'The Two-Handed',
  reflective:  'The Reflective',
  tender:      'The Tender-Hearted',
  warm:        'The Warm-Hearted',
  cozy:        'The Cozy-Watcher',
  playful:     'The Light-Footed',
  joyful:      'The Open-Hearted',
  whimsical:   'The Whimsical',
  uplifting:   'The Uplifter',
  hopeful:     'The Hopeful',
  cathartic:   'The Catharsis-Seeker',
  haunting:    'The Quiet-Haunted',
  romantic:    'The Soft-Hearted',
  longing:     'The Longing',
  thrilling:   'The Restless',
  cerebral:    'The Thinker',
  surreal:     'The Dreamer',
}

function lookup(map, key, fallback) {
  if (!key) return fallback
  return map[String(key).toLowerCase()] || fallback
}

function dedupe(triplet) {
  const out = []
  const seen = new Set()
  for (const t of triplet) {
    if (!t || seen.has(t)) continue
    out.push(t)
    seen.add(t)
  }
  // Backfill from FALLBACK if dedupe dropped entries.
  for (const f of FALLBACK) {
    if (out.length >= 3) break
    if (!seen.has(f)) { out.push(f); seen.add(f) }
  }
  return out.slice(0, 3)
}

/**
 * @param {{ topMoodTags?: Array<{key:string,count:number,share:number}>,
 *           topFitProfiles?: Array<{key:string,count:number,share:number}>,
 *           topToneTags?: Array<{key:string,count:number,share:number}> } | null} fingerprint
 * @returns {[string, string, string]} archetype triplet (primary, secondary, tertiary)
 */
export function archetypeForFingerprint(fingerprint) {
  if (!fingerprint) return [...FALLBACK]
  const m1 = fingerprint.topMoodTags?.[0]?.key
  const m2 = fingerprint.topMoodTags?.[1]?.key
  const f1 = fingerprint.topFitProfiles?.[0]?.key
  const t1 = fingerprint.topToneTags?.[0]?.key

  const primary   = lookup(PRIMARY_BY_MOOD, m1, FALLBACK[0])
  const secondary = lookup(SECONDARY_BY_FIT, f1, FALLBACK[1])
  const tertiary  = t1
    ? lookup(TERTIARY_BY_TONE, t1, lookup(TERTIARY_BY_SECOND_MOOD, m2, FALLBACK[2]))
    : lookup(TERTIARY_BY_SECOND_MOOD, m2, FALLBACK[2])

  return dedupe([primary, secondary, tertiary])
}

export const ARCHETYPE_FALLBACK = FALLBACK
