# Onboarding — Beta-Readiness

*Companion to [`f2-summary.md`](./f2-summary.md). Produced at F2.26 from the F2.22 production-readiness audit + the F2.23/F2.24 remediations + the F2.25 architecture audit.*

## 1. Verdict

# READY FOR PRIVATE / BETA TESTING

- **No P0 release blockers** were found in the F2.22 production-readiness audit.
- The one concrete **P1 cross-account onboarding-draft leak** was fixed in **F2.23** (`622a29cc`).
- Completion **re-run safety** was improved in **F2.24** (`409a159b`) — onboarding-sourced history + ratings now use a replace-by-source write, so a re-run can't duplicate or conflict.
- **The full live first-time journey remains unvalidated against a disposable real backend user**, because there is no non-production Supabase project and no sanctioned disposable-user workflow (auth is Google-OAuth-only; the only test user is the shared, already-onboarded dev account, which must not be used). The unit/component suite + per-phase Playwright are strong but mock the backend.

**This is not a claim of public-production readiness.** See §7 / §9.

## 2. Beta entry checklist

- [ ] Latest `main` deployed (prod = **Cloudflare Pages**, `app.feelflick.com`).
- [ ] Required env vars present: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_TMDB_API_KEY` (+ optional `VITE_ADMIN_EMAILS`, `VITE_SENTRY_DSN`, `VITE_POSTHOG_*`).
- [ ] Google OAuth callback configured (`/auth/callback`) and the redirect URL allow-listed in Supabase Auth.
- [ ] Supabase connection healthy (`getSession` works; RLS owner policies in place).
- [ ] TMDB search healthy (the movie-search combobox returns results; rate-limit headroom).
- [ ] Onboarding unit/component tests green (`vitest run src/features/onboarding` → 153/13 at F2.26).
- [ ] `npm run lint` + `npm run build` green.
- [ ] Error monitoring available (Sentry prod ingest; CSP report-only/enforcing).
- [ ] Beta users told they are testing a **preview** (set expectations).
- [ ] A cleanup/support path exists for a stuck beta user (see §8) — and a way to re-run onboarding if needed.

## 3. Experience checklist

- [ ] **Auth → gate → onboarding** — sign-in → `PostAuthGate` → incomplete user lands on `/onboarding`, no flash-of-home/discover, no redirect loop.
- [ ] **MoodStep** — 0/1/3 selection, attempt a 4th (capped), max-cap feedback, Continue gate, keyboard + visible focus.
- [ ] **GenresStep** — 0/1/many, toggle off, ≥1 to continue, wrapping on mobile.
- [ ] **MoviesStep** — suggestions grid (no horizontal shelf), select/remove, "Your anchors" pips, the search combobox (type → results → arrow-nav → Enter/Escape/outside-click), pool/search error + retry, ≥5 to continue.
- [ ] **RatingStep** — Okay/Liked/Loved map to okay/liked/loved, Skip advances without rating, arrow-key stage shortcuts, auto-finish on the last rating.
- [ ] **CelebrationReveal** — mood pills + posters reflect the picks, "Tonight is yours.", "Next up" coaching, ~12s hold, 900ms fade.
- [ ] **`/discover` handoff** — opens on "How do you feel?", no duplicate celebration overlay, no stale onboarding chrome.
- [ ] **Re-login gate** — the completed user is not re-onboarded; `/onboarding` redirects them to `/home`.

## 4. Accessibility checklist

- [ ] **Keyboard-only** — logical tab order, no traps, every control operable (tiles / combobox / verdicts / Skip / Back).
- [ ] **Visible focus** — focus-visible ring on all controls.
- [ ] **Touch / coarse pointer** — ≥44px targets, no MoviesStep autofocus / soft-keyboard pop, no hover-only meaning.
- [ ] **Reduced motion** — DnaRail instant fill; MoviesStep skeleton suppressed; RatingStep drag disabled; CelebrationReveal stages prompt, no infinite loops.
- [ ] **Screen-reader semantics** — single h1 on celebration; one `role=progressbar`; DnaRail textual labels; combobox/listbox; `role=alert` errors.
- [ ] **Live regions** — partitioned, no competing announcements; CelebrationReveal has exactly one atomic status.
- [ ] **360×640 short viewport** — h1 + coaching visible, no horizontal overflow.

## 5. Responsive matrix

| Viewport | Verified (isolated/per-phase Playwright) |
|---|---|
| 360 × 640 | ✓ MoviesStep grid 3-col · RatingStep verdicts 48px · Celebration fits (h1+coaching) |
| 390 × 844 | ✓ |
| 430 × 932 | ✓ |
| 768 × 1024 | ✓ grid 5-col |
| 1280 × 720 | ✓ Celebration fits (wide-but-short) |
| 1440 × 900 | ✓ |

- **Verified:** per-phase, on isolated component renders (mocked data), with 0 console errors.
- **NOT yet verified:** the **complete journey as one live backend run** (real OAuth → DB writes → celebration → `/discover` → re-login). This is the §7 P1-2 gap.

## 6. Frozen contracts

**Finish-flow ordering** (do not change casually — protected by `OnboardingFinishFlow.test.jsx`):
`completeOnboarding({ markAuthComplete: false })` → parallel persistence + prefetch → **12000 ms** min hold → **900 ms** fade → `navigate('/discover')` → `markOnboardingAuthComplete()` **after** navigation.

**Rating mappings:** `okay = 5` · `liked = 7` · `loved = 9`.

**Thresholds / destinations:** `MIN_GENRES = 1` · `MIN_MOVIES = 5` · **mood maximum = 3** · first landing = **`/discover`** · the **deferred auth-metadata flip** · the **user-scoped onboarding draft key** (`ff_onboarding_draft_v1_${userId}`, cleared on sign-out / completion / onboarded-redirect; legacy global key migrated once then deleted).

## 7. Deferred follow-up register

### P1-2 — Non-production environment & live E2E gap *(the main gate before public production)*
- **Priority:** P1 · **Status:** open.
- **Current:** no development/staging Supabase project; no disposable first-time-user tooling (auth is Google-OAuth-only; no service-role cleanup path); no true-backend onboarding E2E spec (`e2e/` covers landing + about only).
- **Prerequisite:** a sanctioned non-production environment **or** a consenting-beta validation protocol.
- **Recommended trigger:** before declaring public-production readiness.
- **Resolution options:** (a) provision a non-prod Supabase + an automated disposable-user create/cleanup workflow + an onboarding E2E spec; **or** (b) validate the complete journey with consenting private-beta users + formal cleanup/support procedures (§8).

### P2-2 — Transactional completion RPC *(F2.25 decision)*
- **Priority:** P2 · **Status:** deferred (do **not** implement before beta).
- **Preferred design (hybrid RPC):** the client keeps **movie resolution** (the TMDB detail fetch can't run in Postgres); a single RPC **atomically** replaces `user_preferences` / `user_history` / `user_ratings` + sets the `users` completion fields, scoped to `auth.uid()` (never a caller-supplied id); the **auth-metadata flip stays deferred** until after the celebration + `/discover` handoff.
- **Prerequisite:** the schema-capture gap (below) resolved, a non-prod env to validate against, and **staging validation is mandatory**.
- **Recommended trigger:** post-beta, **only if** live evidence shows the idempotent client flow is unreliable. (Not an automatic public-launch blocker — see §9.)

### Schema-capture gap *(prerequisite for the RPC)*
- The completion tables' **columns** are documented in `docs/SUPABASE_SCHEMA.md`, but the executable `supabase/migrations/` do **not** contain the `CREATE TABLE` definitions, the exact **unique constraints**, or the full **RLS policies** for `users`, `user_preferences`, `user_history`, `user_ratings` (they live in the live DB). F2.24 chose the constraint-agnostic replace-by-source strategy precisely because of this. These must be **captured/verified as migrations** (and the owner-scoped write policies confirmed) before writing the RPC.

### Minor follow-ups *(not blockers)*
- **MoviesStep clear-X touch target** — the search "clear" (✕) icon hit-area is < 44px (convenience-only; redundant clear paths exist).
- **`handleFinish` defensive re-entry guard** — add an explicit early-return (`if (celebrate) return`); currently safe via the unmount-clears-timer chain.
- **`PostAuthGate` render-test coverage** — its redirect branches are verified by code-reading; the derivation is unit-tested.
- **`OAuthCallback` render-test coverage** — same.
- **Optional draft-schema evolution** — a versioning strategy beyond the `v1` key marker, if the draft shape changes.

## 8. Safe live-beta validation procedure

1. **Never** reset or reuse the shared dev user (`feelflickDevUser`).
2. Use a **consenting beta user** or a **disposable non-production account** only.
3. Record the initial **auth metadata + profile state** (onboarding flags, row counts) before starting.
4. Complete onboarding **once**.
5. Verify writes: `user_preferences` (genres) · `user_history` (favorites, `source='onboarding'`) · `user_ratings` (5/7/9, `source='onboarding'`) · the `users` completion fields · the `/discover` handoff · the re-login gate (no re-onboarding).
6. Record any **console errors + route transitions**.
7. **Clean up** all created data **only** when using a disposable account.
8. **Never** use production **service-role** credentials in browser/client tooling.
9. **Never** claim the full journey is validated without **real backend evidence** (DB rows + route transitions captured).

## 9. Go / no-go rules

**Private beta is GO when:** `main` checks are green · the environment is healthy (§2) · no new P0/P1 regression is open · a support/cleanup path is available (§8).

**Public production is NO-GO until:** a live first-time journey is verified against a real backend · the environment / E2E gap (P1-2) is closed (or covered by the beta wave) · the schema/RLS assumptions are confirmed · public-launch monitoring/support expectations are met.

> The **transactional RPC (P2-2) is not necessarily required before public production** — if live beta evidence shows the F2.24 idempotent client flow is reliable, the RPC can stay deferred. Treat it as a **risk-informed decision, not an automatic launch blocker**.

## 10. Closure statement

- The **F2 product/UI redesign is complete** — all four step bodies + the chrome + the celebration are on the unified editorial, accessible language.
- The **immediate P1 privacy remediation is complete** (F2.23, user-scoped draft).
- **Client completion idempotency is complete** (F2.24, replace-by-source).
- **Remaining work is infrastructure / validation / architecture** (the non-prod-env + live-E2E gap, and the optional transactional RPC) — **not further onboarding visual redesign.**
