// src/features/landing/data.js
// Static, deterministic landing example data. NO Supabase/product/user fetch, no
// randomization, no time-dependent copy, no match percentages, no real user names.
// Every preview is illustrative; copy is aligned to production as of the pinned base.

const TMDB = (p, size = 'w342') => `https://image.tmdb.org/t/p/${size}${p}`
export const tmdbPoster = TMDB

// Decorative hero ribbon posters (aria-hidden; alt=""). The centre (index 2) is the
// LCP candidate; all others lazy. Title is for the deterministic fallback only.
export const LANDING_POSTERS = [
  { path: '/yihdXomYb5kTeSivtFndMy5iDmf.jpg', title: 'Project Hail Mary' },
  { path: '/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg', title: 'Parasite' },
  { path: '/eCOtqtfvn7mxGl6nfmq4b1exJRc.jpg', title: 'Her' },
  { path: '/yQvGrMoipbRoddT0ZR8tPoR7NfX.jpg', title: 'Interstellar' },
  { path: '/66A9MqXOyVFCssoloscw79z8Tew.jpg', title: '3 Idiots' },
]

export const PRINCIPLES = [
  { title: 'Fewer directions, chosen well.', body: 'FeelFlick narrows the field instead of giving you another endless shelf to scroll.' },
  { title: 'Reasons you can understand.', body: 'Every personal suggestion comes with the signals behind it—not a mysterious match score.' },
  { title: 'Taste that keeps evolving.', body: 'Watches, ratings, saves, skips and reactions help the picture become more accurate over time.' },
]

// Locked order + destination: 01 For tonight → Discover, 02 From your taste → Home,
// 03 Follow a curiosity → Browse. Destinations are editorial labels (explanatory only;
// not links — Home is not anonymously reachable).
export const ENTRANCES = [
  {
    n: '01', destination: 'Discover', title: 'For tonight.',
    example: 'Quiet · two people · under two hours.',
    copy: 'Shape one focused screening around mood, company, time and energy, with a primary direction and a small number of alternatives.',
  },
  {
    n: '02', destination: 'Home', title: 'From your taste.',
    example: 'Because you return to precise, morally complicated films.',
    copy: 'Explore recommendations, recurring themes and transparent reasons grounded in your viewing history and direct preferences.',
  },
  {
    n: '03', destination: 'Browse', title: 'Follow a curiosity.',
    example: 'Korean thrillers · 2000s · slow-burn.',
    copy: 'Browse deliberately by genre, era, language, runtime, filmmaker and supported film qualities while preserving the scope you chose.',
  },
]

export const FILM_FILE_EXAMPLE = {
  poster: { path: '/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg', title: 'Parasite' },
  title: 'Parasite',
  before: {
    status: 'Before watching · spoiler-safe',
    summary: 'A practical decision file: why it may fit, what kind of watch it is, and what to expect—without giving the film away.',
    rows: [
      ['Why this film', 'Personal reasons grounded in your taste and the moment'],
      ['Experience profile', 'Pace, attention, emotional weight and viewing mode'],
      ['Where to watch', 'Regional availability via supported providers'],
      ['Cast and context', 'Useful people and background, kept spoiler-safe'],
    ],
  },
  after: {
    status: 'Watched · reflection open',
    summary: 'The Film File now keeps how the film landed for you and reveals deeper post-watch context where FeelFlick has something meaningful to add.',
    rows: [
      ['Your private response', 'Rating, reaction and a private note'],
      ['Followed voices', 'Watched-gated notes from people you follow'],
      ['Generated impressions', 'Clearly labelled context—not fabricated reviews'],
      ['Deeper portrait', 'Curated interpretation where genuinely available'],
    ],
    note: 'Parasite includes a curated Film Portrait. Other titles may offer a lighter reflection state rather than fabricated depth.',
  },
}

