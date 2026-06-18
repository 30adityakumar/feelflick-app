# Thoughtful Seatmate — Stage 5: Foundation Hardening (implementation record)

## 1. Status

**Implemented, not merged.** Closes globalization-readiness blockers **B1, B2, B4, B5** and produces the
**B3** reconciliation map (executed later, at Stage 13). **No route was migrated; no token value changed;
no `:root` promotion; Tonight and Film File are byte-identical (their screenshots are preserved).** This is
foundation/guard/test/docs work only — the first stage of the whole-site program (ledger:
[`thoughtful-seatmate-whole-site-migration-program.md`](thoughtful-seatmate-whole-site-migration-program.md)).

## 2. Repository state

Branch `migration/thoughtful-seatmate-stage5-foundation-hardening` off `origin/main`
`8deaecf7daa88cb891fb885fb9bffb7048d2c8b8` (after #312); no intervening commits.

## 3. Blockers addressed → resolution

- **B1 (repeated accessibility workarounds) — CLOSED.** The two recurring workarounds are now *rules*,
  enforced by a contrast test, not ad-hoc per-surface fixes:
  - **text-muted usage rule:** `--ts-text-muted` (`#8d887f`) is permitted on `canvas`/`surface-1`/`surface-2`
    only (≥4.7:1); on `surface-raised` it is ~4.2:1 (< AA) → promote to `--ts-text-secondary`. The value is
    **unchanged** (changing it would alter the pilots); the *rule* is the resolution.
  - **rose usage rule:** rose small text only on `canvas`/`surface-1`; rose large text (AA-large 3:1) on all
    stops; otherwise ivory or the white-on-rose pill (`#c0356c`, AA for white text).
  - Both are locked by `src/shared/ui/thoughtful-seatmate/__tests__/contrast-rules.test.js` (computes ratios
    from the live token values; fails CI if a value drifts so a rule breaks).
- **B2 (5/9 primitives unvalidated) — CLOSED for API soundness; production adoption scheduled.** All 9
  primitive APIs are unit-tested (`primitives.test.jsx`) and demoed in the dev showcase (incl.
  `surface-raised`, `linear` depth, `DecisionMarker`, the Brand* helpers). **Retention decision: keep all 9;
  none deprecated** (all are minimal, correct, and either adopted or scheduled). `DecisionMarker` is
  reconciled (below). Production adoption of `Text` / `DecisionMarker` / Brand* is **by-design deferred** to
  the surfaces that need them (route stages adopt `Text`/`DecisionMarker`; the shell stage 12 adopts the
  Brand* wordmark helpers) — Stage 5 forbids migrating a route, so it validates the APIs rather than forcing
  use.
- **B3 (scoped/global token collision) — MAPPED here, EXECUTED at Stage 13.** See §15. Stage 5 does not move
  any token to `:root`.
- **B4 (insufficient guard) — CLOSED.** The guard now enforces migrated-surface purity + the adopter
  allowlist (§14).
- **B5 (under-exercised tokens) — CLOSED (retention decided).** `surface-raised`, `page-depth linear`,
  `--ts-brand-rose(-contrast)` retained with documented purpose; no `--ts-decision` token by design (§13).

## 4. Blockers closed

**B1, B2 (API soundness), B4, B5.** B2's residual (real *production* adoption of the 3 not-yet-used
primitive families) is scheduled across later stages, not a foundation defect.

## 5. Blockers remaining

**B3** (token collision) — reconciliation **planned/mapped** (§15) but intentionally **not executed**;
it closes at **Stage 13 (token promotion)**, which is the only place a `:root` move is authorized.

## 6. Primitive API changes

**None.** No primitive's API or rendered output changed (changing a used primitive would alter the pilots).
The 5 previously-unadopted primitives were already minimal + correct; they were *validated*, not revised.

## 7. Token changes

**None to values.** No `--ts-*` value, `foundations.css`, or `tokens.js` value changed (pilots preserved).
Only documentation (README + this record) + a contrast test were added around the existing tokens.

## 8. Contrast changes

No colour value changed. The contrast *rules* are now codified + machine-enforced
(`contrast-rules.test.js`, 8 assertions): text-primary/secondary AA on all stops; text-muted AA on
canvas/surface-1/surface-2 and explicitly < AA on surface-raised; action-primary AA; focus ≥3:1 everywhere;
rose small-text AA only on canvas/surface-1; rose large-text ≥3:1 everywhere; white-on-`#c0356c` AA.

## 9. Rose rules

Bounded rose: small text only on `canvas`/`surface-1`; large editorial text on any stop (≥3:1); the
white-on-rose **solid pill** (`#c0356c`) for a rare expressive moment. Never: primary action, decision/
committed state, semantic status, provider colour, navigation background, page atmosphere, card fill, glow,
or any small label on `surface-2`/`raised`. Enforced by the contrast test + the migrated-surface guard.

## 10. Muted-text resolution

`--ts-text-muted` value **unchanged** (would re-baseline the pilots). Resolution = a **usage rule**: muted
on `canvas`/`surface-1`/`surface-2` only; promote → `text-secondary` on `surface-raised`/lighter. Codified
in the README + locked by the contrast test. (A future stage may revisit the *value* once it can re-baseline
the affected surfaces together.)

## 11. DecisionMarker resolution

Reconciled (not changed): the pilots' hand-rolled ivory committed-state pattern (semantic state +
≥2 non-colour cues) is the **canonical** pattern; `DecisionMarker` is the **optional** supplementary ivory
dot for it (`aria-hidden`, never sufficient alone). Pinned by
`__tests__/decision-state-composition.test.jsx` (a real toggle with `aria-pressed` + label/icon, composed
with and without the marker). No `--ts-decision` token — the marker reuses `--ts-focus` projection-ivory.

