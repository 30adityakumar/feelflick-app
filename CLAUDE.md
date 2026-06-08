# FeelFlick — Claude Code Guide

## Purpose

This file contains the small set of project instructions useful in most Claude Code sessions.

It is an operating guide and routing layer—not a complete product specification, design constitution, historical record, or substitute for reading the code.

Keep this file concise. Detailed guidance belongs in:

* `.claude/rules/` for topic-specific standards
* `.claude/skills/` for repeatable workflows and audits
* `CLAUDE-REFERENCE.md` for volatile technical facts and tuneable constants
* `docs/` for research, decisions, audits, experiments, runbooks, and history

Load deeper guidance only when it is relevant to the current task.

## Project

FeelFlick helps someone choose a film that fits who they are and how they feel right now.

Its core promise is:

> A trusted film recommendation for the moment—personalized by mood, context, and taste, with a clear reason it fits.

Mood makes the experience approachable. Taste makes it personal. Context makes it useful. Explanation makes it trustworthy.

The product currently focuses on films.

The application uses React, React Router, TanStack Query, JavaScript and JSX, Tailwind CSS, Framer Motion, Vite, Supabase, Vitest, and Playwright.

Confirm dependency versions, scripts, routes, and implementation details from current source and configuration rather than duplicating them here.

## Product north star

FeelFlick should reduce decision fatigue without removing meaningful agency.

A focused recommendation is the clearest expression of the product, but “one pick” is a powerful default—not a requirement that every screen or experiment display exactly one film.

Search, browse, watchlists, history, lists, profiles, social discovery, editorial content, and alternatives are allowed when they improve:

* recommendation relevance
* trust
* user control
* learning
* discovery
* retention
* decision quality

A grid, carousel, feed, list, or longer session is not automatically wrong. Judge it by its purpose, stopping conditions, information density, and effect on the user’s decision.

For product strategy and experiments, read `.claude/rules/product.md`.

## Baselines can evolve

Existing code, design, copy, interaction patterns, and architecture are the current baseline—not permanent law.

For maintenance work, preserve established behavior unless the task requires changing it.

For work explicitly involving redesign, UX improvement, brand evolution, architecture improvement, or product experimentation:

* evaluate the current approach
* identify constraints that limit improvement
* propose deliberate changes with rationale
* consider accessibility, performance, consistency, migration cost, and rollback
* update affected tokens, primitives, tests, and documentation when a new direction is accepted

Do not reject an improvement solely because it differs from an older project decision.

Intentional evolution is encouraged. Accidental drift is not.

## Instruction priority

When project guidance conflicts, use this order:

1. Safety, privacy, security, and data integrity
2. The explicit goal and scope of the current task
3. Verified runtime behavior, current source code, tests, database state, and configuration
4. Relevant path- or topic-specific rules
5. This root guide
6. Reference documents and current baselines
7. Historical audits, changelogs, roadmaps, and superseded decisions

Historical documentation explains how the project arrived here. It does not automatically constrain future improvement.

When guidance and implementation disagree, investigate rather than automatically enforcing either side.

## Safety

Never:

* expose, print, commit, or paste secrets, credentials, access tokens, private keys, or service-role keys
* place server-side secrets in client-exposed `VITE_*` variables
* disable authentication, authorization, RLS, or ownership checks merely to make a feature work
* fabricate activity, testimonials, ratings, usage counts, recommendation reasons, or social proof
* force-push shared branches
* delete or rewrite migration history that may have been applied
* run broad destructive commands without explicit approval
* represent production data changes as local-only work

If a secret is discovered, stop exposing it, report its location without repeating the value, and recommend rotation.

## Explicit confirmation

Require confirmation before actions that are difficult to reverse, affect shared infrastructure, or create external impact, including:

* applying remote migrations
* changing production RLS, grants, Auth, OAuth, or infrastructure
* deploying Edge Functions
* deleting meaningful data, schema, files, or branches
* running remote backfills or bulk mutations
* sending real external communications
* changing billing or paid-service configuration
* committing or pushing code
* rotating or revoking active credentials
* forcefully overwriting uncommitted user work

Before requesting confirmation, explain the exact action, environment, affected resources, risks, rollback, and validation plan.

