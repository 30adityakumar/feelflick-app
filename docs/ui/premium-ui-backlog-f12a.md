# F12A — Premium UI Backlog

> **Phase F12A output (no implementation).** Prioritized, evidence-grounded polish backlog. Each item:
> evidence (**B**rowser/**M**etric/**C**ode) · severity · visual impact · risk · expected files ·
> validation · **do-not-touch**. Engine frozen `2.17`; every phase uses the authenticated-walkthrough
> parity loop. **Does not unblock F8C.**

**Date:** 2026-06-04.

---

## Bucket 1 — F12B · Highest-impact visible polish

### B1. Shared page-container system (max-width + responsive gutters)
- **Component:** page shells, all routes. **Evidence (M):** `<main>` `maxW:none` every route; gutters
  re-implemented per-section; wide-screen (1440) drift. **Severity:** P1. **Visual impact:** high
  (fixes "content doesn't sit well across devices / cards feel inconsistent"). **Risk:** low (additive
  primitive; proof-migrate one route). **Expected files:** new `src/shared/ui/PageContainer.jsx`
  (+ container tokens in `tokens.js`), one route shell as proof, tests, docs. **Validation:**
  lint/test/build + authed before/after parity on the proof route + CI Visual Regression.
  **Do-not-touch:** don't change section content; don't break `/`,`/about` baselines.

### B2. Typography scale tokens + mid-tier heading normalization
- **Component:** headings, all routes. **Evidence (M):** h1 36→102px, no shared scale. **Severity:** P2.
  **Impact:** high ("some content too big/small"). **Risk:** low-med (additive tokens; **exclude heroes**
  discover 102 / landing 90 — intentional). **Files:** `tokens.js` (type scale), 1–2 mid-tier surfaces
  as proof, docs. **Validation:** authed parity + Visual Regression. **Do-not-touch:** hero headlines;
  the `.ff-d1/.ff-d2` landing classes; `/about` baseline (re-baseline deliberately if touched).

### B3. Add `<h1>` to home, browse, history, account
- **Component:** route mastheads. **Evidence (M):** `h1count:0` on all four. **Severity:** P1 (a11y +
  landmark + hierarchy). **Impact:** med (mostly a11y; can be visually-hidden where a visible title
  doesn't fit). **Risk:** low. **Files:** the four route entry/masthead components. **Validation:** lint
  (jsx-a11y) + axe in CI + authed spot-check. **Do-not-touch:** copy/behavior; keep visual identical
  (use `sr-only` if needed).

> **F12B = B1 + B2 + B3** (see `f12b-premium-polish-plan.md`). 3 targets, all additive/low-risk.

## Bucket 2 — F12C · Mobile-first refinement

### C1. 44px touch-target floor (the biggest mobile issue)
- **Evidence (M):** sub-44px interactive targets @390 — **browse 74, history 76, account 20**, movie 11,
  watchlist 11, onboarding 14, home 9. **Severity:** P1 (WCAG 2.5.5 / Apple HIG). **Impact:** high
  ("mobile friendliness not strong enough"). **Risk:** med (touches many small controls — expand
  hit-area via padding, keep visual size). **Files:** chips/pills/nav/poster-action primitives + CSS.
  **Validation:** re-run the F12A tap-target metric (target: 0 critical < 44 on nav/CTAs) + authed mobile
  screenshots. **Do-not-touch:** the MovieCard hover LAW; poster visual scale.

### C2. Home Briefing mobile-fold / loading composition
- **Evidence (B):** `home-390` skeleton dominates the fold. **Severity:** P2. **Impact:** med-high (first
  impression). **Risk:** low. **Files:** home skeleton/masthead. **Validation:** authed mobile capture
  (loaded + loading). **Do-not-touch:** no spinners (skeletons only); engine/data flow.

### C3. List density (history/browse/watchlist) mobile rhythm
- **Evidence (M/B):** history 125 controls @390; browse/watchlist dense. **Severity:** P2. **Risk:** med.
  **Files:** the list/card components. **Validation:** authed mobile captures. **Do-not-touch:** data.

### C4. BottomNav + input min-heights on mobile
- **Evidence (M/C):** nav items + label-less inputs < 44px. **Severity:** P2 + a11y. **Files:** BottomNav,
  `<Input>` callers (labels). **Validation:** axe + tap metric.

## Bucket 3 — F12D · Button / CTA system pass
### D1. Button size/min-height scale + secondary/ghost discipline
- **Evidence (M):** btnHmin 17px (6px outliers); secondary treatments vary; discover is the model.
  **Severity:** P1 (the user's "button selection not polished"). **Impact:** high. **Risk:** **med-high
  — `<Button>` renders on `/` + `/about` visual-baseline routes → REQUIRES a deliberate re-baseline.**
  **Files:** `src/shared/ui/Button.jsx` (size tokens), call-site audit, **re-baselined** `about.visual`
  snapshots. **Validation:** full authed sweep + intentional Visual Regression re-baseline.
  **Do-not-touch:** the gradient brand identity; one-primary-per-view rule.

## Bucket 4 — F12E · Card / poster system pass
### E1. Card proportion + padding rhythm; poster aspect consistency
- **Evidence (M/B):** trust vs list vs poster cards differ; partial Card/AccentPanel adoption.
  **Severity:** P2. **Risk:** med. **Files:** Card consumers, poster/MovieCard, a card-padding token.
  **Validation:** authed parity per migrated surface. **Do-not-touch:** the hover LAW; trust-panel parity.

## Bucket 5 — F12F · Motion / micro-interactions
### F1. Reduced-motion-safe micro-interactions (hover/press/transition consistency)
- **Evidence (C / F11A A1):** reduced-motion gaps on movie/profile/watchlist/history/account; press/hover
  feedback inconsistent. **Severity:** P3. **Impact:** med (the "smooth/premium" feel). **Risk:** med.
  **Files:** shared transition tokens + per-surface `prefers-reduced-motion` gating. **Validation:**
  reduced-motion emulation in Playwright. **Do-not-touch:** the hover LAW timings; no scroll-jacking.

## Bucket 6 — Defer until real-user signal
- **Onboarding flow polish** — needs a fresh user (not observable with the onboarded dev user). Defer
  to a dedicated onboarding pass with a throwaway account.
- **DnaConfidence → AccentPanel** — it's a structural section, not a panel; **leave as-is** unless a
  tester finding justifies it.
- **Legal page (privacy/terms) premiumization** — low ROI; defer.
- **Eyebrow rollout** (`stash@{0}`) — finish only if a surface needs it.
- **Per-vibe anything / feed / autoplay** — ❌ never (betrays the wedge).

---

## Priority order (do this, in this order)
1. **F12B** (container + type scale + h1) — biggest cross-device lift, lowest risk.
2. **F12C** (44px touch floor + mobile fold) — biggest mobile lift.
3. **F12D** (button system) — high impact but needs the `/about` re-baseline; isolate it.
4. **F12E** (cards/posters) → **F12F** (motion) — final polish.
5. **In parallel / higher product priority:** ship the **F10B Wave-1 invites** — real-user signal
   re-orders this backlog and is the only path to unblocking F8C.
