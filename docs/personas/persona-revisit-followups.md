# Persona Revisit Follow-up Backlog

Synthetic UX inspection — not real-user validation

This backlog converts the local Step 5 persona revisit artifacts into sanitized follow-up work. It is not raw artifact storage, not a bug report from real users, and not a recommendation-tuning plan.

Do not commit `e2e/.persona-artifacts`, screenshots, auth states, session files, secrets, cookies, browser storage, or raw generated artifacts.

## Source Artifact Summary

Source: `e2e/.persona-artifacts/revisit-summary.json` plus sampled safe markdown reports for P1, P2, P5, P11, and P14.

- Selected persona count: 17
- Passed count: 17
- Failed count: 0
- Surfaces visited: `/`, `/home`, `/discover`, `/profile`, `/watchlist`, `/history`, `/movie/:id`
- Aggregate scores: trust 1/5, clarity 1/5, momentum 3/5, felt personal 5/5, return likelihood 2/5, friction 5/5
- Issue severity summary: P0 0, P1 0, P2 136, Insight 0
- Repeated observed issue pattern: browser errors across core routes, `/profile` thin/error behavior, `/watchlist` and `/history` recovery/error copy, and no reachable `/movie/:id` link from `/home` or `/discover`.

## Top Interpretation

Recommendation and mood language has promise. The sampled reports consistently observed mood, DNA, watched, and saved language, and recommendation believability scored 4/5 in the sampled persona reports.

Trust and clarity are currently blocked by technical route failures and thin/error states. The aggregate scores are not a clean product-read because all sampled personas saw browser errors and recovery/error copy on key proof surfaces.

Do not tune recommendations until technical confidence blockers are addressed. The next useful move is to make the local browser route evidence reliable, then rerun focused persona revisits before changing recommendation logic.

## P1 — Technical Confidence Blockers

### PRQA-001 — Investigate cross-route browser errors during persona revisits

- Priority: P1
- Type: bug
- Personas most affected: P1, P2, P5, P11, P14, all personas
- Surfaces affected: `/`, `/home`, `/discover`, `/profile`, `/watchlist`, `/history`
- Evidence from Step 5: all 17 personas passed the revisit, but reports recorded browser errors across every core route. Sampled reports repeated route counts such as `/` and `/home` at `consoleErrors=30`, `/discover` at `consoleErrors=45`, `/profile` at `consoleErrors=27`, and `/watchlist` plus `/history` at `consoleErrors=21`.
- Why it matters: persona trust and clarity cannot be interpreted confidently while every core route reports browser-level errors.
- Suggested next action: run a focused local Playwright trace for one persona, group browser errors by route and stack, and fix the shared root cause before product-tuning recommendations.
- Acceptance criteria:
  - P11 smoke revisit records zero browser errors on `/`, `/home`, `/discover`, `/profile`, `/watchlist`, and `/history`.
  - All-persona revisit records no cross-route browser-error issue candidates for the six core routes.
  - Safe revisit summary distinguishes route success from browser diagnostics.
- Non-goals:
  - Do not change recommendation ranking or taste scoring.
  - Do not alter visible UX, copy, layout, or styling.
  - Do not inspect raw session state or generated browser artifacts.
- Synthetic-only caveat: this is synthetic UX inspection evidence from local automation, not a real-user report.

### PRQA-002 — Fix or explain thin/error behavior on the Cinematic DNA profile route

- Priority: P1
- Type: bug
- Personas most affected: P1, P2, P5, P11, P14, all personas
- Surfaces affected: `/profile`
- Evidence from Step 5: sampled reports recorded recovery/error copy on `/profile`; `/profile` was also marked empty or thin. The aggregate weakest-surface list ranked `/profile` with 17 visits, 17 issues, and 17 trust signals.
- Why it matters: profile is the proof surface for Cinematic DNA. P2 needs evidence credibility, P5 needs memory, P11 needs low-effort reassurance, and P14 needs proof that the system is not generic slop.
- Suggested next action: debug the `/profile` data-loading path with a freshly onboarded persona and determine whether the route is missing required rows, querying the wrong shape, or classifying a failed load as an empty profile.
- Acceptance criteria:
  - `/profile` loads without recovery/error copy for P1, P2, P5, P11, and P14 after local onboarding.
  - The route shows either a credible Cinematic DNA state or an explicit honest empty state that is not caused by a failed data load.
  - Persona revisit no longer flags `/profile` as empty or thin for all 17 personas.
