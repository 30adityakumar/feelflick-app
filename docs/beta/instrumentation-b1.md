# Private-beta instrumentation (B1.x) — operator reference

Status: **current**. Scope: how FeelFlick observes private beta safely. No secrets, no real dashboard URLs.

The privacy posture from B1.2 is load-bearing: **identify sends a stable user id only** (no email/name), **PostHog + Sentry session replay mask all text**, **no raw search/Diary/review/DNA text is ever sent**. B1.3 adds a small event taxonomy, a fail-closed event wrapper, error buckets, and runtime kill-switches — all on top of that posture.

## Event taxonomy (source of truth: `src/shared/services/betaEvents.js`)

Every beta event goes through `trackEvent(EVENTS.x, payload)`, which delegates to `analytics.track` (opt-out aware). The allow-list of event names lives in `EVENTS`; a un-allow-listed name is dropped.

**Instrumented in B1.3:**
- People — `people_opened`, `people_search_used`, `people_search_empty`, `people_follow_succeeded`, `people_follow_failed`, `people_unfollow_succeeded`, `people_hide_suggestion`
- Profile — `profile_reflection_refresh_started` / `_succeeded` / `_failed`
- Home — `home_opened`
- System — `route_error` (from the global ErrorBoundary)
- Onboarding — `onboarding_completed` (predates B1.3, emitted via `analytics.track`)

**Defined but not yet emitted** (reserved in `EVENTS`, wire in B1.4): the Discover recommendation funnel (`discover_opened`, `recommendation_shown`/`_opened`/`_saved`/`_error`), `home_error`, `nightly_pick_shown`, `profile_opened_self`, `profile_forming_state_seen`, `people_empty_state`, `auth_error`, `supabase_error`. These were deferred to avoid touching the Discover recommendation flow / hook-order-sensitive components in an instrumentation-only phase.

## Safe payload policy

`trackEvent` is fail-closed (enforced by `betaEvents.test.js`):
- payload keys must be in `ALLOWED_KEYS` (e.g. `surface`, `result_count`, `result_kind`, `movie_id`, `*_bucket`, `error_kind`, `from_cache`, `has_results`) — anything else is dropped;
- values that look like PII/freeform (email, JWT, URL, text > 64 chars, any object/array/Error) are dropped;
- `null`/`undefined` are stripped.

**Never sent:** email, name, username, avatar, phone; search query text; review / Diary / Cinematic-DNA / freeform text; user-entered movie titles; other users' ids (People events carry `surface` + buckets only — no target id/name); tokens/secrets/JWTs; raw backend error messages (use `errorKind()` → `auth` / `permission_denied` / `timeout` / `network` / `edge_error` / `supabase_error` / `unknown`).

`movie_id` (catalog id) is allowed where useful. The current signed-in user is the PostHog distinct id via `identify` only.

## Kill-switches (`src/shared/config/betaFlags.js`)

`isEnabled(key)` reads a public env var, **defaults to enabled** (no behavior change), and disables on `false`/`0`/`off`. Set at deploy time to disable a misbehaving surface without a code change; the surface must then show an honest fallback.

| Flag | Env var | Wired fallback |
|---|---|---|
| `people` | `VITE_ENABLE_PEOPLE` | `/people` shows "taking a short break" and mounts **no** provider/RPC |
| `profileRefresh` | `VITE_ENABLE_PROFILE_REFRESH` | refresh shows the honest "couldn't refresh" state, no Edge call |
| `dailyBriefing` | `VITE_ENABLE_DAILY_BRIEFING` | defined; not yet wired (server-side cron is the real control) |
| `discoverRecommendations` | `VITE_ENABLE_DISCOVER_RECOMMENDATIONS` | defined; not yet wired |

## PostHog funnel suggestions

- **Activation:** `onboarding_completed` → `home_opened` → first `people_*` / `profile_reflection_refresh_*`.
- **People engagement:** `people_opened` → `people_search_used` → `people_follow_succeeded`; watch `people_follow_failed` / `people_search_empty` / `people_hide_suggestion` rates.
- **Profile reliability:** `profile_reflection_refresh_started` → `_succeeded` vs `_failed` (with `error_kind` breakdown).

## Sentry alert suggestions

- spike in `route_error` (or by `error_kind`);
- spike in `profile_reflection_refresh_failed` `error_kind=edge_error` (the taste-summary Edge function);
- spike in `people_follow_failed` `error_kind=permission_denied` (would indicate an RLS regression);
- auth-error rate; new-issue alerts on the `production` environment.

## Beta metrics

Activation (onboarding→home→first action), People engagement (open/search/follow/hide rates), Profile refresh success rate, and reliability (route/Profile/People error buckets). All from the events above — no PII required.

## Retained gaps / deferred

- **Discover recommendation funnel** + Home `nightly_pick_shown` + onboarding step/abandon events — deferred to B1.4 (touching the recommendation flow needs the engine evaluation process, out of scope here).
- **`page_viewed` path values** can contain dynamic ids (`/profile/:id`, `/lists/:id`). Consider redacting dynamic path segments in B1.4.
- **Operator dashboard** — none built; use PostHog/Sentry directly per above.
- Server-enforced **beta access gate** (allowlist) — only the client-side `VITE_ADMIN_EMAILS` exists; a real gate is a separate phase (B1.4).

## Data retention

- First-party event/session tables are purged on account deletion by `process-account-deletions`.
- **PostHog retention gap:** PostHog data is **not** automatically deleted on account deletion, and no app-side PostHog delete call exists. The Privacy page therefore does **not** claim PostHog deletion. Closing this (a PostHog person-delete on account deletion, plus a documented retention window) is a B1.4 item. Sentry replays sample at 10% and mask all text.
