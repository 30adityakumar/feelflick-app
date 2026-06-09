# F5 — `/movie/:id` Film File redesign — final summary

**Status:** closed · private/beta-ready · current
**Scope:** the authenticated Film File route (`/movie/:id`), rebuilt across the self-contained **F5.1–F5.9** initiative and closed by this document (F5.10).
**Verified against:** git `main` (HEAD = `00ccada1`) + GitHub PRs, and firsthand source inspection.

> **Numbering note.** "F5" here denotes the **Film File redesign initiative** (its own F5.1–F5.10 sub-phases), not the global rebuild's "F5 home/Briefing" phase (`home-briefing-vnext-f5.md`). The earlier global Film File case-making work lives in `film-file-case-making-f6a.md` / `f6b.md`; this initiative builds on and supersedes that case layer. This file mirrors the closure-summary pattern of [`discover/f3-summary.md`](../discover/f3-summary.md) and [`home/f4-summary.md`](../home/f4-summary.md).

---

## 1. What it was, and what it is now

**Before — an 18-section editorial/dashboard hybrid:**

- generated viewer quotes styled as external critic authority,
- precise user-match percentages in several places (hero ring, sticky bar, pairs-with cards),
- generated and derived recommendation sources blended together,
- synopsis and provider availability buried *below* analysis and the rating form,
- optimistic action confirmation (Watched flipped/celebrated before the write landed),
- weak trailer-dialog accessibility, no dynamic announcements,
- two separate social sections + two competing exploration shelves (with a reshuffle feed),
- silent provider failures (empty and error looked identical),
- raw route-error text leaked to the screen,
- almost no route-level browser coverage.

**After — a 12-stage decision-first dossier:**

> identify (Hero) → decide (Case → what it's about → where to watch → act) → go deeper (one collapsed evidence disclosure) → reflect / explore (compact-until-watched Your Take, a restrained social + exploration tail, collapsed reference) → exit.

It makes **one honest, signal-backed case** for the film, leads with that case, expresses taste as a single qualitative band (never a fabricated number), and gives reliable, announced act/reflect affordances — with zero live writes during verification.

---

## 2. Phase ledger (F5.1–F5.9)

| Phase | Intent | PR | Squash SHA | On `main` |
|---|---|---|---|---|
| **F5.1** | Comprehensive product/UX/trust/a11y/data/interaction/architecture/perf audit of the legacy Film File | — | *(audit only)* | n/a |
| **F5.2** | Build the safety net: extract a canonical content-provenance model + the pure PrimaryCase tier decision + focused tests | #246 | `c84f4b5a` | ✓ |
| **F5.3** | Remove remaining false-authority signals; establish one honest recommendation-case language (no critic byline, no match-%) | #247 | `40c75bfa` | ✓ |
| **F5.4** | Harden actions, dynamic feedback, rating persistence, trailer-dialog a11y, focus behavior, reduced motion | #248 | `f590c03f` | ✓ |
| **F5.5** | Restructure into a decision-first dossier (synopsis/providers into the decision zone; compact-until-watched Your Take; collapsed evidence; collapsed film details) | #249 | `b39e2081` | ✓ |
| **F5.6** | Reduce/consolidate the social-proof + exploration tail (one Social disclosure, one Exploration disclosure; anonymise Taste Twin; drop reshuffle) | #250 | `46da975c` | ✓ |
| **F5.7** | Final provider-truth + route-reliability + a11y hardening (five provider states; sanitized route errors; skip link + main landmark; 44px/focus; loading semantics) | #251 | `18d8eaaa` | ✓ |
| **F5.8** | Deterministic authenticated intercepted E2E + visual-regression coverage (24 scenarios; 8 visual states; 8 Darwin + 8 Linux baselines) | #252 | `00ccada1` | ✓ |
| **F5.9** | Comprehensive production-readiness audit (13-dimension source-grounded review + adversarial P0/P1 verification) | — | *(audit only)* | n/a |
| **F5.10** | This closure documentation | — | *(docs only)* | this PR |

All seven implementation squash SHAs are real objects, reachable from `main` in chronological order, matching their PR numbers/titles. `main` HEAD = `00ccada1` (F5.8).

---

## 3. Final hierarchy

```
MovieHero
└─ <main id="film-file-content" tabIndex={-1}>          ← the decision dossier + skip target
   PrimaryCaseCard            (always expanded — the one canonical case)
   Synopsis                   (what it's about)
   StreamingProviders         (where to watch — US)
   YourTake                   (compact until watched; full reflection form once watched)
   DecisionEvidence           (collapsed: Why-For-You + Mood Profile + impressions; self-hides empty)
   VideosSection              (featurettes & extras; self-hides empty)
   CastSection                (factual; visible)
   SocialContext              (collapsed: Friends + anonymised Taste Twin; self-hides empty)
   ExplorationTail            (collapsed: ≤4 similar + ≤4 director; self-hides empty)
   FilmDetails                (collapsed: timeline + production facts; self-hides empty)
   MovieFooter                (single "Back to home" exit)
StickyActionBar               ← outside <main>, inert/aria-hidden until scrolled
AccessibleMediaDialog         ← outside <main>, trailer/featurette modal
```

Verified at `src/features/movie/MovieDetail.jsx:290–382`. No duplicate Synopsis / Providers / Your-Take; the case is first and canonical; Decision Evidence / Social / Exploration / Film Details are collapsed-by-default, internally state-owned (survive parent re-render), and self-hide when empty.

---

## 4. Trust / provenance outcome

A **two-axis provenance model** (origin × presentation, F5.2 `derive/sourceClassification.js`) classifies every visible claim — real/direct, real/derived, generated/direct, generated/derived, static/direct.

- **No user match percentage or ring anywhere** — removed from the hero, sticky bar, and pairs-with cards; `matchPct` is mapped to a single qualitative **fit band** ("Good/Strong fit") that appears **at most once**, inside `PrimaryCaseCard`, with no number.
- **Generated content is secondary and openly labelled:** the generated `ff_take` never leads (the adaptive real/derived rationale does); FeelFlick impressions (`ViewerNotes`) carry a generated disclosure and no critic byline/outlet; `daypart_fit` is framed as a FeelFlick suggestion; the Mood Profile is labelled generated/not-measured with no scientific-looking numbers.
- **Real user content is labelled real** (Friends + Taste Twin reviews); generated text is never presented as a testimonial.
- **No false authority risk found** in the F5.9 audit.

---

## 5. Social-privacy outcome

Policy of record: [`social-content-policy-f56.md`](social-content-policy-f56.md).

- **Friends Loved — identified, by consent of the explicit follow relationship:** only users the current user follows, real ≥8/10 ratings + real review text, honest count/average, self-hides when empty.
- **Taste Twin — anonymised, presentation-only:** the real rating, review text, watched date, and exact **overall taste similarity** value are kept verbatim, but the twin's name / avatar / identity-derived initials / UUID colour are hidden, with **no identity in the accessibility tree** (alt / aria-label / title / link / image URL / copy all clean) — replaced by a neutral "A taste twin" label + a generic `aria-hidden` glyph. The real review is never labelled generated.
- **`RLS ≠ consent`:** cross-user-readable RLS is explicitly not treated as permission to surface a stranger's identity. Anonymisation is presentation-only (the hook's returned data is unaltered).
- **Deferred:** an explicit, enforceable public-review / taste-twin **consent model** is required before any re-identification (post-beta; see §9).

