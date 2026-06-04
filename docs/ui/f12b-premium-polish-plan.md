# F12B — Premium Polish Plan (first implementation phase)

> **Proposed next phase after the F12A audit.** The **highest-impact, lowest-risk** visible polish —
> additive primitives + tokens + a per-route proof migration, using the authenticated parity loop.
> Engine frozen `2.17`. Not started in F12A. **Does not unblock F8C.**

**Date:** 2026-06-04. **Status:** proposed (F12A is audit-only).

---

## Why these three

The F12A evidence says the **primitives are good**; the gap is **system-level composition**. The three
cheapest, highest-leverage, lowest-risk fixes — none requiring a redesign or a `<Button>`/`/about`
re-baseline — are:

### Target 1 — `<PageContainer>` primitive (container + responsive gutters)
- **Problem (M):** `<main>` `maxW:none` on every route; gutters re-implemented per-section; wide-screen
  (1440) drift; cross-route inconsistency. **The #1 "content doesn't sit well across devices" cause.**
- **Approach:** add `src/shared/ui/PageContainer.jsx` + container tokens in `tokens.js`
  (`CONTAINER = { maxW: {...}, gutter: {sm,md,lg} }` derived from existing `SPACE`). **Additive.**
  **Proof-migrate ONE route** (recommend `/account` or `/watchlist` — utility, not a visual baseline) and
  verify byte-reasonable parity; defer broad rollout to F12B.x.
- **Files:** `PageContainer.jsx` (+ `.css` if needed), `tokens.js`, one route shell, `PageContainer.test.jsx`, docs.
- **Risk:** low (additive; one proof route). **Validation:** lint/test/build + authed before/after on the
  proof route at 390/768/1280/1440 + CI Visual Regression (no `/`,`/about` change).

### Target 2 — Typography scale tokens + mid-tier heading normalization
- **Problem (M):** h1 36→102px, no shared scale → "some content too big/small."
- **Approach:** add a `TYPE` scale to `tokens.js` (display/h1/h2/h3/body steps with clamp ranges).
  Normalize **mid-tier** headings only (e.g. account/watchlist/history section titles). **Exclude heroes**
  (discover 102, landing 90, movie/profile titles) — they're intentional.
- **Files:** `tokens.js`, 1–2 mid-tier surfaces as proof, docs. **Risk:** low-med (additive tokens).
  **Validation:** authed parity + Visual Regression. **Guardrail:** do not touch hero `.ff-d1/.ff-d2`.

### Target 3 — Add `<h1>` to home, browse, history, account
- **Problem (M):** `h1count:0` on all four (a11y landmark + hierarchy).
- **Approach:** add a semantic `<h1>` to each masthead — visible where it fits the editorial title,
  `sr-only` where a visible heading would change the design. **Zero intended visual change.**
- **Files:** the four route entry/masthead components. **Risk:** low. **Validation:** `lint` (jsx-a11y) +
  `@axe-core/playwright` CI + authed spot-check that layout is unchanged.

## Explicitly NOT in F12B (deferred)
- ❌ **Button size system** → **F12D** (it re-baselines `/` + `/about` — isolate it).
- ❌ **44px touch-target sweep** → **F12C** (bigger surface area; mobile-first phase).
- ❌ **Card/poster proportions** → **F12E**. **Motion** → **F12F**.
- ❌ **DnaConfidence**, onboarding flow, legal pages — deferred per the backlog.

## Scope discipline
**3 targets, all additive + one-route-proof.** If any proof migration can't preserve parity, ship only
the primitive/tokens (documented) and defer the migration — exactly the F11B pattern.

## Validation plan (F12B)
`lint → test → build → npm audit` + new primitive/token tests + **authenticated before/after captures**
on the proof routes across 390/768/1280/1440 + CI Visual Regression (public baselines untouched).

## Do-not-touch (F12B)
Engine/schema/auth/routes/packages · the `<Button>` render · the `/` and `/about` visual baselines · the
honesty layer · the MovieCard hover LAW · recommendation/data flow.
