# Thoughtful Seatmate — Stage 6: Library Family (implementation record)

## 1. Status

**Implemented, not merged.** First post-hardening route migration of the whole-site program. Migrates the
authenticated **Watchlist** route (the Library-family "saved films" view) to the Thoughtful Seatmate system,
**locally** (scoped `<ThoughtfulRoot>`), preserving all behavior/data/analytics/routing/copy. No other route
family; no token globalization; no shell/header/nav/global-focus/global-selection/`:root` change. Tonight and
Film File are unchanged.

## 2. Starting main SHA

`85fa89c85c76174830aafb9544654141465b6bf8` (after #313, Stage 5 foundation hardening); no intervening
commits; branched cleanly.

## 3. Route inventory

- **`/watchlist`** → `src/features/watchlist/Watchlist.jsx` (lazy, inside the shared `AppShell` → auth
  gates). The one route migrated.
- **`/watched`** → `History` (`src/features/history`) — the Diary; **excluded** (Stage 7).
- **`collection/:id`** → `src/features/browse/Collection.jsx` — **browse-owned**, not Library; excluded.

## 4. Ownership boundary

- **Route-owned (migrated fully):** `src/features/watchlist/Watchlist.jsx` + `watchlist.css` (its own
  `WatchlistDataProvider`, `useWatchlistData`, `derive/`, `data.js`).
- **Shared library scaffolding:** `LibrarySectionNav` (`src/features/library/`) + `library.css` are shared by
  Watchlist AND the excluded History/Diary route; the a11y helpers `useLibraryAnnouncement` +
  `focusAfterRemoval` are pure logic (untouched). `library.css` is migrated via **backward-compatible scoped
  fallbacks** (below); `LibrarySectionNav.jsx` (no inline styles) is untouched; the helpers are untouched.
- `data.js` re-exports the **global** `HP`/`ROSE` — not edited (shadowed locally in Watchlist.jsx).

## 5. Included routes

`/watchlist` only (the saved-films Library view).

## 6. Excluded routes

History/Diary (`/watched`, `/history` — Stage 7), Lists, Discover, global search, Profile, People,
preferences, onboarding, landing, auth, shell/header/bottom-nav, generic modals, `collection/:id` (browse),
ShareCard/export artifacts. Library and Watchlist are **not** independently routed (Watchlist *is* the
Library route), so no split was needed; the shared section-nav is handled via scoped fallbacks rather than
migrated outright (it serves the excluded Diary too).

## 7. Behavioral inventory (preserved)

Proven by the existing Watchlist suites (WatchlistA11y / WatchlistDataStates / WatchlistRemoval /
WatchlistTrust) + the History suites, all green: data queries (`useWatchlistData`), film-mood filter +
saved-date sort (`sortItems`), the `visible` memo, the settled-removal flow (`removeFromWatchlist` +
`useLibraryAnnouncement` live region + `focusAfterRemoval` focus recovery + pending/`isRemoving`), the
masthead `total`, empty / filtered-empty / loading / error states, the `MoodPill` film-mood badge, the
`Link` to `/movie/:tmdbId`, `navigate('/discover'|'/browse'|'/home')`, `usePageMeta`, every `aria-*`
(aria-pressed filter pills, the polite live region, role=list/listitem/status/alert, remove aria-label/busy)
and `data-library-*` attribute, all copy, and the IA/order. **No handler, hook, query, route, analytics, or
copy changed.**

## 8. Foundation activation boundary

`Watchlist()` wraps its body in `<ThoughtfulRoot><PageDepth depth="radial" className="ff-watchlist-v2">…`
(inside `WatchlistDataProvider`, inside the shared `AppShell`). The inner `maxWidth:1440` wrapper +
`WatchlistShell` (incl. the early-returned `PageSkeleton` / `PageError`) render **inside** this boundary, so
loading/error states get the neutral canvas + token resolution without a separate wrap. `.ts-root` is **not**
on html/body/`#root`/AppShell/header/nav. Independent from Tonight + Film File.

## 9. PageDepth treatment

`<PageDepth depth="radial">` replaces the flat `HP.bgDeep` (`#06060a`) page background. The Masthead's
rose radial-atmosphere overlay is removed (neutral canvas, no chrome colour). No poster/mood-derived page
chrome.

## 10. Typography migration

Inter only. The Masthead `<h1>` `var(--font-editorial)` (Newsreader) → `Inter, system-ui, sans-serif`
(weight 400→600); all other text was already Inter. No Newsreader/Outfit/serif remains.

The three **section-tone** `<Eyebrow>` labels ("Your library" masthead, "Watchlist" in the empty + error
states) were passed `color="var(--ts-text-secondary, #beb8ad)"` to neutralize them to ivory. The shared
`<Eyebrow>` primitive's *default* colour is the legacy `HP.purple` literal — so it carries **no**
purple-pink hex of its own and the foundation guard cannot see it (see §26). The masthead eyebrow was
therefore still rendering purple after the first migration pass; caught by inspecting the regenerated
`watchlist-empty-mobile` actual and fixed by the explicit `color` prop (the line-47 `tone="meta"` eyebrow
was already muted and left as-is).

## 11. Surface migration

Graphite via the local **shadowed-`HP`** block (`text`/`border`/`panel`/`purple`/`pink`/… → `var(--ts-*)`),
so every `HP.*` usage resolves to ivory/graphite. The poster-fallback (missing artwork) → solid
`var(--ts-surface-2, #241e19)` (was a per-film `f.hex` gradient). No glassmorphism/glow/gradient-border/
hover-lift added; the existing card poster drop-shadow (neutral) is kept.

## 12. Text adoption

`<Text>` was **not** force-adopted for Watchlist. Watchlist uses Inter + the `--ts-*` colour tokens, but
keeps its **bespoke type scale** (72px Masthead hero, 17px lede, 15px card titles, etc.) — a deliberate
surface-specific hierarchy that §7 permits and that the foundation `<Text>` variant sizes do not match.
Per §6 ("do not use primitives merely to increase adoption counts"), forcing `<Text>` here would impose the
foundation scale and change the intended hierarchy, so it was not done. `PrimaryAction` (below) is the
hardened primitive newly exercised in production by this stage.

## 13. DecisionMarker adoption

Not used. The committed/selected controls (filter pills) use the **canonical** ivory committed-state pattern
(semantic `aria-pressed` + an ivory keyline + heavier `fontWeight` = ≥2 non-colour cues), which the Stage 5
record designates as canonical and the pilots validated. `DecisionMarker` (the optional supplementary dot)
was not added — consistent with §6 ("supplementary cue", not forced).

## 14. Primary-action treatment

The single primary action surfaces in the **empty / error** states: "Open Discover →" (empty) and "Try
again" (error) → the Stage 1 `<PrimaryAction>` (neutral projection-ivory). Their `onClick`
(`navigate('/discover')` / `onRetry`) + labels are preserved. When the Watchlist is populated there is **no**
page-level primary action (it is a passive saved list), so none was invented (§6). The secondary actions
("Browse films", "Go to Home", "Show all") remain subordinate graphite ghosts.

> **Update — canonical-Button consumer migration (Slice C, later PR).** Watchlist's two primary CTAs now
> render the **canonical shared `Button` directly** instead of the `PrimaryAction` wrapper:
> `<Button variant="primary" size="md" className="ts-action-primary ts-action-primary--md"><span>…</span></Button>`.
> Watchlist imports `Button` from `@/shared/ui/Button` and imports `@/shared/ui/thoughtful-seatmate/PrimaryAction.css`
> itself, so the **Stage-6 visual recipe is temporarily preserved unchanged** via the `ts-action-primary*`
> compat classes. This is a **zero-pixel** change: the rendered DOM (same element, same classes, same single
> child `<span>`) and computed styles are byte-identical to the wrapper output, so the §23–§25 visual
> baselines are unaffected. The compat classes + explicit CSS import are a temporary bridge until the final
> neutral-primary recipe is approved + implemented (see the
> [PrimaryAction retirement gate](composition-system-ownership.md#primaryaction-retirement-gate)). Home and
> movie still use the `PrimaryAction` wrapper. This makes Watchlist the **first** production consumer to
> render the canonical Button directly.

## 15. Filters / tabs / sort treatment

- **Filter pills** (film-mood): active state → ivory-only (`rgba(243,236,223,0.08)` fill +
  `var(--ts-focus)` keyline + `fontWeight` 700), `aria-pressed` preserved (no rose active). Inactive →
  graphite. ≥44px targets preserved.
- **Sort `<select>`**: ivory text on graphite; behavior/options/labels unchanged.
- **Section nav (`LibrarySectionNav`, shared):** within Watchlist's `.ts-root` the active underline + focus
  ring + text resolve to ivory; in History (no `.ts-root`) they fall back to the exact legacy values
  (byte-identical). Active state keeps weight + underline (≥2 non-colour cues). No rose active tab, no
  purple selected, visible (ivory) focus.

## 16. Item-card treatment

`SavedCard` chrome → graphite/ivory via shadowed-`HP`; poster artwork **unchanged**; poster-fallback →
graphite; the film-mood `MoodPill` colour neutralized to ivory (`#beb8ad`) — the mood is conveyed by the
label + `aria-label`, not the hue. Poster ratio, title, year/runtime/director metadata, the single Film File
`Link`, the Remove control (aria-label/busy/`data-library-*`), keyboard access, and focus are preserved.

## 17. Committed-state treatment

The only committed/active states are the filter pills + the active section-nav link — both ivory-only with
≥2 non-colour cues (aria + keyline/weight, or weight + underline). No rose/purple/gradient/glow for state.

## 18. Rose usage

After migration, rose appears only in the `::selection` highlight (`watchlist.css`, permitted) and — as a
backward-compatible **fallback only** — the shared `library.css` active underline `var(--ts-focus, #DD4E83)`
(History sees rose; Watchlist sees ivory). No rose on the masthead, filter pills, CTAs, cards, or any small
label in the migrated surface.

## 19. Imagery fallback

Poster `<img>` loading + `alt=""` semantics preserved. Missing/failed artwork → neutral graphite
(`var(--ts-surface-2)`) with the title text inside (existing fallback content), no purple/pink placeholder,
no contextual/poster-derived colour.

## 20. Empty / loading / error treatment

- **EmptyState** ("Your Watchlist is open.") + **FilteredEmpty** ("No saved films match this mood.") →
  graphite/ivory, honest copy unchanged, one recovery action each (PrimaryAction "Open Discover" / ghost
  "Show all"). The filtered-empty `role="status"` preserved.
- **PageSkeleton** → neutral graphite pulses (unchanged structure; `aria-busy`/sr-only message preserved).
- **PageError** → graphite/ivory, `PrimaryAction` "Try again", ghost "Go to Home", `role="alert"` + the safe
  fixed copy preserved; it still renders `LibrarySectionNav` so the Diary stays reachable.

## 21. Responsive results

The existing responsive structure (auto-fill grid, 2-col phones, masthead/clamp media queries, safe-area
bottom padding) is preserved — only colour/font values changed. Full breakpoint/zoom/long-content matrix is
verified in CI's authenticated visual project (no local creds).

## 22. Accessibility results

Existing Watchlist a11y suite green (filter group, list semantics, live region, focus recovery on removal,
remove-control labels). Decision/active states ivory-only with ≥2 non-colour cues. Focus rings → ivory
(`var(--ts-focus)`). Contrast: Watchlist text sits on the PageDepth canvas/surface-1/2 where ivory
primary/secondary/muted all pass AA (per the Stage 5 contrast rules); no rose small-text on light remains.
Full keyboard/SR/forced-colours/zoom/touch-target verification runs in CI.

## 23. Visual evidence

The authenticated harness `e2e/visual-auth/library.visual.js` (project `visual-app`, fixture
`e2e/fixtures/library.js`) captures the library family — 8 states (4 Watchlist + 4 Diary). The Watchlist
captures change with this migration; the **Diary** captures (`diary-*`) stay byte-identical (History
excluded). Captures run in CI; Linux baselines are regenerated via the `visual-baselines/library-*` helper-
branch flow. The regenerated `watchlist-empty-mobile` actual was image-inspected and shows the migrated
state: neutral graphite canvas (rose masthead-atmosphere removed), Inter `<h1>` (was Newsreader), ivory
section eyebrow (was purple), ivory `PrimaryAction` "Open Discover →" (was a rose fill), and the ivory
section-nav underline.

## 24. Baseline classification

Regenerated via the `visual-baselines/library-stage6*` helper-branch CI flow (`test:visual:library:update` =
`playwright test --project=visual-app e2e/visual-auth/library.visual.js --update-snapshots`, Linux runner).
Playwright's `--update-snapshots` is **threshold-aware**: it re-renders all nine captures with the migrated
code, compares each against its prior baseline, and rewrites **only** the ones whose delta exceeds the
existing project comparison threshold. The run logged `9 passed` with exactly one
`… watchlist-empty-mobile … is re-generated, writing actual`. Classification of the eight library captures:

| Capture | Result | Why |
|---|---|---|
| `watchlist-empty-mobile` | **Regenerated** (intended migration) | The prominent rose→ivory `PrimaryAction` block on the 390px viewport, plus the masthead changes, exceed the threshold. Image-inspected: graphite canvas, Inter h1, ivory eyebrow + CTA + nav underline. |
| `watchlist-populated-desktop` / `-mobile`, `watchlist-filtered-empty-desktop` | **Unchanged** (within threshold) | Same migrated masthead (Inter h1, ivory eyebrow, ivory active filter pill) renders, but the changed pixels stay under the comparison threshold on these layouts (poster artwork is fixture-provided and identical), so Playwright did not rewrite them. No threshold was relaxed. |
| `diary-populated-desktop` / `-mobile`, `diary-remove-dialog-desktop`, `diary-searched-empty-mobile` | **Byte-identical** | History/Diary has no `.ts-root`, so the shared `library.css` renders its exact legacy fallback values — proving the scoped-fallback technique kept the excluded route pixel-for-pixel unchanged. |

Only Watchlist-owned Linux baselines changed (one file). No Home / Film File / Discover / Profile / People
authenticated baseline changed; no public baseline changed; no Darwin baseline changed; no diff artifacts
committed; no threshold relaxation. The unchanged-but-migrated Watchlist captures are an honest property of
the existing threshold (the migrated masthead delta is sub-threshold on those layouts); forcing a rewrite
would require lowering the threshold, which is prohibited.

## 25. Deterministic rerun result

The Library authenticated suite was regenerated **twice** from the same eyebrow-fixed head (`55645932`) on
two independent helper branches (`visual-baselines/library-stage6b`, `…-stage6c`). Both runs logged
`9 passed` and rewrote **exactly one** snapshot (`watchlist-empty-mobile`); the second pass's
`watchlist-empty-mobile-visual-app-linux.png` is **byte-identical** to the first (empty `git diff`), and no
other library baseline differed between the two passes. The render is deterministic and the single baseline
update is stable. (The authenticated `visual-app` job is the CI gate; there are no local creds, so the
determinism was established on the Linux CI runner, not locally.)

## 26. Guard update

`scripts/guards/legacy-gradient-guard.mjs`: added `src/features/watchlist/` to `ADOPTERS` and
`Watchlist.jsx` + `watchlist.css` to `MIGRATED_FILES` (now 18 migrated-surface files, all clean). The shared
`library.css` is intentionally **not** in `MIGRATED_FILES` (it keeps legacy fallbacks for History); the
backward-compat is asserted by the Stage 6 test instead. Legacy-gradient baseline **unchanged (6 / 16)** —
Watchlist had no baselined gradient occurrence.

**Guard gap (found this stage).** The guard scans each migrated file's *own* source for legacy hex / editorial
font / `HP.purple-pink` / `FILM_PALETTE` / `var(--context-)`. It cannot see a legacy colour a migrated file
inherits from a **shared component's default prop** — here the shared `<Eyebrow>` defaults to the legacy
`HP.purple` literal, so a section eyebrow rendered purple inside the migrated surface while the guard stayed
green (the literal lives in `Eyebrow`'s file, not Watchlist's). It was caught by visual inspection, not the
guard, and fixed by an explicit ivory `color` prop (§10). Recorded as a program follow-up: when the shared
chrome migrates (Stage 12), retire the `<Eyebrow>` purple default; until then, migrated surfaces must pass an
explicit neutral `color` to section-tone eyebrows, and the visual baseline is the backstop the guard is not.

## 27. Tests

New `src/features/watchlist/__tests__/WatchlistStage6Migration.test.js` (5 tests): local boundary +
`PrimaryAction` consumption; no fourth production adopter; rendered Watchlist files free of editorial font /
Outfit / FILM_PALETTE / purple-pink chrome / mood-hex; the shared `library.css` carries scoped vars with the
**exact legacy fallbacks** (History byte-identical); no global `.ts-root` / token leak. The cross-surface
adopter allowlists in `purity-and-non-adoption.test.js`, `HomeStage2Migration.test.js`, and
`FilmFileStage3Migration.test.js` were updated to add Watchlist as the authorized 4th adopter. Local:
`npm ci` ✓, `guard:foundations` ✓ (6/16; 18 migrated clean), `lint` ✓, `test` ✓ (**1597 passed**),
`build` ✓, `git diff --check` ✓.

> **Update — canonical-Button consumer migration (Slice C, later PR).** The first describe block of
> `WatchlistStage6Migration.test.js` was rewritten from "local boundary + `PrimaryAction` consumption" to
> "local Watchlist activation boundary + canonical-Button migration": it now pins that Watchlist imports
> `Button` from `@/shared/ui/Button`, does **not** import/render the `PrimaryAction` component, explicitly
> imports `PrimaryAction.css`, exposes a `WATCHLIST_PRIMARY_COMPAT_CLASS` carrying both
> `ts-action-primary` + `ts-action-primary--md`, and renders exactly two direct `<Button variant="primary"
> size="md">` controls each preserving a single `<span>` label — while keeping the `<ThoughtfulRoot>` /
> `<PageDepth depth="radial">` boundary and the no-global-activation assertions unchanged. The authenticated
> `e2e/app/library.e2e.js` empty/error assertions were strengthened to verify the live DOM (native
> `<button>`, `ff-btn` + `ts-action-primary` + `ts-action-primary--md`, single child span).

## 28. Non-regression proof

Watchlist data flow, filter/sort, removal (settled + announced + focus recovery), navigation, analytics, and
copy are unchanged — proven by the Watchlist behavioral suites passing + a diff touching only visual values.
History/Diary is unchanged — proven by the History suites passing + the shared `library.css` scoped fallbacks
(History has no `.ts-root`, so it only ever renders the legacy fallback values). Tonight, Film File, the
shell, global tokens (`src/shared/lib/tokens.js`, `src/index.css`), global fonts (`index.html`), and global
focus/selection are untouched (verified by the diff + the Stage 6 test's no-global assertions).

## 29. Rollback plan

Independently reversible: revert `src/features/watchlist/{Watchlist.jsx, watchlist.css}` + the new Stage 6
test + the Watchlist Linux visual baselines (in CI) + the shared `library.css` scoped-fallback change + the
narrow guard `ADOPTERS`/`MIGRATED_FILES` additions + the three adopter-allowlist test updates + this doc +
the ledger/plan updates. Rollback requires **no** change to Stage 1, Tonight, Film File, Stage 5 hardening,
global tokens, the shell, or any other route. (Reverting `library.css` restores its exact prior content;
History is unaffected either way.)

## 30. Known limitations

- Authenticated visual evidence + Linux baseline regeneration are CI-only here (no local creds). Darwin
  baselines remain at the pre-Stage-6 render (no CI gate; program follow-up F1).
- The shared `LibrarySectionNav`/`library.css` is migrated only via scoped fallbacks; it fully migrates (its
  own MIGRATED_FILES entry, fallbacks removed) when its last consumer (History/Diary, Stage 7) migrates.
- `<Text>` variant-scale adoption deferred for Watchlist (bespoke surface scale) — documented in §12.
- The shared `<Eyebrow>` purple **default** prop is invisible to the foundation guard (§26); migrated
  surfaces must pass an explicit neutral `color` until the shared chrome migrates (Stage 12). The visual
  baseline, not the guard, is the backstop for inherited shared-component defaults.
- Three Watchlist captures render the migrated masthead but stay within the visual-diff threshold, so their
  Linux baselines were not rewritten (§24); they still depict the pre-migration masthead within tolerance.
  This is a property of the existing threshold, not a regression — production renders the migrated masthead.

## 31. Darwin baseline status

Not regenerated (no local creds; Linux is the CI gate). The `*-visual-app-darwin.png` library baselines stay
at the pre-Stage-6 render; a credentialed local refresh is the program follow-up (F1), unrelated to this gate.

## 32. Next authorized stage

**Stage 7 — Personal archive family (History / Diary / viewing log)** — its own fresh worktree / branch /
PR / validation / rollback cycle. When History migrates, fully migrate the shared `LibrarySectionNav` /
`library.css` (remove the legacy fallbacks; add to `MIGRATED_FILES`). No token globalization until Stages
12–13.