---

## 6. Provider / error outcome

- **Five honest provider states** (`derive/providerState.js`): `idle | loading | found | empty | error`. Explicit failure wins over empty; **empty and error are distinct**; a provider failure **cannot fail the route** (the request is settled-not-thrown in the parallel batch). The found and empty states carry US-region TMDB/JustWatch attribution + a freshness caveat; there is **no universal-unavailability claim**; the error state keeps a direct JustWatch search path.
- **Sanitized route errors** (`derive/movieRouteState.js`): `invalid | not_found | load_error` render **safe copy only** — never raw backend/TMDB/Supabase text. Each is one `<h1>` with `role="alert"`, **Back + Go-to-Home** recovery, and **no fake Retry**.

---

## 7. Accessibility / reliability outcome

- **Structure:** one page `<h1>`; a first-focusable **skip link** → `#film-file-content`; native `<details>/<summary>` disclosures with independent, re-render-safe open state; ≥44px touch targets; visible focus rings; decorative SVGs `aria-hidden`.
- **Settled writes (never optimistic-confirmed):** Save and Mark-Watched observe the shared `loading` true→false settlement and announce only on persistence — Watched never unlocks/scrolls/celebrates before the write lands; failures are retryable and never erase reflection text.
- **Live region:** one Film File-owned `role="status"` `aria-live="polite"` `aria-atomic` region announces Save / Watched / rating / share outcomes.
- **Serialized rating:** debounced, latest-value-wins, stale-completion-guarded; byte-identical `user_ratings` / `user_movie_feedback` payloads.
- **Dialog:** the trailer/featurette dialog has an accessible name, `aria-modal`, a focus trap, body-scroll lock, focus restoration to the exact opener, no autoplay before open, and iframe removal on close.
- **Motion:** reduced motion disables poster tilt + backdrop parallax, sets Mark-Watched scroll to `auto`, and suppresses confetti/cast motion; CSS animation is neutralised by the global reset.

---

## 8. Test evidence

