# Private-beta operator reference (B1.4)

Status: **current**. How an operator runs and observes the private beta. No secrets, no real dashboard URLs, no PII.

See also [`instrumentation-b1.md`](instrumentation-b1.md) (B1.3 event taxonomy + payload policy).

## Beta access gate (B1.4)

**Source of truth:** the `public.beta_members` table (`user_id`, `status`, `invited_by`, `created_at`). RLS lets a signed-in user read **only their own** row; no broad read; **no client write** (service-role only). No email/name is stored.

**Enforcement is flag-controlled and OFF by default.** The app gate (`BetaAccessGate` → `useBetaAccess`) only enforces when `VITE_ENABLE_BETA_GATE` is `true`/`1`/`on` in the deployed build. Default (dev/CI/current prod): transparent pass-through — no query, no behavior change. This keeps E2E/visual + existing users unaffected until you flip it on for a beta deploy.

**Operating the gate:**
1. Enable: set `VITE_ENABLE_BETA_GATE=true` in the Cloudflare Pages production env and redeploy.
2. Add a member (service-role / SQL editor only — never the browser):
   ```sql
   insert into public.beta_members (user_id, status) values ('<user-uuid>', 'active')
   on conflict (user_id) do update set status = 'active';
   ```
3. Revoke: `update public.beta_members set status = 'revoked' where user_id = '<user-uuid>';`
4. Verify RLS/grants: run `scripts/verify-beta-gate.sql` (read-only; proves owner-only read, no anon/broad read, no client write).

**Behavior:** anonymous users see public/marketing/legal routes as today. A signed-in non-member (gate on) sees a calm "Private beta access required" page (`BetaAccessRequired`). Approved members proceed normally. Onboarding + auth callback are never gated. Loading shows the brand splash; a membership-check error shows a safe "try again" fallback (no raw error, no redirect loop).

## DB-side health (read-only)

Run `scripts/beta-health.sql` (service role) — aggregate counts only (never emails/names/ids/titles): beta members (total/active), onboarding completion, taste-discovery opt-in + analytics opt-out counts, 7-day recommendation impression→click→save→watch, daily-briefing send/fail by day, and per-job pg_cron last-run/status.

## PostHog funnels (product events — see instrumentation-b1.md)

- **Activation:** `onboarding_completed` → `home_opened` → first `people_*` / `profile_reflection_refresh_*`.
- **People engagement:** `people_opened` → `people_search_used` → `people_follow_succeeded`; monitor `people_follow_failed` / `people_search_empty` / `people_hide_suggestion`.
- **Profile reliability:** `profile_reflection_refresh_started` → `_succeeded` vs `_failed` (split by `error_kind`).
- Paths in `page_viewed` are now **redacted** (`/profile/:id`, `/lists/:id`, `/movie/:id`, …) — no real ids leak (B1.4).

## Sentry alerts

Spike alerts on the `production` environment for: overall error rate; `route_error`; `profile_reflection_refresh_failed` with `error_kind=edge_error` (the taste-summary Edge function); `people_follow_failed` with `error_kind=permission_denied` (would flag an RLS regression). Sentry `beforeSend` strips account email/name/username/ip (B1.3).

## Minimum beta metrics

Beta members (active), active users, onboarding started/completed, Discover recommendation errors, People opened/follow/hide counts, Profile refresh failures, route errors, daily-briefing health, Edge-function failures, analytics opt-out + taste-discovery opt-in counts. All available from PostHog (events) + `beta-health.sql` (DB) + Sentry (errors) — none require PII.

## PostHog account-deletion retention — **deferred (not implemented in B1.4)**

First-party event/session tables are purged on account deletion by the `process-account-deletions` Edge function. **PostHog data is NOT deleted on account deletion**, and B1.4 does **not** implement it, because:
- `process-account-deletions` is **out-of-band** (not in repo source / `supabase/functions/`), so it cannot be edited in this phase;
- a server-side PostHog person-delete needs a PostHog **personal-API-key secret** that is not provisioned.

The Privacy page therefore (correctly) makes **no** PostHog-deletion claim. **Follow-up (B1.x):** add a server-side PostHog `DELETE /api/person` (by distinct id = user id, no email/name) to the account-deletion pipeline once that function is in-repo and the secret is provisioned, plus a documented PostHog retention window. Until then, treat PostHog as retaining pseudonymous (id-only) event data per its project retention.

## B1.4b funnel + health (shipped)

**Onboarding funnel:** `onboarding_started` (mount), `onboarding_step_completed` (`step_key` = `mood`/`genres`/`movies`), `onboarding_error` (`error_kind`), `onboarding_completed` (now through the central wrapper with **bucketed** counts — `genre_count_bucket` etc., never raw counts/titles/genres). *`onboarding_abandoned` not wired — no clean abandonment signal exists; revisit if drop-off needs it.*

**Discover funnel:** `discover_opened` (mount), `recommendation_requested` (resolve stage), `recommendation_shown` (`result_count` + `from_cache`), `recommendation_error` (`error_kind`), `recommendation_opened` + `recommendation_saved` (carry `movie_id` only — never title/context). These are a **minimal PostHog funnel bridge**; `recommendation_impressions` remains the first-party source of truth for detailed outcomes.

**Discover funnel suggestion:** `discover_opened` → `recommendation_requested` → `recommendation_shown` → `recommendation_opened`/`recommendation_saved`; watch `recommendation_error` by `error_kind`.

**Discover kill-switch (now wired):** `VITE_ENABLE_DISCOVER_RECOMMENDATIONS=false` → the scoring (`scoreMovieForUser`) is **not** run and the pick stage shows an honest "Tonight's pick is paused" fallback (`DiscoverPaused`) with a Start-over button — no request, no spinner hang, no crash. Default on.

**Safe error buckets:** failures emit `error_kind` only (via `errorKind()`) — onboarding (`onboarding_error`), Discover save/resolve (`recommendation_error`), Profile refresh (`profile_reflection_refresh_failed`), People follow (`people_follow_failed`), route (`route_error`). Never raw error text / Supabase error objects / SQL / tokens.

## Retained gaps (B1.x)

`onboarding_abandoned` (no signal); `edge_function_error`/`supabase_error` are reserved in `EVENTS` but emitted only where a clean swallowed-error boundary exists; an operator dashboard UI; the PostHog account-deletion implementation (below).
