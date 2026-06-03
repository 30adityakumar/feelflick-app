# docs/

Long-form project documentation. For *how to work in this repo* (conventions,
guardrails, workflows), the source of truth is **`CLAUDE.md`** at the root, plus
`CLAUDE-REFERENCE.md`. This folder holds the deeper references.

## Current references
| File | What it is |
|---|---|
| [`feelflick-foundation-readiness-audit.md`](feelflick-foundation-readiness-audit.md) | **F0 foundation audit** — ground-truth baseline + F1–F10 rebuild roadmap. Start here for the rebuild. Flags which other docs are stale. |
| [`architecture.md`](architecture.md) | System architecture overview — ⚠️ partly stale (pre-refactor folders, RLS-open); see the F0 audit §2.10 |
| [`FeelFlick_Overview.md`](FeelFlick_Overview.md) | Product overview — what FeelFlick is + the engine |
| [`DESIGN_SYSTEM.md`](DESIGN_SYSTEM.md) | The editorial design language |
| [`user-journey.md`](user-journey.md) | End-to-end user journey |
| [`SUPABASE_SCHEMA.md`](SUPABASE_SCHEMA.md) | DB schema reference — ⚠️ auto-generated; see its staleness note, the live DB is source of truth |
| [`PLANNING.md`](PLANNING.md) | Active planning notes |

## Structured
- [`decisions/`](decisions/) — Architecture Decision Records (ADRs) + `DECISIONS.md` index.
- [`audits/`](audits/) — point-in-time audit write-ups.
- [`runbooks/`](runbooks/) — operational runbooks (dev setup, debugging).

## archive/
Historical / superseded docs — see [`archive/README.md`](archive/README.md). Not current.
