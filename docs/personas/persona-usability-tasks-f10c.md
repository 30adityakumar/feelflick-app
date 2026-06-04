# F10C — Persona Usability Task Script

> **Phase F10C. The shared walkthrough every persona runs.** Same 10 core tasks for all,
> plus persona-specific probes. Tasks are **observational** — the persona *uses* the live
> app and thinks aloud; **nothing in the app changes.** Synthetic runs are UX inspection,
> **not real-user validation**, and do **not** unblock F8C.

**Status:** ✅ task script defined. **Date:** 2026-06-04. Routes per the
[surface hierarchy](../product-doctrine.md#surface-hierarchy). Score with the
[rubric](persona-usability-rubric-f10c.md); record evidence, not just scores.

---

## How to run

- The runner adopts the persona ([prompt pack](claude-persona-test-prompts-f10c.md)), then
  performs each task **in character**, **thinking aloud** (what they see → expect → feel → do).
- **Separate two voices** every task: the **persona reaction** ("as this user, I feel…") vs.
  the **product note** ("as a tester, the issue is…"). Never blur them.
- **Only describe what's actually on screen / in the code** — no invented behavior. If a
  surface can't be reached in the run, mark the task **NOT OBSERVED** (don't fabricate it).
- Capture per task: what they did · friction · trust break · confusing copy · what worked ·
  rubric evidence · any P0/P1/P2/Insight issue.

## Core tasks (all personas, in order)

| # | Task | Surface | What it probes |
|---|---|---|---|
| **T1** | **Land on the homepage and explain what FeelFlick is** (10s, then 60s) | `/` (logged-out landing) | first-10-second clarity; does the wedge read? |
| **T2** | **Decide whether to sign in — and articulate *why* sign-in is needed** | landing → auth CTA | value-before-commitment; is the ask justified? |
| **T3** | **Complete onboarding** (seed a few loved films) | `/onboarding` | onboarding friction; "why we ask" clarity |
| **T4** | **Evaluate tonight's pick** — does it fit my mood + taste? | `/home` Briefing | mood-first + taste-deep fit; perceived personalization |
| **T5** | **Read "Why this pick" and decide: open / save / skip** | `/home` Briefing + WhyThisPick | quality of the case; decision confidence |
| **T6** | **Open the Film File — does the PrimaryCaseCard build trust?** | `/movie/:id` | case-making layer (the moat); honesty |
| **T7** | **Check Cinematic DNA — does it feel honest, or generic/flattering?** | `/profile` | DNA honesty; trust |
| **T8** | **Try to find *another* film without falling into endless browsing** | Discover / Browse / back to Briefing | anti-scroll strength; does a second recommender compete? |
| **T9** | **Give one reason you'd return tomorrow** | whole session | return likelihood; ritual potential |
| **T10** | **Give one reason you'd abandon the app** | whole session | the deal-breaker; switching likelihood |

> A run is "complete" when T1–T10 are attempted and each is either evidenced or marked
> NOT OBSERVED with the reason.

## Persona-specific probes (add to the core run)

| Persona | Extra task | What it tests |
|---|---|---|
| **P1 Letterboxd** | Look for **diary / lists / logging** — compare to your Letterboxd expectations. Does FeelFlick try to replace it, or stay complementary? | not-a-Letterboxd-clone boundary; substrate-not-front-door |
| **P4 JustWatch** | Ask **"where can I watch this?"** on the pick / Film File. Is the answer present, honest, or absent? | where-to-watch as convenience vs. missing-and-frustrating |
| **P5 Trakt** | Look for **history / completion tracking**; check whether a watched film is ever re-recommended. | history use; repeated-pick guard |
| **P3 Netflix** | After the pick, judge: **did this reduce my scrolling vs. Netflix**, honestly? | anti-scroll, head-to-head with the grid |
| **P8 Plex** | Ask whether **personal-library support** matters to you, and how gracefully the app handles "not supported yet." | scope-honesty; control |
| **P13 Couple** | Judge whether the single pick **helps a *shared* decision** (two people), and where it falls short. | single-pick as tiebreaker; multi-user gap |
| **P2 TMDB** | Scrutinize the **match % / numbers** — do they read as honest evidence or an arbitrary grade? | numbers-mean-what-they-say |
| **P6 Apple TV** | Judge the **craft + editorial voice** of the Film File writing specifically. | craft benchmark |
| **P10 Reddit** | Hunt for **fake social proof / fabricated hype** anywhere; flag any claim that "people like you…" without basis. | no-fake-social-proof |
| **P14 Anti-slop** | Pressure-test: is the pick **mediocre/popular**? Is any reason **fabricated**? Is it **recency-biased**? | the full honesty + quality gate |
| **P15 Cold-start** | On thin data, does the app **honestly signal it's still learning** rather than fake confidence? | cold-state honesty (F7) |
| **P16 Warmed-up** | Does the pick **visibly use your depth**, is the DNA **accurate**, and is tonight ≠ yesterday? | compounding + repeated-pick fatigue |
| **P9 YouTube** | Is there a **trailer / instant visual hook**, and is the pick appealing within seconds? | visual-first appeal |
| **P7 Prime** | Is the whole path **low-effort enough** to feel "safe and easy"? | convenience threshold |

## Output of a run

Each run produces a row/section in [persona-pilot-findings-f10c.md](persona-pilot-findings-f10c.md)
(for piloted personas) or a future findings doc: tasks completed/NOT OBSERVED, friction, trust
breaks, confusing copy, what worked, rubric scores **with evidence**, and an issue list tagged
**P0 / P1 / P2 / Insight** — every item labeled **synthetic, to-be-validated-with-real-users**.
