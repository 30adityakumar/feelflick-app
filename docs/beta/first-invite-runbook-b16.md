# First private-beta invite runbook (B1.6)

Status: **current operator runbook.** For inviting the **first 1–2 trusted private-beta users** only.

Companion docs: [`operator-dashboard-b1.md`](operator-dashboard-b1.md) (dashboards, funnels, health SQL), [`instrumentation-b1.md`](instrumentation-b1.md) (event taxonomy + payload policy). Health scripts: [`../../scripts/verify-beta-gate.sql`](../../scripts/verify-beta-gate.sql), [`../../scripts/beta-health.sql`](../../scripts/beta-health.sql).

> Placeholders: `<APP_URL>` = the production app URL, `<USER_UUID>` = a Supabase `auth.users.id`. **Never paste a real UUID, email, or name into this file, a PR, or a chat.**

---

## 1. Purpose and readiness basis

This runbook invites the **first 1–2 trusted users** to a private beta. It is **not** public beta or public production, and it does **not** roll out any Feed / social-publication feature.

**Readiness basis (B1.5, main `bb5a2456`): 0 P0 / 0 P1.** Every invite action below is **manual and reversible**.

Assumptions:
- latest `main` (includes B1.4b) is deployed;
- the beta gate exists but is **disabled by default** (`VITE_ENABLE_BETA_GATE` unset);
- PostHog analytics are privacy-hardened (id-only identify, all-text-masked replay);
- Sentry + PostHog projects are configured;
- `public.beta_members` is **empty** until an operator acts.

Production is served by **Cloudflare Pages** (env vars + redeploy are done there).

---

## 2. Pre-invite checklist

- [ ] Deploy latest `main`; record the deployed SHA (expected ≥ `bb5a2456`).
- [ ] Confirm the Cloudflare Pages production deployment is healthy (build green, site loads).
- [ ] Confirm production env vars exist: `VITE_ENABLE_BETA_GATE`, `VITE_POSTHOG_KEY`, `VITE_SENTRY_DSN`, and the existing `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` / `VITE_TMDB_API_KEY`.
- [ ] Confirm B1.2 analytics posture: PostHog `identify` sends the user id only (no email/name), session replay masks all text + inputs, and the Account → Privacy "Product analytics" toggle suppresses capture when off.
- [ ] Confirm B1.4a gate: gate default off, `beta_members` exists, owner-only SELECT, **no client write policy** (run the verify script in §5).
- [ ] Confirm B1.4b events exist: onboarding funnel, Discover funnel, People/Profile events (see `instrumentation-b1.md`).
- [ ] Run [`scripts/verify-beta-gate.sql`](../../scripts/verify-beta-gate.sql) (read-only) — see expected properties in §5.
- [ ] Run [`scripts/beta-health.sql`](../../scripts/beta-health.sql) (read-only, aggregate) — baseline counts.
- [ ] Confirm cron / daily-briefing health (the `email_sends` + `cron.job_run_details` sections of the health SQL).
- [ ] Confirm the Sentry project is receiving deploy/test events (if a recent event exists).
- [ ] Confirm the PostHog project is receiving safe events (e.g. `page_viewed`, `home_opened`).
- [ ] Confirm no open P0/P1 (B1.5 = none; re-check Supabase advisors if time-sensitive).

> Do not paste script output containing user ids into this doc, a PR, or chat — the scripts are written to return aggregates only.

---

## 3. Enable the beta gate

**Enable** (Cloudflare Pages → production env):
```
VITE_ENABLE_BETA_GATE=true
```
then **redeploy production**.

**Disable / rollback:**
```
VITE_ENABLE_BETA_GATE=false
```
then **redeploy production**.

Behavior:
- **Off (default):** authenticated users pass through normally (the gate runs no query — transparent).
- **On:** only `beta_members` with `status='active'` reach the authenticated app surfaces.
- Legal / public / auth routes stay reachable regardless (`/`, `/about`, `/privacy`, `/terms`, the auth callback, and intentionally-public catalog/list routes).
- A signed-in non-member sees the calm **"Private beta access required"** screen — no raw error, no redirect loop.

---

## 4. Add the first beta member(s)

Use **service-role / admin SQL only** (Supabase SQL editor). **Never** add members from the browser; the table has no client write policy.

```sql
insert into public.beta_members (user_id, status)
values ('<USER_UUID>', 'active')
on conflict (user_id) do update set status = 'active';
```

