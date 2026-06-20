# Thoughtful Seatmate — Stage 4: Two-Pilot Consolidation & Globalization-Readiness Review

## 1. Executive decision

**GLOBALIZATION READINESS: READY WITH BLOCKERS.**

The shared foundation is **proven for scoped, per-route pilot adoption**: two production surfaces (Tonight,
Film File) adopted it, are live, CI-green, and behaviorally stable, using the **same `--ts-*` token values
with no per-surface override and no primitive redesign**. That validates the *local adoption* model.

It is **not yet ready for token globalization** (`:root` promotion / shell-wide adoption / legacy-token
retirement). Five concrete blockers must be centrally resolved first (see §24): repeated accessibility
workarounds, five unvalidated primitives, a real token-name collision with the existing global system, an
insufficient guard, and under-exercised tokens. The safest next step is a **foundation-hardening stage**
(resolve the blockers; no surface migration) followed by **one more low-risk local surface** — **not**
globalization.

This is a documentation/audit stage. No production UI changed; no token was globalized; no surface was
migrated; nothing is merged or deployed.

> **Method note (honesty):** the parallel evidence-gathering pass had a tooling failure — one auditor
> wrongly reported the foundation "does not exist" (its grep ran against a wrong/empty scope). That was
> caught and discarded; all evidence below was re-gathered by **direct repository inspection** of the
> worktree at `e91cb1b4`, and counts are reproducible greps.

## 2. Repository state

