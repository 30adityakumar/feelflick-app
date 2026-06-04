# F9H.1 — Enable real CI gates: E2E + Lighthouse (no longer skip-green)

> **Phase F9H.1. CI/release hardening — flip the two skip-green gates to real.**
> F9H *documented* why E2E + Lighthouse skip (missing repo secrets) and left the
> enable step to the maintainer. F9H.1 *performs* it: uploads the 5 repo secrets
> from approved local sources and fixes the Lighthouse collect scope so it audits
> the app, not the Google-verification stub. **No secret values are printed,
> written to docs, or committed.** No product/engine/schema/package change. F8C
> remains blocked.

**Status:** ✅ secrets configured + Lighthouse scope fixed; both gates now run for
real (CI-confirmed on the F9H.1 PR). **Date:** 2026-06-04.

---

## 1. What changed

| Action | Detail |
|---|---|
| **Uploaded 5 GitHub Actions repo secrets** | `E2E_TEST_EMAIL`, `E2E_TEST_PASSWORD`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_TMDB_API_KEY` — the exact names the two preflights check. Values came from approved local sources (`.claude/local-secrets.json` → `feelflickDevUser` for the E2E creds; the gitignored local `.env`/`.env.local` for the `VITE_*` client keys). |
| **Fixed Lighthouse collect scope** (`lighthouserc.json`) | Added `collect.url: ["http://localhost/index.html"]` alongside `staticDistDir`. lhci now serves `./dist` and audits **only `index.html`** instead of auto-discovering every `*.html` (which also picked up `dist/google246413e30c9bee30.html`, a one-line Google site-verification stub that has no `<title>`/meta and would score poorly on SEO). |
| **Added `workflow_dispatch:`** to both gate workflows | `app-quality.yml` + `lighthouse.yml` now allow on-demand manual runs — useful for verifying/debugging the secret-gated gates without waiting for a qualifying code PR. **Side benefit:** because `.github/workflows/app-quality.yml` is in the `quality-gate` *and* `e2e` paths filters, editing it makes both jobs run **for real on this PR** (full lint/test/build + a real Playwright E2E against the new secrets) — i.e. the E2E gate is demonstrated live here, not just enabled. |

The gate **logic** is unchanged — both workflows already self-flip to real the
moment the secrets exist (F9H). The repo changes this phase are minimal: the
one-line `lighthouserc.json` scope fix + a one-line `workflow_dispatch:` trigger
on each workflow.

### Why E2E needed the workflow touch to prove out

The `e2e` job is intentionally **path-filtered** (`dorny/paths-filter`) to code
changes — `src/**`, `public/**`, `index.html`, `e2e/**`, `playwright.config.*`,
`package.json`, `package-lock.json`, `.github/workflows/app-quality.yml`. A
secrets-only / docs-only change correctly **does not** run E2E (no code to test) —
so on the first F9H.1 commit (lighthouserc + docs) E2E finished green in ~5s via
the path filter, **not** the secret gate. Adding the `workflow_dispatch:` line to
`app-quality.yml` is a legitimate, lasting improvement that also satisfies the e2e
paths filter, so the gate executes its real steps here and we can confirm it
passes in the CI runner (not just locally).

## 2. Secret handling (how no value was exposed)

- Each value was piped to `gh secret set <NAME> --repo …` over **stdin** (read
  from the local `.env`/`.env.local` via a silent `source`, and from
  `local-secrets.json` via a captured `node` read). The value never appeared as a
  command-line literal, in stdout, in a file, or in the diff.
- Verified **presence only** via `gh secret list` (names + updated-at; GitHub
  never returns secret values). All 5 show a fresh `2026-06-04` timestamp.
- `VITE_*` are public client keys (already shipped in the browser bundle — safe as
  CI secrets). `E2E_TEST_PASSWORD` is the **dev test user's** password (a throwaway
  test account, not a real user); it is encrypted at rest and only exposed to
  Actions, never readable back.

## 3. Why the Lighthouse scope fix is correct (lhci behavior)

With `staticDistDir` set and **no** `url`, lhci globs `**/*.html` and audits each
file it finds — here that's both `index.html` **and** the verification stub. When
`url` **is** provided alongside `staticDistDir`, lhci (a) starts its static server
on a random port, (b) rewrites each listed URL's origin to that server, and (c)
audits **only** the listed URLs (auto-discovery is bypassed). So
`["http://localhost/index.html"]` → exactly one audited page, the SPA shell, served
from `./dist`. Budgets/assertions are unchanged.

> A local `npx @lhci/cli collect` dry-run was **not** performed (it would
> npx-download the CLI; declined). The authoritative proof is the **CI Lighthouse
> job on this PR**, which runs the real `treosh/lighthouse-ci-action` against this
> config. The change is strictly *narrowing* (one page instead of two) so it can
> only reduce gate noise, never add a failure that auditing `index.html` alone
> wouldn't already surface.

## 4. Local validation (this branch)

| Check | Result |
|---|---|
| `npm run lint` | ✅ clean |
| `npm run test` | ✅ **487 passed** (44 files) |
| `npm run build` | ✅ (produces `dist/index.html` + the stub) |
| `npm audit --omit=dev --audit-level=high` | ✅ 0 high/critical |
| `lighthouserc.json` parses | ✅ valid JSON |
| `npm run test:e2e` | ✅ **14/14** on this exact tree (re-verified in F9H; the lighthouserc change does not touch E2E) — now also runs in CI for real |

## 5. Expected CI effect (confirmed on the PR run)

| Gate | Before F9H.1 | After |
|---|---|---|
| **E2E** (`app-quality.yml` → `e2e`) | preflight `HAVE_CREDS=false` → all steps skipped → green + `::notice::` | `HAVE_CREDS=true` → Playwright runs (public + app) against a CI-started dev server, signing in the dev test user → **real pass/fail gate** |
| **Lighthouse** (`lighthouse.yml`) | preflight `HAVE=false` → skipped → green + `::notice::` | `HAVE=true` → build with `VITE_*` → lhci audits `./dist` `index.html` only → a11y **error ≥0.9** (landing scores 0.96 → passes), perf/SEO/best-practices **warn** |

The `::notice::… skipping …` annotations should no longer appear; both jobs run
their real steps.

## 6. Out of scope / unchanged

- **F8C (engine tuning) remains BLOCKED** — needs a stable real-user post-deploy
  outcome baseline; CI hardening doesn't touch it.
- Perf assertions stay **warn-only** (media-heavy landing) — tighten to `error`
  only after reviewing real CI numbers across a few runs.
- Open security follow-ups unchanged: CSP enforcement (after the monitoring
  window), HSTS `includeSubDomains`/preload, color-contrast a11y.
- A future scheduled/`workflow_dispatch` **production** smoke + Lighthouse (vs
  `app.feelflick.com`, warn-only) is still a possible later addition — not F9H.1.
