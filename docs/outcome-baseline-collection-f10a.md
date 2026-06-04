# F10A — Outcome Baseline Collection Plan

> **The measurement spine of the private preview.** How to collect, segment, and
> interpret the real-user outcome baseline that gates **F8C** (engine tuning). This doc
> wraps the read-only SQL in
> [`docs/sql/recommendation-evaluation-queries.sql`](sql/recommendation-evaluation-queries.sql)
> (§7 = the F8B capture-verification block) and the offline harness in
> [`scripts/eval/run-recommendation-eval.mjs`](../scripts/eval/run-recommendation-eval.mjs).
> **Everything here is read-only.** No scoring/schema/RLS/Edge change — collecting a
> baseline must never alter what it measures.

**Status:** ✅ plan ready; **pre-preview dev baseline recorded** (§6). Real-user baseline
collection **starts at the first preview invite.** **Date:** 2026-06-04. **Engine frozen
at `algorithm_version = 2.17` for the preview.**

---

## 1. Why this exists

F8A found outcome capture was effectively broken (~0.5% watch capture); F8B repaired the
write paths; F9C proved the repair **works in production**. But "works" ≠ "enough data."
We still only have **dev/test volume (8 users)**. F8C tuning is **blind** until real users
generate a **non-trivial, stable** outcome baseline. This plan turns the preview into that
baseline.

The binding metric is **`outcomeCaptureRate`** (impressions with any outcome ÷
impressions). If it's near-zero, every other fit metric is unmeasurable — *you cannot tune
toward an outcome you never record.*

## 2. The exact queries to run

All in `docs/sql/recommendation-evaluation-queries.sql` (every statement is a `SELECT`):

| Block | What it answers | Run when |
|---|---|---|
| **§0 Data inventory** | How much signal exists, per table + per user + date span | First (every collection pass) |
| **§7a Capture by placement** | shown → clicked/saved/watched/skipped/any, per surface | Every pass (the headline) |
| **§7b Conversion funnel** | clicked → saved / watched | Every pass |
| **§7c Attributed-vs-generic** | orphan (un-attributed) save/watch share | Every pass |
| **§1 Fit quality** | global outcome rates (windowed) | Every pass |
| **§4 Reason coverage (4a/4b)** | generic-reason share, grounded share | Weekly |
| **§2 Repeated-pick fatigue** | hero déjà-vu (distinctRatio, consecutive repeats) | Weekly |
| **§5b Engine-version churn** | confirm one stable `algorithm_version` | Every pass (slice-safety) |
| **§6 Cold vs warm** | tier the cohort (cold <5 / warming 5–19 / warm 20+) | Weekly |

**Always add the post-preview `[WINDOW]`** (uncomment `WHERE shown_at >= DATE '<preview-start>'`)
so the pre-preview dev backlog doesn't dilute real-user numbers.

Offline harness (no DB) — run anytime to regenerate the fixture worked-example and prove
the metric code still discriminates:

```bash
node scripts/eval/run-recommendation-eval.mjs   # writes docs/eval/recommendation-eval-baseline.{json,md}
```

## 3. When to run

- **T0 — pre-invite:** capture the starting inventory (done — §6) so new volume is measurable.
- **During the preview:** every **2–3 days**, windowed to the preview start. Watch the
  trend, not a single snapshot.
- **Weekly:** the fuller slice (reason coverage, fatigue, cold/warm).
- **At the exit gate:** the full §7 + §0 + §5b + §6, windowed, to make the F8C go/no-go call.

## 4. How to segment (never read a global average)

Averaging across segments hides the cold-start trust problem and mixes incomparable engine
versions. Always slice by:

| Segment | Why | Source |
|---|---|---|
| **placement** | hero (the wedge) vs discover vs carousels behave very differently; carousels barely capture by design | `recommendation_impressions.placement` |
| **algorithm_version** | mixing versions makes longitudinal comparison unsafe (9 historical labels exist) — restrict to `2.17` | `.algorithm_version` |
| **cold / warm tier** | the cold→warm jump is where trust is won/lost; cold (<5), warming (5–19), warm (20+) | `user_history` count per user |
| **authenticated / new user** | new (preview) accounts vs the dev test user — exclude dev rows from the real baseline | user id / window |
| **mood session** | does a stated mood correlate with a different outcome? | `mood_sessions` ⨝ window |

## 5. Metrics to watch (+ healthy direction)

| Metric | Definition | Healthy | Caveat |
|---|---|---|---|
| **shown → clicked** | `clicked / impressions` | ↑ | low is OK if save/watch is high |
| **shown → saved** | `added_to_watchlist / impressions` | ↑ | intent signal |
| **shown → watched** | `marked_watched / impressions` | ↑ | watch ≠ enjoyment (need a rating to close that) |
| **clicked → saved / watched** | conversion of an opened pick | ↑ | trust-relevant conversion |
| **skip rate** | `skipped / impressions` | **non-zero is HEALTHY** | skip is a deliberate engine signal, not failure |
| **repeated-pick rate** | hero consecutive-repeat rate / distinctRatio | repeats ↓, distinctRatio ↑ | a re-surfaced *strong* pick isn't always fatigue |
| **generic-reason rate** | `pick_reason_type` ∈ {null,generic,default,fallback} share | ↓ | dev data is already excellent here (~0.03%) |
| **orphan-interaction rate** | save/watch rows with **no** attributed in-window impression | ↓ for *rec-surface* actions | direct/historical actions are legitimately orphan |
| **outcomeCaptureRate** | any-outcome / impressions | **the gate** — materially > F8A ~2% | near-zero ⇒ nothing else is measurable |

