# Persona QA Workflow

This workflow creates the foundation for long-term reusable synthetic beta persona accounts. The accounts are stable UX inspection users: they preserve persona identity, motivation, and accumulated state so repeated walkthroughs can compare the product across changes.

These accounts are synthetic. They are not real users, they are not real validation, and their findings must stay labeled as UX inspection signals to validate with real testers later.

The workflow is tool-agnostic. Codex, Claude Code, or a human developer should be able to use the same registry, environment contract, scripts, and Playwright artifacts without agent-specific files or commands.

## Account Registry

The stable account registry lives at:

```bash
docs/personas/persona-test-accounts.json
```

It contains all P1-P16 synthetic personas plus the `CTRL` shared/control account. Registry entries contain no secrets.

## Required Environment

Provisioning real auth accounts requires these variables:

```bash
PERSONA_SUPABASE_URL
PERSONA_SUPABASE_SERVICE_ROLE_KEY
PERSONA_TEST_PASSWORD
```

`PERSONA_TEST_PASSWORD` must be provided externally and must never be committed. It should be a long, generated test password used only for these synthetic accounts in the intended environment.

`PERSONA_SUPABASE_SERVICE_ROLE_KEY` is server-only. Service role keys must never be exposed in browser code, `VITE_*` variables, screenshots, logs, or committed files.

## Optional Environment

```bash
PERSONA_ENV=local|preview
PERSONA_ALLOW_REMOTE=false|true
PERSONA_ACCOUNT_REGISTRY=docs/personas/persona-test-accounts.json
PERSONA_AUTH_STATE_DIR=e2e/.auth/personas
PERSONA_ARTIFACT_DIR=e2e/.persona-artifacts
```

Defaults:

```bash
PERSONA_ENV=local
PERSONA_ALLOW_REMOTE=false
PERSONA_ACCOUNT_REGISTRY=docs/personas/persona-test-accounts.json
PERSONA_AUTH_STATE_DIR=e2e/.auth/personas
PERSONA_ARTIFACT_DIR=e2e/.persona-artifacts
```

Remote or preview account provisioning must require `PERSONA_ALLOW_REMOTE=true`. Production provisioning is blocked by default and should not be supported unless explicitly approved in a future phase.

## Provisioning Contract

Dry-run is credential-free and safe:

```bash
npm run persona:accounts:dry-run
```

Provisioning requires explicit apply mode and the required environment:

```bash
PERSONA_ENV=local \
PERSONA_SUPABASE_URL=... \
PERSONA_SUPABASE_SERVICE_ROLE_KEY=... \
PERSONA_TEST_PASSWORD=... \
npm run persona:accounts:provision
```

Limit a run to selected accounts with `--limit`:

```bash
npm run persona:accounts:dry-run -- --limit P1,P2,CTRL
```

The provisioning script must:

- validate the registry before doing work
- require all persona emails to end in `@feelflick.test`
- never print the password or service role key
- block `PERSONA_ENV=production`
- block remote provisioning unless `PERSONA_ENV=local` targets a local Supabase URL or `PERSONA_ALLOW_REMOTE=true`
- be idempotent by reusing or updating existing persona accounts instead of duplicating them

## Step 2 — Provision persona auth accounts

The `@feelflick.test` accounts are synthetic long-term QA users. They are stable test identities for repeated UX inspection, not real people and not real validation.

Account provisioning only creates or updates Supabase Auth users and synthetic persona metadata. It does not complete onboarding, seed taste data, seed history, create Playwright auth states, or modify recommendation behavior.

Never paste `PERSONA_SUPABASE_SERVICE_ROLE_KEY`, `PERSONA_TEST_PASSWORD`, or other secrets into ChatGPT, Codex prompts, GitHub issues, commits, screenshots, or logs.

Local dry-run:

```bash
npm run persona:accounts:dry-run
```

Local apply:

```bash
PERSONA_SUPABASE_URL="..." \
PERSONA_SUPABASE_SERVICE_ROLE_KEY="..." \
PERSONA_TEST_PASSWORD="..." \
PERSONA_ENV=local \
npm run persona:accounts:provision
```

Preview apply requires explicit remote permission:

