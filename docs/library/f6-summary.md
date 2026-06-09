# F6 — User Library (Watchlist + Diary) — final summary

**Status:** closed · private/beta-ready · current
**Scope:** the authenticated User Library surfaces — `/watchlist`, `/history`, and the `/watched` compatibility alias — rebuilt across the self-contained **F6.1–F6.10** initiative and closed by this document (**F6.11**).
**Verified against:** git `main` (HEAD = `f07413b0`) + GitHub PRs #254–#261, and firsthand source inspection. Every implementation squash SHA below is reachable from current `main`.

> **Numbering note.** "F6" here denotes the **User Library initiative** (its own F6.1–F6.11 sub-phases), not the global rebuild's other "F6" work (`film-file-case-making-f6a.md` / `f6b.md`, which is the Film File case layer). This file mirrors the closure-summary pattern of [`../discover/f3-summary.md`](../discover/f3-summary.md), [`../home/f4-summary.md`](../home/f4-summary.md), and [`../movie/f5-summary.md`](../movie/f5-summary.md).

---

## 1. Initiative overview — why F6 started, and the target doctrine

The F6.1 audit found the two Library surfaces were quietly working against the user's trust.

**Watchlist behaved like a recommendation queue:** per-film match percentages, an approximate fallback score, match-first sorting, a "Perfect for tonight" claim, "stale"/guilt copy with a 60-day flag, a featured recommendation tier, and a bulk "Clear all" cleanup. Merely viewing the route also computed the user profile and wrote the profile cache.

**Diary had personal-record trust issues:** the average rating was computed over *all* `user_ratings` rather than the watched Diary; a streak applied behavioural pressure; the film's mood read like the user's viewing mood and the film-level review read like a per-watch note; removing a Diary entry left the rating/review stored but *inaccessible* (the Film File "Your Take" was watched-gated); and Discover's "Already watched" insert omitted `watched_at`, so those films never appeared chronologically.

Across both: **removals could falsely appear successful** (a resolved Supabase `{ error }` was treated as success); **route errors exposed raw backend text**; the two surfaces lacked a **coherent shared identity** (the menu said "Watch history" while the page said "Diary"); **accessibility / mobile / browser coverage was thin**; and two data-integrity defects (surfaced by the F6.9 audit) remained: **duplicate `user_history` rows repeated films and inflated Diary facts**, and **changing a Film File reaction could fail on a uniqueness conflict**.

**Target doctrine:**

> The User Library is a calm, trustworthy record of my film intent and memory — what I saved for later, what I watched, and what I thought — without pressure, fake precision, or data ambiguity.

---

## 2. Final product model — Direction A

Two focused routes under one shared **"Your library"** identity. **No `/library` route**, no merged data provider, no in-page tab model — the cross-navigation is real route links.

### Watchlist — *films I chose to remember for another moment*
- route `/watchlist`; eyebrow **Your library**; headline **Saved for later.**
- recently-saved default order; optional **film-mood** filtering; one responsive saved-film grid
- **one Film File link + one Remove** per film; settled removal
- **no scores, no percentages, no recommendation tier, no guilt/stale framing**
- **no profile compute or profile-cache write on view**

### Diary — *a chronological record of what I watched and what I thought*
- route `/history`; `/watched` compatibility alias; eyebrow **Your library**; headline **Your diary.**
- month/day chronology; restrained facts **Logged / Hours watched / Avg rating / This month**
- **one canonical entry per film** using its latest valid `watched_at`
- search by **title / director / review**; **Loved · 9–10** filter; explicit **film-mood** labelling; **Your review**
- honest removal confirmation; retained rating/review stays **visible + editable on the Film File**
- **no streak, no recommendation authority**

---

## 3. Phase ledger (F6.1–F6.11)