## 6. Pre-preview dev baseline (read-only, 2026-06-04 — NOT real-user stable)

> ⚠️ **Dev/test data — 8 users, no real preview traffic yet. A wiring check, not a product
> verdict.** Recorded so preview volume can be measured *against* it. The numbers confirm
> the F8B capture mechanism works where users acted (hero + discover) and is ~0 on
> carousels (expected). **This does NOT unblock F8C.**

**§0 inventory:**

| Table | rows | users | window |
|---|---|---|---|
| recommendation_impressions | 3,376 | 8 | 2026-04-04 → 06-04 |
| recommendation_events (legacy/dead) | 1,657 | 2 | 2026-04-08 → 05-14 |
| mood_sessions | 108 | 3 | 2026-04-08 → 05-14 |
| user_history | 106 | 8 | — |
| user_ratings | 59 | 8 | — |
| user_movie_feedback | 11 | 2 | — |

**§7a capture by placement (all-time):**

| placement | impressions | %clicked | %saved | %watched | %skipped | %any |
|---|---|---|---|---|---|---|
| hidden_gems | 633 | 0 | 0 | 0 | 0 | 0 |
| because_you_loved | 533 | 0 | 0 | 0 | 0 | 0 |
| **hero** | 521 | 0.19 | 0.38 | 0.00 | 3.45 | **3.84** |
| quick_picks | 470 | 0 | 0 | 0 | 0 | 0 |
| trending | 463 | 0 | 0 | 0 | 0 | 0 |
| favorite_genres | 404 | 0 | 0 | 0 | 0 | 0 |
| **discover** | 268 | 0.75 | 1.87 | 5.60 | 17.54 | **23.88** |
| director_spotlight | 47 | 0 | 0 | 0 | 0 | 0 |
| slow_contemplative | 20 | 0 | 0 | 0 | 0 | 0 |
| quick_watches | 17 | 0 | 0 | 0 | 0 | 0 |

**§7b funnel (all-time):** 3 clicked · 65 skipped · 7 saved · 15 watched · clicked→saved 2 · clicked→watched 1.
**§7c orphan:** saved 19 rows → 6 attributed / 13 orphan; watched 106 rows → 16 attributed / 90 orphan (historical/direct — expected pre-F8B).
**§5b version churn:** current `2.17` (1,031 impressions) + 8 historical labels — **slice to `2.17`.**
**§6 cold/warm:** warming 6 users, warm 2, **no logged cold cohort yet** (preview cold-start testers fill this).
**Offline harness:** `node scripts/eval/run-recommendation-eval.mjs` → exit 0 (fixture worked-example; synthetic, discriminates across all metrics + all four rubric verdicts).

## 7. What counts as "capture is working"

(Already true mechanically — confirmed F9C + §6.) Capture is **working** when, in the
preview `[WINDOW]`:

- hero + discover impressions show **non-zero** clicked/saved/watched/skipped (not just the dev rows), and
- new rec-surface saves/watches are **attributed** (low orphan share for in-window actions), and
- outcome flags are idempotent (no double-counting — booleans).

This is a *yes/no wiring* check, not the volume gate.

## 8. What counts as "enough data for F8C"

F8C unblocks only when **all** hold (mirrors the [plan §6 gate](private-preview-plan-f10a.md#6-data-volume--duration-before-f8c)):

1. **≥ 5 distinct real users** with recorded outcomes (excluding the dev test user).
2. **≥ a few hundred** hero + discover impressions (~300–500+) on a **single stable
   `algorithm_version` (`2.17`)**.
3. **`outcomeCaptureRate` materially above F8A's ~2%** — hero any-outcome in the same
   ballpark Discover already shows (~15–25%), not near-zero.
4. **Stable for ≥ 3 consecutive days** (not a one-session spike).
5. **Segmentable** by placement · version · cold/warm without single-digit cells dominating.

When green: hand off to F8C, which tunes **DB-first** (`recommendation-engine` skill) —
leading with the pool/coverage numbers, then the change, then the expected measurable
effect on skip/watch.

## 9. Why F8C stays blocked until then

Tuning scoring against a near-zero or unstable outcome signal is **flying blind** — it
optimizes noise and can quietly degrade the wedge (the engine's anti-recency/decay/
anti-bubble are *intentional*; "fixing" them toward whatever the dev rows show would
betray the product). Mixing 9 `algorithm_version`s makes any before/after unsafe. So: no
F8C until §8 is measurably green. Capture is proven; **volume and stability are not there
yet** → **F8C remains BLOCKED.**

## 10. Non-scope

Read-only measurement only. No scoring/ranking/threshold/`ENGINE_VERSION`/schema/RLS/
migration/Edge/prompt/UI/package change. Collecting the baseline does not modify the
engine or the data shape (outcome capture only flips existing boolean flags).
