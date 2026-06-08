# FeelFlick — Claude Code Guide

## Purpose

This file contains the small set of project instructions useful in most Claude Code sessions.

It is an operating guide and routing layer—not a complete product specification, design constitution, historical record, or substitute for reading the code.

Detailed guidance belongs in:

* `.claude/rules/` for durable topic-specific standards
* `.claude/skills/` for repeatable workflows and audits
* `CLAUDE-REFERENCE.md` for volatile technical facts, environments, and tuneable constants
* `docs/` for research, decisions, audits, experiments, runbooks, and history

Load only the guidance relevant to the current task.

## Project

FeelFlick helps someone choose a film that fits who they are and how they feel right now.

Its core promise is:

> A trusted film recommendation for the moment—personalized by mood, context, and taste, with a clear reason it fits.

Mood makes the experience approachable. Taste makes it personal. Context makes it useful. Explanation makes it trustworthy.

The product currently focuses on films.

The application currently uses React, React Router, TanStack Query, JavaScript and JSX, Tailwind CSS, Framer Motion, Vite, Supabase, Vitest, and Playwright.

Verify dependency versions, scripts, routes, deployment details, and implementation facts from current source and configuration.

## Product north star

FeelFlick should reduce decision fatigue without removing meaningful agency.

A focused recommendation is the clearest expression of the product, but “one pick” is a strong default—not a requirement that every route, state, or experiment display exactly one film.

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

Existing code, design, copy, interaction patterns, architecture, tests, and documentation are the current baseline—not permanent law.

For maintenance work, preserve established behavior unless the task requires changing it.

For redesign, UX improvement, product experimentation, brand evolution, recommendation tuning, or architectural improvement:

* evaluate the current approach
* identify constraints that limit improvement
* distinguish deliberate change from accidental drift
* consider accessibility, performance, security, consistency, migration cost, and rollback
* update affected primitives, tokens, tests, references, and documentation when a new direction is accepted
* remove superseded instructions rather than leaving conflicting guidance active

Do not reject an improvement solely because it differs from an older project decision.

## Instruction priority

When project guidance conflicts, use this order:

1. Safety, privacy, security, and data integrity
2. The explicit goal and scope of the current user request
3. Verified runtime behavior, current source, tests, database state, and configuration
4. Relevant path- or topic-specific rules
5. This root guide
6. Operational references and current baselines
7. Historical audits, changelogs, roadmaps, and superseded decisions

Historical documentation explains how the project arrived here. It does not automatically constrain future improvement.

When guidance and implementation disagree, investigate rather than automatically enforcing either side.

## Safety

Never:

* expose, print, commit, upload, or paste secrets, credentials, tokens, private keys, passwords, or service-role keys
* place server-only secrets in client-exposed `VITE_*` variables
* disable authentication, authorization, RLS, ownership checks, or security controls merely to make a feature work
* fabricate activity, testimonials, ratings, usage counts, recommendation reasons, social proof, availability, or user data
* force-push any branch
* delete or rewrite migration history that may have been applied
* conceal failed validation
* represent production changes as local-only work
* bypass required repository or deployment checks
* delete, truncate, or irreversibly rewrite production user data without explicit authorization

If a secret is discovered:

1. stop exposing it
2. report its location without repeating the value
3. identify the likely scope
4. recommend rotation or revocation
5. avoid placing it in logs, screenshots, commits, or chat output

## Confirmation boundaries

Routine local development does not require confirmation.

Claude may proceed without asking for approval to:

* inspect source, tests, configuration, logs, and documentation
* create, edit, move, rename, or remove source files within the requested scope
* draft migrations and Edge Function changes locally
* install or update dependencies when required by the task
* run lint, tests, builds, Playwright, visual checks, and development servers
* create or switch Git branches
* stage and commit intended changes
* push a feature branch
* create and update pull requests
* monitor CI and deployment checks
* merge an approved pull request after required checks pass
* allow the configured production deployment to run
* verify the deployed application

Require explicit confirmation before:

