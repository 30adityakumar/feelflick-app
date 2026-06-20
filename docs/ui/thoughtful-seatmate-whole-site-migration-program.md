# Thoughtful Seatmate — Whole-Site Migration Program (coordination ledger)

> **SUPERSEDED (2026-06-18) by the Website-Wide Globalization stage.** The slow route-by-route adoption
> model below (Stages 7–16) is **replaced** by one coordinated website-wide migration delivered in a single
> branch/PR (`migration/thoughtful-seatmate-website-wide`), governed by
> [ADR 019](../decisions/019-thoughtful-seatmate-website-wide-theme.md) and recorded in
> [`thoughtful-seatmate-website-wide-migration.md`](thoughtful-seatmate-website-wide-migration.md). The
> theme is now applied once at the app root (`.theme-thoughtful`) with the canonical `--color-*` tokens as
> one canonical token contract (CSS + JS mirrors kept in sync by a drift test); legacy systems alias them;
> `VITE_UI_THEME=legacy` is a runtime emergency theme fallback (partial — a full visual rollback reverts the
> PR). The route-by-route
> caveats below (one local `<ThoughtfulRoot>` per route, no `:root`/global promotion, one route family per
> PR) are historical and no longer apply.

> **Coordination doc only (historical).** Each pilot stage (1–6) executed in its **own** fresh worktree /
> branch / PR / validation / rollback boundary. The website-wide stage intentionally consolidates the
> remaining surfaces + shell + token reconciliation into one PR (see ADR 019 for why scoped roots were
> replaced).

## Current state

