// src/features/account/data.js — Account static data + defaults.
//
//   - Brand tokens (HP, ROSE) — static, re-exported from the shared token source.
//   - SETTINGS — DEFAULT values for notifications + privacy, merged with the user's
//     `user_settings.settings` JSONB on load (see ./useAccountData.jsx). Engine +
//     display prefs live in /preferences ("The dials") and own the `prefs` branch.
//
// Plan is a flat "Free plan" label for this slice — there is no billing/entitlement
// backend, so no tier is derived. (The former signup-cutoff "Founding Member" badge
// was retired: its 2027 cutoff meant every current member qualified, and "Free,
// locked in" was a price guarantee with no backing.)

export { HP, ROSE, ROSE_DEEP } from '@/shared/lib/tokens'

export const SETTINGS = {
  notifications: [
    // Only Daily Briefing has real send infrastructure (out-of-repo Resend + pg_cron).
    // Other channels return one-at-a-time as their delivery systems ship.
    { id: 'daily', label: 'Daily Briefing', desc: 'A daily email with tonight’s picks.', enabled: true, badge: 'Recommended' },
  ],
  // `prefs` (engine/display) is owned by /preferences — never seeded here (would clobber it).
  privacy: {
    // F8.2: taste-match discovery is EXPLICIT OPT-IN — no stored preference → NOT discoverable
    // (matches get_discoverable_taste_profiles' opt-in fallback).
    showOnLeaderboards: false,
    analytics: true,
    // Public social profile (/profile) — a SEPARATE consent from taste-match discovery. All default
    // PRIVATE: the richer social profile (and each section) is only shown to other members after
    // the owner explicitly opts in. showOnLeaderboards is NOT public-profile consent.
    profilePublic: false,
    filmsPublic: false,
    diaryPublic: false,
    reviewsPublic: false,
    listsPublic: false,
    connectionsPublic: false,
    viewingRhythmPublic: false,
  },
  // Owner-authored /profile social-profile curation. Owner-only (read/written via user_settings RLS;
  // exposed to visitors only through the profilePublic-gated get_dna_public_profile RPC).
  dnaProfile: {
    schemaVersion: 1,
    handle: '',
    bio: '',
    location: '',
    coverMovieIds: [],       // internal movie ids for the cover (default: My Four)
    featuredFilmIds: [],     // "My Four" — up to 4 internal movie ids
    pinnedReviewMovieId: null,
    featuredListId: null,
    currentExploration: null,
    highlights: [],          // ordered highlight category keys the owner chose to show
  },
}