export const DNA_EXAMPLE = {
  archetype: 'The Thinking Heart.',
  statement: 'Tenderness through ambiguity. Beauty with something uneasy underneath.',
  traits: [
    { label: 'Emotional patience', level: 4, band: 'Strong' },
    { label: 'Tonal contrast', level: 3, band: 'Growing' },
    { label: 'Visual precision', level: 4, band: 'Strong' },
    { label: 'Heavy aftertaste', level: 3, band: 'Contextual' },
  ],
  sources: ['Watches', 'Ratings and reactions', 'Saves and skips', 'Direct preferences'],
}

export const WATCHLIST_EXAMPLE = {
  copy: 'Films saved for another moment. Search, filter, sort, open a Film File, or remove a title without turning your private library into another recommendation feed.',
  meta: 'Saved for later',
  chips: ['Search', 'Mood', 'Recently saved'],
  films: [
    { title: 'Past Lives', meta: 'Saved', path: '/k3waqVXSnvCZWfJYNtdamTgTtTA.jpg' },
    { title: 'Arrival', meta: 'Thoughtful', path: '/x2FJsf1ElAgr63Y3PNPtJrcmpoe.jpg' },
    { title: 'Her', meta: 'Warm sci-fi', path: '/eCOtqtfvn7mxGl6nfmq4b1exJRc.jpg' },
    { title: 'Moonlight', meta: 'Tender', path: '/qAwFbszz0kRyTuXmMeKQZCX3Q2O.jpg' },
    { title: 'Get Out', meta: 'Tense', path: '/tFXcEccSQMf3lfhfXKSU9iRBpa3.jpg' },
  ],
}

export const DIARY_EXAMPLE = {
  copy: 'A chronological record of what you watched and how it landed. Ratings and reactions stay attached to the viewing rather than becoming a public feed.',
  meta: 'Watched',
  chips: ['Search', 'Loved', 'Newest first'],
  films: [
    { title: 'Parasite', meta: 'Loved', path: '/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg' },
    { title: 'Past Lives', meta: 'Liked', path: '/k3waqVXSnvCZWfJYNtdamTgTtTA.jpg' },
    { title: 'Arrival', meta: 'Loved', path: '/x2FJsf1ElAgr63Y3PNPtJrcmpoe.jpg' },
    { title: 'Moonlight', meta: 'Loved', path: '/qAwFbszz0kRyTuXmMeKQZCX3Q2O.jpg' },
    { title: 'Her', meta: 'Liked', path: '/eCOtqtfvn7mxGl6nfmq4b1exJRc.jpg' },
  ],
}

// Anonymous illustrative "followed voices" — no names, no avatars, no percentages,
// no profile links, no Follow interaction.
export const PEOPLE_EXAMPLE = {
  copy: 'Follow people whose public film notes you value. Their consented notes may appear as context on watched Film Files, without turning People into a public activity feed.',
  voices: [
    'Often shares your response to tender ambiguity',
    'Frequently overlaps on tonal risk and Korean cinema',
  ],
}

export const PREFERENCES_EXAMPLE = {
  copy: 'Direct preferences are private and editable. Learned recommendation sources are currently explained read-only rather than edited individually.',
  controls: [
    'Mood emphasis',
    'Preferred and avoided genres',
    'Runtime and content boundaries',
    'Trusted and down-ranked directors',
    'See what currently shapes recommendations',
  ],
  comingSoon: 'Streaming preferences are coming later.',
}

export const TRUST = [
  { title: 'Private where it should be', body: 'Your Cinematic DNA, Watchlist, Diary and direct Preferences remain private. Public social notes appear only through their existing visibility and consent rules.' },
  { title: 'No mystery score', body: 'FeelFlick uses qualitative reasons instead of presenting a fake personal compatibility percentage.' },
  { title: 'Spoilers stay gated', body: 'User notes, generated impressions and deeper Film Portrait content remain hidden until a film is marked Watched.' },
  { title: 'Designed to shorten the search', body: 'The product is built around bounded choices rather than endless shelves.' },
]
