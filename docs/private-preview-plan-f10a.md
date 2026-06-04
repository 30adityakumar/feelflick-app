# F10A — Private Preview Plan + Decision Criteria

> **Phase F10A. Private-preview operations + measurement readiness — NOT tuning,
> NOT product expansion, NOT public launch.** This doc defines the scope of a small,
> controlled private preview and the criteria that decide what happens after it. It
> ships no runtime change. The companion docs are the
> [tester guide](private-preview-tester-guide-f10a.md),
> [launch runbook](private-preview-launch-runbook-f10a.md),
> [feedback template](private-preview-feedback-template-f10a.md), and
> [outcome-baseline collection plan](outcome-baseline-collection-f10a.md).

**Status:** ✅ plan defined; preview not yet started (awaiting invites). **Date:** 2026-06-04.

The wedge under test: *mood-first, taste-deep — a single justified nightly pick that
makes its case. Anti-scroll.* The preview asks one question above all others: **does
the single nightly pick land, fit, and earn trust for real people who actually watch
films?** Everything else is secondary.

---

## 1. Why a private preview (not a launch)

Production is hardened (live on `app.feelflick.com`, error monitoring + security
headers live, CI gates real), and outcome capture is **mechanically proven in prod**
(F9C) — but the only data we have is **dev/test volume (8 users)**. We cannot tune the
engine (F8C) or claim "the right film" until real people generate a non-trivial,
stable outcome baseline. A private preview is the smallest safe way to get that, while
collecting honest qualitative trust signal — without the blast radius of a public
launch.

This is explicitly **not** a public launch: no marketing, no launch claims, no scale
push, no press. Invite-only, small, observed.

## 2. Tester cohort

| Dimension | Target |
|---|---|
| **Size** | **5–10** trusted testers. Start with a **first wave of 5–7**; add the rest only after the first wave is stable. |
| **Who** | People who **actually watch films** and decide what to watch most nights — the patient, not the scrollers. Friends/peers who will give candid feedback. |
| **Taste-depth mix** | A mix of **cold-start** (brand-new accounts, <5 films logged) and **warm-start** (will log/rate ≥20 films) testers, so we see the cold→warm trust jump (the hardest moment). Aim ~half and half. |
| **Devices** | A mix of desktop + mobile browsers (the app is responsive; mobile is the likely real context). |
| **Avoid (this round)** | Broad public, strangers, anyone who'd share publicly, or anyone who only wants feature-checklists rather than the nightly ritual. |

**Invite order:** start with 2–3 warm cinephiles you trust (fast, rich signal), then
add 2–3 cold-start testers (the trust-critical cohort), then top up toward 10 if the
first wave is healthy. The [runbook](private-preview-launch-runbook-f10a.md) owns the
exact invite sequence + per-tester smoke.

## 3. Feedback that's useful now

Collected via the [feedback template](private-preview-feedback-template-f10a.md).
Focus on the wedge:

- Did **tonight's pick feel relevant** to their mood + taste?
- Did the **"Why this pick"** reason help them trust it (or feel generic/overconfident)?
- Did they **save / open / skip / watch** it — and why?
- Did the **Film File** make the pick feel more trustworthy?
- Did **Cinematic DNA** feel honest, or generic/fabricated?
- Where did they get **confused**?
- Would they **come back tomorrow**? What would make them?

## 4. What NOT to ask testers yet

To keep the preview focused on the wedge (and avoid drift), do **not** solicit:

- **Pricing / willingness-to-pay** — premature; not a monetization test.
- **Feature requests for parked/expansion surfaces** (challenges, feed, social/community,
  TV/series) — out of scope; would pull us toward someone else's product.
- **Public-launch readiness / virality / growth** — not this round.
- **Head-to-head feature comparisons** vs Netflix/Letterboxd/etc. — we win by being the
  best at the one thing they don't do, not by matching checklists.
- **Deep engine/algorithm opinions** ("make it recommend X") — we tune from *data* (F8C,
  DB-first), not from anecdote. Capture the outcome; don't crowdsource the scoring.

If a tester volunteers any of the above, log it under **product insight** (don't act on
it this phase) — see the runbook's issue taxonomy.

## 5. Preview success criteria

The preview **succeeds** when all of these hold:

1. **Capture works at real-user volume.** Post-deploy outcome capture (impressions →
   clicked/saved/watched/skipped) is non-zero and meaningfully above the F8A baseline
   (~2% any-outcome) across real testers — per the
   [outcome-baseline plan](outcome-baseline-collection-f10a.md).
