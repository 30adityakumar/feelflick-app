// /account v2 — data layer
//
// What's here vs derived:
//   - Brand tokens (HP, HP_GRAD) — always static
//   - SETTINGS — *default values* for notifications/prefs/privacy. The page
//     merges these with the user's row from `user_settings.settings` (JSONB)
//     when they sign in. Each toggle / slider / chip queues a debounced
//     upsert via updateNotifications / updateEnginePrefs / updatePrivacy on
//     the AccountData context. See ./useAccountData.jsx.
//   - CONNECTIONS — registry of integrations the page knows about. The
//     `status` is overridden live (Google detected from auth.app_metadata).
//   - PLAN — static until a billing service is in place.
//
// USER + stats are now live. They're fetched via useAccountData() against
// auth.getUser() + the users table + user_history/user_ratings counts.

export const HP = {
  bg:'#000000', bgDeep:'#06060a',
  border:'rgba(255,255,255,0.08)', borderStrong:'rgba(255,255,255,0.14)',
  text:'#FAFAFA', textSoft:'rgba(250,250,250,0.72)', textMuted:'rgba(250,250,250,0.45)', textFaint:'rgba(250,250,250,0.28)',
  purple:'#A78BFA', purpleDeep:'#7C3AED', pink:'#EC4899', amber:'#F59E0B', red:'#EF4444', green:'#34D399',
};
export const HP_GRAD = 'linear-gradient(135deg, #A78BFA 0%, #EC4899 100%)';

export const SETTINGS = {
  notifications: [
    { id:'daily',    label:'Daily Briefing',  desc:"Tonight's three picks at 6 PM",        enabled:true,  badge:'Recommended' },
    { id:'mood',     label:'Mood reminders',  desc:'Re-check in when you skip the picks',  enabled:false },
    { id:'friends',  label:'Friend activity', desc:'When a friend rates a film',           enabled:true },
    { id:'wrapped',  label:'Year in review',  desc:'Monthly digest of your DNA shifts',    enabled:true },
    { id:'product',  label:'Product news',    desc:"What we're shipping (rare)",           enabled:false },
  ],
  prefs: {
    runtimeFloor: 80,
    runtimeCap:   170,
    languages:    ['Korean','English','French','Japanese','Spanish'],
    subtitles:    'always-welcome', // never | sometimes | always-welcome
    spoilerTier:  'brief',           // brief | standard | detailed
    avoidGenres:  ['Horror','Slapstick'],
  },
  privacy: {
    profilePublic:      true,
    diaryPublic:        false,
    showOnLeaderboards: true,
    shareableCards:     true,
    analytics:          true,
  },
};

export const CONNECTIONS = [
  { id:'google',     name:'Google',     status:'Available', detail:'Connect via Google sign-in',  since:null,   primary:false, tint:'#A78BFA' },
  { id:'letterboxd', name:'Letterboxd', status:'Available', detail:'Coming soon',                 since:null,   primary:false, tint:'#F472B6' },
  { id:'netflix',    name:'Netflix',    status:'Available', detail:'Coming soon',                 since:null,   primary:false, tint:'#EF4444' },
  { id:'plex',       name:'Plex',       status:'Available', detail:'Coming soon',                 since:null,   primary:false, tint:'#FBBF24' },
];

export const PLAN = {
  tier:        'Founding Member · Free',
  perks:       ['Unlimited Briefings','Cinematic DNA forever','Share cards','Pre-release features'],
  upgradeHint: 'Pro coming soon · Locked in at $0/mo for foundings.',
};
