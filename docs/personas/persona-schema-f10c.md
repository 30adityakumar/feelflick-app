# F10C — Persona Schema

> **Phase F10C. Synthetic Persona Usability Lab — UX inspection only.** This is the
> field definition every persona in [synthetic-personas-f10c.md](synthetic-personas-f10c.md)
> must fill. **Synthetic personas are archetypes, not real users.** They do **not**
> unblock F8C and their reactions are **not** real-user validation — they are a
> structured lens for finding copy/trust/friction problems *before* real testers arrive.

**Status:** ✅ schema defined. **Date:** 2026-06-04. **Engine:** untouched / frozen `2.17`.

---

## Why a schema

A shared schema makes personas (a) comparable across the same task script and rubric,
(b) honest (every field is a plausible *behavior or motivation*, never a claim about a
real person or proprietary platform data), and (c) reusable as Claude-driven test
subjects. Each persona reads against the [wedge](../product-doctrine.md): does FeelFlick's
single justified nightly pick land for *this* archetype, or does it get judged as a
worse version of the platform they already use?

## Required fields

Every persona document must include **all** of the following:

| # | Field | What it captures |
|---|---|---|
| 1 | **Persona name** | A short memorable handle (archetype label, not a real name) |
| 2 | **Platform archetype** | The product behavior they model (e.g. "Letterboxd power user") |
| 3 | **Age range / life context** | Plausible band + situation (student, parent, commuter…) — context, not a real identity |
| 4 | **Movie-watching frequency** | How often they watch (nightly / few-a-week / weekend / sporadic) |
| 5 | **Primary platform used** | Where they mostly decide/watch today |
| 6 | **Secondary platforms used** | Other tools in their stack |
| 7 | **Watch-decision style** | How they choose (browse-til-tired, list-driven, mood-led, social-led, availability-led…) |
| 8 | **Favorite genres / avoided genres** | Taste shape (to test fit + DNA honesty) |
| 9 | **Tolerance** for old films / foreign films / subtitles / slow cinema | Low / medium / high per axis (tests anti-bubble + quality framing) |
| 10 | **Social vs solo watching** | Mostly alone, with a partner, group |
| 11 | **Mood-dependence** | How much their pick depends on tonight's mood (low→high) — the front door |
| 12 | **Patience level** | Tolerance for friction / onboarding / a "slow" answer |
| 13 | **Current frustration** | The unmet pain in their status quo |
| 14 | **Switching trigger** | What would make them try/adopt something new |
| 15 | **Trust requirements** | What a recommendation must show before they believe it |
| 16 | **What would make FeelFlick valuable** | The win condition for this archetype |
| 17 | **What would make them abandon FeelFlick** | The deal-breaker(s) |
| 18 | **First-session success criteria** | What "this was worth it" looks like on night 1 |
| 19 | **Likely tasks** | Which task-script items they'll care about most |
| 20 | **Likely objections** | The pushback they'll voice |
| 21 | **Feedback style** | How they express reactions (blunt, effusive, analytical, terse, comparative…) |

## Authoring rules

- **Archetype, not identity.** Fields describe *plausible behavior and motivation* based on
  observable product patterns — never a real person, and never a claim of access to any
  platform's private/proprietary user data.
- **Behavior-grounded.** Anchor each field in something observable (how the platform works,
  what that workflow optimizes for), not invented demographics-as-destiny.
- **Wedge-relevant.** Every persona must let us test at least one wedge clause (mood-first,
  taste-deep, single justified pick, anti-scroll) and at least one [do-not-become](../product-doctrine.md#do-not-become-list) risk.
- **No real-user claim.** A persona's reaction is a *hypothesis to validate with real
  testers*, never evidence on its own.

## How a persona is used

1. Instantiated as a Claude test subject via the [prompt pack](claude-persona-test-prompts-f10c.md).
2. Runs the shared [task script](persona-usability-tasks-f10c.md) (+ its persona-specific tasks).
3. Scored on the [rubric](persona-usability-rubric-f10c.md) — **scores require written evidence**.
4. Findings + issues roll up into [persona-pilot-findings-f10c.md](persona-pilot-findings-f10c.md)
   and the issue backlog, always labeled **synthetic / to-be-validated-with-real-users**.
