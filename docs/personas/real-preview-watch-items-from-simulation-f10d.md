# F10D — Real-Preview Watch Items (from the synthetic simulation)

> **The most important F10D output.** It converts the **synthetic** cohort hypotheses into concrete
> things to **observe, ask, and measure in the real Wave-1 preview** — with explicit confirm/disprove
> criteria. **Synthetic findings are not validation;** this doc is how we *get* validation. Pairs with
> the [Wave-1 runbook](private-preview-wave-1-f10b.md), [feedback template](private-preview-feedback-template-f10a.md),
> and [outcome-baseline plan](outcome-baseline-collection-f10a.md). **Does not unblock F8C.**

**Status:** ✅ watch-items defined. **Date:** 2026-06-04. **Engine:** frozen `2.17`.

---

## How to use

For each watch item: **observe** (per-tester smoke), **ask** (feedback form), **measure** (SQL §7,
windowed). A finding is **confirmed** or **disproved** by the stated criteria — *real users decide*,
not the synthetic cohort. Log results back against the [F10D backlog](synthetic-ux-backlog-f10d.md) IDs.

---

## W1 — Cold first pick has no "Why this pick" (backlog D-1, top priority)

- **Synthetic claim:** a brand-new user's first Briefing pick renders no reason (`WhyThisPick` null-safe) → may read as unjustified when trust is lowest.
- **Observe (Wave 1):** for each **cold** tester, on `/home` night 1 — is a "Why this pick" present or absent? Note their reaction.
- **Ask:** *"Did your first pick come with a reason? Did its absence feel honest, or did the pick feel like a guess?"* (add to the feedback form for new testers).
- **Measure:** §4 reason-coverage on the cold cohort's impressions (windowed) — % with a `pick_reason_type`.
- **Confirmed if:** cold testers say the no-reason pick felt unjustified/guessy.
- **Disproved if:** they read the honesty as fine and trusted the pick anyway.
- **Then:** if confirmed → queue D-6 (honest cold-state line) for a *future* UI phase. **Do not** fabricate a reason now.

## W2 — Cold-start can't represent deep taste (D-2)

- **Synthetic claim:** 4-step onboarding + no import underrepresents users with deep external taste → night-1 "taste-deep" feels thin.
- **Observe:** watch a **warm-by-history** tester (e.g. a Letterboxd user) onboard cold; note frustration.
- **Ask:** *"Did night 1 feel like it knew your taste? Did you wish you could import your history?"*
- **Measure:** cold/warm tier split (§6) + first-night save/skip rates by tier.
- **Confirmed if:** multiple power testers call the cold start a dealbreaker / abandon early.
- **Disproved if:** the first pick lands well enough that the thin start doesn't matter.
- **Then:** if confirmed → D-8 (copy nudge) first; D-15 (real import) only if it's a *widespread* blocker. Not now.

## W3 — `/home` supporting tail re-introduces scrolling (D-3, anti-drift)

- **Synthetic claim:** the carousels below the Briefing ("Pick up where you paused.", "What your twins are watching.", "Your taste, taking shape.") could pull users back into scrolling.
- **Observe:** in the per-tester smoke, does the tester treat the **Briefing as the answer**, or scroll the tail looking for more? (especially casual personas).
- **Ask:** *"After your pick, did you stop — or did you keep scrolling for other options?"*
- **Measure:** carousel-placement impression/skip volume vs hero (§7a by placement).
- **Confirmed if:** users routinely scroll past the Briefing into the tail to choose.
- **Disproved if:** the Briefing is where the decision happens; the tail is glanced at, not shopped.
- **Then:** if confirmed → a gated IA tweak to keep the Briefing primary. **Do not** restructure `/home` pre-emptively.

## W4 — Sign-in + 4-step onboarding gate value (D-4, D-7)

- **Synthetic claim:** value is gated behind Google sign-in + a 4-step onboarding (landing says "three short questions") → impatient drop-off + a copy mismatch.
- **Observe:** where do testers hesitate/abandon between landing → sign-in → onboarding → first pick?
- **Ask:** *"Was anything about signing in or onboarding more than you expected?"*
- **Measure:** the funnel — invites → signed-in → onboarded → first impression (mood_sessions / first impression timestamps).
- **Confirmed if:** a meaningful share stalls at sign-in or mid-onboarding.
- **Disproved if:** testers move through smoothly.
- **Then:** D-7 (cheap copy fix: align "three short questions" with the real flow) is low-risk; D-11 (reduce time-to-first-pick) only after the funnel data. Don't gut the taste-seed.