| Phase | Title | Type | PR | Squash SHA | Outcome / key frozen contract |
|---|---|---|---|---|---|
| **F6.1** | Initial User Library audit | audit-only | — | — | Product/UI/trust/architecture audit; selected **Direction A**. No code. |
| **F6.2** | Derivation extraction + safety net | impl | [#254](https://github.com/30adityakumar/feelflick-app/pull/254) | `e65995a5` | Pure Watchlist/Diary derivations extracted byte-for-byte + pinned by tests. *Frozen:* behavior identical (incl. the to-be-fixed avg scope). |
| **F6.3** | Removal reliability + error hardening | impl | [#255](https://github.com/30adityakumar/feelflick-app/pull/255) | `e1991fd1` | Settled delete that recognises resolved `{ error }`, dup-guards, pending, live regions, focus recovery, sanitized `load_error`. *Frozen:* delete filters, product copy. |
| **F6.4** | Watchlist saved-intent redesign | impl | [#256](https://github.com/30adityakumar/feelflick-app/pull/256) | `cf437838` | Removed match %/tonight/featured/pulse/stale/bulk; recently-saved default; **dropped the profile/fingerprint dependency** (no profile-cache write on view). *Frozen:* engine + shared services. |
| **F6.5** | Diary semantics + reflection integrity | impl | [#257](https://github.com/30adityakumar/feelflick-app/pull/257) | `83fcd819` | Diary-scoped average; streak removed; film-mood + "Your review" provenance; honest remove dialog; retained reflection visible/editable on Film File; **Discover writes explicit `watched_at`**. *Frozen:* rating scale + retention. |
| **F6.6** | Shared Library identity + navigation | impl | [#258](https://github.com/30adityakumar/feelflick-app/pull/258) | `d297421e` | `LibrarySectionNav` (native links, `aria-current`, no tabs); "Your library" mastheads; menu **"Watch history" → "Diary"**. *Frozen:* routes, `/watched` alias, providers. |
| **F6.7** | Accessibility + responsive hardening | impl | [#259](https://github.com/30adityakumar/feelflick-app/pull/259) | `357ba221` | One link + one Remove per item; `aria-pressed` filter (no partial radiogroup); honest loading status; list/listitem; 44px; focus rings; bottom-nav clearance; six-width no-overflow. *Frozen:* providers/derivations/nav. |
| **F6.8** | Intercepted E2E + visual coverage | impl | [#260](https://github.com/30adityakumar/feelflick-app/pull/260) | `c819e0af` | Fully-intercepted authenticated E2E + Darwin/Linux visual baselines; deleted the legacy real-write `watchlist.e2e.js`. *Frozen:* all `src/**` (one later-approved a11y line aside in F6.8). |
| **F6.9** | Production-readiness audit | audit-only | — | — | Found **0 P0 · 2 P1** (Diary duplicate entries; Film File reaction 23505) + the P2/P3 register. No code. |
| **F6.10** | Diary de-duplication + reaction idempotency | impl | [#261](https://github.com/30adityakumar/feelflick-app/pull/261) | `f07413b0` | Resolved both F6.9 P1s. *(branch head `86b93b98`, 6 files changed, no schema/route change.)* |
| **F6.11** | Initiative closure documentation | docs-only | *current* | — | This document. No code/test/config change. |

**F6.10 in detail:** a new pure `dedupeHistoryByMovie(history)` collapses `user_history` to **one canonical row per `movie_id`** — the **most-recent valid `watched_at`** (strictly-newer replace → stable original-array tie-break), excluding rows without a valid `movie_id`/`watched_at`, never mutating the input, never merging older-row fields, **never representing a duplicate as a rewatch**. Both `deriveEntries` and `deriveStats` derive from that single canonical set (the **one-entry-per-film** boundary). The Film File reaction write changed from `.insert` to `.upsert(payload, { onConflict: 'user_id,movie_id' })`. **No schema migration, no DB duplicate cleanup, no rewatch UI.**

---

## 4. Before → after

| Before F6 | After F6 |
|---|---|
| Watchlist as a recommendation queue | calm saved-intent collection |
| exact + approximate match percentages | no recommendation score |
| match-first sorting | recently saved |
| "Perfect for tonight" | no false current-context claim |
| stale/guilt copy + bulk cleanup | neutral saved-date context |
| silent / false removal failure | settled, announced, focus-recovered removal |
| raw route errors | sanitized, recoverable errors |
| global average rating | Diary-scoped average |
| streak | removed |
| film mood looked like the user's mood | explicitly labelled **film mood** |
| removal hid the retained reflection | existing reflection stays accessible (Film File) |
| Discover could omit `watched_at` | explicit `watched_at` |
| duplicate watched rows repeated films + inflated facts | latest canonical entry per film |
| reaction insert could 23505 | idempotent reaction upsert |
| terminology drift ("Watch history") | Watchlist + Diary under **Your library** |
| minimal browser coverage | **30 Library E2E scenario bodies** (31 incl. shared auth setup) + 8 visual states |

> **Accurate E2E wording.** `library.e2e.js` contained **29 Library scenarios** after F6.8; F6.10 added one duplicate-history scenario → **30 Library scenario bodies**. The full-run result is **31 passed**, which adds the **1 shared `auth.setup.js`** dependency. The 31 are not all Library scenario bodies.

---

## 5. Final lifecycle semantics

**Save** — creates/upserts one `user_watchlist` row (PK `(user_id, movie_id)` → idempotent); appears in Watchlist; removing from Watchlist affects no rating/review/watched data. Save↔Watched mutual-exclusion remains owned by the existing shared `useUserMovieStatus` flow (saving deletes the watched row; marking watched deletes the watchlist row).

**Watched** — Home, Discover, and Film File all write `watched_at`. The Diary **canonicalizes** duplicate `user_history` rows by `movie_id`, the **most-recent valid `watched_at` wins**. There is **no first-class rewatch model yet**, and **no database duplicate cleanup** occurred.

**Reflection** — rating / review / reaction are **film-level**. Removing from the Diary deletes **only** `user_history`; the rating/review remain. An existing reflection stays **editable when unwatched**; a brand-new *unwatched* reflection remains **locked**. Reaction writes are now idempotent via `upsert(..., { onConflict: 'user_id,movie_id' })`.

**Removal** — Watchlist removes only `user_watchlist`; Diary removes only `user_history`; failures retain the row; duplicate clicks are guarded; success/failure are announced; focus is recovered deterministically.

---

## 6. Trust + data-truth outcome

No match percentage · no approximate score · no inferred current mood · no stale/guilt framing. **Diary statistics derive from the canonical Diary rows**; the average includes only ratings for films **in** the canonical Diary; **duplicate rows cannot inflate Logged/Hours/This month**. Film mood is labelled as film mood; the review is labelled as the user's film review. **Raw backend error text is never rendered** (errors are sanitized to a fixed `load_error`), and an **attempted removal is never reported as success before settlement**.

| Claim | Source | Classification |
|---|---|---|
| saved date | `user_watchlist.added_at` | real / direct |
| watched date | canonical latest `user_history.watched_at` | real / direct |
| rating | `user_ratings.rating` | real / direct |
| review | `user_ratings.review_text` | real / direct |
| film mood | `movies.mood_tags` | real / derived (explicitly labelled "Film mood:") |
| Diary facts (Logged / Hours / Avg / This month) | canonical history aggregates | real / derived |
| empty / error copy | fixed product copy | static |

---

## 7. Reliability outcome

Supabase resolved `{ error }` is inspected on every settled path · removal settles before local success · per-item (and the former bulk) duplicate guards · pending/disabled states · persistent polite/atomic live regions · deterministic focus-after-removal · safe retryable load errors · no false success · no unhandled deletion promise · **Watchlist no longer triggers a profile-cache write on view** · reaction persistence is idempotent.

---

## 8. Accessibility outcome

One `h1` per state · native Library section links with `aria-current="page"` · no tab semantics · one Film File link + one Remove per item · list/listitem structure · honest loading statuses · `aria-pressed` filter · labelled search + sort · ≥44px controls · focus-visible · accessible Diary removal dialog (`role="dialog"`/`aria-modal`, Tab-trap, Escape, focus restore) · persistent live announcements · film-mood + "Your review" labels · reduced-motion compatibility · six-width no-overflow verification · axe **zero serious/critical** violations with the project's existing documented color-contrast exclusion.

> **Color contrast remains unmeasured under the project's current axe exclusion and is not treated as fully cleared.**

---

## 9. Architecture

| Area | Seams |
|---|---|
| Watchlist | `Watchlist.jsx` · `useWatchlistData.jsx` · `derive/watchlistDerive.js` |
| Diary | `History.jsx` · `useHistoryData.jsx` · `derive/historyDerive.js` · `components/RemoveDiaryEntryDialog.jsx` |
| Shared Library | `library/LibrarySectionNav.jsx` · `library/focusAfterRemoval.js` · `library/useLibraryAnnouncement.js` |
| Adjacent lifecycle | Film File rating/reaction hook (`movie/hooks/useUserRating.js`) · Discover explicit watched timestamp (`discover/hooks/useDiscoverResultActions.js`) |
| Test infrastructure | `e2e/fixtures/library.js` · `e2e/app/library.e2e.js` · `e2e/visual-auth/library.visual.js` |

No `/library` shared provider was introduced; no reducer/state machine was needed; the providers remain thin (read `user_*` × movies → pure derive → settled owner-scoped delete); the pure derivations carry the data truth; the UI stays route-specific. **One-entry-per-film is a presentation/read contract** until an explicit rewatch architecture exists.

---

## 10. Frozen contracts (held throughout F6)

Routes `/watchlist`, `/history`, `/watched` · auth + onboarding guards · Watchlist `user_watchlist` read/write semantics · Diary `user_history` removal scope · rating/review retention · rating scale · review payload · recommendation engine unchanged · Home/Discover/Film File recommendation scoring unchanged · Watchlist sorting/filter meaning · Diary search/filter/sort meaning · Discover `source: 'discover_marked'` · Library navigation labels · provider query shapes *(except the deliberate removal of obsolete Watchlist scoring/profile reads in F6.4)* · **no schema/RLS migration** · **no destructive duplicate-history cleanup** · **no first-class rewatch UI**.

---

## 11. Test + verification evidence

| Evidence | Value |
|---|---|
| Library targeted unit/component | **105** (the Watchlist + History + Library feature folders) |
| full unit suite | **1,297** |
| F6.10 changed unit tests | **34** (×3, deterministic) |
| Library E2E | **30 scenario bodies** in `library.e2e.js` · **31 passed** including the shared auth setup (×3) |
| authenticated Library visual states | **8** (4 desktop + 4 mobile) |
| Library visual baselines | **8 Darwin + 8 Linux** |
| responsive widths asserted | 360 · 390 · 430 · 768 · 1280 · 1440 |
| full authenticated app visual suite | **33** including setup (Discover 8 + Home 8 + Movie 8 + Library 8 + setup) |
| public visual suite | unchanged |

> **`534`** is the output of the broad multi-feature targeted command (`watchlist/ history/ library/ movie/ discover/`) used during F6.10 validation — it is **not** a Library-only count. The Library-only targeted figure is **105**.

**Interception model:** real `/auth/v1` · **100% of `/rest/v1/**` intercepted before the route loads** · deterministic fictional data · permitted writes fulfilled in fixture memory · unexpected write-capable requests aborted + recorded · **empty unexpected-request ledger in every test** · **no live row touched**.

> **Intercepted browser coverage proves application integration and UI contracts, but it is not live production integration.**

---

## 12. Readiness verdict

**READY FOR PRIVATE / BETA TESTING.**

The F6.9 audit found **two P1 blockers**; **F6.10 resolved both**. **No open P0/P1 remains**, so **F6 can formally close**.

This is **not** a claim of unrestricted public-production readiness. Before unrestricted public production, the following are required: an explicit **watch-history social-read / privacy policy**; **contrast measurement + remediation**; **real beta evidence**; **operational monitoring**; **scale handling**; a deliberate **rewatch model**; and **live-schema / change-management documentation**.

---

## 13. Deferred register (verified residual — no inflation)

### P2 — safe early-/post-beta follow-ups
- **Missing-`tmdb_id` Watchlist item cannot open the Film File** — add an honest unavailable-state affordance or data repair.
- **No pagination/virtualisation** on either route — evaluate when real Library size warrants it.
- **Diary removal `refresh()` can cause a full-skeleton re-flash** and weaken real-network focus continuity — prefer local settled removal with background reconciliation (mirror the Watchlist's local-update path).
- **Diary dialog lacks the scroll-lock / background-inert hardening** the Film File media dialog already has.
- **Color contrast remains unmeasured** under the current axe exclusion.
- **Broad authenticated `user_history` SELECT** is a deliberate social-read policy (powers Film File "Friends loved"/"Taste twin") but requires a **formal public-scale privacy decision**.

### P3 — polish / cleanup
- Diary empty-state CTA contains the isolated "tonight" wording.
- Discover "Save for later" does not use the shared watched-state mutual-exclusion flow.
- Runtime sort places missing runtime first.
- "0 hours" / "1 hours" pluralisation in the Diary masthead.
- Local-calendar vs UTC boundary for "This month".
- Overlapping `role="status"` semantics in some empty states.
- `data-library-fallback` focus target has an accessible label without a semantic role.
- Stale visual chrome-hide z-selector.
- Stale Watchlist `data.js` comment (taste_fingerprint).
- First-class rewatch model.
- Duplicate database-row cleanup or uniqueness strategy.

> **None blocks a trusted private beta after F6.10.**

---

## 14. Beta-learning plan

Learn from beta rather than pre-empt with speculative implementation: whether users understand Watchlist vs Diary immediately; whether recently-saved ordering is useful; whether film-mood filtering is used; whether users remove Diary entries and expect ratings to remain; whether one-entry-per-film is sufficient or rewatches need first-class support; actual Library sizes; real network latency during removal; focus behaviour under real latency; readability/contrast; public/social expectations around watch-history visibility; reaction changes across sessions; cross-route watched consistency.

---

## 15. Next initiative — Profile / Cinematic DNA

It completes the product loop — **recommend → decide → save/watch → reflect → revisit your taste identity** — and is the signature "we understand you" trust surface. It **consumes the now-corrected `user_history` and `user_ratings`**; duplicate Diary rows no longer distort its inputs *at the Library presentation layer*; and it has **not** received the same F-series audit / trust / a11y / E2E treatment the Library just did, making it more valuable next than further Library polish. (The vNext design exploration already exists in [`../cinematic-dna-profile-vnext-f7.md`](../cinematic-dna-profile-vnext-f7.md).)

> **Important caveat.** True DNA computation must independently verify whether it consumes **raw** `user_history` rows and, if so, requires equivalent de-duplication **at its own data boundary**. The F6.10 Diary *display* fix must **not** be assumed to automatically correct every downstream profile computation.

---

## 16. Closure statement

The **F6 User Library initiative is complete.** The Watchlist is a calm saved-intent collection; the Diary is a trustworthy **one-entry-per-film** chronological record; the reflection lifecycle (save / watch / rate / review / react / remove) is coherent; removal and reaction writes are reliable; the Library identity and navigation are unified under "Your library"; accessibility and responsive behaviour are covered; intercepted authenticated E2E and Darwin/Linux visual evidence are in place; **no open P0/P1 remains**; and further Library work is **beta-evidence-, privacy-, scale-, or defect-driven**, not phase-driven.
