# Thoughtful Seatmate — Whole-Site Migration Program (coordination ledger)

> **Coordination doc only.** Each stage executes in its **own** fresh worktree / branch / PR / validation /
> rollback boundary. No stage is merged automatically. No giant combined PR. Tokens are **not** promoted to
> `:root` until the dedicated shell/token stages (12/13) and all preceding gates pass.
> Every stage PR updates this ledger.

## Current state

- **Current origin/main:** `8deaecf7daa88cb891fb885fb9bffb7048d2c8b8` (after #312).
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
| **5** | **Foundation hardening (close B1/B2/B4/B5; plan B3)** | `…stage5-foundation-hardening` | **this PR** | **OPEN — not merged** |
| 6 | Library family (Library + Watchlist + Library-owned collections) | — | — | not started (next after 5) |
| 7 | Personal archive (History / Diary / viewing log) | — | — | not started |
| 8 | Lists (index / detail / create-edit / states) | — | — | not started |
| 9 | Discover + search (de-flake `discover.e2e.js:211` first, own PR) | — | — | not started |
| 10 | Identity + preference surfaces (Profile / People / preferences / account / DNA / onboarding prefs) | — | — | not started |
| 11 | Logged-out + acquisition (landing / about / auth / signup-login / onboarding entry) | — | — | not started |
| 12 | Shared shell (AppShell / header / bottom-nav / global frame / shared modal + focus/selection) — HIGH RISK | — | — | not started |
| 13 | Token promotion (reconcile `--ts-*` ↔ globals; one canonical system) — dedicated PR | — | — | not started |
| 14 | Legacy retirement (gradient/font/purple-pink/glow/glass; reduce guard baseline) | — | — | not started |
| 15 | Share / export artifacts (`ShareCard`, social/exported images, non-DOM) | — | — | not started |
| 16 | Whole-site closure audit + final record | — | — | not started |

## Open stage — Stage 5 (Foundation hardening)

- **Branch:** `migration/thoughtful-seatmate-stage5-foundation-hardening` · **PR:** this PR.
- **Routes included:** none (foundation-only). **Routes excluded:** all (no route migrated).
- **Visual baselines changed:** none (no token value or pilot file changed; pilot screenshots preserved).
- **Blockers:** closes **B1, B2, B4, B5**; **B3** mapped/planned here, **executed at Stage 13**.
- **Rollback boundary:** revert the foundation guard + primitive tests + README + Stage 5 docs; no production
  surface, token value, or baseline involved.
- **Production status:** no production change (foundation/guard/tests/docs only).
- **Next authorized stage:** Stage 6 — Library family (its own worktree/branch/PR), only after Stage 5 lands.
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