## W5 — Does the real pick actually fit? (D-5 — the core unknown; F8C-gated)

- **Synthetic claim:** NOT OBSERVED — the served pick's fit is the thing that decides everything and can't be simulated.
- **Observe:** the tester's genuine reaction to their *real* Tonight pick (delight / indifference / "not for me").
- **Ask:** the feedback form's "did the pick feel relevant / did the why help" + "what would the right pick have been."
- **Measure:** §7 capture — shown→watched/saved/skipped, by cold/warm, windowed; reason-type → outcome.
- **Confirmed-good if:** real watch/save materially above the F8A ~2% baseline + positive qualitative fit.
- **Confirmed-problem if:** high skip with "wrong for me" feedback.
- **Then:** this is **F8C input, not an F8C action.** Capture it; tuning stays blocked until the [volume gate](private-preview-plan-f10a.md#6-data-volume--duration-before-f8c) is green and DB-first analysis runs. **Never hand-tune from anecdote.**

## W6 — Warm user: does it compound + never repeat? (D-12)

- **Synthetic claim:** the warmed-up persona's payoff is compounding personalization + no déjà-vu picks.
- **Observe:** over multiple nights for a warm tester — does the pick visibly use their depth? Does the hero ever repeat?
- **Ask:** *"Does it feel like it knows you better than day 1? Have you seen the same pick twice?"*
- **Measure:** §2 repeated-pick fatigue (hero distinctRatio / consecutive repeats) for that user.
- **Confirmed-good if:** distinctRatio high, no repeats, "knows me better" feedback.
- **Confirmed-problem if:** repeats appear or DNA feels stale.
- **Then:** repeated-pick is **rec-quality → F8C-gated**; measure, don't tune now.

## W7 — Honesty layer: strength or weakness with real users? (protect D-20…D-24)

- **Synthetic claim:** the no-fabrication stack (null-safe why, "not real reviews", "not a score of you") is the top trust-builder.
- **Observe / ask:** *"Did anything feel fake or overconfident? Did the honest framing (e.g. 'not real reviews', 'still learning') build or reduce your trust?"*
- **Confirmed if:** testers cite the honesty as a reason they trusted it.
- **Disproved if:** the honesty reads as the product being unsure/weak.
- **Then:** **protect regardless** — but if real users read it as weakness, that's a *framing* refinement (copy), never a return to fabrication.

---

## What must stay FROZEN during the preview

- ❌ No scoring/ranking/threshold/`ENGINE_VERSION` change (no F8C).
- ❌ No schema/RLS/migration/Edge/OpenAI-prompt change.
- ❌ No product-UI/auth/route/package change.
- ✅ Only scoped P0/P1 **bug** fixes (non-engine), docs, and tracker/runbook updates.
- **Why:** mixing engine versions or changing the UI mid-window makes the real baseline uninterpretable and corrupts the W5/W6 measurements.

## What must NOT be acted on yet (even though the cohort "found" them)

- D-6 cold-state "why" microcopy → wait for **W1**.
- D-8/D-15 re-seed nudge / import → wait for **W2**.
- D-3 `/home` tail changes → wait for **W3**.
- D-11 onboarding/time-to-pick redesign → wait for **W4** funnel data.
- Any scoring change → **F8C, blocked** (W5/W6 are measurements, not mandates).

## Confirm/disprove scorecard (fill during Wave 1)

```
W1 cold no-why            confirmed / disproved / mixed   evidence: …
W2 cold-start re-seeding   confirmed / disproved / mixed   evidence: …
W3 /home tail re-scroll    confirmed / disproved / mixed   evidence: …
W4 sign-in/onboarding gate confirmed / disproved / mixed   evidence: …
W5 real pick fit           good / problem / insufficient-data   evidence: …
W6 warm compounding/no-repeat good / problem / n/a          evidence: …
W7 honesty = strength?     yes / no / mixed                evidence: …
```

> When this scorecard is filled with **real** testers, it — not the synthetic cohort — drives the next
> UX phase and the F8C go/no-go.
