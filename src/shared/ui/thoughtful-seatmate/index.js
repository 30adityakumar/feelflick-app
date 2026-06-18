// Thoughtful Seatmate — foundation primitives (scoped barrel).
//
// The Thoughtful Seatmate theme is SHIPPED website-wide: `foundations.css` is loaded
// globally via src/index.css and `.theme-thoughtful` is applied once at the app root
// (src/App.jsx), so these primitives are part of the production bundle. They are
// COMPOSITIONALLY adopted by selected production surfaces (home, movie, watchlist —
// each wraps its body in `<ThoughtfulRoot>` + `<PageDepth>`); other routes are
// theme-migrated (recoloured by the global theme) without yet being composition-migrated.
// `<ThoughtfulRoot>` now marks Thoughtful Seatmate composition scope (its `--ts-*` values
// resolve from the global theme). See ./README.md and
// docs/ui/composition-system-ownership.md for the current ownership contract.
//
// `PrimaryAction` is now a COMPATIBILITY WRAPPER over the canonical `<Button
// variant="primary">` (it delegates all semantics/loading/focus/forced-colours to
// Button; ./PrimaryAction.css only preserves its legacy visual recipe). Movie is now the
// SOLE remaining component consumer; Watchlist (Slice C) and Home (Slice D) have migrated
// to rendering `<Button variant="primary">` directly (each importing PrimaryAction.css
// itself for the same recipe via the ts-action-primary* compat classes). The import path
// is kept for Movie — do NOT add new adopters; use Button directly.

export { default as ThoughtfulRoot } from './ThoughtfulRoot'
export { default as PageDepth } from './PageDepth'
export { default as Surface } from './Surface'
export { default as Text } from './Text'
export { default as PrimaryAction } from './PrimaryAction'
export { default as DecisionMarker } from './DecisionMarker'
export { BrandMark, BrandLink, BrandSignature } from './BrandAccent'
export { TS_TOKENS, TS_PAGE_DEPTH } from './tokens'
