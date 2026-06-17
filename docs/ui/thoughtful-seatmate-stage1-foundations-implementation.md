# Thoughtful Seatmate — Stage 1: Shared Foundations & Primitives (implementation record)

## 1. Status

**Implemented (foundations only). Not adopted by any production surface. Not merged, not deployed.**
This is the first implementation stage after the visual-system closure. It builds a production-quality,
reusable, **opt-in** foundation for the later Tonight (Stage 3) and Film File (Stage 4) pilots. Production
remains mixed and transitional; this stage migrates nothing and changes no feature behavior.

## 2. Scope

Stage 1 created a scoped `--ts-*` token foundation, scoped primitives (root scope, page-depth, surfaces,
typography, neutral primary action, ivory decision marker, bounded rose helpers), a dev-only showcase, and
a legacy-gradient + purity guard with a frozen allowlist baseline. It did **not** touch the global app
shell, body/html/root canvas, fonts, focus ring, selection, Tonight, Film File, navigation, cards on
existing surfaces, production button defaults, legacy tokens, the legacy gradient, or any
recommendation/routing/auth/data logic. Contextual film colour is **not** implemented.

## 3. Starting main SHA

Branched from `origin/main` at `5c7191eaacdc32b83b781992f5b118ff1decd946`.

## 4. Files added and changed

**Added — foundation (`src/shared/ui/thoughtful-seatmate/`):** `tokens.js`, `foundations.css`,
`ThoughtfulRoot.jsx`, `PageDepth.jsx` + `PageDepth.css`, `Surface.jsx` + `Surface.css`, `Text.jsx` +
`text.css`, `PrimaryAction.jsx` + `PrimaryAction.css`, `DecisionMarker.jsx` + `DecisionState.css`,
`BrandAccent.jsx` + `brand-accent.css`, `index.js`, and `__tests__/{tokens.test.js, primitives.test.jsx,
purity-and-non-adoption.test.js}`.
**Added — showcase (dev-only):** `src/features/design-lab/thoughtful-seatmate-foundations/{Showcase.jsx,
showcase.css}`.
**Added — guard:** `scripts/guards/{legacy-gradient-guard.mjs, legacy-gradient-baseline.json}`.
**Changed (additive, no behavior change):** `src/app/router.jsx` (a dev-only, tree-shaken showcase
route), `package.json` (`guard:foundations` + `guard:foundations:update` scripts), and this doc set.
The global `src/shared/lib/tokens.js`, `src/index.css`, fonts, and existing components are **unchanged**.

## 5. Token namespace

`--ts-*` CSS custom properties scoped to the **`.ts-root`** class (never `:root`), in
`foundations.css`, mirrored 1:1 by the JS `TS_TOKENS` export in
`src/shared/ui/thoughtful-seatmate/tokens.js`. Scoping to a class (not `:root`) is what keeps the
foundation isolated and out of the production bundle until a pilot imports it. There is **no** gradient
token, **no** `--decision-signal` token, **no** contextual-film-colour token, and **no** purple/plum
target token. The deeper rose is a contrast variant only, not a second accent.

## 6. Background-depth primitive

`<PageDepth depth="radial" | "linear" | "none">`. Radial is preferred; linear only where geometry
requires it; none is the solid canvas. Recipes (over scoped tokens):
`radial-gradient(circle at 50% 0%, #241e19 0%, #1d1814 38%, #15120f 100%)` and
`linear-gradient(180deg, #241e19 0%, #1d1814 42%, #15120f 100%)`. Neutral only — no rose/purple/pink/
contextual colour, no animation, no glow, no pointer interception, no overflow. Under `forced-colors:
active` it collapses to the system `Canvas` (it carries no meaning).

## 7. Surface primitives

`<Surface level={1|2|'raised'} border="none|subtle|strong" radius="<RADIUS key>" shadow as=…>`. Solid
graphite fills via the scoped tokens; subtle/strong graphite borders; the existing restrained `RADIUS`
scale (reused from `@/shared/lib/tokens`, not re-invented); optional minimal warm-neutral shadow. No
glassmorphism, coloured shadow, gradient border, rose/purple glow, excessive blur, oversized radius, or
default animated hover lift.

## 8. Typography roles

`<Text variant="display|title|section|body|body-sm|label|caption|metadata" as=…>`. **Inter only** (no
Newsreader/Outfit/serif/display family, no editorial-context switching). Explicit line-heights; only
globally-loaded weights (400/500/600/700); safe wrapping (`overflow-wrap: break-word`) for long /
localized / unexpected content. The prop is `variant` (not `role`) to avoid colliding with the HTML ARIA
`role` attribute.

