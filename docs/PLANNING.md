# FeelFlick — Active Sprint

> **Update this file yourself at the end of every work session.**
> Claude Code reads this at session start — keep it honest and current.
> Do NOT ask Claude to auto-update this file.

> **Now driven by the phased rebuild.** The full F0–F10 roadmap (objectives, scope,
> non-scope, validation, risk) lives in
> [feelflick-foundation-readiness-audit.md §8](feelflick-foundation-readiness-audit.md).
> This file tracks only the *active* slice — don't duplicate the roadmap here.

## Currently In Progress
- [ ] **F10B — Run Private Preview, Wave 1** (operations/monitoring only; engine FROZEN
      at `2.17`): prepared the Wave-1 operating sheet + invite copy + a (PII-free) tracker
      template (`docs/private-preview-wave-1-f10b.md`, `docs/private-preview-wave-1-tracker-template-f10b.md`).
      **Ran + recorded the pre-invite readiness checks** — prod 200, all 5 security headers,
      CSP-RO rotating nonce, Sentry clean (3 issues are all my own test artifacts), CI green
      on the last code commit, Cloudflare Pages healthy, Supabase auth grant OK, read-only
      pre-wave baseline = **3,376 impr / 8 dev users** (unchanged → no real traffic yet).
      **Invites NOT yet sent (your action).** Next: send the 2–3 Wave-1 invites, run the
      per-tester onboarding smoke, monitor daily, collect the first windowed real-user
      capture. **F8C still BLOCKED.**