| Layer | Coverage |
|---|---|
| Movie unit/component | **217** tests |
| Full unit suite | **1,166** tests |
| Authenticated intercepted E2E | **24** scenarios (+ shared auth setup), **3 consecutive green** runs |
| Authenticated Movie visual states | **8** (2 consecutive green) |
| Movie visual baselines | **8 Darwin + 8 Linux** |
| Responsive browser matrix | **6 widths** — 360×640 / 390×844 / 430×932 / 768×1024 / 1280×720 / 1440×900 |
| Accessibility | axe on success page + opened disclosure + provider error → **no serious/critical** (excl. the documented color-contrast policy) |
| App visual (full) | Discover 8 + Home 8 + Movie 8, green; public 2, unchanged |
| Write safety | **empty unexpected-request ledger** in every scenario; **no `src/**` change in F5.8**; **no live write** |

E2E covers the dossier hierarchy, disclosure independence/persistence, social privacy, exploration cap, provider found/empty/error, Save/Watched success+failure, rating persistence (exact payloads + serialization + latest-value-wins), trailer+featurette dialog focus, share native+clipboard, route errors, keyboard + reduced-motion + axe, and the six responsive widths.

---

## 9. No-live-write interception model

`e2e/fixtures/movie.js` authenticates the dev user for real (`/auth/v1` passes through) and then intercepts **100%** of:

- `/rest/v1/**` (all Film File reads + writes; stateful reads reflect successful writes),
- the `generate-movie-overlay` Edge Function (not called on the success path; aborted+recorded if it is),
- all TMDB API + image requests, and the YouTube embed.

Reads are recorded; **expected** writes (`user_watchlist`, `user_history`, `user_ratings`, `user_movie_feedback`, `user_interactions`, `recommendation_impressions`, `user_profiles_computed`, `user_sessions`) are recorded + locally fulfilled; **any other write-capable request (POST/PATCH/PUT/DELETE) is aborted + recorded in `unexpectedRequests`, failing the test**. Diagnostics are redacted; auth state + local secrets stay gitignored.

> **Caveat of record:** mocked/intercepted browser proof is **not** equivalent to live production integration. Real-traffic write integrity/idempotency, provider/overlay reliability, the not-found-copy edge in the wild, and color-contrast with real low-vision users are **learn-from-beta**, not pre-beta code.

---

## 10. Private/beta-readiness verdict

**READY FOR PRIVATE / BETA TESTING. F5 is closed.**

- **0 P0, 0 P1** after adversarial verification of every candidate (F5.9). All findings are P2/P3 (coverage / observability / edge / polish), each with full recovery and no concrete common-path user-facing failure.
- **Every F5.1 finding is Resolved** (generated quotes, leading `ff_take`, daypart authority, match-% multiplicity, case/why duplication, buried synopsis/providers, early Your Take, mood-radar numbers, twin mislabel/identity, 18-section dashboard, pairs/director duplication, optimistic Watched, rating overlap, no live region, trailer focus, reduced-motion gaps, silent provider failure, raw route error, no skip link/main, no E2E, no visual baselines).
- **Not yet cleared for unrestricted public production:** that requires the P2 register (esp. the 404-copy + second-`<main>` fixes), an explicit public-review consent model, profile-cache/overlay observability, and live-beta evidence — per the rule that public-production readiness cannot be claimed without live-beta + operational evidence.

---

## 11. Deferred register (F5.9 P2/P3 — verbatim)

### P2 — safe early-/post-beta follow-ups