* applying a database migration to a remote environment when the current request did not already authorize deployment
* resetting a remote database
* deleting or irreversibly modifying production data
* changing production RLS, grants, authentication, OAuth, DNS, billing, secrets, or infrastructure outside the stated task
* rotating or revoking active credentials
* sending external communications to real users or third parties outside an explicitly requested workflow
* deleting meaningful repositories, branches, environments, schemas, or infrastructure
* forcefully overwriting unrelated uncommitted user work
* making a high-risk production change with no understood rollback path

Before requesting confirmation, explain:

* the exact operation
* the target environment
* affected data or services
* expected impact
* primary risks
* rollback or recovery plan
* validation plan

Do not ask for confirmation merely because an operation uses Bash, Git, GitHub CLI, Vercel CLI, Supabase CLI, or another approved tool.

For security, Supabase, data, analytics, OAuth, or infrastructure work, read `.claude/rules/security-and-data.md`.

## Autonomous delivery

When the user explicitly asks to:

* ship
* deploy
* publish
* release
* merge
* push
* push to production
* complete the task end to end

Claude may perform the full delivery workflow without stopping for routine confirmations.

The workflow may include:

1. inspect the working tree and current branch
2. identify unrelated or unexplained local changes
3. read relevant rules and current implementation
4. implement the requested change
5. run validation appropriate to the risk
6. create or switch to a feature branch when needed
7. stage only intended files
8. commit with a clear message
9. push the current branch
10. create or update a pull request
11. monitor required checks
12. correct failures caused by the change
13. merge after required checks pass
14. allow the configured production deployment to complete
15. verify the production application
16. report the commit, PR, deployment, checks, and remaining risks

Do not ask again for permission to commit, push, create a PR, merge, or deploy when the current user request has already explicitly authorized delivery.

Do not push directly to `main` unless:

* the user explicitly requests direct-to-main delivery, or
* the repository’s established workflow clearly uses direct pushes and the change is low-risk

Prefer a feature branch and pull request when branch protection or CI is available.

Do not merge or deploy when:

* required validation fails
* the working tree contains unrelated changes that cannot be safely separated
* required credentials or repository permissions are unavailable
* the operation would expose secrets
* the change includes an unauthorized destructive production-data operation
* a high-risk migration has no credible rollback
* the deployed result cannot be verified sufficiently

When blocked, complete all safe work, preserve the branch and commit, and report the exact blocker without repeatedly asking broad questions.

## Working protocol

For non-trivial tasks:

1. read relevant source, tests, configuration, and nearby documentation
2. identify current behavior, ownership, and active call paths
3. load only the rules needed for the task
4. define the smallest coherent implementation scope
5. note meaningful assumptions and risks
6. implement without unnecessary approval loops
7. validate according to actual failure risk
8. inspect the final diff
9. deliver when authorized
10. report what changed, what was validated, and what remains uncertain

Prefer evidence in this order:

1. verified runtime behavior
2. current source and configuration
3. automated tests and rendered screenshots
4. current database or API data
5. maintained project guidance
6. historical notes

Do not rely on stale comments, snapshots, audits, or roadmap documents when the implementation now behaves differently.

Use external research when current libraries, APIs, standards, security practices, or third-party services matter. Prefer official documentation, specifications, source repositories, and release notes.

## Scope and ambiguity

Do not repeatedly ask questions that can be answered safely from the repository, runtime, tests, or established conventions.

When a detail is ambiguous:

* inspect the surrounding implementation
* infer the most consistent safe interpretation
* document the assumption
* proceed when the decision is reversible
* ask only when the ambiguity creates meaningful product, security, data, financial, or irreversible risk

Prefer a complete best-effort implementation over stopping for minor preferences.

Do not expand the task into unrelated cleanup.

## Engineering

The codebase is currently JavaScript and JSX.

Do not introduce TypeScript incidentally during unrelated work. A migration requires an explicit repository-level decision and plan.

Organize primarily by product capability.

Keep behavior close to the feature that owns its meaning. Promote code into shared layers only when it has a coherent cross-feature role.

Existing primitives and abstractions are the first place to look, but they may be improved or replaced when they limit:

* accessibility
* correctness
* product quality
* clarity
* performance
* testability
* the accepted design direction

