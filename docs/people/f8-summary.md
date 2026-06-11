# F8 — People / Social Trust and Consent — final summary

Closure ledger for **F8.1 → F8.10**. Status: **complete**. Verdict: **READY FOR PRIVATE / BETA TESTING — 0 open P0/P1.** Final `main` after F8.8: `19a8dcbc`.

This is the source of truth for what People is, why it changed, the privacy/security incidents found and fixed, the consent and trust models, and what is deliberately deferred before any public social rollout. Cross-reference: [`private-beta-safety-f84.md`](private-beta-safety-f84.md).

---

## 1. Initiative overview

F8 began because the People / social surfaces had an **unclear product purpose** and a set of **active privacy, trust and security problems**:

- anonymous `users.email` readable via the REST API;
- anonymous `user_follows` (follow-graph) readable;
- taste-match **discoverability default-on**;
- algorithmic matches labelled like **friendship**;
- **exact `% Match`** shown without evidence maturity;
- **optimistic** follow/unfollow that could claim success before persistence;
- **no live announcements** for relationship actions;
- **no Hide suggestion**, and no block/report/mute/remove-follower decision;
- **dead Feed / Activity / CrewOverlap / Popular** surfaces;
- **fake social mock data** (fabricated names/reviews);
- **dead cross-user `/profile/:otherId`** affordances;
- weak mobile touch targets, contrast and responsive state;
- **no People-specific browser proof**;
- and — surfaced during the F8.6 audit — **two live global scheduler/security P0s**.

**F8 doctrine.** People is a **consent-led taste-discovery surface, not a public social network.** It helps a signed-in user discover compatible film tastes and optionally follow people, while keeping raw behaviour private, using opt-in projections, and never treating algorithmic similarity as friendship or as publication consent.

---

## 2. Final product model

The current `/people` experience:

- orientation + **search** (by name, via a narrow RPC);
- **closest taste matches** ("People who get it.");
- **more people to discover** (rising);
- **suggested people** (similarity + friend-of-follows);
- **qualitative taste bands** (Very close taste / Strong taste overlap / Some taste overlap);
- **films-in-common evidence** where genuinely available ("Based on N films in common");
- **cautious sparse/forming states** ("Taste still forming" / "Not enough shared evidence yet");
- **settled Follow / Unfollow** (write-confirmed);
- **session-local Hide suggestion**;
- **honest empty / degraded states** ("No taste matches yet").

Explicitly **absent**: no Feed; no activity rail; no CrewOverlap; no Popular; no public Profile browsing; no review / Diary / watched-activity exposure; no exact match percentage; no friendship language for algorithmic matches; no fake mock social proof.

---

## 3. Phase ledger — F8.1 → F8.10

All implementation squash SHAs verified reachable from `main` (`19a8dcbc`).

| Phase | Title | Type | PR / squash | Outcome | Frozen contract preserved |
|---|---|---|---|---|---|
| F8.1 | People audit | audit | — | found the beta blocker: anonymous `users`/`user_follows` exposure (P0) + a register of trust/dead-surface issues | n/a |
| F8.2 | Secure People identity and follow access | privacy / consent | **#271 `26527e5f`** | `users` owner-only; `user_follows` participant-only; anon revoked; 4 narrow authenticated RPCs; discovery opt-in (default-off); Account/Privacy copy | no user rows mutated |
| F8.3 | Harden taste-match trust and evidence | trust / evidence | **#272 `a3c27a5d`** | exact % removed; qualitative evidence-gated bands; cautious sparse copy; no friendship language | ranking / `overall_similarity` unchanged |
| F8.4 | Harden follow actions and beta safety | follow reliability / safety | **#273 `f4ce9791`** | settled Follow/Unfollow; duplicate + self-follow guards; 23505 idempotent; one live region; session-local Hide; safety doc | `user_follows` payloads/filters unchanged |
| F8.5 | Remove dead People social surfaces | dead-surface cleanup | **#274 `7bb24d4c`** | removed Activity/CrewOverlap/Popular + all cross-user behavioural reads; deleted `Feed.jsx`; removed mock arrays + dead Profile links | ranking + rail order unchanged; `/feed`→`/home` kept |
| F8.6 | Feed and cross-user activity audit | audit | — | verdict: do **not** restore Feed before beta; defined the future publication-consent contract | n/a |
| F8.6-SEC | Lock down scheduler security functions | security hotfix | **#275 `bbfdf9c3`** | revoked anon/auth EXECUTE on `get_cron_secret()` + `list_daily_briefing_subscribers()` + diagnostics; **rotated the cron secret**; advisor P0s cleared | cron/service-role bridge preserved; no user rows changed |
| **F8.8 prereq** | **Fix closest-matches identity resolution** | **provider fix** | **#277 `063d056c`** | the closest-matches/rising/similarity-suggested rails were **RLS-dead in production** (identity came from the owner-only embedded `users()` join → null); now resolved via `get_people_public_identities` | ranking + rail order + payloads unchanged |
| F8.7 | Harden accessibility and responsive layout | a11y / responsive / contrast | **#276 `b65dace8`** | heading-labelled regions; 44px controls + focus-visible; `INK` contrast token; responsive CSS; reduced-motion documented | no DB/ranking/snapshot change |
| F8.8 | Add People E2E + authenticated visual coverage | E2E / visual proof | **#278 `19a8dcbc`** | fail-closed fixture + 23 intercepted E2E scenarios + 8 visual states (8 Darwin + 8 Linux) | no product source change |
| F8.9 | Private-beta readiness audit | audit | — | **0 P0/P1**; live boundary verified; F8 may close | n/a |
| F8.10 | Closure documentation | docs | this | this document + one docs-index row | docs-only |

