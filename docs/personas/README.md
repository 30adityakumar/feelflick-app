# FeelFlick Persona QA Lab

Synthetic UX inspection — not real-user validation.

FeelFlick's persona QA lab uses long-term synthetic beta personas to inspect how the product feels across different user mindsets. These personas are not real people, not real users, and not real validation. Treat their findings as structured product hypotheses to compare with real user research later.

## What the Workflow Can Do

The workflow can:

1. Provision local or preview synthetic persona accounts.
2. Generate Playwright auth states.
3. Complete onboarding through the real browser UI.
4. Revisit the app as each persona.
5. Generate safe synthetic feedback reports.
6. Summarize product trust, clarity, and felt-personal signals.

Main workflow doc:

```text
docs/personas/persona-qa-workflow.md
```

## Key Persona Docs

```text
docs/personas/synthetic-personas-f10c.md
docs/personas/persona-test-accounts.json
docs/personas/persona-onboarding-profiles.json
docs/personas/persona-revisit-rubric.json
```

## Safe Feedback Artifacts

These generated artifacts are safe to summarize when present, but they remain generated local QA output and should not be committed unless a future workflow explicitly says otherwise:

```text
e2e/.persona-artifacts/revisit-summary.json
e2e/.persona-artifacts/reports/*.md
```

## Do Not Share or Upload

Never share, upload, paste, or print contents from:

```text
e2e/.auth/personas/*.json
.env files
Supabase keys
passwords
cookies
localStorage
JWTs
screenshots unless explicitly intended
```

Also avoid printing auth-state contents, storage-state JSON, access tokens, refresh tokens, service role keys, anon keys, session data, or screenshot binary/base64 data.

## Claude Code Usage

Use the project-local read-only skill:

```text
/persona-feedback-audit
```

Skill file:

```text
.claude/skills/persona-feedback-audit/SKILL.md
```

Use it when asking for persona QA, synthetic beta-user feedback, felt-experience audits, trust/clarity feedback, or how FeelFlick feels to different users.

## ChatGPT / Claude Chat Usage

Provide safe docs and safe summary artifacts only. Ask for:

```text
Synthetic persona feedback review — product feedback only, no code changes.
```

Do not provide auth states, `.env` files, Supabase keys, passwords, cookies, localStorage, JWTs, browser storage dumps, or screenshot binaries/base64.

## Interpretation Guardrails

- Synthetic persona findings are UX inspection only, not real-user validation.
- Do not treat local console/request warnings as confirmed production bugs without review.
- Do not tune recommendation logic from synthetic findings alone.
- Do not overfit to synthetic users; use them to generate product questions.
- Use P11 Fried, P12 Curious, P14 Anti-slop, P15 Cold-start, and P16 Warmed-up as the core FeelFlick target readout.
- Use the other personas as stress-test lenses for platform habits, trust boundaries, and edge expectations.
