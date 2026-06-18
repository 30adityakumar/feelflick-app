# Thoughtful Seatmate foundation primitives (Stage 1) — pilot handoff contract

Scoped, reusable, **opt-in** foundation for the Thoughtful Seatmate target system. **Not adopted by any
production surface.** Tree-shaken out of the production bundle until a pilot imports from here. Stage 2
(Tonight) and Stage 3 (Film File) consume this API; they do **not** modify these primitives or globalize
the tokens.

Full context: [`docs/ui/thoughtful-seatmate-stage1-foundations-implementation.md`](../../../../docs/ui/thoughtful-seatmate-stage1-foundations-implementation.md).

## Imports

```js
import {
  ThoughtfulRoot, PageDepth, Surface, Text, PrimaryAction, DecisionMarker,
  BrandMark, BrandLink, BrandSignature, TS_TOKENS, TS_PAGE_DEPTH,
} from '@/shared/ui/thoughtful-seatmate'
```

## Token activation scope (required wrapper)

The `--ts-*` tokens exist only inside `.ts-root`. A pilot wraps **its migrated region** (not the global
shell) in `<ThoughtfulRoot>`:

```jsx
<ThoughtfulRoot>
  <PageDepth depth="radial">{/* page / hero background */}
    {/* migrated content */}
  </PageDepth>
</ThoughtfulRoot>
```

This keeps activation **local/scoped**. Do not add `.ts-root` to `<body>`, `#root`, the app shell, or
`:root`, and do not import `foundations.css` globally — that would be a global migration (gated, later).

## API

- **`<PageDepth depth="radial" | "linear" | "none">`** — large page/hero/immersive-modal/section
  backgrounds only. Radial preferred; linear only where geometry requires. Never on cards/buttons/chips/
  nav/selected/semantic states.
- **`<Surface level={1|2|'raised'} border="none|subtle|strong" radius="<RADIUS key>" shadow>`** — solid
  graphite contained surfaces (cards). Keep cards solid; do not put `PageDepth` inside a card.
- **`<Text variant="display|title|section|body|body-sm|label|caption|metadata" as="…">`** — Inter only;
  pick the semantic element via `as`.
- **`<PrimaryAction size="sm|md|lg" fullWidth loading disabled>`** — the neutral ivory primary action.
- **`<DecisionMarker active srLabel="…">`** — ivory selected/committed marker. **The owning control MUST
  also supply** the semantic state (`aria-pressed`/`aria-selected`/`checked`/status) **and ≥2 non-colour
  cues** (changed label, icon, neutral fill/border, status text, stable position). The marker alone is not
  a sufficient state indicator.
- **`<BrandMark>` / `<BrandLink>` / `<BrandSignature solid>`** — bounded rose accents, used sparingly.

## What remains forbidden (in pilots too)

- No legacy purple→pink gradient, no replacement gradient, no new gradient token.
- No Newsreader / Outfit / serif / second reading voice.
- No rose for primary actions, decision/selected states, semantic states, navigation backgrounds, page
  atmosphere, card fills, or pervasive glow.
- No contextual film colour / poster aura / extraction (deferred — implemented in no stage).
- No globalizing `--ts-*` tokens before two pilot surfaces validate (migration gate 5).

## Contrast rule (important)

Rose-as-text (`#dd4e83`) meets WCAG AA only on `--ts-canvas` (~4.88:1) and `--ts-surface-1` (~4.60:1). It
is **~4.31:1 on `--ts-surface-2`** and **3.89:1 on `--ts-surface-raised`** — both below AA for small/normal
text. **Use rose text only on canvas or surface-1**; on lighter surfaces use the non-text `BrandMark`,
large/bold text (AA-large 3:1, which rose clears on every stop), or the white-on-rose solid pill (`#c0356c`,
which passes AA for white text). Neutral ivory text/actions and the ivory decision marker pass on all
surfaces.

**`--ts-text-muted` usage rule (Stage 5/B1):** muted (`#8d887f`) passes AA on `canvas` / `surface-1` /
`surface-2` (~5.3/5.0/4.7:1) but is **~4.2:1 on `--ts-surface-raised` — below AA.** Use `text-muted` only on
canvas/surface-1/surface-2; on `surface-raised` (or any lighter elevation), promote muted → `text-secondary`
(`#beb8ad`, ≥7.5:1 everywhere). These bounds — and the rose bounds above — are **enforced** by
`__tests__/contrast-rules.test.js`, which computes the ratios from the live token values and fails CI if a
value drifts so a rule breaks. Do not change a token value without re-reviewing that table.

## Stage 5 — hardening status (B1–B5)

The foundation was hardened against the globalization-readiness blockers
([stage4 review](../../../../docs/ui/thoughtful-seatmate-stage4-globalization-readiness.md)).
Summary of the durable decisions (full record:
[stage5](../../../../docs/ui/thoughtful-seatmate-stage5-foundation-hardening.md)):

- **Primitive adoption status.** All 9 primitive APIs are unit-tested (`__tests__/primitives.test.jsx`) and
  demoed in the dev showcase. Production adoption so far: `ThoughtfulRoot` / `PageDepth` / `PrimaryAction`
  (both pilots), `Surface` (Film File). **None deprecated** — all are retained. `Text`, `DecisionMarker`,
  `BrandMark`/`BrandLink`/`BrandSignature` are validated by test + showcase; their *production* adoption is
  scheduled, not forced: `Text` is the preferred way to set standard hierarchy on **newly** migrated
  surfaces; `DecisionMarker` is adopted where a supplementary dot helps; the Brand* helpers are for the
  shell wordmark migration (Stage 12) + bounded editorial moments.
- **DecisionMarker reconciliation.** The pilots' hand-rolled ivory committed states (semantic state +
  ≥2 non-colour cues) are the **canonical** pattern; `DecisionMarker` is the **optional** supplementary
  ivory dot for it (never sufficient alone). Pinned by `__tests__/decision-state-composition.test.jsx`.
- **Token retention.** `surface-raised`, `page-depth linear`, `--ts-brand-rose(-contrast)` are **retained**
  (exercised in the showcase; needed by elevated surfaces / geometry / the rose contract) even though the
  two pilots did not exercise them. There is no `--ts-decision` token by design (the marker reuses
  `--ts-focus`). No token value changed in Stage 5 (pilot visuals are byte-identical).
- **Guard.** `scripts/guards/legacy-gradient-guard.mjs` now also enforces (C) migrated-surface purity —
  the rendered files of each migrated surface must stay free of editorial font / purple-pink chrome /
  contextual colour — and (D) the adopter allowlist (`src/features/home/`, `src/features/movie/` + the dev
  showcase). Each future stage adds its surface to `ADOPTERS` + `MIGRATED_FILES`.

## Rolling back one pilot without affecting the other

Each pilot adopts the foundation **locally** (its own `<ThoughtfulRoot>` region, scoped values). Reverting
Tonight's pilot PR removes Tonight's adoption only; Film File is independent (its own PR/region). Because
nothing is globalized in the pilots, neither rollback touches the other or the rest of production.
