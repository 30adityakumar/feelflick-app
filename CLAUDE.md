# FeelFlick — Claude Code Guide

## Purpose

This file is the compact operating guide for most Claude Code sessions.

It is a router, not a full product specification, design constitution, historical record, or substitute for reading the code.

Detailed guidance belongs in:

- `.claude/rules/` for durable topic-specific standards
- `.claude/skills/` for repeatable workflows and audits
- `CLAUDE-REFERENCE.md` for volatile facts, environments, and tuneable constants
- `docs/` for research, decisions, audits, experiments, runbooks, and history

Load only the guidance relevant to the current task.

## Product

FeelFlick helps someone choose a film that fits who they are and how they feel right now.

Core promise:

> A trusted film recommendation for the moment—personalized by mood, context, and taste, with a clear reason it fits.

Mood makes the experience approachable. Taste makes it personal. Context makes it useful. Explanation makes it trustworthy.

FeelFlick is a **Compounding Decision Companion**: it gives one trusted recommendation for the moment, explains why it fits, and becomes meaningfully better through watches, skips, saves, ratings, and corrections. Taste memory is the long-term moat beneath the immediate decision.

Surface roles: **Tonight** (`/home`) is the immediate value; **Film File** (`/movie/:id`) is evidence and trust; **History / Diary** is taste memory; **Cinematic DNA** makes learning visible; **Discover** is intentional exploration; **Search** is known-intent retrieval; **Watchlist** is deferred intent.

A focused recommendation is the clearest expression of the product. Tonight defaults to **one visible recommendation**, and a rejection normally produces one sequential replacement rather than visible backup cards. “One pick” is a strong default—not a rule; bounded choice may serve explicit exploration or a future couple/group negotiation mode.

For product strategy or experiments, read `.claude/rules/product.md`.

## Baselines can evolve

Existing code, design, copy, interaction patterns, architecture, tests, and documentation are the current baseline—not permanent law.

For maintenance work, preserve established behavior unless the task requires changing it.

For redesign, UX improvement, product experimentation, brand evolution, recommendation tuning, or architectural improvement, evaluate the current approach and permit deliberate change when it improves the product.

Do not reject an improvement solely because it differs from an older project decision.

When an accepted direction changes, update the most specific maintained rule, update affected references and skills, and remove or mark superseded guidance.

## Instruction priority

When project guidance conflicts, use this order:

1. Safety, privacy, security, and data integrity
2. The explicit goal and scope of the current user request
3. Verified runtime behavior, current source, tests, database state, and configuration
4. Relevant path- or topic-specific rules
5. This root guide
6. Operational references and current baselines
7. Historical audits, changelogs, roadmaps, and superseded decisions

Historical documentation explains context. It does not automatically constrain future improvement.

When guidance and implementation disagree, investigate rather than enforcing either side automatically.

A legacy skill or historical document must not override a newer maintained rule.

## Safety

Never:

- expose, print, commit, upload, or paste secrets, credentials, tokens, private keys, passwords, or service-role keys
- place server-only secrets in client-exposed `VITE_*` variables
- disable authentication, authorization, RLS, ownership checks, or security controls merely to make a feature work
- fabricate activity, testimonials, ratings, usage counts, recommendation reasons, social proof, availability, or user data
- force-push any branch
- delete or rewrite migration history that may have been applied
- conceal failed validation
- represent production changes as local-only work
- bypass required repository or deployment checks
- delete, truncate, or irreversibly rewrite production user data without explicit authorization

If a secret is discovered, stop exposing it, report its location without repeating the value, identify the likely scope, and recommend rotation or revocation.

## Confirmation boundaries

Routine local development does not require confirmation.

Claude may proceed without asking for approval to inspect, edit, test, build, create branches, stage intended files, commit, push feature branches, create or update PRs, monitor checks, merge approved PRs after required checks pass, allow configured production deployments, and verify deployed applications.

Require explicit confirmation before:

- remote database migrations when the current request did not already authorize deployment
- remote database resets or destructive production-data changes
- production RLS, grants, Auth, OAuth, DNS, billing, secrets, or infrastructure changes outside the stated task
- credential rotation or revocation
- external communications to real users or third parties outside an explicitly requested workflow
- deletion of meaningful repositories, environments, schemas, or infrastructure
- forcefully overwriting unrelated uncommitted user work
- high-risk production changes without a credible rollback path

Do not ask for confirmation merely because an operation uses Bash, Git, GitHub CLI, Vercel CLI, Supabase CLI, or another approved tool.

