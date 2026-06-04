# F9G.2 — Cloudflare Inline-Script CSP Blocker: Diagnosis

> **Phase F9G.2. Diagnosis + documentation — NO enforcing CSP, no code change.**
> Pins down the one CSP report-only violation from F9G.1 and documents the fix
> options. **The report-only CSP stays in place; the app is not broken.** No
> recommendation/schema/Edge/package change. F8C remains blocked.

**Status:** ✅ root cause precisely identified; ⏳ fix requires a Cloudflare-side
action (no zone-settings access from this repo). Enforcement stays **deferred**.
**Date:** 2026-06-04.

---

## 1. Original violation (F9G.1)

`Content-Security-Policy-Report-Only` on production logged one violation —
`Blocked 'script' from 'inline:'` (`script-src-elem`), Sentry issue
[`FEELFLICK-APP-5`](https://feelflick.sentry.io/issues/FEELFLICK-APP-5). F9G.1
attributed it to "the Cloudflare RUM beacon."

## 2. Root cause — corrected: Cloudflare **JavaScript Detections** (Bot Management)

Re-inspecting the production DOM, the offending inline `<script>` (the only
non-`ld+json` inline script) is:

```js
(function(){function c(){var b=a.contentDocument||a.contentWindow.document;if(b){
  var d=b.createElement('script');
  d.innerHTML="window.__CF$cv$params={r:'a0638bf3cc3b5d15',t:'MTc4MDU0MDU1Mg=='};
    var a=document.createElement('script');
    a.src='/cdn-cgi/challenge-platform/scripts/jsd/main.js';
    document.getElementsByTagName('head')[0].appendChild(a);";
  b.getElementsByTagName('head')[0].appendChild(d)}} … })();
```

The `window.__CF$cv$params` marker + the `/cdn-cgi/challenge-platform/scripts/jsd/`
loader identify this as **Cloudflare JavaScript Detections (JSD)** — a Bot
Management feature, **not** Web Analytics/RUM. Confirmed:

- **It is NOT the RUM beacon.** Cloudflare Web Analytics loads
  `static.cloudflareinsights.com/beacon.min.js` as an **external** script — already
  allowed by `script-src … static.cloudflareinsights.com` → **no violation**.
- **It is NOT Rocket Loader** (DOM probe: `rocketLoader: false`).
- Cloudflare's own docs reproduce our **exact** console error for "JavaScript
  Detections + CSP without a nonce."

### Why it can't be hash-pinned, and why it's intermittent
- The inline script embeds **per-request values**: `r:` = the Cloudflare **ray ID**
  (unique per request) and `t:` = a per-request token. Its content — and therefore
  its SHA-256 hash — **changes every request**, so a CSP `hash` cannot pin it.
- JSD injects on **bot-detection-eligible requests** (e.g. a fresh session), then
  trusts the `cf_clearance` cookie and the script **self-removes** after running. So
  the violation is **intermittent**, not on every load (observed: fired on a fresh
  load, absent on an immediate hard-reload).

> Our CSP **already satisfies** Cloudflare's requirement that
> `/cdn-cgi/challenge-platform/` be allowed — those scripts are served from the
> origin (`app.feelflick.com`) and covered by `script-src 'self'` (they load 200).
> **Only the injected inline bootstrap** is flagged.

## 3. Cloudflare change applied? — No (no access); manual/architectural decision required

There is **no Cloudflare zone-settings access** from this environment — the
available Cloudflare MCP is Developer-Platform only (Workers/Pages/D1/KV/R2), and no
Cloudflare API token is present. So no setting could be toggled here. Per Cloudflare's
official docs, the options are:

| Option | What | Tradeoff | Who can do it |
|---|---|---|---|
| **A. Disable JS Detections** | Cloudflare dash → **Security → Settings** (or **Security → Bots → Configure**) → turn **JavaScript Detections** **Off** | **Only possible on Super Bot Fight Mode / Enterprise Bot Management.** On **Bot Fight Mode (free), JSD is auto-enabled and CANNOT be disabled.** Slightly reduces bot-detection signal. | account owner (dashboard) |
| **B. Per-request CSP nonce** *(Cloudflare-recommended)* | Emit a unique `nonce-…` in `script-src` per response; Cloudflare parses the CSP header and **auto-applies the nonce to its injected JSD script** | A static `public/_headers` file **cannot** emit per-request nonces → needs a **Cloudflare Pages Function / Worker** (`functions/_middleware.js`) to generate the nonce + set the CSP header. Modest infra addition; keeps `script-src` strict. | a follow-up infra phase |
| **C. `'unsafe-inline'` in `script-src`** | Allow all inline scripts | **Last resort — discouraged by both Cloudflare and this project**; defeats much of `script-src`'s XSS protection. Not done. | — |
| ~~Hash-pin the JSD script~~ | — | **Non-viable** — per-request content (§2). | — |

**Manual path for Option A** (if the plan supports it):
`dash.cloudflare.com` → select account + `feelflick.com` → **Security → Settings**
→ **JS detections** → toggle **Off** → Save. **Expected:** the `__CF$cv$params`
inline script is no longer injected → the report-only inline-script violation stops.
**Rollback:** toggle it back **On**.

## 4. Verification (current state — fix not yet applied)

- ✅ `content-security-policy-report-only` still live on `app.feelflick.com`; **no
  enforcing CSP**; all F9D headers intact.
- ✅ App renders; Google Fonts, TMDB images, Supabase, and **Sentry error ingest**
  all work; the external `/cdn-cgi/challenge-platform/` + `cloudflareinsights` scripts
  load fine.
- ⏳ The JSD inline-script violation **still occurs intermittently** (report-only →
  logged to Sentry Security, **never blocks**). Unchanged because no Cloudflare-side
  action could be applied from here.

## 5. Enforcement readiness

🟡 **Still deferred.** The allowlist is otherwise complete (F9G.1: zero other
violations on `/` and authenticated `/home`). The **single** remaining blocker is the
JSD inline bootstrap, which must be handled by **Option A** (disable JSD — if the plan
allows) or **Option B** (nonce via a Cloudflare Pages Function — Cloudflare's
recommended approach, keeps `script-src` strict) before flipping
`…-Report-Only` → `Content-Security-Policy`. Also, before enforcing: add a `report-to`
/ `Reporting-Endpoints` header and drop the deprecated `child-src`.

## 6. Rollback

Nothing was changed in the repo (docs only), so there is nothing to roll back here.
If Option A is applied in Cloudflare and causes any issue, toggle JS Detections back
**On**. The report-only CSP can be removed any time by deleting the
`Content-Security-Policy-Report-Only` line from `public/_headers` + `vercel.json`.

## 7. Remaining CSP work

1. Pick and apply **Option A or B** (§3) to clear the JSD inline-script violation.
2. Add `report-to`/`Reporting-Endpoints`; drop deprecated `child-src` (keep
   `worker-src` + `frame-src`).
3. Monitor Sentry → Security a few more days for any other violation types.
4. Flip report-only → enforcing; re-smoke `/`, `/about`, `/home`, `/movie/:id`.

## 8. F8C gate — unchanged

**F8C (engine tuning) remains BLOCKED.** F9G.2 is CSP hardening diagnosis only. F8C
still needs a post-deploy outcome-capture baseline that is non-trivial and **stable
across real users** — capture is proven (F9C), real-user volume is not there yet.
