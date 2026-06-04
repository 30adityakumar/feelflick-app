// FeelFlick — /profile · data layer.
//
// What's left here:
//   - USER editorial fallbacks (summary, archetype, signature). The real values
//     come from user_profiles_computed.editorial_* via useProfileData;
//     USER_DEFAULT.* only renders pre-load or for a brand-new user with no
//     history. These are HONEST "still forming" fallbacks (F7) — they must NEVER
//     fabricate a specific taste for a user who hasn't earned one.
//   - Brand tokens (HP, HP_GRAD).
//
// FRIENDS is gone: the Taste Twins section renders a real empty state when
// user_similarity has no rows. The old SKEWS / YIR fabricated cold-start samples
// ("Darker — you 73 vs them 50", "You binged 18 films in December") were removed
// in F7 — the Skew + YIR sections now self-hide when there's no real data instead
// of rendering invented "you vs everyone" / year-in-review numbers.

export const USER = {
  name: 'You',
  handle: '@you',
  joined: '—',
  filmsLogged: 0,
  filmsRated: 0,
  hoursWatched: 0,
  filmsThisMonth: 0,
  initial: 'Y',
  // Honest cold-start fallbacks — shown only before a real editorial summary
  // exists. MUST NOT fabricate a specific taste; a brand-new user has no
  // "class-coded thrillers" identity yet.
  summary: 'Your Cinematic DNA is still forming. Log and rate a few films, and FeelFlick starts reading your taste.',
  archetype: ['The Explorer', 'The Open', 'The Curious'],
  signature: 'Your taste, taking shape.',
};

// Brand tokens
export { HP, HP_GRAD } from '@/shared/lib/tokens'