**Ordering note.** PR numbers run #271→#278 in order with one inversion: **#277 (the provider fix) merged after #276 (F8.7) but before #278 (F8.8)** — because the F8.8 fixture work surfaced the closest-matches identity-resolution defect, which (by your decision) was fixed first so F8.8 could honestly test the *functional* data flow rather than mask the defect. #277 is part of the F8 completion ledger even though it was a prerequisite fix to F8.8.

---

## 4. Before / after transformation

| Before | After |
|---|---|
| Anonymous `users`/email readable | `users` owner-only; cross-user identity via a narrow RPC |
| Anonymous follow graph readable | `user_follows` participant-only |
| Default-on taste discovery | explicit opt-in; missing value **hidden** |
| Direct cross-user table reads | authenticated **least-data** identity/search/FOF RPCs |
| Cross-user fingerprint views | removed; replaced by a scoped opt-in taste-profile RPC |
| Exact `% Match` | qualitative **evidence-gated** bands |
| "Friend" language for algorithmic matches | taste-match terminology |
| Optimistic follow state | **settled**, write-confirmed Follow/Unfollow |
| No action announcements | a single polite People live region |
| No way to remove an unwanted suggestion | **session-local Hide suggestion** |
| Activity/CrewOverlap/Popular dead surfaces | removed |
| Dead Feed component | deleted; `/feed`→`/home` compatibility redirect retained |
| Fake social mock arrays | removed |
| Dead `/profile/:otherId` links | removed |
| Weak mobile/accessibility polish | heading regions, 44px controls, contrast token, responsive CSS |
| No People browser proof | **24 intercepted E2E passes + 8×2 visual baselines** |
| Anonymous scheduler secret/email RPCs | locked down + **cron secret rotated** |
| Closest-matches rail RLS-dead (empty in prod) | functional — identity via the RPC (#277) |

---

## 5. Privacy and security remediation

**F8.2 (privacy/consent).** `users` owner-only; `user_follows` participant-only; anonymous access denied; four narrow authenticated SECURITY DEFINER RPCs — `get_people_public_identities(requested_user_ids uuid[])`, `search_people_by_name(text)`, `get_follow_suggestions()`, `get_discoverable_taste_profiles()` — each with a fixed `search_path`, **no caller-supplied viewer identity**, bounded results, least-data fields (no raw history/ratings/reviews/email/last_active/settings); taste-match discovery made **explicit opt-in**; Account + Privacy disclosure updated. No user rows mutated.

**F8.6-SEC (scheduler security hotfix).** `get_cron_secret()` and `list_daily_briefing_subscribers()` browser EXECUTE **revoked** (anon + authenticated); extra anon-executable diagnostic functions locked down; the **cron secret was rotated** (server-side, never printed); the two live anonymous P0s cleared; the pg_cron/service-role bridge preserved. No user rows changed.

The **remaining security backlog is documented in §16 as not-resolved** (parallel security track), not folded into this closure.

---

## 6. Final privacy model (verified live at F8.9)

- raw **behaviour** (history/ratings) **self-only**;
- raw **follows** participant-only;
- raw **similarity** participant-only;
- People **identity** through the least-data RPC only (`id, name, avatar_url`);
- People **taste tags** through the opt-in taste-profile RPC only (mood/tone/fit + total);
- **no anonymous** People data access;
- no public Profile browsing;
- no cross-user activity publication;
- no review / Diary / watched content exposure;
- no retired projection views (`user_fingerprint_public`, `user_similarity_discoverable` are **absent**);
- no direct cross-user table fallback.

**RLS is access control, not consent.** Consent is handled by the explicit taste-match-discovery setting; **publication consent for Feed/activity is deliberately absent** (no activity is published).

---

## 7. Consent and discoverability

**"Appear in taste-match discovery"** (`user_settings.privacy.showOnLeaderboards`):

- **default false** / missing → **hidden** (verified: the taste-profile RPC `coalesce(..., false) = true`);
- explicit `true` → included; explicit `false` → excluded.

**Fields exposed** to opted-in, signed-in members: name; avatar; top taste tags (mood/tone/fit); taste total. **Fields not exposed:** watched titles; watched dates; ratings; reviews; Diary entries; Cinematic DNA reflection; email; last-active; settings.

This is **sufficient for private beta** (small, trusted, opt-in cohort) but still needs **public-production hardening**: an onboarding opt-in prompt, opt-in auditability, revocation evidence, rate limiting, anti-scraping, and moderation.

---

## 8. Trust and evidence model (F8.3)

- qualitative bands only ("Very close taste" / "Strong taste overlap" / "Some taste overlap");
- an **evidence floor** (no quantified claim below the shared-film minimum);
- films-in-common context only from genuine shared-film evidence (never total-watched);
- **forming/sparse** counterparts get cautious language, no band;
- the MatchBar is **decorative** (aria-hidden, no `progressbar` role);
- exact percentages **removed** from visible and accessible text;
- "friend" reserved for the **real-world Invite-a-friend** context only;
- **Follow/Following is the only explicit relationship state**;
- a taste match is an **algorithmic estimate**, not mutual acceptance.

Ranking still uses the underlying `overall_similarity` value **unchanged** — F8.3 changed only *presentation*, not the ordering.

---

## 9. Follow, Unfollow and Hide model (F8.4)

- Follow is **one-way**, persisted in `user_follows`;
- **no state settles before the database write succeeds** (no optimistic "Following");
- failures **preserve prior state** + offer retry, with no raw backend text;
- duplicate rapid clicks are **guarded** (collapse to one write);
- a **23505** duplicate key is treated as **idempotent success**, not a false failure;
- **self-follow is rejected** (candidate filtering + a hook guard → zero write);
- a **single** polite live region announces settlement once;
- controls expose `aria-pressed` / `aria-busy` / `disabled` / a named accessible label + visible state text;
- **Hide suggestion is session-local only** — it is **not Block, Report or Mute**, it **writes no data and notifies no one**, and it recovers focus deterministically.

See [`private-beta-safety-f84.md`](private-beta-safety-f84.md) for the safety scope + the deferred-controls decision.

---

## 10. Feed and cross-user activity decision (F8.5 / F8.6)

- Feed should **not** be restored before private beta;
- `/feed`→`/home` compatibility redirect preserved;
- the dead `Feed.jsx` component deleted;
- Activity / CrewOverlap / Popular removed from People;
- no cross-user watched/rated/review activity; no review/Diary publication path;
- the analogous **RLS-dead social widgets in Movie/Home/Profile** (`useFriendsLoved`, `useTasteTwin`, `getTasteTwinPulse`) **fail closed** (owner-only RLS → empty → they render nothing) and are **deferred cleanup** (P2), not exposures.

**Future Feed/social restoration must require:** explicit publication consent; audience controls; block/report/remove-follower; least-data RPCs; no raw table access; unpublish/revocation; moderation + audit logging; full E2E/visual/a11y coverage.

---

## 11. Accessibility, responsive and contrast outcome (F8.7 / F8.8)

One visible `<h1>`; heading-labelled section regions (`aria-labelledby`); no nested `<main>` (AppShell owns it); accessible search; **44px** Clear / Follow / Hide / invite controls; a single relationship-status live region; loading `aria-busy`; Follow/Hide focus-visible rings; MatchBar decorative; a **text equivalent** for the match meaning (the band); a local `INK` contrast token (~7.3:1 on the `#06060a` canvas) for small load-bearing labels; a **colour-contrast-enabled axe pass clean**; no horizontal overflow at the six target widths (360/390/430/768/1280/1440); reduced-motion-safe (global reset); deterministic visual baselines. *(This is not a claim of full-app WCAG compliance.)*

---

## 12. Testing and browser evidence (reconciled from source)

- People **unit tests: 66** (4 files); **full unit suite: 1,445**.
- People **E2E: 19 `test()` literals → 23 executed scenarios** (the axe-standard loop is parametrized ×5) + 1 Playwright setup project = **24 reported passes**.
- People **visual states: 8** (+ 1 setup = 9 passes).
- People **baselines: 8 Darwin + 8 Linux** PNGs.
- Authenticated-visual suite: 6 files (discover/home/library/movie/profile/**people**); public-visual: 2 files.

**The F8.8 fixture** signs in the dev test user for real (the sanctioned auth setup) and then **intercepts every `/rest/v1/**` request before navigation** — fail-closed: a cross-user behavioural read (`user_history`/`user_ratings`/`reviews`/`diary`) or a retired view aborts and **fails the test**; an own/shell read returns empty; there is no direct `users` fallback; follow writes are intercepted + ledgered; images are mocked; users are fictional + deterministic. No live action.

**Honest caveat:** intercepted browser proof verifies the *contract* and protects live data, but **private beta is still needed** to observe real user trust, match quality and social-safety signals.

---

## 13. Architecture

- `usePeopleData.jsx` — data orchestration through the narrow RPCs (own follows + own similarity + opt-in filter + identity/taste/FOF RPCs);
- `derive/peoplePresentation.js` — **pure** trust/evidence presentation (no React/Supabase);
- `hooks/usePeopleFollowActions.js` — settled relationship actions + session-local Hide + focus recovery;
- `People.jsx` — renders only the current product surface;
- `people.css` — responsive / a11y / contrast layout;
- `e2e/fixtures/people.js` + `e2e/app/people.e2e.js` + `e2e/visual-auth/people.visual.js` — the browser-proof layer;
- SQL/RPC migrations — the privacy boundary.

No reducer rewrite was necessary; ranking formulas were preserved; Follow payloads preserved; Feed restoration deliberately not implemented.

---

## 14. Frozen contracts (at F8 close)

`users` owner-only · `user_follows` participant-only · the People identity/search/FOF RPCs · the taste-profile discovery RPC · discoverability opt-in (default-off) · qualitative taste bands · the evidence floor · no exact visible match percentage · no friendship language for algorithmic matches · settled Follow/Unfollow · session-local Hide · no Feed before beta · no cross-user activity · `/feed`→`/home` redirect · no public Profile browsing · no cross-user behavioural reads.

---

## 15. Readiness verdict

**READY FOR PRIVATE / BETA TESTING.**

- F8.1 found **one P0** (anonymous People exposure) and no surviving P1;
- F8.2 **closed the People P0**;
- F8.6 surfaced **two live global security P0s**;
- F8.6-SEC **closed them**;
- F8.9 (live + source + an independent adversarial hunt) found **no open P0/P1**;
- People is coherent, consent-led and tested.

→ **F8 can formally close.** This is **not** unrestricted public-production approval — public social rollout requires the additional work in §16/§18.

---

## 16. Deferred register

### P2 — before public social rollout
block / report / mute / remove-follower; durable Hide (if needed); a moderation queue + abuse escalation; audit logging; a **publication-consent contract** for Feed/activity; audience controls; rate limiting / anti-scraping for the authenticated discovery RPCs; pagination for larger networks; the **RLS-dead Movie/Home/Profile social-widget cleanup**; the residual SECURITY DEFINER views `list_follower_counts` + `vw_movies_scored`; an `increment_session_interactions(uuid)` anon-execute review; `pg_trgm`/`pg_net` extensions in `public`; leaked-password protection; OTP expiry; the available Postgres patch; the scheduler/diagnostic **function-body migration drift** (only grants are tracked).

### P3 — polish
stale comments referencing Feed; harmless dead fallbacks (e.g. the `user_history?.[0]?.count` fallback in `deriveSuggestedFOF`); minor naming cleanup; live beta observation of social usefulness; an optional future "People you follow" directory; the second invite-toast `aria-live`.

**Deferred Feed is not a blocker** — it is the deliberate, safe design.

---

## 17. Beta-learning plan

Private beta must teach: whether users understand opt-in discovery; whether the qualitative bands feel trustworthy; whether films-in-common evidence is enough context; whether Follow has enough value without a Feed; whether session-local Hide is enough for a trusted beta; whether users want a Feed at all; whether users want public/follower-only Profiles; whether sparse matches read as honest; match quality; search usefulness; trust reactions to seeing other people; and any abuse or safety signal.

---

## 18. Future Feed / social contract

Future Feed/social restoration must **start with consent, not UI.** A future Feed phase must decide: which actions are publishable; **default-off** publication; the audience (followers / following / mutuals / opted-in taste matches / signed-in members); revocation; deletion/unpublish; historical backfill; review/Diary treatment; ratings/date visibility; moderation; block/report/remove-follower; least-data RPCs; no raw table reads; and full E2E/visual/a11y proof.

---

## 19. Next initiative recommendation

The F3–F8 core surfaces (Discover, Home, Film File, Library, Profile, People) are now beta-ready and need observation. Recommended next work:

1. **Private-beta instrumentation and operational readiness** — the recommended single product initiative, since the core surfaces are beta-ready and need real-user observation; **and/or**
2. a **cross-app global security hardening track** for the residual §16 P2 security backlog (run in parallel — it is independent of People beta).

**Do not** recommend Feed restoration as the next product phase — Feed/social expansion should wait for private-beta evidence and the publication-consent contract.

---

## 20. Closure statement

**F8 is complete.** People is **opt-in, consent-led and least-data**. There are **no open P0/P1**. **Feed is deliberately deferred.** People is **ready for private beta.** **Unrestricted public social rollout requires additional consent, moderation and security work** (§16/§18).