## 9. Primary-action primitive

`<PrimaryAction size="sm|md|lg" fullWidth loading disabled>`. Solid `#efe7d7` fill + `#221b13` text.
Follows the established Button architecture (forwardRef, in-button micro-spinner, disabled, focus-visible,
reduced-motion-gated press) as an **opt-in scoped primitive** — it does not fork or modify the production
`Button`, and is excluded from production until a pilot imports it. All sizes meet the **44px touch floor**
(sm 44 / md 44 / lg 48). No rose, purple, gradient, glow, or contextual colour. Focus-visible is an offset
ivory outline (visible on the ivory fill and any graphite surface; survives forced-colors); states carry
**no layout shift** (hover = filter, press = transform, loading = centered spinner over a width-reserving
label).

## 10. Decision-state primitive

`<DecisionMarker active srLabel=…>`. The ivory-only (`#f3ecdf`) selected/committed marker — a 7px dot in
a permanently reserved 14px slot, so toggling causes **zero layout shift**. No rose/purple/pink/gradient/
glow/shadow/pulse/animation; no `--decision-signal` token. It is `aria-hidden` and **supplementary only**:
the owning component MUST provide the semantic state (`aria-pressed`/`aria-selected`/`checked`/status) and
at least two non-colour cues. `srLabel` adds screen-reader-only state text as one such cue.

## 11. Rose-accent helper

Three explicit, bounded helpers (not a generic `.accent` utility): `<BrandMark>` (decorative rose dot),
`<BrandLink>` (lightweight rose link), `<BrandSignature solid>` (small uppercase rose kicker; `solid`
renders a white-on-rose pill using the `#c0356c` contrast variant). Permitted: wordmark detail,
lightweight links, small signature marks, limited expressive emphasis. Never: primary buttons, selected
states, semantic states, page atmosphere, card fills, glow, or navigation backgrounds.

## 12. Legacy-gradient safeguard

`scripts/guards/legacy-gradient-guard.mjs` (run via `npm run guard:foundations`) performs two checks:
(A) an **app-wide legacy-gradient baseline** — counts occurrences of the legacy gradient
(`linear-gradient(135deg,#9333ea,#ec4899)`, `--brand-gradient`, `--gradient-primary`, `HP_GRAD`) across
`src/` + `index.html` and compares to the committed, reviewable allowlist
`scripts/guards/legacy-gradient-baseline.json`; a new file or an increased count **fails** with a clear
message; existing debt passes; no automatic rewriting. (B) **Stage-1 purity** — the foundation + showcase
must contain none of the legacy gradient, legacy purple/pink hexes/vars, Newsreader/Outfit font usage, or
contextual-colour vars (usage-based patterns, so explanatory prose is not flagged). The legacy-gradient detection covers hex,
rgb/rgba, and `var(--purple/--pink)` forms of the legacy linear gradient (not just hex), so a re-expressed
gradient cannot evade the baseline. Baseline at authoring: **6 files / 16 allowlisted occurrences**.

## 13. Showcase

`src/features/design-lab/thoughtful-seatmate-foundations/Showcase.jsx`, reached only via the **dev-only**
route `/design-lab/thoughtful-seatmate-foundations`. The route and its lazy import sit behind a literal
`import.meta.env.DEV` guard with a static import path, so Rollup dead-code-eliminates both from the
production build (verified: not a normal user-accessible route; absent from `dist`). It uses no production
user data and exercises every primitive + state: radial/linear/none depth, all surface roles, the full
text hierarchy, the primary action in all states, the ivory decision state, the bounded rose helpers, the
combined desktop/mobile composition, long-copy stress, the missing-image state, and disabled/loading.

## 14. Accessibility results

Validated during Stage 1 via an **ad-hoc** `@axe-core/playwright` + Playwright run against the dev-only
showcase (the showcase is dev-only, so this is **not** committed as a standing CI test; the committed
automated coverage is the vitest suite in §15, including the CSS-token-mirror and purity/non-adoption
tests). Results of that run:
- **Colour contrast: 0 violations** (after the fix in §17 below).
- **No horizontal overflow** at 360px, 200% zoom, and 400% zoom.
- **Reduced motion**: the primary-action spinner's computed `animation-name` is `none` under
  `prefers-reduced-motion: reduce`; all **animated** transitions are reduced-motion-gated (the rose-link
  underline is an instant, non-animated state change — inherently reduced-motion-safe).