Harmless inspection, local source edits, tests, builds, screenshots, proposed migrations, and reversible refactoring do not require confirmation.

For security, Supabase, data, analytics, OAuth, or infrastructure work, read `.claude/rules/security-and-data.md`.

## Working protocol

For non-trivial tasks:

1. read the relevant source, tests, configuration, and nearby documentation
2. identify current behavior and ownership
3. define the smallest coherent implementation scope
4. note meaningful risks and assumptions
5. implement without unnecessary approval loops
6. validate according to the change’s actual risk
7. report what changed, what was validated, and what remains uncertain

Prefer evidence in this order:

1. runtime behavior
2. source code and configuration
3. automated tests and rendered screenshots
4. current database or API data
5. maintained project guidance
6. historical notes

Do not rely on stale comments or audits when the implementation now behaves differently.

Use external research when current libraries, APIs, standards, security practices, or third-party services matter. Prefer official documentation, specifications, source repositories, and release notes.

## Engineering

The codebase is currently JavaScript and JSX.

Do not introduce TypeScript incidentally during unrelated work. A migration requires an explicit repository-wide decision and plan.

Organize primarily by product capability. Keep behavior close to the feature that owns it. Promote code into shared layers only when it has a clear cross-feature role.

Existing primitives and abstractions are the first place to look, but they may be improved or replaced when they limit accessibility, quality, clarity, or the accepted design direction.

Creating, splitting, moving, or renaming files is allowed when it materially improves ownership or is required by the task. Avoid structural churn without a clear benefit.

For architecture, file placement, naming, imports, dependencies, and refactoring, read `.claude/rules/repo-structure.md`.

## UI and design

The current design system is a baseline, not a permanent constraint.

The preferred direction under validation is:

* warm cinematic neutrals
* a controlled rose signature
* muted plum support
* contextual mood- or poster-derived color
* Inter for the functional interface
* Newsreader for the editorial and curator voice
* poster-first composition
* deliberate motion
* reduced decorative chrome

Do not treat this direction as fully adopted until rendered comparisons demonstrate that it improves the product.

For brand, typography, color, layout, motion, composition, and design migration, read `.claude/rules/design-system.md`.

For components, forms, overlays, accessibility, loading states, responsive behavior, and interaction implementation, read `.claude/rules/ui-implementation.md`.

## Recommendation engine

Recommendation changes can alter what users see without causing an obvious technical failure.

Before changing candidate generation, filters, scoring, ranking, mood interpretation, embeddings, explanations, skips, diversity, fallbacks, or caches:

* identify the active pipeline and call path
* inspect relevant data
* measure candidate loss
* define the intended user-visible improvement
* compare representative before-and-after outputs
* preserve rollback
* evaluate both user outcomes and catalog health

Treat existing thresholds and inferred filters as tuneable product hypotheses unless they protect an explicit user boundary, privacy, safety, or data integrity.

Read `.claude/rules/recommendation-engine.md` and `CLAUDE-REFERENCE.md` for recommendation work.

## Validation

Run checks appropriate to the scope and risk.

A typical broad sequence is:

```bash
npm run lint
npm run test
npm run build
```

Use Playwright, visual regression, accessibility review, integration checks, database validation, or performance measurement when those are the real risks.

Do not update snapshots merely to silence failures.

Do not claim validation that was not run.

For detailed validation guidance, read `.claude/rules/testing.md`.

## Guidance map

Load only what the task needs:

* product strategy or experiments → `.claude/rules/product.md`
* visual design or brand work → `.claude/rules/design-system.md`
* UI implementation or accessibility → `.claude/rules/ui-implementation.md`
* recommendation behavior → `.claude/rules/recommendation-engine.md`
* Supabase, Auth, security, analytics, or data → `.claude/rules/security-and-data.md`
* testing, QA, visual regression, or performance validation → `.claude/rules/testing.md`
* architecture, files, imports, dependencies, or refactoring → `.claude/rules/repo-structure.md`

Use skills for repeatable procedures. Use rules for durable standards.

Do not duplicate volatile facts across several documents.

When an accepted direction changes, update the most specific maintained rule and remove superseded guidance rather than leaving both active.
