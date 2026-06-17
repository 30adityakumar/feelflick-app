// Thoughtful Seatmate — Stage 1 foundation primitives (scoped barrel).
//
// Importable by a FUTURE pilot (Tonight, then Film File). Tree-shaken out of the
// production bundle until a pilot imports from here. Stage 1 adopts none of this
// into any production surface. Activate the token scope by wrapping a region in
// <ThoughtfulRoot>; see ./README.md for the pilot handoff contract.

export { default as ThoughtfulRoot } from './ThoughtfulRoot'
export { default as PageDepth } from './PageDepth'
export { default as Surface } from './Surface'
export { default as Text } from './Text'
export { default as PrimaryAction } from './PrimaryAction'
export { default as DecisionMarker } from './DecisionMarker'
export { BrandMark, BrandLink, BrandSignature } from './BrandAccent'
export { TS_TOKENS, TS_PAGE_DEPTH } from './tokens'
