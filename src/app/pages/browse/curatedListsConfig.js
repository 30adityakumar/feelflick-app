// src/app/pages/browse/curatedListsConfig.js
// Each list defines a slug, display info, and a Supabase query builder.

const SELECT = `
  id, tmdb_id, title, poster_path, release_year, runtime, primary_genre,
  ff_audience_rating, ff_audience_confidence,
  ff_critic_rating, ff_critic_confidence,
  ff_rating_genre_normalized, mood_tags, fit_profile
`

export const CURATED_LISTS = [
  {
    slug: 'prestige-drama-2020s',
    title: 'Prestige Drama of the 2020s',
    description: 'Acclaimed dramas from 2020 onward — the awards-circuit heavyweights.',
    query: (sb) => sb.from('movies').select(SELECT)
      .eq('fit_profile', 'prestige_drama').gte('release_year', 2020)
      .eq('is_valid', true).not('poster_path', 'is', null)
      .gte('ff_audience_confidence', 60).gte('ff_audience_rating', 70)
      .order('ff_audience_rating', { ascending: false }).limit(40),
  },
  {
    slug: 'challenging-art',
    title: 'Challenging Art Cinema',
    description: 'Films that demand attention and reward it. Not for casual viewing.',
    query: (sb) => sb.from('movies').select(SELECT)
      .eq('fit_profile', 'challenging_art')
      .eq('is_valid', true).not('poster_path', 'is', null)
      .gte('ff_audience_confidence', 50)
      .order('ff_critic_rating', { ascending: false, nullsFirst: false }).limit(40),
  },
  {
    slug: 'festival-discoveries',
    title: 'Festival Discoveries',
    description: 'Films that premiered at festivals and earned critical acclaim before wider release.',
    query: (sb) => sb.from('movies').select(SELECT)
      .eq('fit_profile', 'festival_discovery')
      .eq('is_valid', true).not('poster_path', 'is', null)
      .gte('ff_audience_confidence', 50)
      .order('release_date', { ascending: false }).limit(40),
  },
  {
    slug: 'cult-classics',
    title: 'Cult Classics',
    description: 'Films that found their audience off the beaten path.',
    query: (sb) => sb.from('movies').select(SELECT)
      .eq('fit_profile', 'cult_classic')
      .eq('is_valid', true).not('poster_path', 'is', null)
      .order('ff_audience_rating', { ascending: false, nullsFirst: false }).limit(40),
  },
  {
    slug: 'comfort-watches',
    title: 'Comfort Watches',
    description: 'Films to return to. Warm, reliable, worth rewatching.',
    query: (sb) => sb.from('movies').select(SELECT)
      .eq('fit_profile', 'comfort_watch')
      .eq('is_valid', true).not('poster_path', 'is', null)
      .contains('mood_tags', ['heartwarming'])
      .order('ff_audience_rating', { ascending: false, nullsFirst: false }).limit(40),
  },
  {
    slug: 'crowd-pleasers',
    title: "Crowd-Pleasers Critics Didn't Love",
    description: 'Films audiences connected with despite mixed critical reception.',
    query: (sb) => sb.from('movies').select(SELECT)
      .eq('is_valid', true).not('poster_path', 'is', null)
      .lte('ff_critic_audience_gap', -15)
      .gte('ff_critic_confidence', 60).gte('ff_audience_confidence', 60)
      .order('ff_audience_rating', { ascending: false }).limit(40),
  },
  {
    slug: 'critics-picks',
    title: "Critics' Picks Audiences Missed",
    description: "Films critics championed that didn't quite land with general audiences.",
    query: (sb) => sb.from('movies').select(SELECT)
      .eq('is_valid', true).not('poster_path', 'is', null)
      .gte('ff_critic_audience_gap', 15)
      .gte('ff_critic_confidence', 60).gte('ff_audience_confidence', 60)
      .order('ff_critic_rating', { ascending: false }).limit(40),
  },
  {
    slug: 'exceptional-for-genre',
    title: 'Exceptional for Their Kind',
    description: 'Films that transcend their genre — each a high-water mark.',
    // ASSUMPTION: threshold 8.0 instead of 8.5 — current data tops out at 8.4
    query: (sb) => sb.from('movies').select(SELECT)
      .eq('is_valid', true).not('poster_path', 'is', null)
      .gte('ff_rating_genre_normalized', 8.0)
      .gte('ff_audience_confidence', 60)
      .order('ff_rating_genre_normalized', { ascending: false }).limit(40),
  },
  {
    slug: 'tense-and-haunting',
    title: 'Tense & Haunting',
    description: 'Films that stay with you. Unsettling in the best way.',
    query: (sb) => sb.from('movies').select(SELECT)
      .eq('is_valid', true).not('poster_path', 'is', null)
      .contains('mood_tags', ['haunting'])
      .gte('ff_audience_confidence', 55)
      .gte('ff_audience_rating', 65)
      .order('ff_audience_rating', { ascending: false }).limit(40),
  },
  {
    slug: 'world-cinema',
    title: 'World Cinema',
    description: 'Non-English films that deserve international attention.',
    query: (sb) => sb.from('movies').select(SELECT)
      .eq('is_valid', true).not('poster_path', 'is', null)
      .neq('original_language', 'en')
      .gte('ff_audience_confidence', 60).gte('ff_audience_rating', 70)
      .order('ff_audience_rating', { ascending: false }).limit(40),
  },
]
