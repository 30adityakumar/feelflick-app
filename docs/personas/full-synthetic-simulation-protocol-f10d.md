# F10D — Full Synthetic Cohort Simulation Protocol

> **Phase F10D. A full 16-persona synthetic customer-journey simulation — UX inspection, NOT
> real-user validation.** This protocol governs the run. **Synthetic personas are archetypes,
> not real users.** The outputs are usability hypotheses, friction analysis, and *simulated*
> feedback — they are **not** measured outcomes, **not** validation, and they **do not unblock
> F8C.** No product/engine/schema/auth/UI/package change is made.

**Status:** ✅ protocol defined. **Date:** 2026-06-04. **Engine:** frozen `2.17`.
Builds on the F10C lab ([personas](synthetic-personas-f10c.md) · [tasks](persona-usability-tasks-f10c.md) ·
[rubric](persona-usability-rubric-f10c.md) · [prompts](claude-persona-test-prompts-f10c.md)).

---

## 1. Purpose

Run the [task script](persona-usability-tasks-f10c.md) for **all 16 personas** (the F10C pilot
covered only 2), to (a) surface cross-persona friction/trust patterns before real testers arrive,
(b) decide **what to watch for in Wave 1**, and (c) sharpen the [F10C.1 backlog](persona-usability-backlog-f10c1.md).
It is a *dress rehearsal*, not a verdict.

## 2. Limits of synthetic simulation (read first)

- A simulated reaction is a **plausible hypothesis**, generated from the persona schema + observed
  product behavior — **never evidence of how a real person reacts.**
- Simulated "scores" and a simulated "outcome matrix" are **behavioral *predictions*** — they look
  like the Wave-1 outcome lens *on purpose* (so we know what to measure) but they are **not data**
  and must never be compared to production SQL as if real.
- Whatever the cohort "says," **real users override it.** When Wave-1 findings land, they are the
  tiebreaker.

## 3. Why this does NOT unblock F8C

F8C needs a **real-user outcome baseline** (≥5 real users, ~300–500+ hero/discover impressions on a
stable `algorithm_version 2.17`, stable ≥3 days — [plan §6](private-preview-plan-f10a.md#6-data-volume--duration-before-f8c)).
A synthetic cohort produces **zero** real impressions/outcomes. So F8C stays blocked, and every
rec-quality observation here is logged as **Insight**, never as a scoring change.

## 4. How personas are run

For each persona: adopt it (schema), run the 18-step journey (Step 3 of the phase), think aloud,
and keep the four voices **separate** (§6). Methodology per surface:

| Surface | Method in this run |
|---|---|
| `/` landing | **Browser-observed** (live, F10C-captured real copy) |
| Onboarding, `/home`+Briefing+WhyThisPick, `/movie`+PrimaryCaseCard+ViewerNotes, `/profile`+DnaConfidence, `/discover`, `/watchlist`, `/history`, `/account` | **Code-grounded** — reactions cite the *actual component copy/structure* read from `src/features/...`. The authenticated UI was **not** live-walked under a real session (real users use Google OAuth; that's Wave-1's per-tester smoke). |
| The actual *pick that would be served* | **SIMULATED / NOT OBSERVED** — depends on a real account + history. Flagged as such. |

## 5. What evidence counts

- **Browser-observed:** a real on-screen string/behavior (quotable).
- **Code-grounded:** a real string/branch in the source (cite the file).
- **Simulated:** a persona inference — must be labeled `(simulated)` and must **not** invent a screen,
  copy, count, or behavior that wasn't observed or in the code.
- A rubric score is invalid without ≥1 observed/code-grounded line behind it.

## 6. The four-voice separation (mandatory)

Every finding separates:

1. **Observed product behavior** — what's actually there (browser/code).
2. **Persona interpretation** — how this archetype reads it.
3. **Simulated feedback** — the quote/reaction they'd plausibly give `(simulated)`.
4. **Recommended next action** — validate / fix-later / defer / protect (never "implement now").

Blurring these (e.g. stating a simulated reaction as fact, or jumping from a reaction to a code change)
is a protocol violation.

## 7. Scoring rubric

Use the [F10C rubric](persona-usability-rubric-f10c.md) (D1–D13, evidence-required). The cohort docs
also use three roll-up scores per persona, **defined once here**:

- **Trust 1–5** (1 = distrusts / trust broken, 5 = fully trusts) — higher is better.
- **Return likelihood 1–5** (1 = one-and-done, 5 = nightly ritual) — higher is better.
- **Friction 1–5** (**1 = smooth, 5 = heavy/blocking friction**) — **lower is better.**

These three are **simulated predictions**, not measurements.

## 8. Issue severity

`P0` blocking / trust-breaking / fabrication · `P1` significant friction most of the type hit ·
`P2` polish/microcopy · `Insight` product/strategy/rec-quality signal (log, don't act). A rec-quality
issue (the *pick itself*) is always **Insight → F8C (blocked)**, never a change here.

## 9. Anti-fabrication rules

- Describe only observed/code-grounded behavior; mark anything else `(simulated)` or NOT OBSERVED.
- No invented screens, copy, counts, quotes, or social proof — and flag any the product itself fabricates.
- Never call a simulated reaction real-user evidence/validation.
- Propose **no** engine/scoring/UI/schema change — outputs are hypotheses + watch-items only.

## 10. Data-freeze rule

The engine + UI are **frozen** (`2.17`) for this phase and through the real-preview window. The
simulation **changes nothing** — it only reads and reasons. (Mixing engine versions would also make
the later real baseline uninterpretable.)

## 11. Output structure

| Step | Doc | Contents |
|---|---|---|
| 5 | [full-synthetic-persona-findings-f10d.md](full-synthetic-persona-findings-f10d.md) | per-persona journey + scores + issues (×16) |
| 4 | (in the outcome matrix) | per-persona behavioral-prediction table (signed-in?/onboarded?/saved?/… + scores) |
| 6 | [synthetic-cohort-findings-f10d.md](synthetic-cohort-findings-f10d.md) | exec summary, top-10, patterns, wedge fit, risk matrix |
| 7 | [synthetic-outcome-matrix-f10d.md](synthetic-outcome-matrix-f10d.md) | simulated shown→opened/saved/skipped/trusted, by segment (clearly synthetic) |
| 8 | [synthetic-ux-backlog-f10d.md](synthetic-ux-backlog-f10d.md) | 5-bucket prioritized backlog (nothing implemented) |
| 10 | [real-preview-watch-items-from-simulation-f10d.md](real-preview-watch-items-from-simulation-f10d.md) | **the key output** — what to observe/ask/disprove in Wave 1 |

Every doc carries the header reminder: **synthetic · not real-user validation · does not unblock F8C.**
