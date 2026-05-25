// FeelFlick — /profile · data layer.
//
// What's left here:
//   - USER editorial fallbacks (summary, archetype, signature). The real
//     values come from user_profiles_computed.editorial_* via
//     useProfileData; USER_DEFAULT.* only renders pre-load or when the
//     LLM regen hasn't run yet.
//   - Brand tokens (HP, HP_GRAD).
//   - SKEWS / YIR cold-start fallbacks — kept because they let the Skew /
//     YIR sections always render something sensible while data thickens.
//
// FRIENDS is gone: the Taste Twins section now renders a real empty state
// when user_similarity has no rows (no more Marco/Priya/Theo/Jules).

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
export const HP_GRAD = 'linear-gradient(135deg, #9333ea 0%, #ec4899 100%)';

// Cold-start fallbacks for sections that always render — Skew + YIR show
// these neutral values when the user has too little data for a live
// derivation.
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
