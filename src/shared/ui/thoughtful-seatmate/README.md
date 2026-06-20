# Thoughtful Seatmate foundation primitives

Reusable foundation primitives for the Thoughtful Seatmate visual system, which is **shipped
website-wide**. `foundations.css` is loaded **globally** via `src/index.css`, and the canonical
`.theme-thoughtful` theme is applied **once at the application root** (`src/App.jsx`), so these
primitives are part of the production bundle. They are **compositionally adopted** by selected
production surfaces (**home, movie, watchlist**); other routes are **theme-migrated** (recoloured by
the global theme via the temporary legacy compatibility-alias layer in `src/index.css`) without yet
being **composition-migrated**.

**Authorities (these override the historical stage docs):**
[ADR 019](../../../../docs/decisions/019-thoughtful-seatmate-website-wide-theme.md),
[`docs/ui/composition-system-ownership.md`](../../../../docs/ui/composition-system-ownership.md),
the current `.claude/rules/design-system.md`, and the shipped implementation. Historical context:
[`docs/ui/thoughtful-seatmate-stage1-foundations-implementation.md`](../../../../docs/ui/thoughtful-seatmate-stage1-foundations-implementation.md).

## Imports

```js
import {
  ThoughtfulRoot, PageDepth, Surface, Text, PrimaryAction, DecisionMarker,
  BrandMark, BrandLink, BrandSignature, TS_TOKENS, TS_PAGE_DEPTH,
} from '@/shared/ui/thoughtful-seatmate'
```

## Composition scope (`<ThoughtfulRoot>`)

The canonical `--color-*` tokens (and the `--ts-*` aliases) are defined **globally** by
`.theme-thoughtful` (applied once at the app root). `<ThoughtfulRoot>` no longer "activates" the
tokens — it marks a **Thoughtful Seatmate composition scope** and re-asserts the `--ts-*` names so a
composition-migrated region resolves them locally:

```jsx
<ThoughtfulRoot>
  <PageDepth depth="radial">{/* page / hero background */}
    {/* composition-migrated content */}
  </PageDepth>
</ThoughtfulRoot>
```

`foundations.css` **is** imported globally — that is the shipped architecture. Do not add a *second*
theme boundary or re-import `foundations.css` per route: the one root boundary in `src/App.jsx` themes
the whole app.

## API

- **`<PageDepth depth="radial" | "linear" | "none">`** — large page/hero/immersive-modal/section
  backgrounds only. Radial preferred; linear only where geometry requires. Never on cards/buttons/chips/
  nav/selected/semantic states.
- **`<Surface level={1|2|'raised'} border="none|subtle|strong" radius="<RADIUS key>" shadow>`** — solid
  graphite contained surfaces (cards). Keep cards solid; do not put `PageDepth` inside a card.
- **`<Text variant="display|title|section|body|body-sm|label|caption|metadata" as="…">`** — Inter only;
  pick the semantic element via `as`.
- **`<PrimaryAction size="sm|md|lg" fullWidth loading disabled type>`** — **COMPATIBILITY WRAPPER** over
  `<Button variant="primary">`. Delegates all semantics/loading/focus/forced-colours to Button;
  `PrimaryAction.css` only preserves its legacy visual recipe. **It now has ZERO production component
  consumers** — Watchlist (Slice C), Home (Slice D) and Movie (Slice E) all render `<Button
  variant="primary">` directly, each importing `PrimaryAction.css` for the same recipe via the
  `ts-action-primary*` compat classes. The wrapper + barrel export are **retained temporarily** (only
  retirement-gate condition 1 is met; conditions 2–4 remain) — **do not add new adopters; use `Button`
  directly.**
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
- No second theme boundary or replacement theme: the canonical `.theme-thoughtful` is the one root
  boundary (the historical "do not globalize" gate is satisfied — globalization has shipped).

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
  demoed in the dev showcase. Production adoption: `ThoughtfulRoot` / `PageDepth` (home, movie, watchlist),
  `Surface` (movie / Film File); `PrimaryAction` the wrapper (**zero production consumers**). **`PrimaryAction`
  is now a compatibility wrapper over `<Button variant="primary">`** (Slice B) with **zero production component
  consumers**: **Watchlist (Slice C), Home (Slice D) and Movie (Slice E) all render `<Button
  variant="primary">` directly** (each importing `PrimaryAction.css` for the same legacy recipe via the
  `ts-action-primary*` compat classes), pending the final neutral-primary recipe. The wrapper + barrel export
  are retained temporarily (retirement-gate condition 1 met; 2–4 pending). **None deprecated** — all are retained. `Text`, `DecisionMarker`,
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
  contextual colour — and (D) the adopter allowlist (`src/features/home/`, `src/features/movie/`,
  `src/features/watchlist/` + the dev showcase). Each future stage adds its surface to `ADOPTERS` +
  `MIGRATED_FILES`.

## Rollback

The theme is **global** (one root boundary), so rollback is **not** per-surface independent. The
environment switch `VITE_UI_THEME=legacy` is a **partial** runtime token-layer fallback — it disables the
canonical alias layer so the legacy `:root` tokens resolve again **where those fallbacks still exist**. It
does **not** restore removed font loading, changed component defaults, or directly-edited presentation; a
full return to the pre-#315 appearance requires reverting the migration commit, not flipping the env var. A
single surface's *composition* (its `<ThoughtfulRoot>` / primitive usage) can be reverted independently, but
the global theme remains applied.
