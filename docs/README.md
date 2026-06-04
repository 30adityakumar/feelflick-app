# docs/

Long-form project documentation. For *how to work in this repo* (conventions,
guardrails, workflows), the source of truth is **`CLAUDE.md`** at the root, plus
`CLAUDE-REFERENCE.md`. This folder holds the deeper references.

## Current references
| File | Read it for |
|---|---|
| [`product-doctrine.md`](product-doctrine.md) | **The wedge, anti-drift rules, surface hierarchy, and the feature decision test.** Read before any product/design/IA/engine work. |
| [`feelflick-foundation-readiness-audit.md`](feelflick-foundation-readiness-audit.md) | **F0 foundation audit** — ground-truth baseline + the F1–F10 rebuild roadmap. Start here for the rebuild. |
| [`ia-v2-decision-record.md`](ia-v2-decision-record.md) | **F2 IA v2 decision record** — how the nav encodes the surface hierarchy (the Briefing is primary; browse/lists/discover are supporting). The source of truth for nav structure. |
| [`design-system-hardening-f3.md`](design-system-hardening-f3.md) | **F3 design-system hardening** — brand vs semantic tokens, what drift was retired vs retained (and why), Eyebrow/stash decisions. |
| [`landing-onboarding-vnext-f4.md`](landing-onboarding-vnext-f4.md) | **F4 landing + onboarding vNext** — landing-primitive adoption (Eyebrow/AuthCTA/Wordmark), Community honesty framing, onboarding "why we ask" copy, visual re-baseline status. |
| [`home-briefing-vnext-f5.md`](home-briefing-vnext-f5.md) | **F5 home / Briefing vNext** — surfacing the "why this pick" case (`WhyThisPick`), Briefing loading skeleton, supporting-tail hierarchy decision; engine untouched. |
| [`film-file-case-making-f6a.md`](film-file-case-making-f6a.md) | **F6A Film File case-making design** — current-state map, tiered case hierarchy, UI/data-contract plan, F6B options. Corrects the F0 "one seeded film" framing. Read before F6B. |
| [`film-file-case-making-f6b.md`](film-file-case-making-f6b.md) | **F6B Film File case-making UI** — what shipped: `PrimaryCaseCard` (consolidated tier-aware case), `ViewerNotes` honest reframe, Parasite-placeholder cleanup. UI-only. |
| [`cinematic-dna-profile-vnext-f7.md`](cinematic-dna-profile-vnext-f7.md) | **F7 Cinematic DNA / Profile vNext** — removed cold-state fabrications (fake taste/skew/YIR), honest `DnaConfidence` framing (evidence, not accuracy). `dnaConfidence` formula untouched. |
| [`recommendation-trust-evaluation-f8a.md`](recommendation-trust-evaluation-f8a.md) | **F8A Recommendation Trust + Evaluation foundation** — current-state map, the 6-family metrics framework, the offline fixture harness (`shared/services/eval/`), read-only SQL templates (`sql/recommendation-evaluation-queries.sql`), the explanation-quality rubric, real-data baseline (outcome-capture gap), and the tuning gates. **Evaluation-only — engine untouched.** |
| [`recommendation-outcome-capture-f8b.md`](recommendation-outcome-capture-f8b.md) | **F8B Recommendation Outcome Capture Repair** — fixes the F8A capture gap: current-state map of every outcome write, the attribution contract (recency-gated `recordRecommendationOutcome`), the save/watch/click wiring repair, schema reused (no migration), tests, read-only verification SQL (§7), and the F8C tuning gate. **Instrumentation-only — engine untouched.** |
| [`release-readiness-f9a.md`](release-readiness-f9a.md) | **F9A Release / CI / Production Hardening Prep** — branch lineage, the local+CI validation matrix, the Linux visual-baseline blocker + exact regeneration command, e2e/a11y status, deploy/preview + rollback + smoke + post-deploy outcome-capture checklists, and the restated F8C gate. **Docs/validation-only — no code change.** (Linux baseline resolved in F9B.) |
| [`post-merge-smoke-f9c.md`](post-merge-smoke-f9c.md) | **F9C Merge / Deploy / Smoke / Outcome baseline** — the rebuild merged to `main` (#169, squash `c38cb473`) + deployed to production; post-merge CI + local validation; the live production smoke results (public + authenticated); **proof that F8B outcome capture works in production** (recency-gated save attribution flipped real impression flags); the post-deploy baseline + why **F8C stays blocked**; and remaining hardening follow-ups (incl. the Sentry-ingest 403). |
| [`production-observability-security-f9d.md`](production-observability-security-f9d.md) | **F9D Production Observability + Security Headers** — diagnoses the Sentry 403 (Allowed-Domains inbound filter: 200 server-to-server, 403 with any browser Origin → one-time Sentry dashboard fix, no code/env change); ships safe security headers via `public/_headers` (Cloudflare Pages — the prod path) + mirrored `vercel.json`; defers CSP with a draft report-only policy; documents the CI secret names for E2E/Lighthouse. **Config + docs only — no product/engine change.** Notes prod is served by **Cloudflare Pages**, not Vercel. |
| [`architecture.md`](architecture.md) | Current system architecture — verified against code in F1 (routes, folders, engine, auth, services, external touchpoints, risks). |
| [`FeelFlick_Overview.md`](FeelFlick_Overview.md) | Product overview in prose — features + the engine (reconciled in F1; framed as features in service of the single pick). |
| [`product-research-patterns.md`](product-research-patterns.md) | Competitive patterns to **borrow / refuse**, mapped to the wedge (research-framing memo). |
| [`DESIGN_SYSTEM.md`](DESIGN_SYSTEM.md) | World-class product-design patterns reference (aspirational; the *enforced* design rules live in `CLAUDE.md`). |
| [`PLANNING.md`](PLANNING.md) | The active-sprint slice of the phased rebuild. |
| [`user-journey.md`](user-journey.md) | End-to-end user journey — ⚠️ **stale** (references removed `/x-legacy` routes + a `HeroSection` that no longer exists); pending a later refresh. |
| [`SUPABASE_SCHEMA.md`](SUPABASE_SCHEMA.md) | DB schema reference — ⚠️ auto-generated snapshot (pre-2026-05-29); the live DB is the source of truth. |

## Structured
- [`decisions/`](decisions/) — Architecture Decision Records (ADRs) + `DECISIONS.md` index.
- [`audits/`](audits/) — point-in-time audit write-ups.
- [`runbooks/`](runbooks/) — operational runbooks (dev setup, debugging).
- [`sql/`](sql/) — **read-only** analysis query templates (e.g. `recommendation-evaluation-queries.sql`).
- [`eval/`](eval/) — generated evaluation baselines (fixture-based; regenerate via `scripts/eval/`).

## archive/
Historical / superseded docs — see [`archive/README.md`](archive/README.md). Not current.
