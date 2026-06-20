---
description: Run a read-only synthetic persona feedback audit for FeelFlick. Use when reviewing persona QA artifacts, synthetic beta-user feedback, felt-experience findings, or product trust signals from the persona lab.
---

# Persona Feedback Audit

Synthetic UX inspection — not real-user validation.

Run a read-only synthetic persona feedback audit for FeelFlick. This skill reviews existing safe persona QA artifacts and turns them into product feedback about trust, clarity, felt personalization, and the quality of personal movie discovery across taste, mood, and curiosity.

Core product lens:

```text
Does FeelFlick help a person discover movies that feel personally relevant — through
their taste, their mood, and their curiosity — with the right amount of bounded
choice, honest explanations, and an accurate, evolving Cinematic DNA?
```

Evaluate whether FeelFlick:

- makes discovery feel **personally relevant** (taste + context, not generic);
- **understands mood and situation** when the user signals them;
- **supports intentional exploration** (direct filters / browse) for users with their own intent;
- offers an **appropriate, bounded amount of choice** — not exactly one mandatory film, and not an overwhelming wall;
- **explains recommendations honestly**, grounded in real signals, clear about uncertainty;
- **prevents choice fatigue** without removing agency;
- reflects an **accurate, evolving Cinematic DNA** (living and correctable — never fixed or infallible).

Do **not** require every surface to present exactly one film. A finite, bounded, personalized selection is in-doctrine; treat single-pick framing in older artifacts as current-runtime context, not the evaluation standard. (Canonical doctrine: [`docs/product-doctrine.md`](../../../docs/product-doctrine.md).)

## Default Mode

Review existing safe artifacts only.

Do not rerun Playwright, onboarding, auth-state generation, account provisioning, migrations, tests, or app-changing commands unless the user explicitly asks.

If the user asks for a "feedback audit", "persona review", "felt-experience readout", "trust/clarity feedback", or "what are the personas telling us", treat the request as product feedback only unless they explicitly ask for implementation.

## Hard Rules

- Do not modify source files during the audit.
- Do not edit app code, tests, docs, package scripts, migrations, RLS/auth logic, recommendation logic, routing, UI/copy/layout/styling, or Supabase data during the audit.
- Do not commit anything.
- Do not create GitHub issues unless explicitly asked.
- Do not treat synthetic persona feedback as real-user validation.
- Do not automatically turn findings into fix tasks.
- Do not tune recommendation logic from synthetic findings alone.
- Do not claim local technical warnings are confirmed production bugs without review.

## Secret and Artifact Safety

Never read, print, summarize, upload, or paste contents from:

- `e2e/.auth/personas/*.json`
- auth storage-state files
- cookies
- localStorage
- sessionStorage
- JWTs
- access tokens
- refresh tokens
- passwords
- service role keys
- anon keys
- `.env` files
- screenshots as binary or base64
- browser storage dumps

Safe to mention filenames and paths only. Do not print screenshot bytes, base64, browser storage, or token-bearing JSON.

## Safe Files to Read

When present, safe project guidance and persona inputs:

- `CLAUDE.md`
- `docs/personas/persona-qa-workflow.md`
- `docs/personas/synthetic-personas-f10c.md`
- `docs/personas/persona-revisit-rubric.json`
- `docs/personas/persona-test-accounts.json`
- `docs/personas/persona-onboarding-profiles.json`

When present, safe generated summaries and reports:

- `e2e/.persona-artifacts/revisit-summary.json`
- `e2e/.persona-artifacts/reports/*.md`

Optional sanitized follow-up docs may also be read:

- `docs/personas/persona-revisit-followups.md`
- `docs/personas/persona-revisit-issue-candidates.json`

## Initial Safety Check

Before analysis, run:

```bash
git status --short
```

State whether the repo has uncommitted changes. If there are changes, do not modify them. Continue read-only.

## Commands Not Allowed By Default

Do not run these unless the user explicitly asks for that workflow:

```bash
npm run persona:accounts:provision
npm run persona:auth-states
npm run persona:onboard
npm run persona:revisit
npx supabase db reset
npx supabase migration
npx supabase link
npx supabase push
```

Also do not run account creation, migrations, onboarding, auth-state generation, or production/preview provisioning during a feedback audit.

## Optional Safe Summary

If the repo provides a safe summary helper and the user allows safe commands, this is acceptable:

```bash
npm run persona:revisit:summary
```

This helper must not read auth states, screenshots, browser storage, or secrets. If unsure, skip it and read the safe JSON/markdown artifacts directly.

## Interpretation Rules

Use careful product-feedback language:

- trust risk
- felt-experience concern
- persona confidence issue
- needs human review
- observed in local persona artifacts
- not observed
- synthetic signal

Avoid unsupported claims:

- users hate this
- real users will churn
- production bug
- the algorithm is wrong
- recommendations are objectively bad

Do not assume every console/request warning is a product defect. Treat technical warnings as possible trust signals only.

Do not assume every empty state is bad. Some empty or thin states may be expected for new accounts or local data.

If safe artifacts are missing, do not invent findings. State what is missing and suggest the lowest-risk next step, such as asking for safe summaries or running an explicitly authorized read-only summary command.

## Persona Lens

Prioritize core FeelFlick target personas:

- P11 Fried
- P12 Curious
- P14 Anti-slop
- P15 Cold-start
- P16 Warmed-up

Use the other personas as stress-test lenses:

- P1 depth and diary/list expectations
- P2 evidence and number credibility
- P3 anti-scroll clarity
- P4 where-to-watch practicality
- P5 memory and no-repeat expectations
- P6 editorial polish
- P7 mainstream convenience
- P8 control and scope honesty
- P9 visual/trailer energy
- P10 no-fake-social-proof authenticity
- P13 shared-decision pressure
- CTRL workflow baseline only

## Output Format

Use this structure:

```markdown
# Synthetic Persona Feedback Review

Synthetic UX inspection — not real-user validation.

## 1. Executive summary
## 2. Strongest positive signals
## 3. Strongest trust risks
## 4. Persona-by-persona feedback
## 5. Core target persona readout
## 6. What not to overreact to
## 7. Recommended next product questions
## 8. Suggested next feedback run
## Final confirmation
```

The final confirmation must state:

- no files modified
- no commits made
- no secrets/auth states/screenshots printed
- findings remain synthetic UX inspection, not real-user validation

If the user asked for a shorter answer, keep the same safety confirmation and compress the middle sections.