Creating, splitting, moving, renaming, or removing files is allowed when it materially improves ownership or is required by the task.

Avoid structural churn without a clear benefit.

Do not treat arbitrary line-count thresholds as architecture rules.

Do not hide behavior changes inside a refactor.

For architecture, file placement, naming, imports, dependencies, configuration, and refactoring, read `.claude/rules/repo-structure.md`.

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

For ordinary maintenance, preserve the current system unless the task calls for visual change.

For explicit redesign or exploration work:

* compare alternatives in rendered product surfaces
* preserve usability and accessibility
* test mobile and desktop
* avoid blindly imitating reference sites
* evaluate interaction, performance, and migration cost
* update shared primitives and tokens when a direction is accepted

No legacy skill or historical document may override `.claude/rules/design-system.md`.

For brand, typography, color, layout, motion, composition, and design migration, read `.claude/rules/design-system.md`.

For components, forms, overlays, accessibility, loading states, responsive behavior, and interaction implementation, read `.claude/rules/ui-implementation.md`.

## Recommendation engine

Recommendation changes can alter what users see without creating an obvious technical failure.

Before changing candidate generation, filters, scoring, ranking, mood interpretation, embeddings, explanations, skips, diversity, fallbacks, or caches:

* identify the active pipeline and call path
* inspect relevant data
* identify pre-scoring hard filters
* measure candidate loss
* define the intended user-visible improvement
* compare representative before-and-after outputs
* evaluate catalog-health effects
* inspect correlated penalties
* preserve rollback
* account for cache invalidation and engine versions

Treat existing thresholds and inferred filters as tuneable product hypotheses unless they protect an explicit user boundary, privacy, safety, or data integrity.

Do not allow legacy recommendation skills or compatibility paths to override `.claude/rules/recommendation-engine.md`.

Read `.claude/rules/recommendation-engine.md` and `CLAUDE-REFERENCE.md` for recommendation work.

## Validation

Run checks appropriate to the scope and risk.

A typical broad sequence is:

```bash
npm run lint
npm run test
npm run build
```

Use Playwright, visual regression, accessibility review, integration checks, database validation, performance measurement, and production verification when those are the actual risks.

Validation should be proportional:

* documentation-only changes do not automatically require all browser tests
* visual changes should receive rendered and responsive review
* interaction changes should receive keyboard and browser testing
* recommendation changes require representative output and candidate-pool analysis
* data changes require role, ownership, and migration validation
* deployment changes require production verification

Do not:

* update snapshots merely to silence failures
* claim checks that were not run
* hide skipped or environment-blocked checks
* treat a successful build as proof of correct behavior
* treat an admin query as proof that RLS works for ordinary users

For detailed validation guidance, read `.claude/rules/testing.md`.

## Git and change hygiene

Before committing:

* inspect `git status`
* separate unrelated changes
* review the staged diff
* ensure secrets and local files are absent
* run validation appropriate to the change
* use a clear commit message

Before merging:

* confirm required checks passed
* verify the PR contains only intended scope
* identify any migration or deployment risk
* preserve a rollback path when appropriate

After deployment:

* verify the production URL or relevant service
* inspect obvious errors
* confirm the intended behavior
* report deployment and verification results honestly

Never force-push.

## Guidance map

Load only what the task needs:

* product strategy or experiments → `.claude/rules/product.md`
* visual design or brand work → `.claude/rules/design-system.md`
* UI implementation or accessibility → `.claude/rules/ui-implementation.md`
* recommendation behavior → `.claude/rules/recommendation-engine.md`
* Supabase, Auth, security, analytics, or data → `.claude/rules/security-and-data.md`
* testing, QA, visual regression, or performance validation → `.claude/rules/testing.md`
* architecture, files, imports, dependencies, configuration, or refactoring → `.claude/rules/repo-structure.md`

Use skills for repeatable procedures.

Use rules for durable standards.

A legacy skill must not override a newer maintained rule.

Do not duplicate volatile facts across multiple documents.

When an accepted direction changes:

1. update the most specific maintained rule
2. update affected references and skills
3. remove or mark superseded guidance
4. avoid leaving both old and new instructions active