- Non-goals:
  - Do not redesign the profile page.
  - Do not rewrite Cinematic DNA copy.
  - Do not seed taste data directly as a shortcut for the browser workflow.
- Synthetic-only caveat: this is synthetic UX inspection evidence from local automation, not a real-user report.

### PRQA-003 — Clarify watchlist and history recovery states after onboarding

- Priority: P1
- Type: bug
- Personas most affected: P5, P11, P14, P1, all personas
- Surfaces affected: `/watchlist`, `/history`
- Evidence from Step 5: sampled reports recorded recovery/error copy on `/watchlist` and `/history`. P5's report is especially sensitive because its survival instinct depends on history and no-repeat memory.
- Why it matters: watchlist and history are the proof surfaces for saved and watched memory. If they look broken after onboarding, personas cannot trust that recommendations will compound.
- Suggested next action: trace `/watchlist` and `/history` with a local persona, classify whether the state is a real empty list or a failed load, and fix any query or data-shape mismatch.
- Acceptance criteria:
  - `/watchlist` and `/history` load without recovery/error copy for at least P5 and P11.
  - The revisit summary records a clear empty state only when the underlying data truly has no rows.
  - P5's report no longer treats history memory as blocked by route errors.
- Non-goals:
  - Do not add new watchlist or history features.
  - Do not alter recommendation de-duplication behavior.
  - Do not use direct database seeding to make the route appear populated.
- Synthetic-only caveat: this is synthetic UX inspection evidence from local automation, not a real-user report.

## P2 — Product-believability and Flow Gaps

### PRQA-004 — Make a movie detail path reachable from Home or Discover during persona revisit

- Priority: P2
- Type: product
- Personas most affected: P2, P4, P9, P11, P14, all personas
- Surfaces affected: `/home`, `/discover`, `/movie/:id`
- Evidence from Step 5: every sampled report recorded `/movie/:id` as `not_found`; the revisit runner could not find a safe `/movie/:id` link from `/home` or `/discover`.
- Why it matters: movie detail is where evidence, metadata, availability, trailer energy, and Film File trust can be inspected. Without a reachable detail route, recommendation believability remains shallow.
- Suggested next action: confirm whether Home and Discover expose a real link to a selected film in the current UI and, if they do, update the runner's safe locator. If they do not, file a scoped product task for a reachable detail path.
- Acceptance criteria:
  - P11 revisit captures one visited `/movie/:id` observation from either `/home` or `/discover`.
  - The captured detail route includes a safe heading or title for the selected film.
  - The runner still records `not_found` without failing when no detail link is available.
- Non-goals:
  - Do not change recommendation selection.
  - Do not add new metadata providers.
  - Do not evaluate where-to-watch or trailer depth until the detail route is reliably reachable.
- Synthetic-only caveat: this is synthetic UX inspection evidence from local automation, not a real-user report.

### PRQA-005 — Separate true empty states from failed load states in revisit findings

- Priority: P2
- Type: qa
- Personas most affected: P5, P11, P14, P15, all personas
- Surfaces affected: `/profile`, `/watchlist`, `/history`
- Evidence from Step 5: artifacts report empty/thin states and recovery/error copy together. A true empty state has different product meaning than a route that failed to load personalized data.
- Why it matters: without separating empty from failed, the backlog can overstate product gaps or miss technical failures that invalidate persona interpretation.
- Suggested next action: add route observation fields that classify `empty`, `failed_load`, and `loaded_with_no_rows` separately using visible copy and safe app-side signals.
- Acceptance criteria:
  - Revisit summary includes route-level state classification for each surface.
  - Reports distinguish OBSERVED true empty states from OBSERVED failed load states.
  - Persona voice feedback does not infer product thinness from a technical load failure.