For security, Supabase, data, analytics, OAuth, or infrastructure work, read `.claude/rules/security-and-data.md`.

## Autonomous delivery

When the user explicitly asks to ship, deploy, publish, release, merge, push, push to production, or complete a task end to end, use `.claude/skills/ship-to-production/SKILL.md`.

Do not ask again for permission to commit, push, create a PR, merge, deploy, or verify production when the current request has already authorized delivery.

Do not push directly to `main` unless the user explicitly requests direct-to-main delivery or the repository workflow clearly permits it for the change.

Stop and report the exact blocker when validation fails, unrelated changes cannot be separated, credentials or permissions are unavailable, secrets would be exposed, an unauthorized destructive production-data operation is required, or the deployed result cannot be verified sufficiently.

## Working protocol

For non-trivial tasks:

1. read relevant source, tests, configuration, and nearby documentation
2. identify current behavior, ownership, and active call paths
3. load only the rules needed for the task
4. define the smallest coherent scope
5. implement without unnecessary approval loops
6. validate according to actual risk
7. inspect the final diff
8. deliver when authorized
9. report what changed, what was validated, and what remains uncertain

Prefer evidence in this order:

1. verified runtime behavior
2. current source and configuration
3. automated tests and rendered screenshots
4. current database or API data
5. maintained project guidance
6. historical notes

Do not repeatedly ask questions that can be answered safely from the repository, runtime, tests, or established conventions.

Ask only when ambiguity creates meaningful product, security, data, financial, or irreversible risk.

## Engineering

The codebase is currently JavaScript and JSX.

Do not introduce TypeScript incidentally during unrelated work. A migration requires an explicit repository-level decision and plan.

Organize primarily by product capability. Keep behavior close to the feature that owns its meaning. Promote code into shared layers only when it has a coherent cross-feature role.

Existing primitives and abstractions are the first place to look, but they may be improved or replaced when they limit accessibility, correctness, quality, clarity, performance, testability, or the accepted design direction.

Creating, splitting, moving, renaming, or removing files is allowed when it materially improves ownership or is required by the task.

Do not hide behavior changes inside a refactor.

For architecture, file placement, imports, dependencies, configuration, and refactoring, read `.claude/rules/repo-structure.md`.

## UI and design

The current design system is a baseline, not a permanent constraint.

The design character is the **Thoughtful Seatmate**: serious taste without arrogance, evidence without dryness, calm at first glance and intelligent on closer inspection. Design for someone **smart but tired**.

Accepted target principles: a warm graphite / warm-neutral foundation; projection-ivory text; **one coherent human sans-serif voice**; normalized contextual film color; a **neutral, high-contrast primary action** with an ivory-only confirmation marker for meaningful selection (no separate warm cue); progressive recommendation depth; brief, purposeful motion; and the legacy purple–pink gradient kept out of default actions, selected states, chrome, and atmosphere (any rare reveal/memory/celebration role stays unvalidated). No default visible backups on Tonight; no permanent serif-versus-system split; no permanent rose/plum core identity; no required numbered case.

The shipped app is **mixed and transitional**: many feature surfaces ship the F4 Newsreader/Inter/rose direction (`/home` also has the numbered I/II case and a neutral primary), while residual global, shared, and legacy areas still contain Outfit, purple/pink styling, and gradient treatments. Treat it as a transitional baseline — do not claim either F3/F4 or the Thoughtful Seatmate direction is uniformly implemented, and do not remove shipped work outside a deliberate, gated re-migration. **Inter** is the accepted single core Latin sans-serif target following the P1 controlled blind comparison (`docs/decisions/014-thoughtful-seatmate-p1-core-voice.md`); Newsreader and Outfit remain part of the transitional baseline until deliberate surface migration. The warm graphite / projection-ivory **foundation token values are now accepted** (`docs/decisions/015-thoughtful-seatmate-p2a-foundation.md`) as fixed prototype/pilot-scoped values — not yet global production tokens. Meaningful **selected/committed confirmation remains ivory-only** (projection ivory `#f3ecdf` supplementary marker + redundant non-color signals; **no separate warm-cue token**; `docs/decisions/016-thoughtful-seatmate-p2b-decision-signal.md`). The contextual-film-color treatment is **accepted in full** — preserve source hue, output lightness **L = 0.62**, retained chroma cap **C = 0.04** (strict envelope, `docs/decisions/017-thoughtful-seatmate-p2c-a-contextual-color-envelope.md`) and aura **compositing alpha 0.14** (`docs/decisions/018-thoughtful-seatmate-p2c-b-aura-strength.md`), single focal-film scope; **no production aura is implemented** and no global contextual-color token exists. The contextual-color **extraction** method remains **unresolved and is not accepted**: edge-context was selected in the synthetic P2C-C comparison but **failed the genuine real-poster holdout (P2C-D)** on transformation stability, alternate-rendition stability, incidental-color rate, product value over showing no aura, and harmful suppression. **Do not implement edge-context as the production extraction method.** No automatic extraction method is accepted and manual deterministic seeds are not a production method (`docs/ui/thoughtful-seatmate-p2c-d-validation-closure.md`). The **long-form Film File reading voice is resolved**: P2D tested a bounded Newsreader long-form exception; it improved sustained reading comfort but **tied Inter-only 90–90**, scored lower on product-voice coherence and mixed-script robustness, and carried greater font-swap reflow, so it is **not accepted** — **Film File long-form body prose remains Inter; do not introduce Newsreader or another serif into it** (`docs/ui/thoughtful-seatmate-p2d-reading-voice-closure.md`). Newsreader stays transitional shipped-baseline usage only (do not remove opportunistically; removal needs a separate scoped migration). **Gradient survival** remains a **provisional prototype question**.