```bash
PERSONA_SUPABASE_URL="..." \
PERSONA_SUPABASE_SERVICE_ROLE_KEY="..." \
PERSONA_TEST_PASSWORD="..." \
PERSONA_ENV=preview \
PERSONA_ALLOW_REMOTE=true \
npm run persona:accounts:provision
```

Limited run, for example only `P1` and `P11`:

```bash
PERSONA_SUPABASE_URL="..." \
PERSONA_SUPABASE_SERVICE_ROLE_KEY="..." \
PERSONA_TEST_PASSWORD="..." \
PERSONA_ENV=local \
npm run persona:accounts:provision -- --limit P1,P11
```

Reset passwords for existing persona accounts:

```bash
PERSONA_SUPABASE_URL="..." \
PERSONA_SUPABASE_SERVICE_ROLE_KEY="..." \
PERSONA_TEST_PASSWORD="..." \
PERSONA_ENV=local \
npm run persona:accounts:provision -- --reset-password
```

Machine-readable summary:

```bash
npm run persona:accounts:dry-run -- --json
```

## Step 3 — Generate persona Playwright auth states

Prerequisite: Step 2 provisioned the persona Auth accounts successfully in the target local or preview environment.

This step uses `PERSONA_TEST_PASSWORD` only. It signs in through the app's normal Supabase password auth path with `window.supabase.auth.signInWithPassword(...)`. It does not use `PERSONA_SUPABASE_SERVICE_ROLE_KEY`, does not complete onboarding, does not seed taste data, and does not seed history.

The generated Playwright storage state files are written under:

```bash
e2e/.auth/personas/
```

These files are gitignored and must not be committed because they contain live session tokens. Do not paste storage state file contents into ChatGPT, Codex, Claude, GitHub issues, screenshots, commits, or logs.

A safe summary artifact is written to:

```bash
e2e/.persona-artifacts/auth-states-summary.json
```

Smoke run for one persona:

```bash
PERSONA_TEST_PASSWORD="..." \
PERSONA_LIMIT=P1 \
npm run persona:auth-states
```

Run all personas:

```bash
PERSONA_TEST_PASSWORD="..." \
npm run persona:auth-states
```

Run selected personas:

```bash
PERSONA_TEST_PASSWORD="..." \
PERSONA_LIMIT=P1,P11,P16 \
npm run persona:auth-states
```

Inspect generated files without printing storage state contents:

```bash
ls e2e/.auth/personas
cat e2e/.persona-artifacts/auth-states-summary.json
```

## Step 4 — Complete persona onboarding through the browser

Prerequisite: Step 3 generated persona auth storage states under `e2e/.auth/personas/`.

This step uses the app's browser UI and the persona auth states. It does not require `PERSONA_SUPABASE_SERVICE_ROLE_KEY`, does not directly seed Supabase data, and does not use the provisioning admin path. The browser flow writes onboarding data through the same app code a signed-in user uses.

The Vite app must point at the same Supabase environment where the persona accounts and auth states were created. Persona browser runs depend on the `VITE_*` environment seen by the app, not only `PERSONA_*` variables. In local recovery, the P1 auth-state smoke failed when Vite was still pointed at a hosted Supabase URL; the successful run explicitly overrode Vite to use the local Supabase URL and local anon key for that command only.

Get local Vite values from:

```bash
npx supabase status -o env
```

Never commit or paste keys, auth-state contents, cookies, localStorage, access tokens, refresh tokens, or session JSON into tools, chats, issues, screenshots, commits, or logs.

Smoke run for one persona:

```bash
VITE_SUPABASE_URL="http://127.0.0.1:54321" \
VITE_SUPABASE_ANON_KEY="..." \
PERSONA_LIMIT=P1 \
npm run persona:onboard
```

Run all personas:

```bash
VITE_SUPABASE_URL="http://127.0.0.1:54321" \
VITE_SUPABASE_ANON_KEY="..." \
npm run persona:onboard
```

Run selected personas:

```bash
VITE_SUPABASE_URL="http://127.0.0.1:54321" \
VITE_SUPABASE_ANON_KEY="..." \
PERSONA_LIMIT=P1,P11,P16 \
npm run persona:onboard
```

The onboarding run writes a safe summary to:

```bash
e2e/.persona-artifacts/onboarding-summary.json
```

