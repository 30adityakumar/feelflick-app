// scripts/phase1/01-populate-moods.js
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const moods = [
  {
    name: 'Cozy',
    description: 'Warm, comforting, gentle entertainment',
    emoji: '☕',
    category: 'calm',
    pacing_preference: 3,
    intensity_level: 2,
    emotional_depth: 5,
    escapism_factor: 6,
    active: true,
    display_order: 1
  },
  {
    name: 'Adventurous',
    description: 'Exciting, bold, thrilling experiences',
    emoji: '🗺️',
    category: 'energetic',
    pacing_preference: 8,
    intensity_level: 7,
    emotional_depth: 5,
    escapism_factor: 8,
    active: true,
    display_order: 2
  },
  {
    name: 'Heartbroken',
    description: 'Emotionally raw, cathartic stories',
    emoji: '💔',
    category: 'emotional',
    pacing_preference: 4,
    intensity_level: 6,
    emotional_depth: 9,
    escapism_factor: 3,
    active: true,
    display_order: 3
  },
  {
    name: 'Curious',
    description: 'Thought-provoking, mind-expanding content',
    emoji: '🔍',
    category: 'intellectual',
    pacing_preference: 5,
    intensity_level: 5,
    emotional_depth: 7,
    escapism_factor: 5,
    active: true,
    display_order: 4
  },
  {
    name: 'Nostalgic',
    description: 'Classic, familiar, comforting favorites',
    emoji: '🎞️',
    category: 'reflective',
    pacing_preference: 4,
    intensity_level: 3,
    emotional_depth: 6,
    escapism_factor: 7,
    active: true,
    display_order: 5
  },
  {
    name: 'Energized',
    description: 'Fast-paced, high-energy entertainment',
    emoji: '⚡',
    category: 'energetic',
    pacing_preference: 9,
    intensity_level: 8,
    emotional_depth: 4,
    escapism_factor: 7,
    active: true,
    display_order: 6
  },
  {
    name: 'Anxious',
    description: 'Need something calming and predictable',
    emoji: '😰',
    category: 'calm',
    pacing_preference: 2,
    intensity_level: 1,
    emotional_depth: 3,
    escapism_factor: 8,
    active: true,
    display_order: 7
  },
  {
    name: 'Romantic',
    description: 'Love stories and heartfelt connections',
    emoji: '💕',
    category: 'emotional',
    pacing_preference: 5,
    intensity_level: 5,
    emotional_depth: 7,
    escapism_factor: 6,
    active: true,
    display_order: 8
  },
  {
    name: 'Inspired',
    description: 'Uplifting, motivational stories',
    emoji: '✨',
    category: 'uplifting',
    pacing_preference: 6,
    intensity_level: 6,
    emotional_depth: 7,
    escapism_factor: 5,
    active: true,
    display_order: 9
  },
  {
    name: 'Silly',
    description: 'Light, funny, don\'t-think-too-hard fun',
    emoji: '🤪',
    category: 'lighthearted',
    pacing_preference: 7,
    intensity_level: 3,
    emotional_depth: 2,
    escapism_factor: 9,
    active: true,
    display_order: 10
  },
  {
    name: 'Dark',
    description: 'Gritty, intense, edge-of-your-seat tension',
    emoji: '🌑',
    category: 'intense',
    pacing_preference: 6,
    intensity_level: 9,
    emotional_depth: 8,
    escapism_factor: 4,
    active: true,
    display_order: 11
  },
  {
    name: 'Overwhelmed',
    description: 'Need complete escape and zone-out time',
    emoji: '😵',
    category: 'calm',
    pacing_preference: 3,
    intensity_level: 1,
    emotional_depth: 2,
    escapism_factor: 10,
    active: true,
    display_order: 12
  }
];

async function populateMoods() {
  console.log('🎭 Populating moods table...\n');

  for (const mood of moods) {
    const { data, error } = await supabase
      .from('moods')
      .upsert(mood, { onConflict: 'name' })
      .select();

    if (error) {
      console.error(`❌ Error inserting ${mood.name}:`, error.message);
    } else {
      console.log(`✅ ${mood.emoji} ${mood.name} (ID: ${data[0].id})`);
    }
  }

  console.log('\n✨ Moods population complete!');
}

populateMoods().catch(console.error);