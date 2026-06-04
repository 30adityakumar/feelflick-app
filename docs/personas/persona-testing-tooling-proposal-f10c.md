# F10C — Persona-Testing Tooling Proposal (docs only)

> **Phase F10C. A *proposal* for repeatable persona-testing tooling — NOT shipped.** No
> executable command, skill, hook, or workflow is added in this phase. This documents three
> options for a later, explicitly-approved phase to implement. The repo convention is
> `.claude/skills/<name>/SKILL.md` (there is **no** `.claude/commands/` dir today), plus a
> `PostToolUse` lint hook in `.claude/settings.json`. **Nothing here executes** until approved.

**Status:** ✅ proposal only — no files created in `.claude/`. **Date:** 2026-06-04.

---

## Why propose, not build

The persona lab is fully usable **today** via the [prompt pack](claude-persona-test-prompts-f10c.md)
(copy-paste). Tooling would make runs repeatable, but adding an auto-triggering skill or a hook
is a behavior change that needs its own approved phase (per CLAUDE.md Hard Stops + the
project-guardrail-skills convention). So F10C ships the *design*, not the wiring.

---

## Option A — `/persona-test` slash command (proposed)

A user-invocable command that runs the standard walkthrough for a chosen persona.

- **Where it would live:** `.claude/commands/persona-test.md` *(this dir does not exist yet;
  creating it introduces a new convention — defer to approval).*
- **Invocation:** `/persona-test P3` or `/persona-test "Netflix casual scroller"`.
- **Behavior (proposed):** load the persona + global guardrails + task script + rubric, run a
  live or code-grounded walkthrough, emit a findings block in the pilot-findings format.
- **Proposed template (NOT installed):**

```markdown
---
description: Run a synthetic persona usability walkthrough of FeelFlick (UX inspection only)
argument-hint: <persona id or name, e.g. P3 or "Letterboxd power user">
---
Run a SYNTHETIC persona usability test of FeelFlick as persona: $ARGUMENTS.
Read docs/personas/{synthetic-personas,persona-usability-tasks,persona-usability-rubric,
claude-persona-test-prompts}-f10c.md. Apply the global guardrails (synthetic ≠ real users;
describe only observed behavior; PERSONA REACTION vs PRODUCT NOTE; propose NO engine changes —
F8C is blocked). Run task script T1–T10 + the persona probes, score the rubric WITH evidence,
classify issues P0/P1/P2/Insight, and write up in the pilot-findings format. Change no app code.
```

> **Guardrail:** even if added, this is a *user-invocable* command — never auto-triggering. It
> must not edit app code, tune the engine, or claim real-user validity.

## Option B — Persona QA subagent (proposed)

A dedicated subagent (`Agent` tool / `subagent_type`) for isolated persona runs.

- **Design:** read-only tools only (Read, Grep, Glob, chrome-devtools **read-only** verbs:
  navigate, snapshot, list_console_messages, evaluate_script for inspection). **No** Edit/Write
  to `src/`, **no** Supabase write tools, **no** engine files.
- **Charter:** "Adopt one persona, run the task script against the live app / code, produce
  evidence-backed rubric scores + an issue backlog. Never modify the app. Never claim real-user
  validation. Route rec-quality observations to Insight (F8C stays blocked)."
- **Why a subagent:** isolates each persona's context (no cross-contamination between runs) and
  lets several personas run in parallel for a cohort sweep, each returning just its findings.
- **Status:** design only — not registered as an agent in this phase.

## Option C — Playwright walkthrough integration (proposed)

Semi-automated, deterministic surface coverage to *support* (not replace) the persona reasoning.

- **Idea:** a `e2e/persona/*.persona.js` set (named so Vitest skips them, like the existing
  `*.e2e.js`) that drives the standard route path (`/` → auth → `/onboarding` → `/home` →
  `/movie/:id` → `/profile` → Discover) and **captures artifacts** — screenshots + the visible
  copy/a11y snapshot per surface — which the persona/runner then *reacts to*.
- **Auth:** reuse the existing E2E client-side sign-in against the dev test user
  (`E2E_TEST_EMAIL`/`PASSWORD`), same as `e2e/app/*` — no new auth path, no secrets in the repo.
- **Boundary:** Playwright provides **deterministic observation** (what's actually rendered);
  the **judgment stays with the persona** (Claude). Playwright never asserts UX quality — it only
  gathers ground truth so findings can't drift into invented behavior.
- **Out of scope here:** writing the specs. This phase only proposes the shape; a later approved
  phase would add them under `e2e/persona/` with their own gitignored artifact dir.

## What F10C actually ships

- The persona docs + prompt pack (usable now, no tooling required).
- This proposal. **No `.claude/commands/`, no new skill, no hook, no `e2e/persona/` specs, no
  `package.json`/workflow change.** Each option above is a separate, approval-gated follow-up.

## Recommendation

Start with the **prompt pack (already shipped)** for the next few runs; if persona testing
becomes routine, implement **Option A (`/persona-test`)** first (lowest blast radius, user-
invoked), then **Option C (Playwright artifacts)** to harden observation, and **Option B
(subagent)** only if parallel cohort sweeps are needed. All three remain **read-only, non-engine,
synthetic-labeled**.
