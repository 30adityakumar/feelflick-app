// /account v2 — data layer
//
// What's here vs derived:
//   - Brand tokens (HP, HP_GRAD) — always static
//   - SETTINGS — *default values* for notifications + privacy. The page
//     merges these with the user's row from `user_settings.settings` (JSONB)
//     when they sign in. Each toggle queues a debounced upsert via
//     updateNotifications / updatePrivacy on the AccountData context.
//     See ./useAccountData.jsx. Engine + display prefs live in /preferences.
//   - CONNECTIONS — registry of integrations the page knows about. The
//     `status` is overridden live (Google detected from auth.app_metadata).
//   - PLAN — static until a billing service is in place.
//
// USER + stats are now live. They're fetched via useAccountData() against
// auth.getUser() + the users table + user_history/user_ratings counts.

export { HP, HP_GRAD } from '@/shared/lib/tokens'

export const SETTINGS = {
  notifications: [
    // MVP: only Daily Briefing has real send infra (Resend + pg_cron). Other
    // channels return one-at-a-time as their underlying feature ships
    // (Friend activity needs a friend graph, Year in review needs annual
    // content gen, Product news needs a broadcast tool).
    { id:'daily', label:'Daily Briefing', desc:"Tonight's three picks at 6 PM", enabled:true, badge:'Recommended' },
  ],
  // `prefs` is owned by /preferences-v2 (see usePreferencesData.jsx). We
  // never seed defaults here — that would clobber engine prefs the user set
  // on /preferences when /account writes a notifications/privacy change.
  privacy: {
    profilePublic:      true,
    diaryPublic:        false,
    showOnLeaderboards: true,
    analytics:          true,
    // `shareableCards` removed: no export feature exists for it to gate.
  },
};

// "Founding Member" = signed up before this cutoff. Lets us derive plan
// status from `users.joined_at` without a new column or billing system.
// When billing ships, add `users.plan_tier` and switch source.
export const FOUNDING_CUTOFF = new Date('2027-01-01T00:00:00Z');

export const CONNECTIONS = [
  { id:'google',     name:'Google',     status:'Available', detail:'Connect via Google sign-in',  since:null,   primary:false, tint:'#A78BFA' },
  { id:'letterboxd', name:'Letterboxd', status:'Available', detail:'Coming soon',                 since:null,   primary:false, tint:'#F472B6' },
  { id:'netflix',    name:'Netflix',    status:'Available', detail:'Coming soon',                 since:null,   primary:false, tint:'#EF4444' },
  { id:'plex',       name:'Plex',       status:'Available', detail:'Coming soon',                 since:null,   primary:false, tint:'#FBBF24' },
];
