---
name: supabase-change
description: >
  Guide FeelFlick Supabase, schema, RLS, migration, Edge Function, Auth,
  pgvector, and scheduled backend work.
---

# Supabase Workflow

Read `.claude/rules/security-and-data.md` first. For recommendation-related work, also read `.claude/rules/recommendation-engine.md`.

The maintained rules take precedence over this workflow.

## Classify the work

- **Inspection:** source, policy, schema, logs, or approved read-only queries. Proceed.
- **Local implementation:** migration drafts, Edge Function source, tests, and documentation. Proceed.
- **Remote change:** hosted schema, policy, Auth, function deployment, secrets, schedules, or remote data updates. Use the authorization in the current request; otherwise request confirmation with target and recovery plan.
- **High-risk remote change:** work that could remove access, alter important user data, or be difficult to reverse. Require a clear recovery plan and explicit authorization.

Do not stop merely because a file is under `supabase/`. The boundary is remote impact, sensitive data, credentials, and reversibility.

## Analysis

Identify:

- target environment
- affected database objects or functions
- caller roles and ownership model
- migration order and compatibility
- cache or engine-version implications
- validation for anonymous, owner, non-owner, and privileged paths when relevant

For recommendation behavior, inspect real catalog and candidate-pool evidence before changing filters, thresholds, or scoring policy.

## Migration guidance

- Preserve shared migration history; create a new migration for later changes.
- Prefer forward-compatible sequencing.
- Prepare existing rows before adding stricter constraints.
- Keep remote backfills bounded, restartable, and observable where practical.
- Validate RLS with ordinary roles; an administrative query is not sufficient evidence.

## Edge Functions

Classify the function as authenticated-user, internal service, public, or signed webhook.

Verify authentication, authorization, secret placement, input and output validation, CORS, cost control, provider failures, and deployment target.

A public project key is not proof of user identity.

## Output

Lead with one status:

- `✅ proceeding locally`
- `📊 evidence needed first`
- `⚠️ remote authorization needed`
- `❌ blocked by safety or environment uncertainty`

Then state the next action, validation plan, and remaining risk.