- **Current origin/main:** `ae45f3e678d953a4251cbeeba948f94cdbf60ec1` (after #314, Stage 6 — Library).
- **Website-wide globalization:** branch `migration/thoughtful-seatmate-website-wide` (this PR) —
  canonical theme applied site-wide; supersedes Stages 7–16 below.
- **Design target (non-negotiable):** Inter only · near-black→warm-graphite depth · solid graphite
  surfaces · projection-ivory text · neutral ivory primary action · ivory-only decision signal · one
  bounded rose · legacy purple–pink gradient retired · contextual film colour deferred. No replacement
  gradient; no poster/mood chrome; no behavior redesign.
- **Readiness (from #312):** READY WITH BLOCKERS — B1 a11y workarounds, B2 unvalidated primitives, B3
  token collision, B4 guard gaps, B5 under-exercised tokens. Globalization is gated until these close.

## Stage ledger

| Stage | Scope | Branch | PR | Status |
|---|---|---|---|---|
| 1 | Foundation primitives + scoped tokens | `…stage1-foundations` | #308 | **MERGED / live** |
| 2 | Tonight pilot (`/home`) | `…tonight-pilot` | #309 | **MERGED / live** |
| 3 | Film File pilot (`/movie/:id`) | `…film-file-pilot` | #310 | **MERGED / live** |
| 4 | Globalization-readiness review | `…globalization-readiness` | #312 | **MERGED** (verdict: READY WITH BLOCKERS) |
| 5 | Foundation hardening (close B1/B2/B4/B5; plan B3) | `…stage5-foundation-hardening` | #313 | **MERGED** |
| 6 | Library family — Watchlist route (`/watchlist`) | `…stage6-library` | #314 | **MERGED / live** |
| **WW** | **Website-wide globalization** (canonical theme + shell + all routes + token reconciliation + legacy retirement) — supersedes 7–14, 16 | `…website-wide` | **this PR** | **OPEN — not merged** |
| ~~7~~ | ~~Personal archive (History / Diary)~~ — **folded into WW** (auto-migrated via shared tokens) | — | — | superseded |
| ~~8~~ | ~~Lists~~ — **folded into WW** | — | — | superseded |
| ~~9~~ | ~~Discover + search~~ — **folded into WW** | — | — | superseded |
| ~~10~~ | ~~Profile / People / preferences / account~~ — **folded into WW** | — | — | superseded |
| ~~11~~ | ~~Logged-out + acquisition (landing / about / auth)~~ — **folded into WW** | — | — | superseded |
| ~~12~~ | ~~Shared shell~~ — **folded into WW** (AppShell / header / bottom-nav / focus / selection migrated) | — | — | superseded |
| ~~13~~ | ~~Token promotion~~ — **folded into WW** (one canonical `--color-*` system + compat aliases) | — | — | superseded |
| ~~14~~ | ~~Legacy retirement~~ — **partially in WW** (gradient debt 16→10; full alias/HP_GRAD removal scheduled post-monitoring, see migration doc §24) | — | — | superseded / follow-up |
| 15 | Share / export artifacts (`ShareCard`, social/exported images, non-DOM) | — | — | **deferred** (separate render env; migration doc §21) |
| 16 | Whole-site closure audit + final record | — | — | folded into WW record |

## Open stage — Website-wide globalization (supersedes 7–16)

- **Branch:** `migration/thoughtful-seatmate-website-wide` · **PR:** this PR · **ADR:**
  [019](../decisions/019-thoughtful-seatmate-website-wide-theme.md) · **Record:**
  [`thoughtful-seatmate-website-wide-migration.md`](thoughtful-seatmate-website-wide-migration.md).
- **Scope:** one canonical theme (`.theme-thoughtful` at the app root) owning `--color-*`; legacy systems
  (`--ts-*`/`--bg-*`/`--brand-*`/Tailwind `--purple-*`/`--pink-*`/`--font-editorial`/`HP`/`ROSE`) alias the
  canonical tokens; shell + header + bottom-nav + global focus migrated; all browser production routes themed
  (3 already-migrated via aliases, the rest recoloured by the theme + shared-token recolor + targeted holdout
  edits); Inter-only (Newsreader/Outfit removed); legacy purple/pink gradient chrome retired.
- **Rollback:** `VITE_UI_THEME=legacy` → `.theme-legacy` no-op = a runtime emergency theme fallback
  (legacy `:root` tokens + literal `var()` fallbacks resolve where they still exist) — a PARTIAL visual
  rollback, not an exact restoration (removed fonts, changed component defaults, edited presentation, and
  regenerated baselines are not reverted by the switch). A FULL visual rollback reverts this PR's commit.
- **Deferred:** ShareCard / export artifacts (separate render env); alias + `HP_GRAD` + redundant-wrapper
  removal (post-monitoring follow-up); per-route visual specs for Browse/Collection/Lists/Account/
  Preferences/Onboarding/legal.
- **Validation:** `guard:foundations` (legacy-gradient + theme audit) green, lint clean, 1612 unit tests
  green, build green; website-wide Linux visual baselines regenerated via CI (run twice; thresholds
  unchanged); Darwin baselines intentionally stale (documented).
- **Production status:** not merged, not deployed.

### (historical) Stage 6 — Library (Watchlist), MERGED #314

- **Branch:** `migration/thoughtful-seatmate-stage6-library` · **PR:** #314. (Stage 5 merged as #313.)
- **Routes included:** `/watchlist` (`src/features/watchlist`). **Excluded:** History/Diary (`/watched`,
  `/history` — Stage 7), Lists, Discover, Profile, People, prefs, onboarding, landing, auth, shell, header,
  bottom-nav, generic modals, `collection/:id` (browse), ShareCard.
- **Visual baselines changed:** exactly one — `watchlist-empty-mobile` Linux (regen via the
  `visual-baselines/library-*` CI flow). The other three Watchlist captures render the migrated masthead but
  stay within the comparison threshold (no rewrite); all four Diary captures are byte-identical (verified —
  shared-nav scoped fallback kept History pixel-identical). Determinism confirmed by a second regen.
- **Ownership note:** `LibrarySectionNav`/`library.css` are SHARED with the excluded History/Diary; migrated
  via backward-compatible scoped `var(--ts-*, <legacy>)` fallbacks so History stays byte-identical.
- **Program follow-ups raised this stage:** (1) the shared `<Eyebrow>` purple **default** prop is invisible
  to the foundation guard — caught a purple masthead eyebrow by visual inspection, fixed via explicit ivory
  `color`; retire the default when shared chrome migrates (Stage 12). (2) Three migrated Watchlist captures
  sit within the visual-diff threshold, so their baselines still depict the pre-migration masthead within
  tolerance (threshold property, not a regression).
- **Blockers:** none opened; none closed (B3 still deferred to Stage 13).
- **Rollback boundary:** watchlist source/test + Watchlist Linux baselines + the scoped `library.css` change
  + the narrow guard/test adopter additions + Stage 6 docs/ledger. No Stage 1 / Tonight / Film File / Stage 5
  / global token / shell / other-route revert needed.
- **Production status:** not merged, not deployed.
- **Next authorized stage:** Stage 7 — Personal archive (History/Diary), its own worktree/branch/PR; fully
  migrate the shared `LibrarySectionNav`/`library.css` then.
- **Prohibited next actions:** `:root` token promotion; shell migration; deleting legacy tokens;
  contextual-colour rollout; combining a route with the shell/token stage; more than one route family per PR.

## Per-stage rules (every stage)

Fresh worktree from latest safe `origin/main`; audit rendered ownership before editing; preserve
logic/analytics/routing/data/copy/behavior; smallest local `<ThoughtfulRoot>` boundary; no unrelated routes;
explicit adopter invariants (add the surface to the guard's `ADOPTERS` + `MIGRATED_FILES`); update only
route-owned Linux baselines via the `visual-baselines/<surface>-*` CI flow; inspect every diff; run visual
twice for determinism; never relax thresholds; never commit diff artifacts; document Darwin-baseline status;
keep rollback independently reversible; **do not merge automatically.** Checks: `npm ci`,
`guard:foundations`, `lint`, `test`, `build`, `git diff --check` + the relevant E2E / visual / a11y /
Lighthouse / CodeQL / GitGuardian / deploy-preview gates.

## PR-split triggers (a stage PR MUST split if any holds)

>1 unrelated route family · behavior + visual mixed · shell + route combined · token-promotion + route
combined · >1 rollback boundary · unrelated baselines change · >1 flaky test needs adjustment · the scope
can't be described in one sentence. Optimize for reversible, inspectable migration — not fewer PRs.
