# F4 — `/home` Redesign: Final Initiative Summary

**Status:** COMPLETE · **Route verdict:** READY FOR PRIVATE / BETA TESTING
**Span:** F4.1 → F4.9 · **Final implementation merge:** `fd5babd6` (F4.7 E2E + visual coverage)
**Companion docs:** the F4.1 product/UI/architecture audit and the F4.8 production-readiness audit (both audit-only); see also the Discover closure [`../discover/f3-summary.md`](../discover/f3-summary.md), whose pattern this follows.

This is the closure ledger for the `/home` redesign: why it was rebuilt, the final experience, the per-phase record (verified against git/GitHub), the product transformation, the final architecture, the trust / accessibility / reliability outcomes, the frozen contracts, the verification evidence, the private/beta verdict, the deferred register, and the next initiative.

---

## 1. Initiative overview

After Discover (F3) was rebuilt into one honest nightly pick, the F4.1 audit found `/home` had become **a second, louder, less-honest Discover wrapped in a magazine dashboard**:

- a mood selector + **Reshuffle** + a one-pick **"Netflix-style slider" with dots** + a **numeric match ring** — i.e. mood-driven recommendation with *more* controls and *less* honesty than Discover;
- the pick competed with its own change affordances (mood switch + reshuffle + skip + slider);
- a **fabricated "For your {mood} night"** reason that claimed a current emotion the user never supplied;
- **Mark Watched advanced optimistically** (before the write resolved) — false success;
- an **eight-section tail** (ContinueWatching [dead] + CuratedLists [browse wall] + TasteMatch + TasteTwinPulse [social feed] + CinematicDNA [Profile duplicate] + QuickLog + PageEndCard) that turned Home into a dashboard;
- **no route-level E2E** and **no authenticated visual** coverage (and live rendering was unsafe — the pick logs an impression on render).

Target doctrine: **automatic · stable · one pick · anti-scroll · taste-deep · evidence-backed · no fake certainty · no feed · no duplicate-job-with-Discover · a calm nightly ritual.**

## 2. Final experience

When you open `/home`, it is **already holding tonight's one pick** — chosen from your taste, steady enough to trust, with a clear reason — plus a quiet trail back into your film life:

1. **One Briefing pick** leads (pick-first), masthead above it.
2. **A grounded reason** ("Because you loved …" / a genuine engine reason) — or **nothing** when unsupported (never a fabricated mood line).
3. **Open Film File** (`/movie/:tmdbId`), **Mark Watched**, **Save**, **Not tonight**.
4. A **secondary "Adjust mood"** strip *below* the pick — an optional refinement, not the front door.
5. **QuickLog** — log films you've already seen to sharpen tomorrow's pick.
6. A **quiet Discover exit** — Discover is the deliberate, mood+context session for when you'd rather shape a pick than be handed one.

The internal ranked queue (daily-seeded, mood-poolable) stays an **implementation detail**: **Not tonight** and **Mark Watched** draw the next result, but there is no visible queue, count, alternative, carousel, slider, Reshuffle, or match percentage. The daily UTC seed keeps the pick stable long enough to decide; Discover remains the place to actively re-shape it.

## 3. Phase ledger (verified against git/GitHub)

