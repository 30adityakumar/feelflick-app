# F9H — Make CI Truthful: non-skip E2E + Lighthouse gates

> **Phase F9H. CI/release hardening — docs only.** Documents exactly why the E2E and
> Lighthouse CI gates are "skip-green," the secrets needed to make them run for real,
> and the recommended gate strategy. **No workflow code change** (both workflows are
> structurally sound — they auto-flip to real gates the moment the secrets exist).
> **No secret values are printed or committed.** No product/engine/schema/package
> change. F8C remains blocked.

**Status:** ✅ documented + locally verified (E2E 14/14; landing Lighthouse a11y 0.96).
The substantive enable step (adding repo secrets) is the maintainer's. **Date:** 2026-06-04.

---

## 1. Current "skip-green" state

Two jobs pass green without actually running, by design, so they never blocked PRs
before the repo was set up:

| Gate | Workflow | Why it skips | What it would do with secrets |
|---|---|---|---|
| **E2E (Playwright)** | `.github/workflows/app-quality.yml` (`e2e` job) | Preflight: `HAVE_CREDS = secrets.E2E_TEST_EMAIL != '' && secrets.VITE_SUPABASE_URL != ''`. If false → `ready=false` → every step `if: ready == 'true'` is skipped → job is green + a `::notice::`. | `npm run test:e2e` (public + app projects) against a Playwright-auto-started Vite dev server, signing in the dev test user. |
| **Lighthouse CI** | `.github/workflows/lighthouse.yml` | Preflight: `HAVE = secrets.VITE_SUPABASE_URL != ''`. If false → `ready=false` → skipped → green + a `::notice::`. | `npm run build` (with `VITE_*`) → `treosh/lighthouse-ci-action` against `./dist` per `lighthouserc.json`. |

The skip is **announced** (a `::notice::` annotation on each run) — it is not silent —
but a green check still *reads* like a pass. This doc makes the gap explicit; the fix
is to add the secrets (below), after which the gates run for real with **no code change**.

> The **visual-regression** + **public a11y** gates already run for real (they use dummy
> env, no secrets). `quality-gate` (lint/test/build/audit), CodeQL, and GitGuardian also
> run for real. Only E2E + Lighthouse are gated on secrets.

## 2. Required GitHub Actions repo secrets

Settings → **Secrets and variables → Actions → New repository secret**. *(No values are
printed here.)*

| Secret | Used by | Value source |
|---|---|---|
| `E2E_TEST_EMAIL` | E2E | the dev test user (`.claude/local-secrets.json` → `feelflickDevUser.email`) |
| `E2E_TEST_PASSWORD` | E2E | the dev test user password (`feelflickDevUser.password`) — **sensitive** |
| `VITE_SUPABASE_URL` | E2E + Lighthouse | the Supabase project URL (non-secret; already in the client bundle) |
| `VITE_SUPABASE_ANON_KEY` | E2E + Lighthouse | the Supabase **anon** key (public; RLS enforces access; already in the bundle) |
| `VITE_TMDB_API_KEY` | E2E + Lighthouse | the read-only TMDB client key (public; already in the bundle) |

`VITE_*` are public client keys (safe as CI secrets, already shipped in the browser
bundle). `E2E_TEST_*` are the dev test user's credentials — keep the password out of
logs/commits.

### Setup (CLI) — run yourself; do not paste values into chat
```bash
# requires admin on the repo; gh prompts for / reads the value (never echoed)
gh secret set E2E_TEST_EMAIL        --repo 30adityakumar/feelflick-app
gh secret set E2E_TEST_PASSWORD     --repo 30adityakumar/feelflick-app
gh secret set VITE_SUPABASE_URL     --repo 30adityakumar/feelflick-app
gh secret set VITE_SUPABASE_ANON_KEY --repo 30adityakumar/feelflick-app
gh secret set VITE_TMDB_API_KEY     --repo 30adityakumar/feelflick-app
```
> **Not done in F9H:** no secrets were uploaded — the task said configure only with
> *user-provided* values, and none were provided. The local dev creds were **not**
> auto-uploaded.