Rules:
- add only **1–2 trusted users**;
- **never** store an email/name in `beta_members` (the table has no such columns — keep it that way);
- **never** paste a real UUID into docs, PR comments, or chat;
- verify after insert (§5).

**Revoke** (immediate deny):
```sql
update public.beta_members set status = 'revoked' where user_id = '<USER_UUID>';
```

**Temporary pause:** the gate allows **only** `status='active'`, so **any** non-`active` value denies access. To pause without deleting the row:
```sql
update public.beta_members set status = 'paused' where user_id = '<USER_UUID>';
```
(Re-enable by setting `status='active'`.)

---

## 5. Verify access

Run [`scripts/verify-beta-gate.sql`](../../scripts/verify-beta-gate.sql) (read-only). Expected:
- RLS **enabled** on `beta_members`;
- **owner-only SELECT** (`auth.uid() = user_id`);
- **no** INSERT/UPDATE/DELETE policy for `anon`/`authenticated` (service-role only);
- a random authenticated user and `anon` both read **zero** rows;
- `authenticated` is granted SELECT only.

Manual smoke checklist (read-only — do not perform destructive route actions):
- [ ] public routes load (`/`, `/about`, `/privacy`, `/terms`);
- [ ] login works;
- [ ] with the gate **on**, a **non-member** sees the access-required fallback;
- [ ] a **member** reaches `/home`;
- [ ] no redirect loop;
- [ ] `/privacy` stays public;
- [ ] `/lists/:id` public-list behavior is unchanged (explicitly-public lists viewable; private lists owner-only).

---

## 6. Feature kill switches

All default **on** (no behavior change unless explicitly set to `false`/`0`/`off`). Set in Cloudflare Pages env + redeploy.

| Flag | Default | Disabled behavior | User sees | When to disable |
|---|---|---|---|---|
| `VITE_ENABLE_PEOPLE` | on | `/people` mounts no provider/RPC | "People is taking a short break" | People misbehaves / a privacy concern on the surface |
| `VITE_ENABLE_PROFILE_REFRESH` | on | reflection refresh makes no Edge call | honest "couldn't refresh" state | the `generate-taste-summary` Edge function is failing |
| `VITE_ENABLE_DISCOVER_RECOMMENDATIONS` | on | no scoring runs; pick stage shows fallback | "Tonight's pick is paused" (Start over) | the recommendation flow is erroring |

Re-enable by setting the flag back to `true` (or removing it) + redeploy.

**Daily briefing:** there is **no fully-wired client flag**. The daily-briefing send is controlled by the **server pg_cron job + Edge function**; pause/disable it operationally there (cron / Edge function), not via a client env var.

---

## 7. Analytics & privacy disclosure checklist

Tell beta users (accurately):
- product analytics are used to improve reliability/usability during beta;
- PostHog receives a **stable account id** and **coarse events** — **no** email, name, search text, reviews, Diary entries, or Cinematic DNA reflection;
- session replay **may** be used, but **all text and form inputs are masked**;
- Sentry captures errors with privacy scrubbing (no account email/name/IP);
- they can **opt out** any time in **Account → Privacy → Product analytics**;
- first-party data is purged by the account-deletion flow where implemented;
- **PostHog deletion automation is not implemented yet.**

**Operational condition (PostHog deletion):** for the first 1–2 users, PostHog **person deletion is manual/operator-handled** if a user requests it (see §11). **Automate before expanding beyond the early trusted wave.** Do **not** claim automatic PostHog deletion.

---

## 8. Invite message template

> Hi <name> — you're one of the first people I'm letting into the FeelFlick private beta. It's a small, early test, so expect rough edges and a few unfinished corners.
>
> What to know:
> - It's invite-only right now; your account is on the list.
> - I collect **privacy-safe** usage analytics to fix bugs and see what's working — never your email, name, what you search, your reviews, your Diary notes, or your taste reflection. If session replay is on, all text and inputs are masked. Sentry catches errors with the same care.
> - You can turn analytics off any time in **Account → Privacy**.
> - A few things aren't built yet: there's **no activity feed**, **no block/report**, and Lists are **private by default** — they're only public if you choose to make them public.
> - If something breaks or feels off, just reply here — that feedback is the whole point.
> - Want out, or want your data removed? Tell me and I'll handle it (account deletion + a manual analytics cleanup until that's automated).
>
> Here's the link: `<APP_URL>` — sign in with the email I invited you on.

---

## 9. Known limitations to disclose