## 12. Text resolution

**Kept.** `Text` (Inter-only variant scale + polymorphic `as`) is sound + unit-tested + demoed. The pilots
used local token consts + inline styles for fine control; going forward, `Text` is the **preferred** way to
set standard hierarchy on newly migrated surfaces. Not deprecated.

## 13. Brand primitive validation + token retention

`BrandMark`/`BrandLink`/`BrandSignature` are unit-tested + demoed; **kept** for the shell wordmark migration
(Stage 12) + bounded editorial moments. Token retention: `surface-raised` (elevated surfaces / modals later),
`page-depth linear` (geometry-specific), `--ts-brand-rose` + `--ts-brand-rose-contrast` (the canonical rose
source + the white-on-rose AA variant) are **retained**; no token removed (removal is a Stage 14 concern
after zero consumers are proven).

## 14. Guard changes

`scripts/guards/legacy-gradient-guard.mjs` gains two checks (CI-enforced via `app-quality.yml`):
- **(C) migrated-surface purity** — an explicit list of the rendered files of each migrated surface
  (`MIGRATED_FILES`, 16 files) must be free of `var(--font-editorial)` / Newsreader / Outfit / purple-pink
  chrome hex / `HP.purple|pink` / `FILM_PALETTE` / `var(--context-`. Zero-tolerance (clean today). The mixed
  `home/sections-bottom.jsx` is excluded (its rendered exports are slice-checked by the Stage 2 test; its
  non-rendered deferred components keep legacy styling until their route migrates).
- **(D) adopter allowlist** — only `src/features/home/`, `src/features/movie/` (+ the foundation + dev
  showcase) may import `@/shared/ui/thoughtful-seatmate`; any other importer fails. Each future stage adds
  its surface to `ADOPTERS` + `MIGRATED_FILES`.
The legacy-gradient app-wide baseline (6 files / 16 occ) and Stage-1 namespace purity are unchanged. Guard
output confirms: "6 baselined files / 16 occ unchanged; Stage-1 namespace pure; 16 migrated-surface files
clean; adopter allowlist = home + movie + showcase".

## 15. B3 — token-reconciliation map (for Stage 13; not executed)

At promotion, reconcile the scoped `--ts-*` with the existing `:root` globals (one canonical system):

| `--ts-*` (scoped) | existing global (`:root`) | Stage-13 action |
|---|---|---|
| `--ts-canvas` / `--ts-surface-1/2/raised` | `--bg-base`, `--bg-elevated` | promote `--ts-*` as canonical; alias `--bg-*` → `--ts-*` temporarily; remove `--bg-*` in Stage 14 |
| `--ts-text-primary/secondary/muted` | `--brand-ivory`, `--brand-ivory-soft` | promote `--ts-text-*`; alias `--brand-ivory*`; remove later |
| `--ts-border-subtle/strong` | `--brand-warm-hairline` | promote `--ts-border-*`; alias |
| `--ts-action-primary-fill/-text` | (none) | promote as-is |
| `--ts-brand-rose` / `-contrast` | `--brand-rose`, `--brand-rose-soft` | unify on `--ts-brand-rose`; map `--brand-rose` → it; `-soft` retired |
| `--ts-focus` | (global focus uses legacy) | promote; reconcile global `:focus-visible` in Stage 12 |
| (none — Inter) | `--font-body`/`-ui` (Inter), `--font-display`/`-editorial` (Newsreader) | keep Inter; retire `--font-display`/`-editorial` in Stage 14 once zero consumers |
| (n/a — retired) | `--brand-gradient`, `--gradient-primary`, `--purple-*`, `--pink-*` | **retire** (Stage 14), no `--ts-*` equivalent |

Rule for Stage 13: promote only approved tokens; keep aliases temporarily; prove no third-party / exported-
artifact / test-fixture regression; do not combine with a route migration.

## 16–18. Tonight visual / Film File visual / determinism

No Tonight or Film File **file** changed and no token **value** changed → both pilots render byte-identically
→ their committed visual baselines remain valid (no re-baseline; nothing to regenerate). Verified by the diff
(no `src/features/home/*` or `src/features/movie/*` or `foundations.css`/`tokens.js` value change) and the
green migrated-surface guard. The new tests are deterministic (pure computation + jsdom render, no clock/
network).

## 19. Tests added

- `__tests__/contrast-rules.test.js` (8 assertions) — enforceable B1 contrast/usage rules.
- `__tests__/decision-state-composition.test.jsx` (2 tests) — B2 DecisionMarker ↔ canonical committed-state
  reconciliation.
- (existing `primitives.test.jsx` already covers all 9 primitive APIs; `purity-and-non-adoption.test.js`
  covers the adopter allowlist + guard-mandatory-in-CI; both unchanged.)

## 20. Rollback plan

Revert the guard extension + the two new test files + the README hardening section + the program ledger +
this record. No production surface, token value, primitive API, or visual baseline is touched, so rollback
is trivial and affects nothing else.

## 21. Known limitations

- B3 is mapped, not executed (closes at Stage 13). B2's production adoption is deferred to later stages.
- The text-muted *value* is unchanged (a usage rule, not a value fix) to preserve pilot screenshots; a
  value change is deferred to a stage that can re-baseline the affected surfaces.
- Darwin pilot baselines remain stale (program follow-up F1; unrelated to Stage 5).

## 22. No new route migrated / no globalization

No production route was migrated; no `--ts-*` token was promoted to `:root`; no global token/font/shell/nav
change; no contextual colour added. ADR 014–018 unchanged; no new ADR. Production behavior and visuals are
unchanged.