Current design authority: `docs/ui/design-authority-thoughtful-seatmate.md`. The prior `docs/ui/design-authority-f3.md` is historical — it records the shipped baseline, not the target.

For brand, typography, color, layout, motion, composition, and design migration, read `.claude/rules/design-system.md`.

For components, forms, overlays, accessibility, loading states, responsive behavior, and interaction implementation, read `.claude/rules/ui-implementation.md`.

## Recommendation engine

Recommendation changes can alter what users see without creating an obvious technical failure.

Treat existing thresholds and inferred filters as tuneable product hypotheses unless they protect an explicit user boundary, privacy, safety, or data integrity.

Before changing candidates, filters, scoring, ranking, mood interpretation, embeddings, explanations, skips, diversity, fallbacks, or caches, read `.claude/rules/recommendation-engine.md` and `CLAUDE-REFERENCE.md`.

## Validation

Run checks appropriate to the scope and risk.

A typical broad sequence is:

```bash
npm run lint
npm run test
npm run build
```

Use Playwright, visual regression, accessibility review, integration checks, database validation, performance measurement, and production verification when those are the actual risks.

Do not update snapshots merely to silence failures. Do not claim checks that were not run. Do not hide skipped or environment-blocked checks.

For detailed validation guidance, read `.claude/rules/testing.md`.

## Guidance map

Load only what the task needs:

- product strategy or experiments → `.claude/rules/product.md`
- visual design or brand work → `.claude/rules/design-system.md`
- UI implementation or accessibility → `.claude/rules/ui-implementation.md`
- recommendation behavior → `.claude/rules/recommendation-engine.md`
- Supabase, Auth, security, analytics, or data → `.claude/rules/security-and-data.md`
- testing, QA, visual regression, or performance validation → `.claude/rules/testing.md`
- architecture, files, imports, dependencies, configuration, or refactoring → `.claude/rules/repo-structure.md`
- end-to-end delivery → `.claude/skills/ship-to-production/SKILL.md`

Use skills for repeatable procedures. Use rules for durable standards. Do not duplicate volatile facts across multiple documents.

## Persona QA / Synthetic Feedback Lab

FeelFlick has a reusable synthetic persona QA workflow under `docs/personas/`.

Use it for read-only product feedback when the user asks about persona QA, synthetic beta users, felt-experience audit, trust/clarity feedback, or how the app feels to different users.

Primary read-only skill:

```text
/persona-feedback-audit
```

Skill file:

```text
.claude/skills/persona-feedback-audit/SKILL.md
```

Guardrails:

- Synthetic persona findings are UX inspection only, not real-user validation.
- Do not treat local console/request warnings as confirmed production bugs without review.
- Do not tune recommendation logic from synthetic findings alone.
- Do not modify source code when the user asks for feedback only.
- Never read or print `e2e/.auth/personas/*.json`.
- Never print cookies, localStorage, JWTs, passwords, service role keys, anon keys, or auth-state contents.

Safe docs:

- `docs/personas/persona-qa-workflow.md`
- `docs/personas/synthetic-personas-f10c.md`
- `docs/personas/persona-revisit-rubric.json`

Safe generated summaries:

- `e2e/.persona-artifacts/revisit-summary.json`
- `e2e/.persona-artifacts/reports/*.md`