- [ ] **F10C — Synthetic Persona Usability Lab** (parallel UX track while we wait for real
      testers): built a reusable persona lab under `docs/personas/` (schema, 16 personas,
      task script, rubric, Claude prompt pack, tooling proposal) + ran a 2-persona pilot;
      **F10C.1 merged it (PR #183, squash `00b8b4e4`) + classified the findings into a
      controlled backlog** (`docs/personas/persona-usability-backlog-f10c1.md`).
      **Synthetic ≠ real users — does NOT unblock F8C; nothing acted on.** Buckets 1–2
      (cold-start re-seeding, cold no-why, home-tail re-scroll) wait on **Wave-1 real-user
      validation**; Bucket 3 (honesty invariants) is a protect-list; Bucket 4 (imports/library/
      availability/social) is deferred. Next persona runs queued (cold-start, anti-slop, couple,
      JustWatch, Plex) — not run yet.

## Up Next (prioritized)
- [x] ~~Apply the Sentry Allowed-Domains dashboard fix~~ — ✅ done (user) + **verified
      in F9F** (prod ingest working; test error landed in Issues). Housekeeping: resolve
      the labeled `F9F-SENTRY-VERIFY` test Issue in Sentry.
- [ ] **CSP enforcement** — the report-only CSP now reports **ZERO violations** in prod
      (F9G.4: JSD violation resolved). Before flipping to enforcing: monitor Sentry →
      Security a few more days, add `report-to`/`Reporting-Endpoints`, drop deprecated
      `child-src` (keep `worker-src`+`frame-src`), then change
      `Content-Security-Policy-Report-Only` → `Content-Security-Policy` in
      `functions/_middleware.js` and re-smoke. (Housekeeping: resolve Sentry `FEELFLICK-APP-5`.)
- [x] ~~**Enable CI E2E + Lighthouse**~~ — ✅ **DONE in F9H.1** (PR #180, merged): 5 repo
      secrets uploaded (no values exposed) + Lighthouse collect restricted to `index.html`;
      both gates now run for real (`docs/ci-real-gates-verification-f9h1.md`).
- [ ] **Other hardening**: upgrade HSTS (`includeSubDomains`/preload) once subdomains are
      HTTPS-confirmed; color-contrast a11y pass.
- [ ] **F8C — Gated engine tuning** — the first phase allowed to touch scoring
      (highest blast radius). **Capture is now PROVEN in prod (F9C)**; the gate that
      remains is **VOLUME**, now being collected via the **F10B private preview** (Wave 1 →
      Wave 2): gather the windowed real-user baseline per
      `docs/private-preview-wave-1-f10b.md` §9 + `docs/outcome-baseline-collection-f10a.md`
      (§7 SQL, sliced by placement · `algorithm_version 2.17` · cold/warm) until the
      [volume gate](private-preview-plan-f10a.md#6-data-volume--duration-before-f8c)
      is green. Today only dev volume (8 users) → **still blocked**. THEN tune DB-first
      (recommendation-engine skill), leading with pool/coverage numbers + expected skip/watch effect.
- [ ] **F6C (later, gated)** — extend `generate-movie-overlay` to produce a
      `why_for_you` for non-curated films (Edge Function + prompt + honesty guards) —
      via the `supabase-change` skill.
- [ ] (later) F9–F10 per the F0 roadmap (F9 also owns the deferred Linux visual baseline).

## Blocked / Waiting
- [x] ~~**Linux landing visual baseline regeneration** (F4 landing)~~ — ✅ **RESOLVED
      in F9B.** Pushed `phase-f9a-release-ci-hardening:visual-baselines/rebuild` →
      the "Visual & A11y Regression" CI run regenerated + committed the Linux
      baseline (`5b9d0bad`); pulled the landing PNG back as `ed13b470`. CI changed
      exactly one file (`landing-fullpage-visual-linux.png`); `/about` untouched.
- [ ] (now-active, not a blocker) **F8C remains gated** — needs the post-deploy
      outcome-capture baseline (`docs/sql/recommendation-evaluation-queries.sql` §7).

## Done This Week
- [x] **F12B — PageContainer + type scale + missing h1s** (first premium-polish wave; engine frozen `2.17`;
      **zero rendered-pixel change**): added shared **`<PageContainer>`** primitive (size app1280/wide1440/
      narrow1080 + responsive padding none/sm/default/lg; layout-only) + additive **LAYOUT/GUTTER/TYPE**
      tokens; +13 tests (PageContainer 7 + token pins) = 533. **Added the 4 missing `<h1>` landmarks**
      (Home/Browse/History/Account) as **`sr-only`** (documented: each masthead is intentional — Briefing
      hero / filter toolbar / Diary eyebrow / editable identity — so a visible page-title would compete;
      sr-only fixes the a11y landmark + heading order at zero visual risk). **Byte-identical PageContainer
      adoption** on Account (size="app"=1280) + History (size="wide"=1440). **VERIFIED on LIVE authenticated
      Home/Browse/History/Account at 390/768/1280/1440** (Playwright harness): zero h-overflow all bp, h1count
      1 + srOnly true each, container maxW correct, **history-1280 byte-identical + account identical
      dimensions** (36-byte dynamic-content PNG noise). `TYPE` shipped as tokens (broad visible heading
      normalization deferred). No `<Button>`/`/about` impact. Docs: `docs/ui/page-container-type-h1-f12b.md`
      + DESIGN_SYSTEM §6c. lint/533/build/audit green. Next F12C = 44px mobile touch-target sweep. F8C blocked.
- [x] **F12A — Premium UI visual QA + responsive composition audit** (AUDIT ONLY, docs-only; engine frozen
      `2.17`): ran a REAL authenticated visual pass of **13 routes × 6 breakpoints** (390/430/768/1024/1280/
      1440) via the Playwright harness — captured **computed metrics + 26 screenshots** (7 directly reviewed;
      creds in env never printed; temp specs deleted; screenshots in `/tmp/ff-f12a/`, not committed). 7 docs
      in `docs/ui/`: QA protocol + route audit + component audit + responsive matrix + prioritized backlog
      (F12B–F12F) + skills/tooling eval + F12B plan. **Global positives:** zero horizontal overflow every
      route×bp, console clean, 100% alt coverage, trust panels (AccentPanel) + `/discover` hero = premium
      exemplars. **Top gaps:** (1) no shell container/max-width system (per-section gutters → wide-screen
      drift), (2) **missing `<h1>` on home/browse/history/account** (a11y), (3) **sub-44px mobile tap targets**
      (browse 74 / history 76 / account 20 @390), (4) type scale 36→102px not normalized, (5) button
      min-height 17px (the "buttons not polished" feel). **F12B proposed = PageContainer primitive + type-scale
      tokens + add the 4 `<h1>`s** (all additive/low-risk, no `<Button>`/`/about` impact). Onboarding flow NOT
      observed (dev user already onboarded → /home). No implementation. F8C still blocked.
- [x] **F11B.5 — AccentPanel `gradient` variant + PrimaryCaseCard proof** (design-system consolidation,
      engine frozen `2.17`; **zero rendered-pixel change**): extended `<AccentPanel>` with a constrained
      **`variant="tint"|"gradient"`** prop (default `tint` = F11B.4, unchanged → WhyThisPick byte-identical;
      `gradient` = the *encoded existing* PrimaryCaseCard surface `linear-gradient(160deg, ${tone}0f,
      transparent 72%)` + `${tone}33` border — a **fixed tone-driven recipe, NO angle/stop/gradient-string
      props**; unknown variant → tint fallback). **Proof migration: PrimaryCaseCard inner panel** →
      `<AccentPanel variant="gradient" tone="purple" radius="lg">` (maxWidth/padding stay consumer-owned;
      eyebrow/match %/chips/lead/nudge all preserved). **Byte-identical, verified on LIVE authenticated
      `/movie/:id` desktop+mobile** (`linear-gradient(160deg, rgba(167,139,250,0.06), transparent 72%)`,
      `…0.2` border, `12px`, padding `26px 30px`; match % + 5 chips intact). +3 tests (gradient parity guard,
      default-tint, unknown-variant fallback) = 522. **net zero new gradients** (moved into the primitive).
      **DnaConfidence NOT touched.** No Button/`/about` impact. Docs:
      `docs/ui/accent-panel-gradient-primarycase-f11b5.md` + DESIGN_SYSTEM §6b. lint/test/build/audit green. F8C blocked.
- [x] **F11B.4 — AccentPanel primitive + trust-surface consolidation** (design-system phase, engine
      frozen `2.17`; **zero rendered-pixel change**): added a new shared **`<AccentPanel>`** primitive —
      the accent-tinted sibling of the flat `<Card>` (tone tint `${tone}0d` + tone border `${tone}26` +
      token radius; tones = brand purple/pink + semantic amber/green/red + neutral; **NO arbitrary hex**;
      non-interactive default + reduced-motion-gated opt-in hover). +7 tests incl. a **parity guard**
      (tone=purple == the legacy WhyThisPick surface). **Proof migration: WhyThisPick only** → its
      always-`HP.purple` inline surface became `<AccentPanel tone="purple" radius="md">`, **byte-identical**
      (verified on LIVE authenticated `/home` via the Playwright harness: `rgba(167,139,250,0.05)` tint /
      `…0.15` border / `8px` radius; null-safety + copy preserved). **PrimaryCaseCard** (directional
      gradient → needs a future `gradient` variant) **+ DnaConfidence** (structural section) **deferred.**
      No route redesign, no behavior change, no `<Button>`/`/about` impact. Docs:
      `docs/ui/accent-panel-trust-surfaces-f11b4.md` + DESIGN_SYSTEM §6b. lint/test/build/audit green. F8C blocked.
- [x] **F11B.3 — Authenticated visual walkthrough + rhythm/token work** (engine frozen `2.17`; **zero
      rendered-pixel change**): ran a REAL live **authenticated** visual pass of Home/Movie/Profile
      (desktop+mobile) — signed in the dev user via the **Playwright e2e harness** (creds in env, never
      printed; chrome-devtools couldn't be used — Google OAuth + the credential guard) — captured
      screenshots + computed section rhythm. **Finding: the 3 routes are already visually coherent**
      (Briefing primary/tail subordinate; PrimaryCaseCard tight to hero; honest DnaConfidence) → evidence
      called for restraint, NOT pixel normalization (would be a redesign). Change set: migrated the
      remaining ad-hoc `borderRadius` literals in `movie/sections-{top,bottom}.jsx` +
      `profile/sections-{top,bottom}.jsx` to `RADIUS` tokens (999→pill/8→md/6→sm/4→xs; 3/14 left;
      80 ins/80 del, all 1:1). **No padding normalization, no `<Card>` forced** (surfaces are
      accent-tinted/poster, not flat) **— deferred to F11B.4 with the same walkthrough verification loop.**
      Zero-visual-change confirmed 3 ways (999↔9999 pill identical; computed rhythm byte-identical pre/post;
      screenshots identical). Docs: `docs/ui/authenticated-visual-walkthrough-f11b3.md` + `authenticated-card-rhythm-f11b3.md`.
      lint/test/build/audit green. F8C still blocked.
- [x] **F11B.2 — Page rhythm: Home/Movie/Profile** (rhythm/consistency foundation; engine frozen `2.17`;
      **zero rendered-pixel change**): added a `SPACE` page-rhythm token (gutter + section vertical scale +
      stack gaps) to `tokens.js`; re-exported `RADIUS`+`SPACE` from the 3 routes' `data.js`; adopted them in
      the **trust callouts** — `WhyThisPick` (radius), `PrimaryCaseCard` (radius + section padding tokens),
      `DnaConfidence` (radii + section padding) — all **exact-value swaps** (`RADIUS.md`=8, `SPACE.gutter`=88,
      …) so render is byte-identical. +2 SPACE token tests (512 total). **No section pixel values changed**
      (the 40–88px vertical variation is likely intentional hierarchy → normalize in F11B.3 with a live
      authenticated visual pass). No `<Button>`/baseline change. **Methodology: live authenticated browser
      walkthrough NOT run (kept dev creds out of the transcript) → audited code-grounded; E2E 14/14 is the
      functional safety net.** Docs: `docs/ui/page-rhythm-walkthrough-f11b2.md` + `page-rhythm-home-movie-profile-f11b2.md`.
      Next: F11B.3 (verified rhythm normalization + broad token migration). F8C still blocked.
- [x] **F11B.1 — Design tokens + primitive cleanup** (the safe UI foundation; engine frozen `2.17`):
      **purely additive — zero rendered change to any route/primitive → no visual baseline touched.**
      Added `RADIUS` (xs4/sm6/md8/lg12/xl16/pill9999), `SHADOW` (card/hover/focus — borders-over-shadows,
      brand-purple focus ring), `SURFACE` (base/panel/card/elevated aliases) to `src/shared/lib/tokens.js`;
      new **`<Card>`** primitive (`src/shared/ui/Card.jsx` + `Card.css`, reduced-motion-gated opt-in hover)
      exported from the barrel. Pinned contracts with tests (tokens scale, Card, Eyebrow tones + the
      reconciled landing-quiet variant via props, Button 5-variant pill/focus/size). Documented in
      `DESIGN_SYSTEM.md` §6a + `docs/ui/design-tokens-primitives-f11b1.md`. **Deferred (needs a deliberate
      re-baseline since `/about` uses the shared Button):** the button-font→Outfit alignment + inline-button/
      Eyebrow render convergence → F11B.2/B.3. No call-site mass-migration; gated by design-system-guard.
      Next: F11B.2 (page rhythm). F8C still blocked.
- [x] **F11A — UI consistency + visual design audit** (docs/audit only; engine frozen `2.17`; no UI
      implementation): created `docs/ui/` — `ui-inspiration-translation-f11a.md` (borrow disciplines,
      not visuals), `ui-inventory-f11a.md` (code-grounded tokens/primitives/patterns + live computed
      styles), `ui-consistency-audit-f11a.md` (drift classified P0–P3; no P0 code-level), `route-visual-audit-f11a.md`
      (12 routes), `feelflick-visual-direction-f11a.md` (cinematic/calm/honest + do-not-become),
      `claude-ui-skills-recommendation-f11a.md` (use existing design-system-guard/a11y/perf + frontend-design
      gated; install nothing 3rd-party), and `ui-polish-implementation-plan-f11b.md` (6 safe waves).
      Biggest drift: **no radius scale** (3/4/5/6/8/10/14/999 ad-hoc), two button languages
      (pill primitive vs inline rounded-rect 6–8 + Inter/Outfit), Eyebrow 700/purple vs landing
      `.ff-eyebrow` 600/white, Discover `purpleDeep` override, reduced-motion gaps (movie/profile/
      watchlist/history/account). Strongest to PRESERVE: the honesty layer + MovieCard hover LAW +
      single-pick primacy. **Nothing implemented; no engine/UI change; F8C stays blocked.** Next: F11B.1.
- [x] **F10D — Full synthetic 16-persona customer-journey simulation** (docs/UX-inspection only;
      engine frozen `2.17`): ran the full journey for all 16 personas (browser-observed landing +
      code-grounded auth surfaces; the served pick honestly NOT OBSERVED). New docs under
      `docs/personas/`: `full-synthetic-simulation-protocol-f10d.md`,
      `full-synthetic-persona-findings-f10d.md` (16 personas), `synthetic-cohort-findings-f10d.md`
      (cross-persona top-10 + risk matrix), `synthetic-outcome-matrix-f10d.md` (simulated behavioral
      predictions — clearly NOT data), `synthetic-ux-backlog-f10d.md` (5 buckets, nothing built),
      and **`real-preview-watch-items-from-simulation-f10d.md`** (the key output — what to observe/
      ask/measure in Wave 1, with confirm/disprove criteria). Top signals: cold-start is the
      make-or-break; the honesty layer is the top trust-builder (protect); `/home` tail = anti-drift
      watch. **SYNTHETIC ≠ real-user validation → does NOT unblock F8C; nothing implemented.**
- [x] **F10C.1 — Merge persona lab + classify findings** (docs only): merged PR #183 (squash
      `00b8b4e4`); created `docs/personas/persona-usability-backlog-f10c1.md` — pilot findings
      classified into 4 buckets: **(1) validate-with-real-users** (cold-start re-seeding, cold
      no-why, home-tail re-scroll), **(2) safe-UX-candidate-after-validation** (thin-why microcopy,
      re-seed prompt, "teach FeelFlick" guidance — queued, not built), **(3) protect/do-not-regress**
      (null-safe non-fabrication, ViewerNotes/DnaConfidence honesty, no fake social proof, honest
      match gloss), **(4) defer** (diary/Trakt/Plex/JustWatch/social integrations). Each item:
      source persona · evidence · severity · validation-required · next action. Next persona-run
      queue added. **Nothing implemented; synthetic ≠ validation; F8C stays blocked.**
- [x] **F10C — Synthetic Persona Usability Lab** (docs/UX-inspection only; engine frozen `2.17`):
      created `docs/personas/` — `persona-schema-f10c.md`, `synthetic-personas-f10c.md` (10 platform
      archetypes + 6 FeelFlick targets, all clearly labeled synthetic/no-proprietary-data),
      `persona-usability-tasks-f10c.md` (10 core tasks + persona probes), `persona-usability-rubric-f10c.md`
      (13 evidence-required dims), `claude-persona-test-prompts-f10c.md` (reusable run prompts +
      guardrails), `persona-testing-tooling-proposal-f10c.md` (docs-only `/persona-test` + subagent +
      Playwright proposal — nothing installed), and `persona-pilot-findings-f10c.md` (2-persona pilot:
      P3 Netflix scroller + P1 Letterboxd power user, live-landing + code-grounded). **Does NOT unblock
      F8C** (synthetic). Pilot Insights: cold-start re-seeding gap; cold Briefing shows no "why" (honest);
      honesty layer is a strength; `/home` tail anti-drift watch. No app/engine change.
- [x] **F10B — Run Private Preview, Wave 1 (prep)** (operations/docs only; engine frozen `2.17`):
      created the Wave-1 operating sheet (`private-preview-wave-1-f10b.md`) — cohort (2–3),
      invite sequence, tester invite copy (DM/email/reminder/feedback), daily monitoring
      checklist, data-freeze + triage + pause rules, Wave-2 success criteria, baseline/measurement
      plan with warning signs — and a **PII-free tracker template**
      (`private-preview-wave-1-tracker-template-f10b.md`). **Ran + recorded the full pre-invite
      readiness gate**: prod 200, 5 security headers, CSP-RO rotating nonce, Sentry clean (3
      issues = my own test artifacts), CI green on last code commit `ec2cdb6a`, Cloudflare Pages
      healthy, Supabase auth grant OK, read-only pre-wave baseline 3,376 impr / 8 dev users
      (hero any-outcome 3.84% / discover 23.88%). Invites not yet sent. F8C stays blocked.
- [x] **F10A.1 — Merge CI gates + private-preview docs**: merged **#180** (F9H.1 real CI gates,
      squash `ec2cdb6a`) then **#181** (F10A docs, squash `830ae679`); resolved the trivial
      PLANNING/README docs conflict preserving both phases; main green (lint/487/build/audit).
- [x] **F10A — Private Preview + Outcome Baseline (docs/measurement only)**: five new docs —
      plan + decision criteria (`private-preview-plan-f10a.md`), tester guide
      (`private-preview-tester-guide-f10a.md`), launch runbook
      (`private-preview-launch-runbook-f10a.md`), feedback template
      (`private-preview-feedback-template-f10a.md`), outcome-baseline collection plan
      (`outcome-baseline-collection-f10a.md`). Defined cohort (5–10 trusted, cold+warm
      film-watchers), success/blocker criteria, the F8C volume gate, and the daily
      monitoring/triage runbook. Ran the **read-only pre-preview dev baseline** (SQL §0/§7
      + offline harness): 8 users / 3,376 impressions, capture confirmed on hero+discover,
      0 on carousels (expected), 9 mixed `algorithm_version`s (current `2.17`). No runtime
      change; engine frozen. F8C stays blocked. *(Merged via PR #181 after F9H.1/#180.)*
- [x] **F9H.1 — Enable real CI gates (E2E + Lighthouse)** (`docs/ci-real-gates-verification-f9h1.md`):
      flipped both gates from skip-green to real. Uploaded the 5 GitHub Actions repo secrets
      (`E2E_TEST_EMAIL/PASSWORD`, `VITE_SUPABASE_URL/ANON_KEY`, `VITE_TMDB_API_KEY`) from approved
      local sources by piping each value over stdin to `gh secret set` — **no value printed,
      written, or committed**; presence verified via `gh secret list` (fresh timestamps).
      Fixed `lighthouserc.json`: added `collect.url: ["http://localhost/index.html"]` so lhci
      audits the SPA shell only (was also auto-auditing the `google…html` verification stub).
      Added `workflow_dispatch` to both gate workflows. CI on PR #180 confirmed E2E (14 passed)
      + Lighthouse run their real steps. Merged (squash `ec2cdb6a`). F8C still blocked.
- [x] **F9H — Non-skip CI gates (E2E + Lighthouse)** (`docs/ci-nonskip-gates-f9h.md`):
      docs-only, no workflow change. Documented why the **E2E** (`app-quality.yml`) and
      **Lighthouse** (`lighthouse.yml`) jobs are skip-green (preflight checks for missing
      repo secrets → all steps skip → green + `::notice::`), the exact 5 secrets to add
      (`E2E_TEST_EMAIL/PASSWORD` + `VITE_SUPABASE_URL/ANON_KEY` + `VITE_TMDB_API_KEY`) with
      `gh secret set` steps (NO values printed/committed; local dev creds NOT auto-uploaded),
      the gate strategy, and enablement caveats. Both workflows are structurally sound →
      auto-flip to real gates once secrets exist. Verified locally: **E2E 14/14**,
      lint/487 tests/build/audit green, and the prod landing **Lighthouse a11y = 0.96 /
      BP 100 / SEO 100** (so the `accessibility: error ≥0.9` assertion passes). Flagged:
      `lighthouserc.json` `staticDistDir` also audits the `google…html` verification stub
      → restrict to `index.html` before relying on it. **Maintainer action:** add the secrets.
- [x] **F9G.4 — CSP nonce production verification**
      (`docs/csp-nonce-production-verification-f9g4.md`): merged PR #177 (squash
      `8f68a235`) → Cloudflare Pages prod deploy. Verified on `app.feelflick.com`: the
      report-only CSP carries a **rotating per-request nonce** (two requests → two
      nonces), exactly one CSP-RO header, no enforcing CSP, all 5 F9D headers intact.
      In a fresh isolated browser session, **Cloudflare's injected JSD inline script now
      carries a nonce** → the `script-src-elem` violation is **GONE** (console clean, no
      `…/security/…` POST). Sentry `FEELFLICK-APP-5` stopped getting events (last seen =
      pre-deploy). App/JSD/Sentry/RUM all work. **Report-only CSP now reports zero
      violations** → enforcement eligible after monitoring. lint + 487 tests + build +
      audit green. No code change.
- [x] **F9G.3 — Cloudflare JSD CSP resolution via a Pages Function nonce** (Option B,
      user-chosen; `docs/cloudflare-csp-nonce-f9g3.md`): new **`functions/_middleware.js`**
      (the repo's first Cloudflare Pages Function) emits a **per-request CSP nonce** on
      HTML responses so Cloudflare auto-nonces its JS-Detections inline script — clears
      the last report-only violation **without `script-src 'unsafe-inline'`** (script-src
      stays strict). Moved the CSP out of `public/_headers` (F9D headers stay; exactly one
      CSP source now). Fail-open; static assets pass through (caching unaffected).
      **Verified on the CF Pages preview**: per-request nonce (two requests → two nonces),
      5/5 F9D headers present, single CSP-RO, no enforcing CSP, SPA renders + scripts
      execute + fonts/TMDB load, zero CSP violations. JSD-nonce effect is **prod-only**
      (preview bypasses JSD) → verify after merge. node --check + lint + 487 tests + build
      + audit green. **PR #177.**
- [x] **F9G.2 — Cloudflare inline-script CSP blocker diagnosis**
      (`docs/cloudflare-rum-csp-cleanup-f9g2.md`): diagnosis/docs only, no code change.
      **Corrected the root cause** — the one report-only CSP violation is **Cloudflare
      JavaScript Detections** (Bot Management; `__CF$cv$params` →
      `/cdn-cgi/challenge-platform/scripts/jsd/main.js`), NOT the RUM/Web Analytics beacon
      (that's external + already allowed by `script-src 'self'`). It's per-request (ray +
      token) + intermittent + self-removing → **hash-pinning non-viable**. No Cloudflare
      zone-settings access from the repo (Dev-Platform MCP only), so the fix is a manual/
      architectural decision: disable JSD (only on Super Bot Fight Mode/Enterprise — Bot
      Fight Mode free can't) OR Cloudflare's recommended per-request **nonce via a Pages
      Function**; `'unsafe-inline'` is last-resort/avoided. CSP stays report-only;
      enforcement deferred. lint + 487 tests + build + audit green.
- [x] **F9G.1 — CSP report-only production verification**
      (`docs/csp-report-only-verification-f9g1.md`): merged PR #174 (squash `86a0ebab`);
      `content-security-policy-report-only` **live on `app.feelflick.com`** (no enforcing
      CSP; all F9D headers intact); app renders + fonts/TMDB/Supabase/Sentry all work
      (report-only never blocks). Reporting pipeline verified end-to-end (browser POST to
      Sentry security endpoint → 200; report landed as Sentry issue `FEELFLICK-APP-5`).
      **Exactly one violation:** the Cloudflare-injected inline RUM beacon
      (`script-src-elem`) — prod-only (the `*.pages.dev` preview bypasses CF zone
      features) → handle before enforcing. lint + 487 tests + build + audit green. No
      code change.
- [x] **F9G — CSP report-only** (`docs/csp-report-only-f9g.md`): shipped
      `Content-Security-Policy-Report-Only` via `public/_headers` (Cloudflare Pages —
      prod) + mirrored `vercel.json`. Built the full source inventory from the F9C/F9F
      prod network captures; `style-src 'unsafe-inline'` (pervasive inline styles),
      `script-src` kept STRICT (built bundle has no inline-executable script). Reports
      to the Sentry CSP security endpoint (verified accepts reports → 200). **Never
      blocks** — collects violations to confirm what would break before enforcing. No
      enforcing CSP. lint + 487 tests + build (emits `dist/_headers` w/ CSP) + audit
      green. No product/engine change.
- [x] **F9F — Sentry ingest verification** (`docs/sentry-ingest-verification-f9f.md`):
      after the user added `app.feelflick.com`/`*.feelflick.com`/`localhost` to Sentry
      Allowed Domains, verified prod ingest works — 403→200 server-side (control
      `example.com` still 403, so the filter still enforces), browser envelope 200,
      **prod console fully clean**, and a labeled runtime test error (not committed)
      **landed in Sentry Issues** (env `production`, url `app.feelflick.com`, project
      `feelflick-app`) confirmed via read-only MCP. Replay masks text (no PII). lint +
      487 tests + build + audit green. No code change.
- [x] **F9E — Post-F9D production verification** (`docs/post-f9d-verification-f9e.md`):
      merged PR #171 (squash `0b9a1b5c`) → `main`; post-merge CI + Cloudflare Pages
      prod deploy green. **Security headers VERIFIED LIVE on `app.feelflick.com`**
      (`x-frame-options: SAMEORIGIN`, `x-content-type-options: nosniff`,
      `referrer-policy`, `permissions-policy: camera/mic/geo/browsing-topics=()`,
      `strict-transport-security: max-age=31536000`); browser smoke confirms the app
      renders + fonts/TMDB load + no header/CSP breakage (only the Sentry 403 remains).
      **Sentry ingest still 403** — Sentry MCP is read-only (no inbound-filter write),
      so the Allowed-Domains dashboard toggle is still the one manual step. lint + 487
      tests + build + audit green. No code change.
- [x] **F9D — Production Observability + Security-Header Hardening**
      (`docs/production-observability-security-f9d.md`): config + docs only, no
      product/engine change. **Root-caused the Sentry 403** — it's an Origin/
      Allowed-Domains inbound filter (200 server-to-server, 403 with any browser
      Origin incl. app.feelflick.com), NOT a bad DSN/env → one-time Sentry dashboard
      fix documented (no code change). Shipped safe security headers (X-Frame-Options,
      Permissions-Policy, HSTS, + explicit nosniff/Referrer-Policy) via **`public/_headers`**
      (discovered prod is **Cloudflare Pages**, not Vercel — so `_headers`, not
      `vercel.json`, is what reaches prod) + mirrored `vercel.json`. CSP deferred with
      a draft report-only policy. Documented CI secret names for E2E/Lighthouse.
      Validated: lint + 487 tests + build (emits `dist/_headers`) + audit 0 vulns.
- [x] **F9C — Merge / Deploy / Smoke / Outcome baseline**
      (`docs/post-merge-smoke-f9c.md`): merged rebuild PR **#169 (squash `c38cb473`)**
      → `main` + **Vercel Production deploy** (app.feelflick.com); post-merge CI +
      local gates green; live smoke (public + authenticated) all render; **F8B
      outcome capture VERIFIED in prod** (recency-gated save flipped a real
      impression's `added_to_watchlist`; >72h impression correctly not attributed).
      Only console error = pre-existing **Sentry-ingest 403** (flagged). **F8C still
      blocked** — capture proven, no real-user volume yet. No scoring/schema/UI change.
- [x] **F9B — Linux visual baseline** — regenerated via the `visual-baselines/*`
      CI flow (`ed13b470`); PR #169 "Visual Regression" green on ubuntu-latest.
- [x] **F9A — Release / CI / Production Hardening Prep**
      (`docs/release-readiness-f9a.md`): docs/validation-only — no code change.
      Audited the rebuild branch for PR/CI readiness: it's a clean fast-forward of
      `main` (12 commits ahead, 0 divergence; 81 files, +6,475/−673; no engine/
      schema/edge files). Ran the full local matrix green — lint, **487 tests**,
      build, `npm audit` (0 vulns), eval, **e2e 14/14** (public+app), **visual 2/2
      (Darwin)**. Mapped CI gates: quality-gate green; e2e/Lighthouse skip-green
      until secrets; CodeQL informational. **One real blocker:** the Linux landing
      visual baseline is pre-F4 (CI-only; needs the `visual-baselines/*` push flow
      — documented, not pushed, no approval). Wrote release-readiness doc with the
      validation matrix, deploy/rollback/smoke + post-deploy outcome-capture
      checklists, and the restated F8C gate. No scoring/schema/UI/route change.
- [x] **F8B — Recommendation Outcome Capture Repair**
      (`docs/recommendation-outcome-capture-f8b.md`): instrumentation-only, engine
      untouched. Fixed the F8A capture gap — `useUserMovieStatus` (the one hook
      behind save/watch on the Briefing, every carousel, and the Movie page) wrote
      to `user_watchlist`/`user_history` but never flagged the impression; the
      carousel click passed `placement` as the action arg (silent no-op); the
      Briefing open recorded no click. New `recordRecommendationOutcome` helper
      attributes save/watch/click to the most-recent impression ONLY when it's
      recent (72h window) — so generic/direct actions never falsely attach, and
      the Briefing "See More"→Movie-page→Save conversion auto-captures with no
      nav-state or schema change. Reused existing impression columns (no migration/
      RLS/edge change). Added 17 tracking tests (helper 8, hook 4, MovieCard +2,
      eval +3) + §7 read-only verification SQL + `conversionFunnel`/
      `captureByPlacement` harness metrics. Real post-deploy baseline still to be
      collected before F8C tuning.
- [x] **F8A — Recommendation Trust + Evaluation foundation**
      (`docs/recommendation-trust-evaluation-f8a.md`): evaluation-FIRST, engine
      untouched. Added a current-state map + a 6-family metrics framework (fit/
      outcome, repeated-pick fatigue, diversity/anti-bubble, reason coverage,
      explanation-quality rubric, cold/warm); a SAFE offline fixture harness
      (`src/shared/services/eval/recommendationEval.js` + `fixtures.js` +
      `scripts/eval/run-recommendation-eval.mjs` → `docs/eval/` baseline); read-only
      SQL templates (`docs/sql/recommendation-evaluation-queries.sql`, verified
      against live schema); 18 new Vitest contracts. Read-only DB baseline found the
      headline gap: **outcome capture is effectively broken** (≈0.5% watch capture;
      events funnel 0 watched/0 skipped) — so F8B must fix capture before tuning.
      Reason coverage is strong (1/3,288 generic); hero déjà-vu near zero. No
      scoring/schema/UI/`ENGINE_VERSION` change.
- [x] **F7 — Cinematic DNA / Profile vNext** (`docs/cinematic-dna-profile-vnext-f7.md`):
      removed three cold-state fabrications (masthead fake taste summary/signature →
      honest "still forming"; Skew + YIR now self-hide instead of inventing "you vs
      everyone" / "18 films in December" samples); new self-only `DnaConfidence` section
      frames the number as taste *evidence* (not accuracy/score-of-you) with cold/warm
      guidance + a Tonight connection (moved out of the bare QuickStats stat). Shared
      `dnaConfidence` formula UNCHANGED (consistent with `/account`). Added a
      `DnaConfidence` test + a `/profile` a11y e2e.
- [x] **F6B — Film File case-making UI** (`docs/film-file-case-making-f6b.md`): new
      `PrimaryCaseCard` leads `/movie/:id` with the consolidated tier-aware case
      (ff_take → adaptive header → honest standalone; folds in the previously-buried
      FF Take); reframed `critic_quotes` → honest **`ViewerNotes`** ("not real
      reviews" disclaimer); made `data.js` Parasite placeholders explicit
      (`PARASITE_*_SAMPLE`, gated). Existing data only; engine/schema/edge untouched.
      Verified: lint + 447 tests + build + authenticated `/movie` e2e (poster→detail,
      watchlist Save, a11y) all green.
- [x] **F6A — Film File case-making design** (`docs/film-file-case-making-f6a.md`):
      current-state map + tiered hierarchy + UI/data-contract plan + F6B options.
      Corrected the F0 "one seeded film" shorthand: the Film File already has a
      rich, tiered, never-fabricating case layer (`deriveWhyReasons`/`MoodRadar`/
      `boundaryWarnings`) + a lazy `generate-movie-overlay` edge pipeline (ff_take/
      critic_quotes/daypart, OpenAI server-side). Real gaps: `why_for_you` is
      curated-only, the case is distributed (no leading primary card), and
      `critic_quotes` (invented personas) need honest reframing. Recommended
      F6B = Option A (UI-only). Added `deriveWhyReasons`/`deriveWhyHeader` contract
      tests. Docs-only; no behavior change.
- [x] **F5 — Home / Briefing vNext** (`docs/home-briefing-vnext-f5.md`): surfaced the
      hidden `engineReason` as the Briefing's "Why this pick" case (new null-safe
      `WhyThisPick` — no fabrication on cold-start); replaced the loading text with a
      content-shaped `BriefingSkeleton`; kept the self-hiding supporting tail
      (Option A). Engine/schema/auth/routes untouched; skip/save/watch contracts +
      impression writes preserved.
- [x] **F4 — Landing + Onboarding vNext** (`docs/landing-onboarding-vnext-f4.md`):
      applied the parked landing-reusability stash (Eyebrow/AuthCTA/Wordmark +
      `useInView`; movie/profile excluded); tightened Community honesty framing
      ("Illustrative · taste twins grow as FeelFlick does"); added onboarding
      "why we ask" microcopy (Genres/Films/Rate). Engine/IA/auth untouched. Darwin
      visual baseline re-generated; Linux pending (see Blocked).
- [x] **F3 — Design System Hardening** (`docs/design-system-hardening-f3.md`): retired
      genuine brand-ambient/accent drift (router `LandingBg`, SearchBar hover,
      ErrorBoundary → sanctioned `red`); documented brand-vs-semantic tokens (amber/
      red/green kept as load-bearing semantics); exported `Eyebrow` from `@/shared/ui`;
      added a tokens contract test. Inline `HP` holdouts were already resolved
      (Discover + browse spread `baseHP`). `stash@{0}` reviewed, left intact, not applied.
- [x] **F2 — Information Architecture v2** (`docs/ia-v2-decision-record.md`): nav now
      encodes the surface hierarchy — mobile bottom-nav hero moved Discover →
      **Tonight** (`/home`); desktop pills reduced to Tonight · Discover · DNA
      (Browse/Watchlist demoted to the account menu); "Home" → "Tonight" label.
      Routes/guards unchanged. Added a `BottomNav` IA-contract test.
- [x] **F1 — Product Doctrine + README/Docs Alignment** (`docs/product-doctrine.md`,
      `docs/product-research-patterns.md`; README/architecture/overview reconciled).
- [x] F0 — Foundation Readiness Audit (`docs/feelflick-foundation-readiness-audit.md`).
- [x] chore: npm audit clean — `npm audit` reports **0 vulnerabilities** (resolved).
- [x] fix: ESLint clean — `npm run lint` passes with 0 warnings (the prior
      rules-of-hooks ×8 + no-unescaped-entities ×47 backlog is resolved).
- [x] fix: `recommendations.helpers.test.js` now passes in the standard suite
      (full unit suite green: 417 tests / 33 files).

---

## How to Use

**Start of session:** Tell Claude Code — *"Read CLAUDE.md, PLANNING.md, and CLAUDE-REFERENCE.md before we start."*

**End of session:** Move in-progress items to Done, add new items to Up Next.

**Session handoff note (optional):** Add a one-liner below about where you stopped:

> _Last stopped: ..._