- Non-goals:
  - Do not modify visible empty-state copy.
  - Do not add direct database probes to the persona revisit flow by default.
  - Do not store raw page snapshots in committed files.
- Synthetic-only caveat: this is synthetic UX inspection evidence from local automation, not a real-user report.

### PRQA-006 — Group persona revisit diagnostics by route and root cause

- Priority: P2
- Type: qa
- Personas most affected: all personas
- Surfaces affected: `/`, `/home`, `/discover`, `/profile`, `/watchlist`, `/history`, `/movie/:id`
- Evidence from Step 5: the artifact reports 136 repeated P2 issue candidates, many repeating the same browser-error pattern across personas and routes.
- Why it matters: repeated per-persona evidence is useful for confidence, but engineers need grouped root-cause buckets to act efficiently.
- Suggested next action: enhance the revisit summary or helper summary to include grouped issue counts by route, issue title, and first safe evidence line.
- Acceptance criteria:
  - Summary output includes grouped issue counts by route and issue.
  - Repeated browser-error candidates collapse into a small diagnostic table.
  - Per-persona detail remains available without duplicating the main backlog.
- Non-goals:
  - Do not remove per-persona reports.
  - Do not collect sensitive browser storage.
  - Do not depend on agent-specific tooling.
- Synthetic-only caveat: this is synthetic UX inspection evidence from local automation, not a real-user report.

## P2 — Workflow/platform Reliability

### PRQA-007 — Make fresh local persona QA reproducible from durable schema/bootstrap

- Priority: P2
- Type: workflow
- Personas most affected: all personas
- Surfaces affected: local Supabase, persona QA workflow
- Evidence from Step 5 and setup history: local persona QA depends on the Vite app pointing at the same Supabase environment as accounts, auth states, onboarding data, and revisit data. Fresh local resets should not depend on ad hoc schema scaffolding.
- Why it matters: persona QA only compounds if future developers can recreate the same local baseline without private setup knowledge.
- Suggested next action: capture the authoritative base Supabase schema in migrations or a documented bootstrap workflow, then validate the full persona chain after a local reset.
- Acceptance criteria:
  - Fresh local reset can run persona account provisioning, auth-state generation, onboarding, and revisit from documented commands.
  - Required local Vite environment values are documented without committing secrets.
  - No ad hoc schema patch is needed outside the durable workflow.
- Non-goals:
  - Do not support production persona provisioning.
  - Do not add production data workflows.
  - Do not hardcode project-specific credentials.
- Synthetic-only caveat: this is synthetic UX inspection evidence from local automation, not a real-user report.

## Insight

### PRQA-008 — Re-check persona-specific trust lenses after technical blockers are fixed

- Priority: Insight
- Type: product
- Personas most affected: P2, P4, P5, P9, P11, P14
- Surfaces affected: `/home`, `/discover`, `/profile`, `/history`, `/movie/:id`
- Evidence from Step 5: reports observed promising mood, DNA, watched, and saved language. P11 needs decision relief, P14 needs anti-slop proof, P2 needs evidence and number credibility, and P5 needs memory/no-repeat confidence. P4 where-to-watch and P9 visual/trailer energy remain product-scope-sensitive until the detail route and technical confidence blockers are resolved.
- Why it matters: these persona lenses are the right product questions, but current technical blockers make product tuning premature.
- Suggested next action: after P1 blockers pass, rerun P11, P14, P2, P5, P4, and P9 and compare their reports before tuning recommendations.
- Acceptance criteria:
  - Follow-up revisit has zero P1 technical confidence blockers.
  - Persona reports include route evidence for the surfaces each trust lens depends on.
  - Any recommendation or product changes are based on observed post-fix evidence, not this blocked baseline alone.
- Non-goals:
  - Do not tune recommendation logic from the current blocked baseline.
  - Do not claim these synthetic findings are real user feedback.
  - Do not expand scope into availability or trailer provider integrations before detail-route confidence exists.
- Synthetic-only caveat: this is synthetic UX inspection evidence from local automation, not a real-user report.