- **origin/main:** `e91cb1b4987f2cdc14916ec9217f10315d5a2a63` (Film File pilot #310), unchanged through this
  review. Prior: `3c0c561f` (Tonight #309), `b3691f45` (Stage 1 foundation #308).
- **Worktree / branch:** `/Users/wish/feelflick-thoughtful-seatmate-consolidation` /
  `migration/thoughtful-seatmate-globalization-readiness`.
- Foundation present at `src/shared/ui/thoughtful-seatmate/` (7 primitive modules + `foundations.css` +
  `tokens.js`). Both pilots merged + live (`app.feelflick.com` HTTP 200). Guard baseline 6 files / 16 occ.

## 3. Tonight summary (Stage 2 pilot)

Route `/home` → `src/features/home`. Local `<ThoughtfulRoot>` wrapping `HomeBody` (3 `<ThoughtfulRoot>`
sites incl. states); `<PageDepth depth="radial">` ×2; `<PrimaryAction>` ×1 ("Open Film File"); `<Surface>`
×0; `<DecisionMarker>` ×0 (mood pills + Watched/Save are hand-rolled ivory states). Rose retired to a single
large editorial `em` + the wordmark. 37 `--ts-*` references. Behavior preserved (103 Home tests). Live;
Darwin baselines stale (Linux regenerated in CI). Residual legacy is confined to the **non-rendered**
`sections-bottom` components (out of scope).

## 4. Film File summary (Stage 3 pilot)

Route `/movie/:id` → `src/features/movie`. Local `<ThoughtfulRoot>` (body + skeleton + error, 3 sites);
`<PageDepth depth="radial">` ×4; `<PrimaryAction>` ×2 ("Play Trailer" hero + sticky); `<Surface>` ×1
(`PrimaryCaseCard`, replacing the legacy purple-gradient `AccentPanel`); `<DecisionMarker>` ×0 (watched /
saved / reaction-tag / save-indicator hand-rolled ivory). Rose retired to `::selection` only. 170 `--ts-*`
references. `FILM_PALETTE` poster/mood colour fully removed from the chrome (incl. MoodRadar hues). Behavior
preserved (full Film File suites). Live; Darwin baselines stale.

## 5. Two-pilot comparison

| Dimension | Tonight | Film File | Consistent? |
|---|---|---|---|
| `<ThoughtfulRoot>` local boundary | yes (HomeBody) | yes (body + skeleton + error) | ✅ |
| `<PageDepth depth="radial">` | ✅ | ✅ | ✅ |
| `<PrimaryAction>` | 1 | 2 | ✅ |
| `<Surface>` | 0 | 1 | ⚠️ one pilot only |
| `<Text>` primitive | 0 | 0 | ❌ neither |
| `<DecisionMarker>` | 0 (hand-rolled) | 0 (hand-rolled) | ❌ neither (ADR 016 bypassed) |
| `BrandMark`/`BrandLink`/`BrandSignature` | 0 | 0 | ❌ neither |
| `--ts-*` token values | identical, no override | identical, no override | ✅ |
| rose bound | large `em` + wordmark | `::selection` only | ⚠️ tighter than the token implies |
| local override pattern | local token consts | shadowed-`HP` + per-site `FILM_PALETTE` removal | ⚠️ more on Film File |
| behavior preserved | ✅ | ✅ | ✅ |
| production / CI | live, green | live, green | ✅ |
| Darwin baselines | stale | stale | ⚠️ both |

Behavior was equivalent across desktop/tablet/mobile/200%/400%/forced-colours/reduced-motion/long-content/
missing-imagery/loading/empty/error/committed-states for both pilots (verified locally + in CI on the
authenticated visual project; full matrices live in each pilot's record §14/§18).

## 6. Primitive audit

Usage counts (direct grep, both pilots):

| Primitive | Tonight | Film File | Verdict |
|---|---|---|---|
| `ThoughtfulRoot` | 3 | 3 | **validated** (both) |
| `PageDepth` | 2 | 4 | **validated** (both) |
| `PrimaryAction` | 1 | 2 | **validated** (both) |
| `Surface` | 0 | 1 | partially validated (one pilot) |
| `Text` | 0 | 0 | **UNVALIDATED** — both pilots used inline styles + local token consts |
| `DecisionMarker` | 0 | 0 | **UNVALIDATED** — both pilots hand-rolled ivory decision states (ADR 016 marker bypassed) |
| `BrandMark` | 0 | 0 | **UNVALIDATED** |
| `BrandLink` | 0 | 0 | **UNVALIDATED** |
| `BrandSignature` | 0 | 0 | **UNVALIDATED** |

No primitive **API defect** was found (no severe correctness bug → no corrective PR proposed). But **5 of 9
primitives were never exercised by production**, so their APIs are **unvalidated for broad adoption**. Two
are notable: `DecisionMarker` encodes ADR 016's ivory marker, yet **both** pilots hand-rolled ivory states
inline instead — evidence the marker API either doesn't fit real toggle controls or is redundant; and
`<Text>` was bypassed entirely (both used `var(--ts-text-*)` consts + inline styles). Per the task, no
primitive API was changed in this stage.

## 7. Repeated-override analysis

| Pattern | Repeated across both pilots? | Classification |
|---|---|---|
| Local token consts / shadowed-`HP` to map legacy → `--ts-*` | yes | **SHARED-PRIMITIVE-CANDIDATE** (a `<Text>`/themed-style helper would remove it) |
| Eyebrow/kicker = ivory secondary + graphite rule line | yes | **SHARED-PRIMITIVE-CANDIDATE** (an `Eyebrow` themed variant) |
| Ivory committed-state (border + ≥2 non-colour cues) hand-rolled | yes | **SHARED-PRIMITIVE-CANDIDATE** (reconcile with `DecisionMarker`) |
| Muted copy promoted to secondary for AA | yes (Film File; latent on Tonight) | **SHARED-TOKEN-CANDIDATE** (tune `text-muted`) |
| Rose removed from small text → ivory | yes | **SHARED-TOKEN-CANDIDATE** (rose usage rule / AA-safe variant) |
| Neutral graphite missing-poster fallback | yes | **SHARED-PRIMITIVE-CANDIDATE** |
| `focus` ring = `var(--ts-focus)` | yes | already shared (consistent) |
| Section gaps / content width / title sizing | per-surface | **SURFACE-SPECIFIC** |
| Sticky-action treatment | Film File only | **SURFACE-SPECIFIC** |
| Non-rendered `sections-bottom` legacy styling | Tonight | **LEGACY-DEBT** (deferred) |

Nothing is promoted in this stage.

## 8. Token audit

Distinct `--ts-*` consumed across both pilots (count): `text-secondary` 58, `text-primary` 37,
`text-muted` 30, `border-strong` 24, `border-subtle` 21, `surface-1` 15, `focus` 12, `surface-2` 5,
`action-primary-text` 3, `action-primary-fill` 2.

| Token | Used? | Notes |
|---|---|---|
| `canvas` | via `PageDepth` | painted by the primitive (not referenced directly) |
| `surface-1` | ✅ both | the workhorse contained surface |
| `surface-2` | ✅ both (5) | used sparingly |
| `surface-raised` | **❌ 0** | distinction **not exercised** — surface-1/2/raised collapses to 1/2 in practice |
| `text-primary` | ✅ (37) | |
| `text-secondary` | ✅ (58, most-used) | the practical workhorse — see `text-muted` |
| `text-muted` | ✅ (30) | **too weak on lighter stops** (≈4.22:1 on surface-raised); repeatedly promoted to secondary for AA |
| `border-subtle` / `border-strong` | ✅ both | |
| `action-primary-fill` / `-text` | ✅ both | the ivory PrimaryAction |
| `focus` | ✅ both (12) | also doubles as the ivory decision-marker colour → naming/semantic overlap |
| `brand-rose` (`--ts-brand-rose`) | **❌ 0 as a token** | rose used as the `ROSE` const literal, not the token |
| `brand-rose-contrast` (`#c0356c`) | **❌ 0** | the white-on-rose variant was never needed |
| `decision` (`--ts-decision`) | **❌ 0** | no such token; `focus` is used for the marker |
| `page-depth radial` | ✅ both | |
| `page-depth linear` | ❌ 0 | never needed by either pilot |

**No surface overrides a `--ts-*` value** (verified) — strong consistency. But `surface-raised`,
`--ts-brand-rose(-contrast)`, and `linear` depth are **unused**, and `text-muted` is practically too weak
(secondary dominates). No contextual-colour token exists or was added.

## 9. Accessibility audit (consolidated)

Computed contrast vs the actual PageDepth stops (WCAG relative luminance):

| FG \ BG | canvas `#15120f` | surface-1 `#1d1814` | surface-2 `#241e19` | raised `#2d2621` |
|---|---|---|---|---|
| text-primary `#f3ecdf` | 15.9 | 15.0 | 14.0 | ~13 (all PASS) |
| text-secondary `#beb8ad` | 9.5 | 8.9 | 8.4 | 7.6 (all PASS) |
| text-muted `#8d887f` | 5.3 | 5.0 | 4.7 | **4.2 (FAIL on raised)** |
| rose `#DD4E83` (small text) | 4.88 | 4.60 | **4.31 (FAIL)** | **3.89 (FAIL)** |
| PrimaryAction `#221b13` on `#efe7d7` | — | — | — | ~13 (PASS) |

**Repeated accessibility workarounds (BLOCKERS per the rule that a repeated workaround blocks
globalization unless centrally resolved):**
1. **Rose-as-small-text repeatedly removed** — both pilots stripped rose from eyebrows/labels because it
   fails AA below surface-1; rose ended up bounded to `::selection` + one large `em`. The `--ts-brand-rose`
   token's practical small-text use is **none**, contradicting its prominence.
2. **Muted → secondary repeatedly promoted** — Film File bumped provider attribution + disclosure copy from
   `text-muted` to `text-secondary` for AA on lighter surfaces; `text-secondary` is the most-used token.

Decision-state non-colour cues (≥2) hold in both pilots, but **only because they were hand-rolled** (aria +
icon/label/border/weight/inset-ring) — the `DecisionMarker` primitive (which would centralize this) was not
used. Focus rings, forced-colours, reduced-motion, touch targets, heading order, and modal behavior verified
OK in both pilots. The skip-link white-on-ivory focus ring was a per-surface correction in Film File.

## 10. Production evidence

| | Tonight | Film File |
|---|---|---|
| merge SHA | `3c0c561f` (#309) | `e91cb1b4` (#310) |
| main CI | green | green (E2E needed one rerun for an **unrelated** flake) |
| production deploy | Cloudflare Pages success | Cloudflare Pages success |
| HTTP | `app.feelflick.com` 200 | 200 |
| authenticated visual baseline determinism | two-pass green | two-pass green |
| rollback | independent, documented | independent, documented |

Confirmed: no third surface adopted the foundation; no global token promotion; no contextual colour; guard
baseline unchanged (6/16); the rest of the app remains visually transitional (legacy) outside the two
pilots. No product success metrics are claimed (none available).

## 11. Remaining-surface inventory

(Direct grep of legacy markers per `src/features/*`; "visual" = an `e2e/visual-auth/*.visual.js` exists.)

| Surface | Dir | legacy font / Outfit / HP.purple / HP_GRAD / blur | Visual cov. | Risk tier |
|---|---|---|---|---|
| Library | `features/library` | 0 / 0 / 0 / 0 / 0 | ✅ | **LOW-RISK-LOCAL** (cleanest) |
| Browse | `features/browse` | 0 / 0 / 0 / 0 / 2 | ✗ | LOW-RISK-LOCAL |
| History / Diary | `features/history` | 1 / 0 / 0 / 0 / 0 | ✗ | LOW-RISK-LOCAL |
| Watchlist | `features/watchlist` | 1 / 0 / 0 / 0 / 0 | ✗ | LOW-RISK-LOCAL |
| Lists | `features/lists` | 4 / 0 / 0 / 0 / 1 | ✗ | LOW-RISK-LOCAL (most editorial-font) |
| Discover | `features/discover` | 3 / 0 / 0 / 0 / 4 | ✅ | MEDIUM (prominent, glassy, known flake) |
| Profile / Account | `features/profile`,`account` | 3 / 0 / 3 / 0 / 4 | ✅ profile | MEDIUM (purple chrome) |
| People | `features/people` | 1 / 0 / 1 / 0 / 1 | ✅ | MEDIUM (privacy-sensitive) |
| Preferences | `features/preferences` | 1 / 0 / 1 / 0 / 0 | ✗ | MEDIUM |
| Onboarding | `features/onboarding` | 1 / **1** / 0 / **1** / 2 | ✗ | MEDIUM (last Outfit + HP_GRAD) |
| Landing / About | `features/landing`,`legal` | 1 / 0 / 0 / 0 / 5–2 | visual-baselined | MEDIUM (logged-out, baselined) |
| Share artifacts | `features/share` | 1 / 0 / 0 / 0 / 1 | ✗ | **DEFERRED-ARTIFACT** |
| Global shell / header / bottom-nav | `src/app/*` | gradient wordmark (in guard baseline) | n/a | **HIGH-RISK-SHELL** |
| Non-rendered Home sections | `features/home/sections-bottom` | legacy | n/a | DEFERRED (with their routes) |

Routes confirmed in `src/app/router.jsx` (home + movie migrated; all others legacy). Auth/challenges/legal
are minimal-styling.

## 12. Migration-risk matrix

- **LOW-RISK LOCAL SURFACES** (route-local, low shell dependency, small blast radius): Library, Browse,
  History, Watchlist, Lists. Each migrates behind its own `<ThoughtfulRoot>`; no shell change; per-route
  baselines.
- **MEDIUM-RISK SHARED-COMPONENT SURFACES** (shared components, more complex, prominence/privacy): Discover,
  Profile/Account, People, Preferences, Onboarding, Landing/About.
- **HIGH-RISK GLOBAL SHELL / TOKEN MIGRATIONS**: AppShell/header/bottom-nav; `:root` token promotion;
  legacy-token retirement.
- **DEFERRED SPECIALIZED ARTIFACTS**: `ShareCard.jsx` exported artifacts; contextual film colour
  (implemented in **no** stage).

## 13. Proposed migration sequence (risk-based)

1. **Foundation-hardening stage (next)** — resolve the blockers (§24) centrally: tune `text-muted` /
   define a rose contrast-usage rule (or AA-safe rose-text variant); validate-or-trim the 5 unused
   primitives + reconcile `DecisionMarker` with the hand-rolled pattern; extend the guard; add authenticated
   visual coverage to uncovered low-risk surfaces; refresh Darwin baselines. **No surface migration; no
   `:root` change.** Adds: a hardened, broadly-adoptable foundation.
2. **Library (3rd local pilot)** — cleanest remaining surface (0 legacy markers), has a visual baseline;
   exercises the hardened primitives on a third surface. Local boundary; no shell change.
3. **Browse / History / Watchlist / Lists** — low-risk locals, one PR each, after adding their baselines.
4. **Discover / Profile / People / Preferences / Onboarding / Landing** — medium-risk, one per PR; retire
   the last Outfit + HP_GRAD (onboarding) here.
5. **Global shell + token promotion (high-risk)** — only after all route-level risks are understood and the
   blockers are resolved; its own shell-wide visual + contrast pass.
6. **Legacy-token retirement + Share artifacts** — last, after zero consumers remain.

## 14. Globalization-readiness criteria

Defined pass/fail criteria (scored in §15). "Globalization" = `:root` token promotion + shell adoption +
legacy retirement (see §16) — **not** the already-done opt-in foundation.

## 15. Criteria scorecard

| # | Criterion | Score |
|---|---|---|
| 1 | Both pilots use the same `--ts-*` values without override | **PASS** |
| 2 | No repeated accessibility workaround | **FAIL** (rose-removal + muted→secondary both repeated) |
| 3 | No primitive API defect | **PARTIAL** (no defect, but 5/9 primitives unvalidated; `DecisionMarker` bypassed) |
| 4 | No unresolved naming ambiguity | **PARTIAL** (`focus` doubles as decision colour; `--ts-brand-rose` unused as token) |
| 5 | No repeated surface-local token duplication | **PARTIAL** (shadowed-`HP` + eyebrow/secondary patterns repeat) |
| 6 | Stable visual baselines | **PARTIAL** (Linux stable + deterministic; Darwin stale) |
| 7 | Deterministic CI | **PARTIAL** (visual deterministic; E2E has an unrelated flake) |
| 8 | Rollback plan | **PASS** |
| 9 | Migration map | **PASS** (§11–§13) |
| 10 | Global shell audit | **NOT TESTED** (inventoried, not migration-audited) |
| 11 | Global contrast audit | **PARTIAL** (pilots computed; shell/remaining not) |
| 12 | Legacy debt inventory | **PASS** (§18) |
| 13 | No contextual-colour dependency | **PASS** |
| 14 | No poster-derived styling dependency | **PASS** (`FILM_PALETTE` removed) |
| 15 | No route-specific token semantics behind generic names | **PARTIAL** (`focus`=decision; surface levels under-exercised) |

**1 FAIL + 8 PARTIAL/NOT-TESTED + 6 PASS → READY WITH BLOCKERS** (not READY; not NOT-READY — the foundation
is production-proven for local adoption).

## 16. Globalization-level definitions

1. **Foundation availability** — primitives opt-in, tokens scoped to `.ts-root`. **Current + safe.**
2. **Route-level default adoption** — major routes wrapped individually; no shell/global root change.
   **Safe next direction (after hardening).**
3. **Shared-shell adoption** — shell/header/nav migrate. **NOT yet safe.**
4. **Token promotion** — selected `--ts-*` become canonical `:root` tokens. **NOT yet safe** (blocked by §17).
5. **Legacy-token retirement** — old gradient/font/purple/pink removed. **NOT yet safe.**

Recommended next level: stay at **Level 1–2**. Do **not** undertake 3/4/5 next.

## 17. Token-collision audit (vs existing global tokens)

`--ts-*` are correctly scoped to `.ts-root` (`foundations.css`), **not** in `src/index.css :root`. But
`:root` already defines a **parallel, semantically-overlapping** system:

| Existing global (`:root`) | Overlaps with `--ts-*` | Collision risk if `--ts-*` → `:root` |
|---|---|---|
| `--brand-ivory`, `--brand-ivory-soft` | `text-primary`/`secondary`/`action-fill` | duplicate ivory truth |
| `--brand-rose`, `--brand-rose-soft` | `brand-rose` | duplicate rose truth |
| `--bg-base`, `--bg-elevated` | `canvas`/`surface-*` | duplicate surface truth |
| `--brand-warm-hairline` | `border-*` | duplicate border truth |
| `--brand-gradient`, `--gradient-primary` | (legacy; retired in target) | two gradient meanings coexisting |
| `--font-body`/`-ui`/`-display`/`-editorial` | Inter / Newsreader | font-role overlap |
| `--purple-*`, `--pink-*` scales | (legacy) | live legacy hues remain global |

**What would break if `--ts-*` were moved to `:root` today:** two parallel token systems with overlapping
meanings (`--brand-ivory` vs `--ts-text-primary`, `--brand-rose` vs `--ts-brand-rose`, `--bg-base` vs
`--ts-canvas`), forcing every consumer + test fixture to disambiguate; the legacy `--brand-gradient` /
`--purple-*` / `--pink-*` would still be globally live alongside the neutral system. Globalization must
**reconcile/rename**, not merely relocate. (No move performed.)

## 18. Legacy debt inventory

| Debt | Count / location | Class |
|---|---|---|
| Legacy purple→pink gradient (`HP_GRAD`/`--brand-gradient`/`9333ea`/`ec4899`) | 6 files / 16 occ (guard baseline: `index.html`, `app/header/Header.jsx`, `BottomNav.jsx`, `index.css`, `tokens.js`, `tokens.test.js`) + `onboarding` (1) | **ACTIVE-PRODUCTION-DEBT** (shell + onboarding) |
| `--purple-*` / `--pink-*` token scales | `index.css :root` | ACTIVE (global, legacy) |
| `HP.purple`/`HP.pink` inline | account, people, preferences, profile, home-non-rendered | ACTIVE-PRODUCTION-DEBT |
| Newsreader (`var(--font-editorial)`) | discover(3), lists(4), profile(2), account/history/landing/onboarding/people/preferences/share/watchlist (1 each) | ACTIVE-PRODUCTION-DEBT |
| Outfit | onboarding (1) | ACTIVE (last holdout) |
| glassmorphism / backdrop-blur | discover(4), landing(5), profile(2), home/movie/account/etc. | ACTIVE (many; some intentional, e.g. movie dialog scrim) |
| coloured glow | reduced to none in pilots; legacy elsewhere | ACTIVE elsewhere |
| contextual / per-film colour | none in production (removed from Film File) | resolved (DEFERRED in spec) |
| `--ts-*` unused tokens | `surface-raised`, `brand-rose`, `brand-rose-contrast`, `decision`, `page-depth linear` | DEAD-ish (unexercised) |

No debt removed in this stage.

## 19. Guard-readiness audit

`scripts/guards/legacy-gradient-guard.mjs`, CI-enforced (`app-quality.yml` runs `npm run guard:foundations`).
Scans `src/ + index.html`. Has: app-wide legacy-gradient baseline (6/16); Stage-1 namespace purity; an
explicit adopter allowlist (home + movie + dev showcase). **Gaps for broad migration:** it does **not**
detect Newsreader/Outfit (`var(--font-editorial)`) usage (so it freely persists in lists/discover/profile);
it does **not** detect general new hardcoded purple/pink *chrome* beyond the gradient pattern; it has no
contextual-colour detection; the adopter allowlist is the right shape but must grow per stage.

**Recommendation: EXTEND BEFORE GLOBALIZATION** — add per-surface detectors for editorial font + purple
chrome + contextual colour (opt-in per migrated surface), so each newly-migrated surface is protected from
regression. (Not extended in this stage — not required for the review itself.)

## 20. CI / baseline strategy (for future migrations)

- **Linux baselines** are the CI gate, regenerated via the `visual-baselines/<surface>-*` push flow
  (`test:visual:<surface>:update`) which commits only that surface's snapshots back.
- **Per-route update commands** already exist (`test:visual:home`, `:movie`, `:library`, `:profile`,
  `:people`, `:discover`); add them for History/Lists/Watchlist/Browse/Onboarding before migrating those.
- **Process:** download + classify the authenticated diff artifact; fix genuine defects before re-baselining;
  two deterministic compare reruns; cross-route baseline protection (regen only the migrating surface);
  never commit diff artifacts/traces; never relax thresholds.
- **Authenticated credentials** live only in CI (no local creds), so baseline regen is a CI operation.

## 21. Darwin-baseline plan

Tonight + Film File `*-visual-app-darwin.png` baselines remain at the pre-migration render (Linux is the CI
gate; macOS renders need a credentialed local run). **Plan:** refresh them in a dedicated credentialed
local pass (`test:visual:home:update` + `test:visual:movie:update` on macOS with the secrets), committed as
a `test:`-only change. **Not done here** (no local creds; the task forbids touching product code to do it).
No CI gate depends on the Darwin baselines.

## 22. Known flake inventory (unrelated to this work)

| Test | Frequency | Mode | Retry recovers? | Touched by migration? | Action |
|---|---|---|---|---|---|
| `e2e/app/discover.e2e.js:211` (trailer-dialog focus) | intermittent (seen on #309, #310 main) | `toHaveCount` timeout, can fail all 3 attempts | usually yes (passed on reruns) | no (Discover untouched) | **isolated de-flake task** |
| `e2e/app/home-focus.e2e.js:42` | occasional | focus-visible timing | yes (self-recovered) | no | watch; de-flake if it persists |

Risk: a hard-failing flake can mask a real regression. Not fixed here.

## 23. Rollback considerations

Each pilot is independently revertible (its files + tests + Linux baselines + the narrow adopter-allowlist
entry). This review is **docs-only** — reverting it removes only documentation. No production code, token,
or baseline is touched by Stage 4.

## 24. Blockers (must resolve before token globalization)

- **B1 — Repeated accessibility workarounds (criterion 2 FAIL):** centrally resolve the rose-small-text
  failure (a documented rose contrast-usage rule and/or an AA-safe rose-on-light text variant) and the
  `text-muted` weakness (tune it or define when secondary is required). Both recurred across the pilots.
- **B2 — 5/9 primitives unvalidated:** `Text`, `DecisionMarker`, `BrandMark`, `BrandLink`,
  `BrandSignature` were never used in production; validate via real adoption or trim/redesign, and reconcile
  `DecisionMarker` (ADR 016) with the ivory decision pattern both pilots actually hand-rolled.
- **B3 — Token collision:** reconcile/rename `--ts-*` against the existing `--brand-*` / `--bg-*` /
  `--font-*` / `--purple-*` / `--pink-*` globals before any `:root` promotion.
- **B4 — Guard insufficient:** extend it to catch editorial-font + purple-chrome + contextual-colour
  regressions per migrated surface.
- **B5 — Under-exercised tokens:** decide the fate of `surface-raised`, `--ts-brand-rose(-contrast)`,
  `--ts-decision`, and `page-depth linear` (prune or validate) before promotion.

## 25. Non-blocking follow-ups

- **F1** Refresh the stale Darwin baselines for Tonight + Film File (credentialed local pass).
- **F2** Isolated de-flake of `discover.e2e.js:211` (and watch `home-focus.e2e.js:42`).
- **F3** Add authenticated visual coverage to the low-risk surfaces lacking it (History, Lists, Watchlist,
  Browse, Onboarding, Preferences) before migrating them.

## 26. Final recommendation

**READY WITH BLOCKERS.** The local-adoption model is validated; full globalization is not yet safe. Proceed
to a **foundation-hardening stage** (resolve B1–B5; no surface migration, no `:root` change), then a single
**low-risk local surface (Library)** as a third pilot. Defer shell adoption, token `:root` promotion, and
legacy retirement until the blockers are closed and a shell-wide audit is done.

## 27. Next-stage authorization

Authorized next (one at a time, each its own PR): **(a)** the foundation-hardening stage (B1–B5, docs/tests/
primitive-or-token tweaks only); then **(b)** the **Library** local pilot. Continue the per-route
`<ThoughtfulRoot>` boundary pattern (Level 1–2). No token globalization is authorized.

## 28. Prohibited next actions

- Direct `:root` promotion of `--ts-*` tokens.
- Shell-wide palette rewrite (AppShell / header / bottom-nav) before route-level risks are resolved.
- Deleting legacy tokens (`--brand-gradient` / `--purple-*` / `--pink-*` / Newsreader / Outfit).
- Contextual-colour / poster-derived rollout (deferred in every stage).
- Simultaneous migration of multiple large routes in one PR.
- Token globalization while any blocker in §24 is open.
