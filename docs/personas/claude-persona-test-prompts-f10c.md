# F10C — Claude Persona-Testing Prompt Pack

> **Phase F10C. Reusable prompts for running a synthetic persona walkthrough with Claude
> Code.** Copy-paste these to drive a structured run. **Guardrails are part of every prompt:**
> describe only observed behavior, separate persona-reaction from product-recommendation, and
> never claim synthetic feedback is real-user validation. These runs **do not** change the app
> and **do not** unblock F8C.

**Status:** ✅ prompt pack ready. **Date:** 2026-06-04. Pairs with
[personas](synthetic-personas-f10c.md) · [tasks](persona-usability-tasks-f10c.md) ·
[rubric](persona-usability-rubric-f10c.md).

---

## Global guardrails (prepend to any run)

```
You are running a SYNTHETIC persona usability test of FeelFlick. Hard rules:
1. Synthetic personas are archetypes, NOT real users. Never describe their reactions as
   real-user validation, evidence, or proof. Always label findings "synthetic — to be
   validated with real users."
2. Describe ONLY what is actually on screen or in the code. Do NOT invent product behavior,
   copy, screens, or data that you did not observe. If you can't reach a surface, mark the
   task NOT OBSERVED and say why.
3. Keep two voices separate every step:
   - PERSONA REACTION: "as {persona}, I see X, I expect Y, I feel Z, I do W."
   - PRODUCT NOTE: "as a tester, the issue is …" (severity P0/P1/P2/Insight).
4. A bad recommendation is a rec-quality / Insight signal for F8C — note it, do NOT propose
   scoring/ranking/threshold/engine changes. F8C is blocked.
5. Change no app code. This is read-only UX inspection.
6. No fabricated social proof, counts, or claims — and flag any you see in the product.
```

## 1. Run as a specific persona

```
Adopt persona {P# — name} from docs/personas/synthetic-personas-f10c.md. Internalize all
their schema fields (decision style, tolerances, frustration, trust requirements, success
criteria, likely objections, feedback style). Stay in character for the whole run, but keep
the PRODUCT NOTE voice available. Confirm the persona in one sentence before starting.
```

## 2. Think aloud while using FeelFlick

```
Walk through FeelFlick as {persona}, thinking aloud at each step: what you SEE → what you
EXPECT → what you FEEL → what you DO next. Narrate honestly in character (including boredom,
distrust, delight). Quote the actual on-screen copy you react to. Where you only inspected
the code (not a live screen), say so explicitly.
```

## 3. Complete the task script

```
Run the core task script T1–T10 from docs/personas/persona-usability-tasks-f10c.md, plus the
persona-specific probe(s) for {persona}. For each task record: what you did · friction ·
trust break · confusing copy · what worked · NOT OBSERVED (if unreachable). Don't skip the
abandon-reason task (T10).
```

## 4. Record friction

```
For every point of friction, capture: WHERE (route/surface), the exact COPY or affordance,
WHAT the persona expected, WHAT happened, and the FEELING (confused / distrustful / bored /
delighted). Friction with a quote beats friction described abstractly.
```

## 5. Separate persona reaction from product recommendation

```
For each finding, output two labeled lines:
  PERSONA REACTION: (in character, subjective)
  PRODUCT NOTE: (as a tester — the underlying UX/copy/trust issue, with severity)
Never merge them. A persona disliking a good film ≠ a product defect; a persona confused by
unclear copy IS a product defect.
```

## 6. Classify issues (P0/P1/P2/Insight)

```
Tag every PRODUCT NOTE:
  P0  — blocking / breaks trust hard / fabricated content / can't complete core path
  P1  — significant friction or confusion most of this persona type would hit
  P2  — polish / minor copy / single-edge
  Insight — product/strategy/rec-quality signal (incl. "the pick itself was off") — log, don't act
Group by surface. Note when ≥3 personas hit the same issue (a pattern outranks any one score).
```

## 7. Score the rubric (evidence-required)

```
Fill the docs/personas/persona-usability-rubric-f10c.md scorecard for {persona}: D1–D13, each
1–5 WITH a one-line evidence quote/observation. A score without evidence is invalid — drop it.
State the methodology (live-browser public / code-grounded authenticated / mixed) at the top.
```

## 8. Anti-fabrication check (run before finalizing)

```
Before writing findings, audit your own output:
- Did I describe any screen/copy/behavior I did NOT actually observe? Remove or mark NOT OBSERVED.
- Did I imply any reaction is real-user evidence? Re-label as synthetic/hypothesis.
- Did I propose any engine/scoring change? Remove — F8C is blocked; recategorize as Insight.
- Did I invent counts, quotes, or social proof? Remove.
Then write the findings.
```

## 9. Findings write-up

```
Summarize the run into the docs/personas/persona-pilot-findings-f10c.md format: persona ·
methodology · tasks completed/NOT OBSERVED · observed friction · trust breaks · confusing copy ·
what worked · rubric scorecard (with evidence) · issue backlog (P0/P1/P2/Insight) · "to validate
with real users." End with the one-line reminder that this is synthetic and does not unblock F8C.
```

## Reusable one-liner (kick off a full run)

```
Run a synthetic persona usability test of FeelFlick as {P# — name}: adopt the persona, think
aloud through task script T1–T10 + the persona probes, keep PERSONA REACTION vs PRODUCT NOTE
separate, describe only observed behavior, score the rubric with evidence, classify issues
P0/P1/P2/Insight, propose NO engine changes, and label everything synthetic /
to-be-validated-with-real-users. Write it up in the pilot-findings format.
```