1. **Not-found-id → load-error copy.** `src/features/movie/useMovieData.jsx:695` + `src/shared/api/tmdb.js:148–153`: a real HTTP-404 movie id throws a `TMDBError` (no `.kind`) → classified `load_error`, so a stale/wrong link reads "Something interrupted the request. Try again" instead of "Couldn't find that movie." Edge path (not the Home/Discover common path), full Back/Home recovery, no crash/leak. **Fix:** in the catch, map `e?.status === 404 → kind:'not_found'` (or `getMovieDetails(id).catch(e => e?.status===404 ? null : Promise.reject(e))`).
2. **Two `<main>` landmarks.** `src/app/AppShell.jsx:124` / `src/app/router.jsx` shell `<main>` + `src/features/movie/MovieDetail.jsx:306` `<main id="film-file-content">` (introduced F5.7). Skip link works via the id; page operable; axe-moderate. **Fix:** make MovieDetail's wrapper `<section role="region" aria-label="Film File" tabIndex={-1}>`, keeping the same id/tabIndex.
3. **Dead legacy exports + mis-pointed trust test.** `src/features/movie/sections-bottom.jsx:799` exports `PairsWith/FriendsLoved/TasteTwinReview/DirectorShelf` (dead in production), kept alive only by `src/features/movie/__tests__/FilmFileTrustFraming.test.jsx`. A trust regression in the **live** ExplorationTail/SocialContext wouldn't be caught. **Fix:** delete the four; repoint the test at ExplorationTail + SocialContext.
4. **Rating success not E2E-asserted through the live region** (the F5.8 observation). The announce fires correctly in production code; the dev-only non-observation was a StrictMode double-mount (the `isWatched` flip) + fixed-clock harness artifact (`src/main.jsx:90,100` wraps in `StrictMode`, a no-op in production); the `saveStatus → 'saved'` link is unit-asserted (`useUserRating.test.js:101,116`) and the announce mechanism is E2E-proven by Save/Watched. Coverage/regression-risk only. **Fix:** add one assertion to E2E test F (`await expect(liveStatus(page)).toContainText('Your take on …')`) and/or a component test asserting `onSaved` fires on `saving→saved` through the `isWatched`-flip mount.
5. **`useUserMovieStatus` redundant re-fetch** on each interaction. `src/features/movie/MovieDetail.jsx:82` passes an unmemoised `movie` literal; `src/shared/hooks/useUserMovieStatus.js:107` deps re-run the watchlist/history read (+ an `ensureMovieInDb` SELECT). Avoidable Supabase reads, no incorrect state. **Fix:** memoise the status-movie prop (and add `tmdb_id` to take the Priority-2 path, skipping `ensureMovieInDb`).
6. **Director shelf unasserted in E2E.** `e2e/app/movie.e2e.js` test B asserts the similar subsection but not "More from …". **Fix:** assert 4 director buttons in source order + the "More from <director>" heading.
7. **`MOVIE_ENGINE_COLS` column contract unexercised.** `src/features/movie/__tests__/MovieDataProviders.test.jsx:43` mocks it to `'*'`. **Fix:** import the real const and assert the `.select()`, or assert the column list in the e2e fixture's `movies` GET branch.
8. **Visual-baseline `HIDE_CHROME` dead selectors.** `e2e/visual-auth/movie.visual.js:19–21` targets `.ff-movie-scroll-progress` / `.ff-movie-grain`, which the components (`sections-top.jsx:29–46`) don't carry, so the progress bar is baked into the mobile baselines. Test-hygiene, not a rendered defect. **Fix:** add the matching class hooks and re-baseline both platforms via the `visual-baselines/**` CI flow.

### P3 — polish

- **Videos grid renders expanded** (the lone non-collapsed secondary section). `MovieDetail.jsx:347` / `sections-bottom.jsx:113–130`. **Fix:** wrap its body in a collapsed `FilmFileDisclosure` for demotion consistency.
- **Decision Evidence groups three evidence types** (Why-For-You + generated mood radar + generated impressions) under one "Why this film" label. `components/DecisionEvidence.jsx`. No trust violation (each child is honestly labelled). **Fix (optional):** sub-headings or a sub-disclosure to separate real signals from generated tone.
- **Identical consecutive announcements not re-fired** (aria-atomic equal-string `setState`). `MovieDetail.jsx:125–126,186,285`. **Fix (optional):** store `{ msg, n }` with an incrementing counter.
- **Hero Save / Mark-Watched lack `aria-pressed`** (only the sticky-bar Save sets it). `sections-top.jsx:250–294`. Label-flip already conveys state. **Fix (optional):** forward `aria-pressed` from `active`.
- **Color-contrast tokens unmeasured.** The provider attribution (`rgba(250,250,250,0.45)`) and the 10.5px fit-band qualifier carry real info but are excluded from the axe gate. **Fix:** a one-off contrast pass on `/movie/:id` with the exclusion removed; raise the two thinnest tokens to ≥4.5:1 where the text is essential.
- **`contentSources` provenance computed-but-unread.** `useMovieData.jsx:652–657` + `:506` ("NOT rendered"). **Fix:** either wire it into a real consumer (drive the generated-vs-real disclosure labels from it) or drop the compute+state field, keeping `classifyFilmFileContent` as a tested module until a consumer lands.
- **E2E test "Save success then failure" only runs success** (D2 is the failure). `e2e/app/movie.e2e.js:151`. **Fix:** rename to "D — Save success".

---

## 12. Next initiative — the user library surfaces (Watchlist + History)

Home, Discover, and the Film File now form a complete **recommend → decide → act** loop, and the Film File's hardened writes land in `user_watchlist`, `user_history`, and `user_ratings`. The **act → revisit** half of the loop — where saved films wait, where watched/rated films are reviewed, where taste visibly accumulates — has not had the F-series treatment. It is the highest-frequency return surface, directly **consumes the writes this initiative just made reliable**, carries real trust risk (honest saved/watched/rating presentation, no fabricated counts), and squarely fits doctrine (watchlist = "preserve intent for another moment"; history = "remember and refine taste"). It is recommended as the next initiative for its loop-closing value rather than technical novelty. *Runner-up: Profile / Cinematic DNA* (makes personalization visible) — strong, but a step removed from the concrete act/reflect outcomes the Film File now produces; sequence it after the library.