| Phase | Title | Type | PR | Squash SHA | Outcome | Key frozen contract preserved |
|---|---|---|---|---|---|---|
| **F4.1** | Home product/UI/architecture audit | audit/spec | — | — | Verdict: structural redesign + simplification; the F4.2–F4.8 plan | — |
| **F4.2** | Extract Home derivation helpers + remove dead onboarding overlay | extraction | #239 | `c3dcd681` | Pure mood-order / `todaySeed` / `shuffleBySeed` / `buildBriefingQueue` → `homeDerive.js` + tests; the dead onboarding overlay removed (proven unreachable) | No engine/scoring/payload/timing change; duplicate mood mappings preserved |
| **F4.3** | Harden Home briefing actions | reliability/a11y | #240 | `341712c0` | Mark-Watched success-before-advance; Skip ordered + failure-contained; impression `.catch`; one polite live region; honest HomeData error state | Payloads/events/route + impression timing unchanged |
| **F4.4** | Make Home briefing pick-first | product/UI | #241 | `27bd4109` | Pick leads; MoodReactor demoted ("Adjust mood"); **Reshuffle / match ring / slider-dots removed**; See More → Open Film File; Skip Tonight → Not tonight | `effectiveSeed` value byte-identical; scoring/ranking/payloads unchanged |
| **F4.5** | Simplify Home supporting sections | product/UI | #242 | `120cd2e1` | Tail → QuickLog + a quieter, role-clear PageEndCard; ContinueWatching/CuratedLists/TasteMatch/TasteTwinPulse/CinematicDNA removed from render (components + data preserved) | `sections-top.jsx`/`useHomeData.jsx` untouched; routes/payloads unchanged |
| **F4.6** | Harden Home trust and accessibility | reliability/a11y | #243 | `0db9db2e` | Dropped the "For your {mood} night" fallback (→ null); MoodReactor group/aria-pressed/44px/focus + reduced-motion scroll; Briefing focus rings + aria-hidden icons + reduced-motion-instant slide; honest provider `{provider,status}`; QuickLog live region + SeenTile a11y + timers + impression `.catch` | Scores + film order byte-identical; QuickLog + impression payloads unchanged; shared `ActionButton`/`useUserMovieStatus` untouched |
| **F4.7** | Add Home E2E and visual coverage | testing/tooling | #244 | `fd5babd6` | 14 authenticated intercepted journey E2E + 8 visual states (Darwin + Linux); `installHomeFixture` + write-escape guard; visual workflow generalized to Authenticated App | **No `src/**` change; no live Home write** |
| **F4.8** | Production-readiness audit | audit/spec | — | — | Verdict: READY FOR PRIVATE/BETA; no P0/P1; F4 closes | — |