- no Feed / public social activity;
- no block / report / mute / remove-follower yet;
- Lists public sharing is **explicit/opt-in**, but **moderation is not built**;
- Account / Preferences / Lists / Browse have some known **P2 rough edges** (reliability/a11y polish);
- Discover may show an empty or **paused** fallback;
- Profile reflection refresh can be disabled;
- People can be disabled;
- the beta gate may temporarily block access if paused.

---

## 10. During-beta monitoring (first week, daily)

- [ ] run [`scripts/beta-health.sql`](../../scripts/beta-health.sql) (members, onboarding, opt-in/opt-out, 7-day rec outcomes, briefing/cron);
- [ ] Sentry: route errors (`route_error`) + new issues on `production`;
- [ ] Discover recommendation errors (`recommendation_error`);
- [ ] Profile refresh failures (`profile_reflection_refresh_failed`, esp. `error_kind=edge_error`);
- [ ] People usage (`people_opened` / `_follow_*` / `_hide_suggestion` / `_search_*`);
- [ ] onboarding funnel (`onboarding_started` → `onboarding_completed`);
- [ ] analytics opt-outs (health SQL);
- [ ] cron / daily-briefing health;
- [ ] feedback / manual messages;
- [ ] (if time-sensitive) re-check Supabase advisors for any P0/P1 regression.

For funnel/alert details see [`operator-dashboard-b1.md`](operator-dashboard-b1.md) — don't duplicate it here.

---

## 11. Incident response / rollback

**Auth / beta gate broken** → `VITE_ENABLE_BETA_GATE=false`, redeploy, pause invites, inspect Sentry.
**Discover failing** → `VITE_ENABLE_DISCOVER_RECOMMENDATIONS=false`, redeploy, verify the `DiscoverPaused` fallback, inspect `recommendation_error` + Sentry.
**People causing problems** → `VITE_ENABLE_PEOPLE=false`, redeploy, verify the `PeopleUnavailable` fallback.
**Profile refresh causing problems** → `VITE_ENABLE_PROFILE_REFRESH=false`, redeploy.
**Privacy issue appears** → pause invites; revoke the member (§4) if needed; turn analytics off if needed; investigate before continuing.
**User requests deletion/removal** → use the in-app account-deletion flow where possible; revoke the `beta_members` row if needed; **handle the PostHog person deletion manually** (find the PostHog person by **distinct id = the user's id** — never by email/name — and delete it in the PostHog UI/API) until automation lands; **do not promise instant deletion** while the process is manual.

---

## 12. Graduation gate to the 5–10 user wave

Before expanding beyond the first 1–2:
- [ ] the first 1–2 users completed onboarding successfully;
- [ ] no P0/P1 incidents;
- [ ] Discover error rate acceptable;
- [ ] no privacy/analytics regression;
- [ ] the manual PostHog deletion process has been tested, **or** automation is planned/scheduled;
- [ ] F9.3 route reliability/a11y cleanup completed **or** consciously deferred with a note;
- [ ] a Lists UGC moderation decision is made;
- [ ] the security backlog is reviewed (leaked-password protection, OTP expiry, the SECURITY DEFINER views, the Postgres patch);
- [ ] an operator can answer the §10 health questions without manual guesswork.

(Public-production perfection is **not** required to reach 5–10.)

---

## 13. Follow-up phases

1. **F9.3** — Account / Preferences / Lists / Browse reliability + accessibility cleanup.
2. **PostHog account-deletion automation** (a security/ops track, or folded into ops) once `process-account-deletions` is in-repo + a PostHog secret is provisioned.
3. **Global security hardening** — the SECURITY DEFINER views (`list_follower_counts`, `vw_movies_scored`); OTP expiry / leaked-password protection / Postgres patch; extensions in `public`; scheduler function-body migration drift.
4. **5–10 beta expansion** (after the §12 gate).
5. **Future Feed / social publication** — only after beta evidence **and** an explicit consent + moderation contract (deferred since F8.6).

---

## 14. Operator sign-off

- [ ] latest `main` deployed;
- [ ] beta gate enabled;
- [ ] beta member(s) inserted (service-role);
- [ ] gate verified (`verify-beta-gate.sql`);
- [ ] analytics verified (id-only, masked replay, opt-out);
- [ ] Sentry verified;
- [ ] health SQL reviewed;
- [ ] invite sent;
- [ ] rollback plan ready;
- [ ] known limitations disclosed.