The safe summary contains persona IDs, emails, selected moods/genres, counts, completion route, and safe notes only. It must not contain tokens, cookies, localStorage, passwords, service role keys, anon keys, or storageState contents.

## Step 5 — Persona revisit and felt-experience QA

Prerequisites:

- Step 2 provisioned persona auth accounts.
- Step 3 generated persona auth states under `e2e/.auth/personas/`.
- Step 4 completed onboarding through the real browser UI.
- The Vite app is pointed at the same Supabase environment used for the persona accounts, auth states, and onboarding data.

This step revisits the app as each synthetic persona and captures actual route observations from the browser. It then produces deterministic synthetic persona feedback grounded in observed UI evidence. These findings are synthetic UX inspection signals, not real-user validation.

This step does not use `PERSONA_SUPABASE_SERVICE_ROLE_KEY`, does not directly write database rows, does not seed taste data, and does not modify recommendation logic. It uses existing persona auth storage states and normal app routes.

Persona browser runs depend on the `VITE_*` environment seen by the app. For local runs, get the local Vite values from:

```bash
npx supabase status -o env
```

Never commit or paste secrets, anon keys, auth-state contents, cookies, localStorage, access tokens, refresh tokens, session JSON, screenshots, or artifact contents that contain sensitive data into tools, chats, issues, screenshots, commits, or logs.

Smoke one persona:

```bash
VITE_SUPABASE_URL="http://127.0.0.1:54321" \
VITE_SUPABASE_ANON_KEY="..." \
PERSONA_LIMIT=P11 \
npm run persona:revisit
```

Run all personas:

```bash
VITE_SUPABASE_URL="http://127.0.0.1:54321" \
VITE_SUPABASE_ANON_KEY="..." \
npm run persona:revisit
```

Run without screenshots:

```bash
VITE_SUPABASE_URL="http://127.0.0.1:54321" \
VITE_SUPABASE_ANON_KEY="..." \
PERSONA_REVISIT_SCREENSHOTS=false \
npm run persona:revisit
```

Inspect safe outputs:

```bash
cat e2e/.persona-artifacts/revisit-summary.json
ls e2e/.persona-artifacts/reports
sed -n '1,200p' e2e/.persona-artifacts/reports/P11.md
```

The revisit run writes:

```bash
e2e/.persona-artifacts/revisit-summary.json
e2e/.persona-artifacts/reports/<persona-id>.md
e2e/.persona-artifacts/screenshots/<persona-id>/<route>.png
```

Generated reports, screenshots, session files, and artifacts are gitignored and must not be committed. The markdown reports must keep the label `Synthetic UX inspection — not real-user validation`.

## Step 6 — Convert revisit findings into follow-up backlog

Prerequisite: Step 5 generated the safe revisit summary and per-persona markdown reports.

This step reads safe Step 5 outputs, then creates a durable sanitized follow-up backlog:

```bash
docs/personas/persona-revisit-followups.md
docs/personas/persona-revisit-issue-candidates.json
```

The backlog keeps all findings labeled as synthetic UX inspection, not real-user validation. It should summarize observed evidence, group repeated issue patterns, and turn them into prioritized follow-up work without committing raw generated artifacts.

Safe helper summary:

```bash
npm run persona:revisit:summary
```

Inputs to inspect:

```bash
cat e2e/.persona-artifacts/revisit-summary.json
sed -n '1,200p' e2e/.persona-artifacts/reports/P11.md
```

Do not commit `e2e/.persona-artifacts`, screenshots, auth states, session files, or other generated browser artifacts. Do not paste secrets, auth-state contents, or screenshots into tools, chats, issues, commits, or logs.

Do not tune recommendations from a technically blocked baseline. Resolve P1 technical confidence blockers first, rerun focused persona revisits, and only then compare persona-specific trust lenses across product changes.

## Intended Future Stages

1. Provision persona auth accounts.
2. Seed onboarding profile data.
3. Create Playwright auth storage state per persona.
4. Run persona walkthroughs repeatedly.
5. Generate persona voice findings.
6. Compare findings across product changes.

Each stage should keep synthetic findings separate from real-user validation and should avoid modifying production data unless a future phase explicitly approves a production-safe workflow.