*F4.1 and F4.8 are audit-only — no PR or merge SHA. (PR numbers #226/#230/#233 etc. are unrelated to F4.)*

## 4. Product transformation

| Before (F4.1) | Final |
|---|---|
| A second, louder Discover | The automatic, stable nightly briefing |
| Mood selector as the front door | Pick-first; "Adjust mood" demoted below the pick |
| Reshuffle | Removed (one stable daily pick) |
| Visible match percentage ring | Removed (no false precision) |
| Visible slider + dots (queue leak) | One visible pick; internal queue invisible |
| Optimistic Mark Watched (false success) | Success-gated advance (mirrors Discover F3.9) |
| Fabricated "For your {mood} night" | Grounded reason — or omitted when unsupported |
| Eight-section magazine tail | QuickLog + a quiet, role-clear Discover exit |
| Browse wall + social feed + DNA duplicate on Home | Removed from render (live on /browse, /people, /profile) |
| No browser coverage | Intercepted authenticated E2E (14) + visual baselines (8 × 2 platforms) |

## 5. Final architecture

```
src/features/home/
├── Home.jsx            route orchestration — auth/data wiring, currentMood state,
│                       handlers (onWatch/onSkip/onLog), the pick-first composition,
│                       the honest HomeData-error branch
├── sections-top.jsx    MoodReactor (demoted "Adjust mood" strip) · BriefingSlide
│                       (the one pick + actions) · TheBriefing (queue/state + the
│                       live region) · useStreamingProvider ({provider,status}) ·
│                       BriefingSkeleton
├── sections-bottom.jsx QuickLog + PageEndCard (rendered) + ContinueWatching /
│                       CuratedLists / TasteMatch / TasteTwinPulse / CinematicDNA
│                       (retained, NOT rendered on Home — preserved for their
│                       proper routes / a real return)
├── useHomeData.jsx     read orchestration + cold-start profile compute + the moods
│                       shape + resolveEngineReason (null when unsupported)
├── homeDerive.js       PURE helpers — orderBriefingMoodKeys · todaySeed ·
│                       shuffleBySeed · buildBriefingQueue
├── WhyThisPick.jsx     null-safe reason panel (renders nothing when reason is null)
└── __tests__/          10 unit/component test files

e2e/
├── fixtures/home.js            deterministic Supabase/TMDB interception + write ledger
├── app/home-briefing.e2e.js    14 authenticated journey tests (app project)
├── app/home.e2e.js             the retained route/auth smoke
└── visual-auth/home.visual.js  8 authenticated visual states (visual-app project)
```

A **reducer / state-machine extraction** and a **shared Home/Discover result component** were both considered and **deliberately deferred** — the current orchestrator + sections shell is readable and well protected by 101 unit tests + 14 E2E checks; extraction now would be churn without a product benefit. Revisit only if branching complexity grows or the two routes' result UIs converge.

## 6. Trust & data-truth outcome

- **No "For your {mood} night"** — `resolveEngineReason` returns the seed reason ("Because you loved X") or a genuine non-generic engine reason verbatim, and **null** for generic/missing/unknown. Home never claims a current emotion the user didn't supply.
- **A grounded reason, or none** — `WhyThisPick` is null-safe; cold-start shows no "why" panel rather than filler.
- **No match percentage / confidence** — the ring is gone; trust rests on the reason, not a number.
- **Honest provider states** — found (chip) / empty ("Availability not found") / error ("Availability unavailable") are distinct; loading renders nothing; neither message implies the film is unavailable everywhere.
- **Honest load error** — a `role="alert"` "We couldn't load your home briefing." (no raw error, no eternal skeleton), and **no impression is logged on an errored load**.
- **Save never falsely confirms** and **Mark Watched is success-gated** — the pick never advances on a failed write; failures are retryable and announced.

## 7. Accessibility outcome

One sr-only page `<h1>`; the Briefing is a labelled region ("Tonight's briefing"); the pick title is a heading; all actions + the poster have accessible names; visible focus rings on every control; **≥44px** targets (mood pills, action buttons, Open Browse, Open Discover); the Briefing live region narrates initial / skip / mark-watched / Save / exhausted; **MoodReactor** is a labelled `role="group"` with `aria-pressed`, a non-dot-only selected state, native keyboard access, and reduced-motion-safe (`auto`) active-pill scroll; provider state text is SR-reachable; **QuickLog** tiles have action names + `aria-busy` + `aria-pressed` + a live announcement + a retryable error; PageEndCard has a heading + a clear CTA; decorative icons are `aria-hidden`; images have alt text; the framer Briefing slide is gated to instant under reduced motion; keyboard order is logical with no trap; the E2E runs **axe** clean (no serious/critical, color-contrast excluded per the existing project policy).

## 8. Frozen product contracts

Unchanged across all of F4:

- recommendation **scoring / ranking / candidate pools / exclusion rules** (the engine was frozen);
- `MOOD_META` (ids/labels/colours/order), `MOOD_BRIDGE`, `ONBOARDING_MOOD_TO_BRIEFING`, the onboarding→Home mood ordering;
- `todaySeed` · `shuffleBySeed` · `buildBriefingQueue` · `hiddenIds` · `queue[0]` as the visible pick (the `effectiveSeed` value is byte-identical — F4.4 dropped only the always-0 Reshuffle term);
- the active-pick **impression payload** (`placement: 'hero'`, `pickReasonType: 'briefing_active'`, `pickReasonLabel`) and its **on-render timing** (exposure, not action-gated);
- **QuickLog** `user_history` payload (`source: 'home_quicklog'`, `watch_duration_minutes: null`, `mood_session_id: null`) and the `quick_picks` impression payload;
- the **Save / Mark-Watched / Not-tonight** payloads + event names;
- provider lookup (CA region, US fallback, `providers[0]`, cancellation);
- the **`/movie/:tmdbId`, `/browse`, `/discover`** routes and the Home tail order;
- **no schema / RLS migration** occurred.

## 9. Test & verification evidence

**Unit / component** — Home **101** tests; full suite **962**. Coverage: derivation (`homeDerive`), seed + queue, action reliability (`HomeBriefingActions`), loading/error (`HomeDataStates`), hierarchy (`HomeBriefingHierarchy`), supporting sections (`HomeSupportingSections`), trust + a11y (`HomeTrustA11y`, `resolveEngineReason`), provider states (`HomeProviderStates`), QuickLog (`QuickLog`), `WhyThisPick`.

**Authenticated E2E** — **14** intercepted Home journey tests (`home-briefing.e2e.js`), deterministic across **3 runs**: pick-first journey · Adjust mood · Not-tonight progression · Save success/failure · Mark-Watched success/failure · QuickLog success/failure · provider found/empty/error · load-error · keyboard + reduced-motion + axe. The simple route/auth smoke (`home.e2e.js`) is retained intact.

**Visual regression** — **8** authenticated Home states (desktop 1280×720: Briefing / Adjust-mood / provider-empty / tail; mobile 390×844: fold / Adjust-mood / QuickLog / Discover-close); **8 Darwin + 8 Linux** baselines. Discover authenticated visuals (**8**) and public visuals (**2**) remain unchanged.

**Safety (F4.7 interception model)** — the dev user authenticates for real (`/auth/v1` passes through), but **100% of Home `/rest/v1/**`** is intercepted: deterministic per-table/per-query reads, recorded + locally-fulfilled writes, aborted + recorded unexpected write-capable requests (the **write-escape ledger was empty**). Backend integrity was verified read-only (impression/quicklog timestamps + watchlist/history counts unchanged) → **no live Home write occurred**.

**Mocked ≠ live production integration** — the fixtures prove the integration path + the UI contract, not live Supabase write semantics, real scoring quality, or real provider data. Those require real beta traffic, not more automated tests.

## 10. Readiness verdict

**READY FOR PRIVATE / BETA TESTING.** No P0, no P1 (every F4.1 P0/P1 is resolved — see F4.8). The **F4 implementation arc closes** with this document.

This is **not** a claim of unrestricted public-production readiness. Public launch still depends on:

- real **beta-user feedback**;
- **operational monitoring** (fallback / provider / error / write-failure frequency);
- **recommendation-quality evaluation** across cohorts;
- a **privacy / security review at launch scale**;
- **live-traffic** observation.

## 11. Deferred register (non-blocking, evidence-driven)

- **Unrendered-section data-fetch cleanup** — `useHomeData` still issues live queries (`user_similarity` ×2, taste-twin-pulse, personal-lists, taste fingerprint) that only fed the removed sections; drop those, keeping `computeUserProfile` + `getSeenCandidates` (QuickLog needs them). The clearest narrow post-beta win.
- The **5 unrendered components** in `sections-bottom.jsx` (ContinueWatching/CuratedLists/TasteMatch/TasteTwinPulse/CinematicDNA) — move or delete once surfaced on their proper routes.
- **Mood-taxonomy unification** across onboarding / Home / Discover — a future decision record, not a beta blocker (labels are clear within each route; the cross-route mapping is invisible to users).
- **Provider lookup memoization** (per-tmdbId) + **skip-write monitoring** — operational hardening.
- **Cross-route picks shared context** (Home ↔ Discover) — a post-beta product question; non-identical picks are honest (no equality promise is made).
- **Explicit `min-height: 44px`** on the QuickLog SeenTile (functionally fine via its composite height) and **un-baselined breakpoints** (360/430/768/1440) — polish.
- A **1–2 real-backend write-failure E2E** once a safe test environment exists.

None of these blocks a trusted private beta.

## 12. Closure statement

The **F4 `/home` redesign is complete** and the route is **private/beta ready**: the nightly ritual (automatic, stable, one pick-first recommendation), trust (grounded-or-no reason, no fabricated mood, no false precision, honest provider + error states), accessibility, action reliability (success-gated Mark-Watched, contained Skip, live announcements), authenticated E2E, and visual coverage have all been addressed and verified — with the engine and every write payload frozen and no live data ever touched. Further Home work should be **beta-evidence- or defect-driven**, not speculative. The next initiative is **`/movie/:id`** — the Film File, the shared destination of both Home and Discover's primary action, and the deepest trust surface remaining.
