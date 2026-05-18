// FeelFlick — /profile · data layer.
//
// What's left here:
//   - USER editorial fallbacks (summary, archetype, signature) — these are
//     still hardcoded until a per-user editorial overlay table lands (PR 4).
//     name/handle/joined/filmsLogged/hoursWatched are all derived live now —
//     USER_DEFAULT.name is only the placeholder if useAuthSession() has no
//     user yet.
//   - Brand tokens (HP, HP_GRAD)
//   - FRIENDS / SKEWS / YIR — still static until PR 3 (FRIENDS needs real
//     user_similarity; SKEWS needs an RPC; YIR composes both).
//
// MOODS, DIRECTORS, MOTIFS, TRAJECTORY, DECADES, RUNTIME, DAYPART, MIXTAPE
// are now derived in real time from user_history × user_ratings × the taste
// fingerprint — see ./derive.js and ./useProfileData.jsx.

export const USER = {
  name: 'You',
  handle: '@you',
  joined: '—',
  filmsLogged: 0,
  filmsRated: 0,
  hoursWatched: 0,
  filmsThisMonth: 0,
  initial: 'Y',
  summary: 'Patient, class-coded thrillers with a soft spot for slow burns and one-night two-handers.',
  archetype: ['The Slow-Burner', 'The Class-Conscious', 'The Two-Handed'],
  signature: 'Films that earn their silences.',
};

// Brand tokens
export const HP = {
  bg:'#000000', bgDeep:'#06060a',
  border:'rgba(255,255,255,0.08)', borderStrong:'rgba(255,255,255,0.14)',
  text:'#FAFAFA', textSoft:'rgba(250,250,250,0.72)', textMuted:'rgba(250,250,250,0.45)', textFaint:'rgba(250,250,250,0.28)',
  purple:'#A78BFA', purpleDeep:'#7C3AED', pink:'#EC4899', amber:'#F59E0B',
};
export const HP_GRAD = 'linear-gradient(135deg, #A78BFA 0%, #EC4899 100%)';

// Static fallbacks — PR 3 wires these to real Supabase data.
export const FRIENDS = [
  { name:'Marco', initial:'M', match:87, films:42, avatarBg:'#A78BFA' },
  { name:'Priya', initial:'P', match:79, films:64, avatarBg:'#F472B6' },
  { name:'Theo',  initial:'T', match:64, films:38, avatarBg:'#7DD3FC' },
  { name:'Jules', initial:'J', match:58, films:91, avatarBg:'#FBBF24' },
];

export const SKEWS = [
  { label:'Darker',         you:73, them:50, delta:+23 },
  { label:'Slower-paced',   you:68, them:50, delta:+18 },
  { label:'More subtitled', you:64, them:50, delta:+14 },
  { label:'Less spectacle', you:62, them:50, delta:+12 },
];

export const YIR = {
  topMoodGrowth: { mood:'Bittersweet', delta:'+18%', note:'You leaned in after Past Lives.' },
  newDirectors: 4,
  rewatched:    7,
  bingedMonth:  { month:'December', count:18 },
};
