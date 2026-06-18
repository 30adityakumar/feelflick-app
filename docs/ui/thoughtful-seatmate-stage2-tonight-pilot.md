# Thoughtful Seatmate — Stage 2: Tonight Pilot (implementation record)

## 1. Status

**Implemented and visually validated. Behavior verified locally; authenticated visuals reviewed +
baselines regenerated in CI; all required PR checks green. Not merged, not deployed.**
The first production-surface pilot using the Stage 1 foundation (PR #308). Tonight (`/home`) is migrated to
the consolidated Thoughtful Seatmate visual system **locally** (a scoped `<ThoughtfulRoot>` boundary — no
global token change). All recommendation logic, analytics, routing, navigation, and product copy are
preserved; only the visual layer changed. Film File and every other surface are untouched.

> **Visual verification (resolved — see §16):** the authenticated Tonight surface needs Supabase test
> credentials (CI-only here), so the authenticated visual evidence + baseline regeneration ran in CI. The
> intended change was reviewed against the `visual-diff-app` artifact (8/8 captures = intended migration),
> the Linux authenticated Home baselines were regenerated via the repo's `visual-baselines/home-f47` flow
> (`npm run test:visual:home:update`), and the **`Visual Regression — Authenticated App` check is now
> green** (it failed first only because the committed baselines pre-dated this intended change).

## 2. Starting main SHA

`b3691f45b995d5890360238ba51f836fcf6005e5`.

## 3. Exact route and ownership boundary

- **Route:** `/home` → `src/features/home/Home.jsx` (lazy, inside the shared `AppShell` → `RequireAuth` →
  `PostAuthGate` → `BetaAccessGate`). The AppShell Header/BottomNav are **global chrome, not Tonight-owned.**
- **Rendered Tonight surface:** `TheBriefing` (the one nightly pick), `MoodReactor` (adjust-mood pills),
  `QuickLog`, `PageEndCard`, plus their dependencies (`BriefingSlide`, action buttons, `WhyThisPick`,
  `atoms`, `home.css`). The other components living in `sections-bottom.jsx` (`ContinueWatching`,
  `CinematicDNA`, `TasteMatch`, `TasteTwinPulse`, `CuratedLists`) are **not rendered on Tonight**; they
  retain legacy styling and are out of the rendered-surface scope (deferred to their own routes).

## 4. Files changed

`Home.jsx`, `sections-top.jsx`, `sections-bottom.jsx`, `WhyThisPick.jsx`, `atoms.jsx`, `home.css`
(Tonight-owned), plus a new `__tests__/HomeStage2Migration.test.js` and a one-line update to the Stage 1
`thoughtful-seatmate/__tests__/purity-and-non-adoption.test.js` (its "no production adoption" invariant now
allows the authorized Tonight adopter). Diff: **10 files, +489 / −146** (incl. the two docs). No global
token / font / shell / Film File / engine / data change.

## 5. Behavioral inventory (preserved)

Captured from the audit and **proven preserved by the 103 Home unit tests** (10 suites, all green):
recommendation flow (one head pick + invisible skip/watched queue, daily seed `todaySeed()+strHash(mood)`),
the `home_opened` event, `onWatch`→`/movie/:tmdbId`, `onSkip`→`updateImpression('skipped')` **then**
`trackInteraction('dismiss')` (order asserted), `onLog`→`/browse`, mood baseline auto-select +
`userPickedMood` latch, Mark-Watched write-settle gating (no optimistic advance), Save optimistic toggle,
`logSurfaceImpressions` (`hero`/`briefing_active`, `quick_picks`/`seen_candidates`),
`recordRecommendationOutcome('clicked')`, the polite live regions + announcements, the skeleton
("no spinners"), QuickLog `user_history` insert, and all `.catch(()=>{})` failure containment. No handler,
event name, payload, route, or copy changed.

## 6. Foundation activation boundary

`Home()` wraps `<HomeBody/>` in `<ThoughtfulRoot>` (inside `HomeDataProvider`, inside the shared AppShell).
This is the **smallest boundary** that covers the whole Tonight surface without leaking: `.ts-root` is
**not** added to html / body / `#root` / AppShell / Header / BottomNav / any shared parent. The
`--ts-*` tokens resolve only within this subtree.

## 7. Background treatment

The mood-tuned ambient radial gradient (`radial-gradient(... ${currentMood.hex} ...)`) is **removed** and
replaced by the Stage 1 `<PageDepth depth="radial">` as the page canvas — a neutral near-black→warm-graphite
transition that is **not** a recommendation/mood signal. `minHeight: 100vh` + the canvas fill keep the
background correct on short, tall, loading, and error content. `.ff-brief-warm` (the rose/brown atmosphere
pool) is neutralized to paint nothing.

## 8. Typography migration

Inter only. The local `EDITORIAL` constant (`var(--font-editorial)` = Newsreader) is redefined to
`Inter, system-ui, sans-serif`, migrating every usage at once: the Briefing title (`<h2>`, now Inter 600),
`WhyThisPick`'s "why" line, the `Heading` helper's `<h2>`, and `PageEndCard`'s closer. Semantic heading
order (the single `<h2>` pick title) is unchanged. No Newsreader/Outfit/serif/display family remains in
the migrated files.

## 9. Surface migration

Few containers, solid graphite. The poster "plate" becomes `--ts-surface-1` with a `--ts-border-subtle`
keyline (was a rose-tinted mat); `PageEndCard` becomes a neutral graphite panel (was a mood-tinted radial);
`SeenTile` keeps its solid tile with neutral title/meta. No glassmorphism, gradient border, rose/purple
glow, or animated hover lift was added. The recommendation remains the dominant object.

## 10. Primary-action migration

The single main action ("Open Film File") is now the Stage 1 `<PrimaryAction>` (neutral projection-ivory
fill `#efe7d7` / dark text `#221b13`). Its `onClick` (`handleOpen` → `recordRecommendationOutcome` +
`onWatch`), label, accessible name, the aria-hidden chevron, the `focus-visible` ring class, disabled, and
keyboard behavior are unchanged. Secondary actions (Mark Watched / Save / Not tonight) remain the
subordinate `SecondaryActionButton`s.

> **Addendum — Slice D (canonical-Button consumer migration, current).** The Stage-2 pilot above adopted the
> `<PrimaryAction>` wrapper, which is accurate for the pilot. After the Button ↔ PrimaryAction convergence
> (Slices A/B) and the Watchlist migration (Slice C), **Home's *Open Film File* now renders the canonical
> `<Button variant="primary">` directly** (`src/features/home/sections-top.jsx`) instead of the wrapper —
> Home no longer imports the `PrimaryAction` component. The **exact compat structure is retained**:
> `<Button variant="primary" size="md" className="ts-action-primary ts-action-primary--md flex-1
> lg:flex-none …focus-ring…"><span><span>Open Film File</span><ChevronRight aria-hidden/></span></Button>`,
> with `PrimaryAction.css` imported by Home itself, so the **DOM and visual output are unchanged**
> (byte-identical, proven via Vite-SSR `renderToStaticMarkup` + a browser computed-style capture of the flat
> recipe). The **authenticated Home visual suite passes without baseline regeneration** (zero-pixel). `onClick`
> / outcome recording / navigation / accessible name / chevron / focus ring / responsive width are all
> preserved. **Movie remains the final `PrimaryAction` wrapper consumer** (see
> [`docs/ui/composition-system-ownership.md`](composition-system-ownership.md) → Status — Slice D). The
> historical record above is unchanged and remains true for the pilot.

## 11. Decision-state migration

Ivory-only. The MoodReactor pills' selected state drops the mood-hex tint/glow for an ivory keyline + ivory
dot + heavier label, with `aria-pressed` + label + border as ≥2 non-colour cues (`minHeight: 44` preserved).
The Mark-Watched / Save committed states switch their active tint from rose to ivory
(`accent={'#f3ecdf'}`), keeping the check/bookmark icon + label change + `aria-pressed` as non-colour cues.
No new decision-state token; no rose/purple/gradient/glow/animation-alone for state.

## 12. Rose usage

Restrained, bounded — and AA-checked against the actual `PageDepth` canvas. Rose `#DD4E83` only clears
WCAG AA on the darker depth stops (≈4.88:1 on `--ts-canvas`, ≈4.60:1 on `--ts-surface-1`) and **fails AA
for small text on the lightest region** (≈4.31:1 on `--ts-surface-2`, the radial gradient's 0% stop at the
top of the page). The small rose eyebrows that sat there ("Tonight's pick", the "Why this pick" rung, and
"Feed the engine") were therefore switched to **ivory** (the ivory-only eyebrow discipline). Rose now
survives only where it stays AA-safe and truly bounded: the PageEndCard "mood and moment?" editorial
emphasis (a large `em`, ≥26px → the 3:1 large-text threshold, which it clears) and the FeelFlick wordmark
mark (a logotype). Rose is **not** used for the primary CTA, selected/committed states, confidence, card
fills, page atmosphere, large headings, navigation, semantic states, or any small label.

## 13. Legacy styling removed from Tonight

The mood-tuned ambient gradient; Newsreader from the rendered surface; the rose poster keyline; the rose
CTA glow (`.ff-brief-primary` retired); the rose page-atmosphere pool (`.ff-brief-warm` neutralized); the
mood-hex pill tints + the mood-coloured "exhausted/no-films" emphasis; the per-film **purple/pink**
missing-poster placeholder gradient (`gradForId`) → neutral graphite; the rose Discover-CTA border/hover;
the small rose kicker eyebrows ("Tonight's pick" / "Why this pick" / "Feed the engine") → ivory (AA on the
depth canvas); and the one cool-grey legacy keyline left in the rendered `QuickLog` (`HP.border`) → the
graphite `--ts-border-subtle` token. No legacy styling was removed **outside** Tonight.

## 14. Responsive results

Local: the existing responsive class structure (mobile/sm/lg breakpoints, the mobile poster max-widths, the
flex-1 mobile CTA) is preserved; `PageDepth` covers the full route height. **Full breakpoint matrix
(1440/1280/1024/768/430/390/360 + 200%/400% zoom + long title/explanation + missing image + safe-area) is
verified in CI's authenticated visual project** (not renderable locally without creds — see §1).

## 15. Accessibility results

Local (jsdom): `HomeTrustA11y` + the other suites pass — group/aria-pressed mood semantics, the four action
buttons' focus-ring classes + aria-hidden icons, the live regions, and the no-fabricated-mood rules all
hold. Ivory-only decisions carry ≥2 non-colour cues. **Contrast (measured against the real canvas):** the
`PageDepth` radial gradient's lightest stop is `--ts-surface-2` (`#241e19`) at `circle at 50% 0%` — the top
of the page, exactly where the kickers sit. Rose `#DD4E83` is only 4.31:1 there (below the 4.5:1 small-text
AA bar), so the small rose eyebrows were switched to ivory (`--ts-text-primary`/`-secondary`, ≥8:1 on every
stop); rose is retained only on the large editorial `em` (≥26px → 3:1 large-text bar, cleared) and the
wordmark. Every ivory text/border tone clears AA on canvas/surface-1/surface-2 (per the contrast
computation run during review). Full keyboard/SR/forced-colours/zoom/touch-target verification runs in CI
on the authenticated surface.

## 16. Visual evidence — authenticated baseline validation (CI close-out)

The authenticated harness (`e2e/visual-auth/home.visual.js`, `--project=visual-app`) captures eight
deterministic Tonight states — briefing, adjusted-mood, provider-empty, and the QuickLog/Discover tail —
across desktop (1280×720) and mobile (390×844), under a fixed clock + seeded RNG + reduced motion + a full
read/write/TMDB interception fixture (`installHomeFixture`), so the route is offline and reproducible.

**Reviewed run:** `27703431903` ("Visual & A11y Regression", PR #309, head `29ab3eee`) — the
`Visual Regression — Authenticated App` job failed as expected on the intended visual change. **Artifact:**
`visual-diff-app` (id `7701448696`, digest
`sha256:9fdd8bb8f9e75db09e4d9966dc8c87749794c04f72d99588e567ac12880c0ce3`), confirmed to belong to
`29ab3eee`. Every diff was inspected against its `expected` / `actual` (8 distinct captures = 4 desktop +
4 mobile; 24 core PNGs reviewed; the artifact held 96 PNGs incl. retries / `test-failed` / `trace.zip`).

**Classification:** 8 / 8 = **intended Tonight visual migration** (Newsreader→Inter reflow; rose/mood→ivory
eyebrows + ivory-only selected pill; mood/rose canvas→neutral PageDepth; rose CTA border→graphite; the
`HP.border` keyline→graphite; the one bounded rose `em` preserved). **0** unintended regressions, **0**
unrelated / non-Tonight changes, **0** fixture/data instability, **0** capture instability. In every diff
the global shell (wordmark + nav + search + avatar) and the fixture poster / SeenTile plates render
unchanged (faded); honest copy ("Mock Stream", "Availability not found") is preserved; nothing is clipped
at either width; the recommendation stays dominant; the primary CTA is projection-ivory; decisions are
ivory-only; rose appears only as the large editorial `em`.

**Regeneration (Linux):** via the repository's sanctioned `visual-baselines/home-f47` CI flow —
`npm run test:visual:home:update` on the Linux runner with the configured secrets (run `27710655211`,
both jobs green). The bot commit `5a0cea79` ("test(visual): regenerate Linux authenticated baselines")
changed **only** the 8 `e2e/visual-auth/home.visual.js-snapshots/*-visual-app-linux.png` files — no source,
config, Darwin, or other-surface baseline. Those 8 files were brought into the PR as commit `e69aed0d`.

**Two-pass determinism:** PR run `27710930934` (compare mode, all authenticated surfaces) passed on
attempt 1 **and** attempt 2 against the committed baselines, with the branch head unchanged (`e69aed0d`) —
compare mode wrote nothing; the suite is deterministic, not threshold-masked, and no diff tolerance was
relaxed.

**Final result:** all required PR checks green on `e69aed0d` — Visual Regression, **Visual Regression —
Authenticated App**, quality-gate (App Quality), CodeQL / Analyze, GitGuardian, E2E (Playwright),
Lighthouse, Cloudflare Pages, Vercel (preview). PR #309 remains **OPEN / MERGEABLE / not merged**.

**Darwin baselines are intentionally not regenerated here:** the local environment has no Supabase creds
(the premise of this pilot) and macOS renders can only be produced locally — the CI gate is Linux, so the
`*-visual-app-darwin.png` files remain at their pre-Stage-2 render and should be refreshed in a credentialed
local run. This affects no CI gate.

## 17. Tests

New `HomeStage2Migration.test.js` (8 tests): the local `<ThoughtfulRoot>`+`<PageDepth>` boundary; Tonight
consuming `PrimaryAction`; **only Tonight + the dev-only showcase import the foundation** (Film File and all
other surfaces asserted clean); the fully-migrated Tonight files free of Newsreader/Outfit/mood-hex; **the
RENDERED `sections-bottom` exports (`SeenTile`/`QuickLog`/`PageEndCard`) free of legacy `HP.*`/editorial
font/mood-hex** (a per-function-body slice, so the non-rendered components in that file are correctly
excluded — this check is what catches a residual-legacy leak that a whole-file include/exclude could not);
no global `.ts-root`; no `--ts-*` leaked into the global token sources. The Stage 1 non-adoption invariant
was updated to allow the authorized Tonight adopter. The 10 existing Home suites (103 tests) remain green.
Local run: `npm run guard:foundations` ✓, `npm run lint` ✓ (clean), `npm run test` ✓ (**1575 passed**),
`npm run build` ✓, `git diff --check` ✓. The guard baseline is **unchanged (6 files / 16 occurrences)** —
Tonight had no baselined legacy-gradient occurrence to remove.

## 18. Non-regression proof

Recommendation output, network requests, analytics events/payloads, route/navigation, save/history/watch
interactions, and state transitions are unchanged — proven by the 103 Home behavioral tests (which assert
handlers, event order, live-region wording, and state) all passing, plus a code diff that touches only
visual properties (font/colour/background/CTA-component) and never the handlers, hooks, services, or copy.
Non-Tonight surfaces, Film File, the global shell, global tokens (`src/shared/lib/tokens.js`,
`src/index.css`), global font loading (`index.html`), and global focus/selection (`globals.css`) are
untouched (verified by the diff + the Stage 2 test's no-global assertions).

## 19. Rollback plan

Independently reversible: revert the 6 Tonight files + the new `HomeStage2Migration.test.js` + the one-line
Stage 1 test update (and, in CI, restore the prior home visual baselines). Rollback requires **no** change
to Stage 1 primitives, Film File, global tokens, or any other migration stage — Tonight adopts the
foundation only locally via its own `<ThoughtfulRoot>` boundary.

## 20. Known limitations

- Authenticated visual evidence + baseline regeneration are CI-only here (no local Supabase creds).
  **Resolved (§16):** the Linux authenticated Home baselines were regenerated in CI and the
  `Visual Regression — Authenticated App` check is green. The `*-visual-app-darwin.png` baselines remain
  at the pre-Stage-2 render (macOS-only, gated by no CI) pending a credentialed local refresh.
- The non-rendered `sections-bottom.jsx` components — `ContinueWatching`, `CinematicDNA`, `TasteMatch`,
  `TasteTwinPulse`, `CuratedLists` — retain legacy styling (out of rendered scope; they migrate with their
  own routes). The rendered exports in that file (`SeenTile`/`QuickLog`/`PageEndCard`) are fully migrated
  and purity-checked.
- The rose-eyebrow contrast risk noted in earlier drafts is **resolved**: those eyebrows are now ivory; the
  only remaining rose (the large editorial `em` + the wordmark) is AA-safe by computation. CI's axe pass
  remains the authoritative cross-check on the authenticated surface.

## 21. Film File handoff

Film File (`src/features/movie/**`) is **not** migrated. The next stage wraps the Film File surface in its
own `<ThoughtfulRoot>` boundary and applies the same primitives (PageDepth / Surface / Text / PrimaryAction
/ DecisionMarker / bounded rose), independently, using scoped/local values — following this pilot's pattern
and the migration plan. Token globalization is still **deferred** until both pilots validate (gate 5).

## 22. Token globalization is still prohibited

This pilot uses the foundation **locally** (scoped `.ts-root`). No `--ts-*` token was promoted to the global
token files, and none must be until the two pilot surfaces (Tonight, then Film File) validate — per the
migration gates.