2. **The pick earns trust more often than not.** Across testers, the Tonight pick is
   judged relevant and the "why" judged helpful **more often than not** (qualitative,
   from the feedback template) — and skip-with-frustration is the exception, not the norm.
3. **Honesty holds.** No tester reports the product feeling **fake, fabricated, or
   overconfident** (DNA, reasons, Film File) — the trust moat is intact.
4. **No unresolved P0/P1.** No open launch-blocking or preview-breaking issue (see §7).
5. **Volume gate for F8C is met** (§6) — enough stable data to unblock tuning DB-first.

## 6. Data volume + duration before F8C

F8C (engine tuning) stays **BLOCKED** until the outcome baseline is **non-trivial and
stable across real users**. Concrete gate (refines F9C's "≥ a few hundred impressions
across multiple real users with a stable `algorithm_version`"):

| Gate | Target |
|---|---|
| **Distinct real users with outcomes** | **≥ 5** (preview cohort), not the dev test user |
| **Impressions on the measured surfaces** | **≥ a few hundred** hero + discover impressions (order ~300–500+), on a **single stable `algorithm_version`** (today `2.17`) |
| **Outcome-capture rate** | Materially above the F8A ~2% any-outcome — i.e. hero any-outcome in the same ballpark as Discover already shows (~15–25%), not near-zero |
| **Stability** | The above **holds for ≥ 3 consecutive days** (not a single-session spike) |
| **Segmentable** | Enough rows to slice by **placement · algorithm_version · cold/warm tier** without single-digit cells dominating |

**Duration:** plan for a **minimum 7-day** collection window, **target ~2 weeks**, and
in all cases **run until the volume gate is met**, whichever is later. Do not start F8C
on partial data — a noisy baseline produces worse tuning than no tuning.

## 7. What counts as a blocker (issue severity)

The [runbook](private-preview-launch-runbook-f10a.md) owns triage; the bar:

- **P0 (pause the preview):** app down / won't load; auth broken (can't sign in /
  onboard); data loss or a privacy/security leak; Sentry shows a crash loop or a
  PII-exposing error; any **fabricated content** shipped to a user (fake reviews,
  fake social proof, overconfident false claims) — a direct wedge violation.
- **P1 (fix before widening the cohort):** a core wedge surface is broken or seriously
  confusing for most testers (Tonight pick won't render, "why" missing, Film File
  broken, save/skip/watch not working); repeated "this feels generic/fake."
- **P2 (polish, fix post-preview):** cosmetic, copy, minor a11y, single-tester edge cases.
- **product insight / recommendation-quality signal:** captured, not acted on this phase.

## 8. What we do NOT change during the preview

Hold the product **stable** so the baseline is interpretable (mixing engine versions
makes the data unsafe to compare — we already have 9 `algorithm_version` labels in
history):

- ❌ No recommendation scoring / ranking / threshold / `ENGINE_VERSION` change (no F8C).
- ❌ No schema / RLS / migration / Edge Function / OpenAI-prompt change.
- ❌ No product UI redesign, no auth redesign, no new surfaces.
- ❌ No package/dependency changes.
- ✅ Allowed mid-preview: P0/P1 **bug fixes** (clearly scoped, non-engine), docs, and
  measurement/runbook updates. A real P0 always overrides "hold stable."

## 9. After the preview — decision criteria

At the end of the window, classify into exactly one path:

| Outcome | Condition | Next |
|---|---|---|
| **Proceed to F8C** | Volume gate (§6) met + capture stable + no open P0/P1 | Unblock F8C: tune **DB-first** (`recommendation-engine` skill), leading with pool/coverage numbers + expected skip/watch effect. |
| **Extend the preview** | Trust signal positive but volume gate not yet met | Keep collecting; optionally add testers; re-check in a few days. |
| **Fix-and-re-baseline** | A P0/P1 or a capture defect corrupted the data | Fix (scoped, non-engine), reset the `[WINDOW]`, recollect. |
| **Rework before widening** | Testers report the pick/why/DNA as untrustworthy or generic | Treat as a trust problem (honesty/explanation), *not* a scoring problem yet; address in a gated phase, then re-preview. |

F8C is **never** entered on vibes — only when §6's measured gate is green.

## 10. Non-scope (F10A)

No tuning, no product expansion, no public launch, no schema/RLS/Edge/prompt/package/UI/
auth change. F10A creates the **plan + instructions + measurement runbook** and records a
**pre-preview dev baseline**; the preview itself (invites, daily monitoring, the real
baseline) runs against this doc set. `stash@{0}` (parked Eyebrow WIP) untouched.
