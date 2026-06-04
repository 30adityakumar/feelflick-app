# F10C — Persona Usability Rubric

> **Phase F10C. Scoring rubric for synthetic persona runs.** Each dimension scores **1–5**,
> but **a score is invalid without written evidence** (a quote, an observed step, a specific
> copy string, a screenshot ref). **Scores alone are banned.** These are synthetic-run
> signals for prioritizing UX work — **not real-user validation**, and they **do not unblock F8C.**

**Status:** ✅ rubric defined. **Date:** 2026-06-04. Use with the
[task script](persona-usability-tasks-f10c.md) + [personas](synthetic-personas-f10c.md).

---

## Scoring rules

- **1–5 per dimension**, where **1 = broken/blocking**, **3 = works but flawed**, **5 = magical/trustworthy**.
- **Evidence required.** Every score carries ≥1 line of *what was observed* (quote the copy,
  name the step, cite the surface). No evidence → the score is discarded.
- **Score the experience, not the engine.** A bad *pick* is a rec-quality signal for F8C, **not**
  a low usability score — note it separately. The rubric measures whether the *product makes its
  case clearly and honestly*, which is UX, not tuning.
- **Persona-relative.** A 5 for the Netflix scroller (low-effort, safe) differs from a 5 for the
  anti-slop cinephile (honest, non-mediocre). Score against *that persona's* success criteria.
- **NOT OBSERVED ≠ 0.** If a surface wasn't reached, mark the dimension NOT OBSERVED, don't guess.

## Dimensions

| # | Dimension | The question | 1 (broken) | 5 (magical/trustworthy) |
|---|---|---|---|---|
| **D1** | **First-10-second clarity** | In 10s on the landing, does the persona get what FeelFlick is? | "no idea what this does" | "one film for tonight, with a reason — got it instantly" |
| **D2** | **Onboarding friction** | How costly is the path to first value? | abandons; too long/unclear | quick, "why we ask" is clear, value felt fast |
| **D3** | **Trust in the Tonight pick** | Does the pick feel right for *this* persona's mood + taste? | random/popular/off | "this gets me" |
| **D4** | **Quality of "Why this pick"** | Is the reason specific, true, useful — not generic? | "Picked for you" / empty | "Because you loved X" — specific + believable |
| **D5** | **Film File case-making** | Does the PrimaryCaseCard build trust in the pick? | thin / no case | a sharp, honest, tiered case that earns the watch |
| **D6** | **Cinematic DNA honesty** | Does the DNA feel *true*, including honest about thin data? | fake/flattering/over-confident | accurate; honestly "still learning" when cold |
| **D7** | **Anti-scroll strength** | Does it reduce deciding, not add a grid to evaluate? | becomes a feed/carousel wall | one decision, made; scrolling reduced |
| **D8** | **Perceived personalization** | Does it feel made for *me*, not a generic popular set? | "this is just popular stuff" | "this is *my* taste" |
| **D9** | **Emotional resonance** | Does the session land emotionally (relief, delight, being understood)? | indifferent/annoyed | "it understood how I felt" |
| **D10** | **Task completion** | Did the persona complete the core path (arrive→mood→pick→decide)? | blocked | smooth end-to-end |
| **D11** | **Confusion points** | How free of confusing copy/affordances was it? (5 = none) | repeatedly lost | nothing confusing |
| **D12** | **Switching likelihood** | Would this persona *switch from their status quo*? | "no, my app is fine" | "I'd use this instead tonight" |
| **D13** | **Return likelihood** | Would they come back tomorrow? | "one-and-done" | "this could be a nightly ritual" |

## Per-run scorecard template

```
Persona: P# — {name}
Run date: {date} · Methodology: {live-browser public / code-grounded authenticated / mixed}

D1  First-10s clarity      [_/5]  evidence: "…"
D2  Onboarding friction    [_/5]  evidence: "…"
D3  Trust in Tonight pick   [_/5]  evidence: "…"
D4  "Why this pick" quality [_/5]  evidence: "…"
D5  Film File case-making   [_/5]  evidence: "…"
D6  DNA honesty             [_/5]  evidence: "…"
D7  Anti-scroll strength    [_/5]  evidence: "…"
D8  Perceived personalization[_/5] evidence: "…"
D9  Emotional resonance     [_/5]  evidence: "…"
D10 Task completion         [_/5]  evidence: "…"
D11 Confusion points        [_/5]  evidence: "…"
D12 Switching likelihood    [_/5]  evidence: "…"
D13 Return likelihood       [_/5]  evidence: "…"

Top friction:  …
Top trust break: …
What worked:   …
Issues raised: [P0/P1/P2/Insight] …
To validate with real users: …
```

## Reading the scores (honestly)

- **A dimension ≤2 with evidence = a real UX problem** → issue backlog (P0/P1/P2).
- **A low D3/D4 that's about the *pick itself* (not the framing)** = a **rec-quality / Insight**
  signal for F8C — record it, **do not** act on it as tuning (F8C stays blocked).
- **Aggregate scores are directional only.** With synthetic personas, the *evidence and issues*
  matter; the numbers are a sorting aid, never a verdict and never "validated."
- **Cross-persona patterns** (the same confusion across ≥3 personas) outrank any single score.