- **Forced colours**: the depth treatment collapses to system `Canvas`; text/borders/buttons use system
  colours; structure and legibility are intact.
- **Decision state** carries semantic state + ≥2 non-colour cues (the marker alone is not relied upon).
- Focus-visible is a visible offset ivory outline; **all** primary-action sizes (sm/md/lg) and the
  selectable rows meet the 44px touch-target floor.

## 15. Test results

- `npm run lint` (eslint src): **clean** (0 errors, 0 warnings).
- `npm run test` (vitest): **1565 passed** (1539 existing + 26 new Stage-1 tests across `tokens.test.js`
  incl. the CSS↔JS token-mirror + exact-key-set checks, `primitives.test.jsx`, and
  `purity-and-non-adoption.test.js` incl. the rgb/var gradient-evasion checks).
- `npm run guard:foundations`: **pass** (baseline unchanged; Stage-1 namespace pure).
- `npm run build` (production): **succeeds**.
- `git diff --check`: **clean**.

## 16. Production non-adoption proof

- **Bundle exclusion (authoritative):** after `npm run build`, `dist` contains **none** of the Stage-1
  code — no `--ts-*` vars, no target foundation hexes (`#15120f`/`#efe7d7`/`#2d2621`/`#f3ecdf`), no
  `ThoughtfulRoot`/`ts-page-depth`/`ts-action-primary`/`ts-decision-marker`/`ts-brand-*`, no showcase
  identifier, and no Stage-1 chunk.
- **No production importer:** the `purity-and-non-adoption.test.js` suite asserts no file outside the
  namespace imports the foundation, and the showcase is imported only by `src/app/router.jsx` under the
  literal `import.meta.env.DEV` guard.
- **No replacement of existing values:** global `tokens.js`, `index.css`, fonts, focus ring, selection,
  and existing components are unchanged; no legacy token/font/gradient was removed.

## 17. Known limitations

- **Rose-as-text contrast:** the accepted rose `#dd4e83` as TEXT meets WCAG AA only on `--ts-canvas`
  (~4.88:1) and `--ts-surface-1` (~4.60:1). It is **~4.31:1 on `--ts-surface-2`** and **3.89:1 on
  `--ts-surface-raised` (#2d2621)** — both below AA for small/normal text. The showcase originally placed
  rose text on a raised card; it was fixed to surface-1. **Pilot rule:** use rose-as-text only on
  `--ts-canvas` or `--ts-surface-1` (or for large/bold text, or as the non-text `BrandMark`/white-on-rose
  solid pill on lighter surfaces). White-on-rose uses `#c0356c`.
- Visual screenshots are captured against the dev server (the showcase is dev-only); they are not wired
  into the committed Playwright visual baselines (Stage 1 adds no production visual baseline by design).
- The automated guard covers the legacy gradient (app-wide) and Stage-1 purity. Broader bans (new
  Newsreader/Outfit/purple/plum/contextual usage on production *target* surfaces) remain **review rules**
  (documented), not automated, to avoid brittle false positives against existing debt.

## 18. Pilot handoff

See `src/shared/ui/thoughtful-seatmate/README.md` for the exact pilot API and the contrast/usage rules.
Summary: a pilot (Tonight, then Film File) wraps its migrated region in `<ThoughtfulRoot>`, composes
`PageDepth` (page background) + `Surface` (solid cards) + `Text` (Inter roles) + `PrimaryAction`
(neutral CTA) + `DecisionMarker` (ivory selected state, with owner-supplied semantic + ≥2 non-colour cues)
+ the bounded rose helpers — using **scoped/local** values, never globalizing tokens before two pilot
surfaces validate (migration gate 5). Contextual film colour is implemented in **no** stage.

## 19. Rollback

Stage 1 is additive and unadopted: reverting the branch (or deleting the namespace + showcase + guard and
reverting the two additive router/package edits) removes the foundation with **zero** production impact —
nothing references it in production. The legacy-gradient baseline can be regenerated with
`npm run guard:foundations:update` if the underlying debt legitimately changes (review the diff).

## 20. No-production-visual-change statement

This stage changed **no** production page's appearance. The dev-only showcase is the only surface that
renders the foundation, and it is excluded from the production build. No existing production component
changed, no production visual baseline changed, no existing token value was replaced, no legacy font or
gradient was removed, and no contextual-colour code was introduced. Nothing here authorizes the Tonight or
Film File pilot, a global token migration, or any deployment.
