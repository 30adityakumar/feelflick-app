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

## archive/
Historical / superseded docs — see [`archive/README.md`](archive/README.md). Not current.
