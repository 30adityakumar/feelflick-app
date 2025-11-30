require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const viewingContexts = [
  {
    name: 'Alone',
    description: 'Watching by yourself',
    icon: '🧘',
    prefer_shorter_runtime: false,
    content_rating_filter: null,
    active: true,
    display_order: 1
  },
  {
    name: 'Partner',
    description: 'Watching with your significant other',
    icon: '💑',
    prefer_shorter_runtime: false,
    content_rating_filter: null,
    active: true,
    display_order: 2
  },
  {
    name: 'Friends',
    description: 'Watching with friends',
    icon: '👥',
    prefer_shorter_runtime: false,
    content_rating_filter: null,
    active: true,
    display_order: 3
  },
  {
    name: 'Family',
    description: 'Watching with family members',
    icon: '👨‍👩‍👧‍👦',
    prefer_shorter_runtime: true,
    content_rating_filter: 'PG-13',
    active: true,
    display_order: 4
  },
  {
    name: 'Kids',
    description: 'Watching with young children',
    icon: '👶',
    prefer_shorter_runtime: true,
    content_rating_filter: 'G,PG',
    active: true,
    display_order: 5
  }
];

async function populateViewingContexts() {
  console.log('👥 Populating viewing_contexts table...\n');

  for (const context of viewingContexts) {
    const { data, error } = await supabase
      .from('viewing_contexts')
      .upsert(context, { onConflict: 'name' })
      .select();

    if (error) {
      console.error(`❌ Error inserting ${context.name}:`, error.message);
    } else {
      console.log(`✅ ${context.icon} ${context.name} (ID: ${data[0].id})`);
    }
  }

  console.log('\n✨ Viewing contexts population complete!');
}

populateViewingContexts().catch(console.error);