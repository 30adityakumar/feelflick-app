require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// TMDB Genre IDs reference:
// 28: Action, 12: Adventure, 16: Animation, 35: Comedy, 80: Crime
// 99: Documentary, 18: Drama, 10751: Family, 14: Fantasy, 36: History
// 27: Horror, 10402: Music, 9648: Mystery, 10749: Romance, 878: Science Fiction
// 10770: TV Movie, 53: Thriller, 10752: War, 37: Western

const experienceTypes = [
  {
    name: 'Escape',
    description: 'Get lost in another world',
    preferred_genres: [14, 878, 12, 16],  // Fantasy, Sci-Fi, Adventure, Animation
    avoid_genres: [99, 36],  // Documentary, History
    active: true,
    display_order: 1
  },
  {
    name: 'Laugh',
    description: 'Just want to laugh and feel good',
    preferred_genres: [35, 10751],  // Comedy, Family
    avoid_genres: [27, 53, 18],  // Horror, Thriller, Drama
    active: true,
    display_order: 2
  },
  {
    name: 'Cry',
    description: 'Need a good emotional release',
    preferred_genres: [18, 10749],  // Drama, Romance
    avoid_genres: [35, 28],  // Comedy, Action
    active: true,
    display_order: 3
  },
  {
    name: 'Think',
    description: 'Want something intellectually stimulating',
    preferred_genres: [9648, 878, 99, 80],  // Mystery, Sci-Fi, Documentary, Crime
    avoid_genres: [28, 12],  // Action, Adventure
    active: true,
    display_order: 4
  },
  {
    name: 'Zone Out',
    description: 'Don\'t want to think at all',
    preferred_genres: [28, 12, 16],  // Action, Adventure, Animation
    avoid_genres: [9648, 99],  // Mystery, Documentary
    active: true,
    display_order: 5
  }
];

async function populateExperienceTypes() {
  console.log('🎯 Populating experience_types table...\n');

  for (const experience of experienceTypes) {
    const { data, error } = await supabase
      .from('experience_types')
      .upsert(experience, { onConflict: 'name' })
      .select();

    if (error) {
      console.error(`❌ Error inserting ${experience.name}:`, error.message);
    } else {
      console.log(`✅ ${experience.name} (ID: ${data[0].id})`);
    }
  }

  console.log('\n✨ Experience types population complete!');
}

populateExperienceTypes().catch(console.error);