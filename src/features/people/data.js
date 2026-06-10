// /people — shared design tokens.
// F8.5: the prototype mock arrays (fabricated people, ratings, reviews, activity and "crew overlap")
// were removed. The production People surface is driven entirely by usePeopleData (real similarity +
// the narrow identity/fingerprint RPCs); it never imported these mocks, so nothing rendered them.
// Only the design tokens below are used by People.jsx.

export { HP, HP_GRAD } from '@/shared/lib/tokens'