After setting them, the next matching PR/push runs **real** E2E + Lighthouse — no
workflow edit needed.

## 3. Recommended gate strategy

The current wiring is already close to ideal; recommendation:

| Tier | Runs | Target | Block? |
|---|---|---|---|
| **PR gate (fast)** | lint · test · build · `npm audit` · visual-regression · public a11y | CI build | **blocks** (already real) |
| **PR gate (auth E2E)** | `e2e` job once secrets exist | Playwright vs a CI-started dev server (not prod) | **blocks** on real failures; until then skip-green |
| **PR gate (Lighthouse)** | `lighthouse` job once secrets exist | the built `./dist` (static) | a11y **error**; perf/SEO/best-practices **warn** |
| **Scheduled / manual** *(optional, future)* | a production smoke + Lighthouse vs `app.feelflick.com` | **production** | warn / report (don't fail the build on prod variance) |

E2E targets a **CI-built preview** (the auto-started dev server), not production —
correct (no prod side effects, deterministic). Lighthouse targets the **static dist**,
not prod — correct. A separate scheduled/`workflow_dispatch` production smoke could be
added later, but is **out of F9H scope**.

## 4. Local verification (this branch, `main` tree)

| Check | Result |
|---|---|
| `npm run lint` | ✅ clean |
| `npm run test` | ✅ 487 passed (44 files) |
| `npm run build` | ✅ |
| `npm audit --omit=dev --audit-level=high` | ✅ 0 vulnerabilities |
| `npm run test:e2e` (public + app, dev creds) | ✅ **14 passed** — so the E2E gate flips to a **real passing gate** once secrets exist |
| Lighthouse (prod landing, desktop) | ✅ **Accessibility 96**, Best Practices 100, SEO 100 |

**The `accessibility: error, minScore 0.9` assertion would PASS** for the landing
(0.96 ≥ 0.90) — the known color-contrast exception lowers the category but not below
the threshold. (`performance` is **warn**-only → never blocks; not measured here.)

## 5. Enablement caveats (handle before flipping Lighthouse on)

1. **`staticDistDir` also audits `dist/google246413e30c9bee30.html`** (a Google
   site-verification stub) — Lighthouse would test it alongside `index.html`, and a
   stub page may score poorly on SEO. **Recommend** restricting the Lighthouse collect
   to `index.html` (switch `collect` to `url`/serve + a single URL, or move the
   verification file out of `dist`) before enabling, so the gate doesn't fail/warn on a
   non-page. *(Not changed in F9H — it needs a CI run to validate.)*
2. **Performance budget** (`performance: warn ≥0.85`, LCP/CLS/TBT warns) — the landing is
   media-heavy; perf may warn. All perf assertions are **warn**, so they report but
   don't block. Tighten to `error` only after reviewing real CI numbers.
3. **E2E in CI** uses a client-side sign-in against the **production** Supabase project
   (the dev test user). That's the same path the suite uses locally; it writes a few dev
   rows (sessions/impressions) per run — acceptable for a test user.

## 6. Remaining blockers / follow-ups

- **Add the repo secrets** (§2) — the one action that makes E2E + Lighthouse real (maintainer).
- Refine the Lighthouse collect to `index.html` (§5.1) before relying on it as a hard gate.
- Unrelated security follow-ups still open: CSP enforcement (after the monitoring window),
  HSTS `includeSubDomains`/preload, color-contrast a11y.

## 7. F8C gate — unchanged

**F8C (engine tuning) remains BLOCKED.** F9H is CI hardening only. F8C still needs a
post-deploy outcome-capture baseline that is non-trivial and **stable across real
users** — capture is proven (F9C), real-user volume is not there yet.
