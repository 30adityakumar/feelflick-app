# Thoughtful Seatmate — Website-Wide Globalization & Migration (implementation record)

**Status:** Implemented, not merged. Supersedes the route-by-route adoption model
(Stages 1–6) with one centrally-controlled canonical theme, delivered in one branch
(`migration/thoughtful-seatmate-website-wide`) / one PR. Governing decision:
[ADR 019](../decisions/019-thoughtful-seatmate-website-wide-theme.md). Starting SHA
`ae45f3e678d953a4251cbeeba948f94cdbf60ec1` (after #314, Stage 6).

No product behavior, data flow, analytics, routing, copy, or information architecture
changes — this is visual-system architecture + visual migration only.

## 1. Architecture

One canonical theme, applied once at the application root, owns the semantic tokens;
every legacy token system aliases the canonical tokens, so a single token change
propagates site-wide:

```
change --color-* (foundations.css / CANONICAL_THEME)
  → --ts-* / --bg-* / --brand-* / --purple-* / --pink-* / --font-editorial aliases update
  → HP / ROSE / C / SHADOW JS tokens (var(--color-*, legacy)) update
  → the shell + every route + every shared component update
  → no route-by-route colour editing
```

## 2. Canonical token map

One canonical token contract with two manually-maintained mirrors (neither generated from the
other), kept in sync by a drift test: the CSS mirror in
`src/shared/ui/thoughtful-seatmate/foundations.css` (`.theme-thoughtful`) and the JS mirror
`CANONICAL_THEME` in `tokens.js`. The drift test (`website-theme.test.js`) compares every token
name + value across both mirrors.

| Token | Value | Token | Value |
|---|---|---|---|
| `--color-canvas` | `#15120f` | `--color-border-subtle` | `#302c28` |
| `--color-surface-1` | `#1d1814` | `--color-border-strong` | `#46423d` |
| `--color-surface-2` | `#241e19` | `--color-action-primary-fill` | `#efe7d7` |
| `--color-surface-raised` | `#2d2621` | `--color-action-primary-text` | `#221b13` |
| `--color-text-primary` | `#f3ecdf` | `--color-focus` / `--color-decision` | `#f3ecdf` |
| `--color-text-secondary` | `#beb8ad` | `--color-brand-rose` | `#dd4e83` |
| `--color-text-muted` | `#8d887f` | `--color-brand-rose-contrast` | `#c0356c` |
| `--font-ui` / `--font-display` | `Inter` | `--page-depth-radial` / `-linear` | warm-graphite depth |

## 3. Compatibility aliases (temporary)

Under `.theme-thoughtful` only, so they vanish on rollback:

- **`--ts-*` → `--color-*`** (foundations.css) — the pilot scoped namespace.
- **`--bg-base`/`--bg-elevated`, `--brand-ivory`/`-soft`, `--brand-rose`, `--brand-warm-hairline`, `--font-body`/`--font-editorial`/`--font-display`** → `--color-*` (src/index.css).
- **Tailwind `--purple-50..900` + `--pink-50..900`** → a neutral graphite/ivory ramp (src/index.css). Because `tailwind.config.js` maps `{bg,text,border,ring,from,to,via}-{purple,pink}-N` to these vars, this neutralises every purple/pink Tailwind utility site-wide, and the legacy `--brand-gradient` (which expands from `--purple-600`/`--pink-500`) renders flat graphite with no new gradient declaration.
- **JS tokens** `HP.*`, `ROSE`, `ROSE_DEEP`, `IVORY`, `C.*`, `SHADOW.focus` → `var(--color-*, <legacy>)` (src/shared/lib/tokens.js).

Each alias holds exactly one value (the canonical one); none is an independent palette.

## 4. Root theme boundary

`src/App.jsx` wraps `RouterProvider` in `<div className={THEME_CLASS} data-ui-theme=…
style={{minHeight:'100vh'}}>`, covering every route (incl. landing/auth/onboarding), the
shell, and overlays. `foundations.css` is imported globally via `src/index.css`. No route
applies a theme class. The legacy per-route `<ThoughtfulRoot>` wrappers (Tonight/Film
File/Library) are now redundant no-ops nested inside the global theme — retained to
minimize churn, scheduled for removal with the alias cleanup (§24).

## 5. Emergency theme switch (partial visual rollback)

`VITE_UI_THEME` (read once in App.jsx): `thoughtful` (default) → `.theme-thoughtful`;
`legacy` → `.theme-legacy` (no-op) so the `:root` legacy tokens + `var(…, <legacy>)` fallbacks
resolve again **where those fallbacks still exist**. This is a **runtime token-layer fallback**
(emergency palette / theme-boundary mitigation) — a **partial** visual rollback, **not** an exact
restoration of the pre-migration site: it does not undo the removed Newsreader/Outfit font
loading, the changed shared-component defaults, the directly-edited shell/route/CSS/SVG/JS
presentation, or the regenerated baselines. A **full** visual rollback requires reverting this
PR's squash commit (§23). Do not call `.theme-legacy` an exact restoration of the old website.

## 6. Routes migrated

All browser production routes are now under the canonical theme. Three were already
migrated (Tonight `/home`, Film File `/movie/:id`, Library `/watchlist`) and continue to
work via the canonical `--ts-*` aliases. The rest are recoloured by the theme + the
shared-token recolor with no per-route colour edits required: Landing `/`, Browse,
Discover, Mood/Tone/Fit browse, Collection detail, History/Diary, Profile (+`/:userId`),
People, Lists (+ list/curated/personal detail), Account, Preferences, Onboarding, About,
Privacy, Terms, OAuth callback, Admin cache-monitoring. Targeted holdout edits were made
where colour was hardcoded (see §10).

## 7. Shared components migrated

`shared/ui`: Button (primary → ivory action pill; ivory focus ring), Eyebrow (default →
ivory-secondary, §11), SectionHeader, BrandSplash (purple glows + wordmark gradient →
neutral), Checkbox (checked → ivory), Input/Select/Textarea (focus → ivory), Modal,
Tooltip, EmptyState, Card (via tokens). `shared/components`: Pagination (current →
ivory, purple glow removed), MovieCardRating (purple borders → neutral),
MovieSentimentWidget / FollowButton / RecommendationFeedback (purple→pink gradients →
neutral/ivory). MoodPill, MatchBadge, ActionButton, StarRating auto-migrate via the
`HP`/`ROSE` recolor (defaults now resolve to ivory/rose; amber stars kept).

## 8. Shell migration

`src/app/AppShell.jsx` — purple/pink atmosphere blobs → flat canvas; mobile-nav active
purple glow + `var(--purple-400)` + `text-purple-300` → ivory, keeping `scale-110` +
stroke weight as non-colour cues; route-loading bar purple→pink gradient → solid rose;
PendingDeletionBanner Outfit → Inter (red deletion-alert kept). `header/Header.jsx` —
`AMBIENT_HEX` purple → ivory; avatar conic purple→pink ring + default-initial gradient →
flat surface; wordmark purple→pink clip → solid ivory; 4× Outfit → Inter.
`header/components/BottomNav.jsx` — `AMBIENT_HEX`/`PINK`/`GRAD` → ivory/ivory-fill active
pill (non-colour cues kept); 2× Outfit → Inter. `header/components/SearchBar.jsx` —
purple skeleton/hover → neutral. Global focus → ivory (`globals.css :focus-visible` →
`var(--color-focus, …)`); selection highlight stays restrained rose (allowed).

## 9. Typography migration

Inter everywhere. `index.html` loads only Inter (Newsreader + Outfit removed).
`--font-editorial`/`--font-display` alias to Inter, so the ~45 inline `var(--font-editorial)`
usages + `.ff-d1`/`.ff-d2`/`.ob-*` classes resolve to Inter with no per-file edit. Hardcoded
faces removed: 8 inline Outfit usages (shell) and `landing.css .ff-italic` Newsreader →
Inter. Semantic heading levels, hierarchy, line lengths, wrapping, and responsive scaling
are unchanged (only the face changed).

## 10. Colour-system removal

- The Tailwind `purple`/`pink` scale is neutralised globally (§3), so `*-purple-N` /
  `*-pink-N` utilities across all routes render graphite/ivory.
- Local route palette overrides neutralised: `browse/data.js` + `discover/constants.js`
  (`purpleDeep:'#9333ea'`, `surface`/`paper` near-purple darks → canonical); the
  `discover/sections/StageMood.jsx` SVG `linearGradient` purple→pink stops → ivory; the
  discover/people/history `.css` purple focus outlines → `var(--color-focus)`; the
  Discover audio-toggle purple icon → ivory.
- `FILM_PALETTE` (movie/data.js) is unused in rendered code (the migrated Film File route
  forbids it); retained as vestigial data, flagged as remaining debt (§20).
- Mood / avatar / chart hex palettes (data arrays + mood→hex maps) are **kept** — they are
  identity / data-viz, not chrome (ADR 019 §4; the theme audit classifies them
  allowed-artwork-or-identity). Posters, provider logos, avatars, and semantic
  amber/red/green are not recoloured.

## 11. Shared Eyebrow resolution

`shared/ui/Eyebrow.jsx` `TONES.section.color` changed from `HP.purple` to `HP.textSoft`
(→ `--color-text-secondary`). The shared default can no longer render purple/pink; routes
no longer need to pass an override to avoid purple. A regression test
(`website-theme.test.js` + the updated `Eyebrow.test.jsx`) asserts the default is the
ivory-secondary token and not any purple/pink hue.

## 12. Decision-state rules

Selected/saved/watched/active/committed states use semantic ARIA + ivory + ≥2 non-colour
cues (weight, underline, border, fill, icon, scale). No colour-only state; no rose/purple
for committed states. The shell active nav (mobile + bottom) keeps `scale`/weight as the
non-colour cue alongside ivory; filter/selected pills inherit the canonical ivory pattern.

## 13. Rose rules

Rose (`--color-brand-rose`) is restrained: the wordmark moment, the route-loading accent
bar, the white-on-rose pill (`ROSE_DEEP`/`--color-brand-rose-contrast`), and the selection
highlight (contrast passes). It is NOT used for primary action (ivory), active navigation
(ivory), saved/watched/filter states (ivory), success/error (semantic), card backgrounds,
page atmosphere, small text on surface-2/raised, or decorative glows.

## 14. Form / control migration

Inputs, selects, textareas, checkboxes, pills, tabs, menus, dialogs, and sheets use
graphite surfaces, ivory text, subtle borders, and a visible ivory focus (the global
`:focus-visible` ivory ring + component focus on the canonical border/focus tokens);
selected states are ivory. Labels, validation, keyboard behaviour, autofill/password-manager
compatibility, error messaging, and submission behaviour are unchanged (colour/focus only).

## 15. Empty / loading / error migration

These consume canonical tokens via the theme (graphite surfaces, ivory text) — the
`RouteSkeleton` purple pulses, `EmptyState`, `Modal`, and route skeletons resolve to
neutral; no route-specific purple/pink fallback remains. Behaviour and copy unchanged.

## 16. Visual-baseline updates

Because the whole site recolours, all affected Linux production baselines are regenerated
via the `visual-baselines/<surface>-*` CI flow: public `visual` (landing, about) + authed
`visual-app` (home, movie, discover, library, profile, people). The change is the intended
migration (warm-graphite canvas, Inter, ivory controls, neutral nav). The suite is run
twice from the same head for determinism; thresholds are unchanged (`maxDiffPixelRatio:
0.02`); no traces/diff artifacts are committed. *(Status recorded at the CI baseline step
in the PR.)* Routes without dedicated authenticated visual specs (Browse, Collection,
Lists, Account, Preferences, Onboarding, legal) are covered by the theme + audit + unit
tests; adding specs for them is tracked as follow-up (§20).

## 17. Accessibility results

Global focus is projection-ivory (`--color-focus`), a single visible 2px ring. Decision
states keep ≥2 non-colour cues. Text/surfaces use the ADR 015 contrast-validated ivory/
graphite tiers. Reduced-motion + the existing a11y resets are unchanged. Forced-colours,
zoom (200/400%), and SR behaviour are exercised by the visual/e2e suites; full results at
the CI step.

## 18. E2E results

The unit/integration suite is green locally (1612 tests). Public + authenticated E2E +
visual + a11y + Lighthouse run in CI on the PR; results recorded there. No route/handler/
analytics change means existing E2E flows are unaffected by design.

## 19. Behavior-preservation proof

The diff changes colour, gradient, and font values + the theme boundary + the audit/test/
docs — never route paths, params, query params, API/Supabase calls, mutations, optimistic
updates, analytics events/payloads, data attributes, focus/keyboard/modal/share/provider
behaviour, copy, IA, SEO/metadata, auth/authz, or RLS assumptions. Proven by: the full
behavioural unit suite green; the theme audit (0 forbidden chrome); `git diff` containing
only visual values + the theme scaffold; and the routes auto-migrating via token aliases
(no logic touched).

## 20. Remaining legacy debt

- **Compatibility aliases** (`--ts-*`, `--bg-*`, `--brand-*`, `--purple-*`/`--pink-*`,
  `--font-editorial`, JS `HP`/`ROSE` var-backing) — temporary; removal plan in §24.
- **Legacy-gradient debt** frozen at 3 files / 10 occ (`src/index.css` `:root`
  rollback-fallback tokens, unused `HP_GRAD`, test assertions). `HP_GRAD` is unused in
  production and can be deleted with the alias cleanup.
- **`FILM_PALETTE`** (movie/data.js) — vestigial unused contextual-color data; remove with
  cleanup.
- **Redundant `<ThoughtfulRoot>` wrappers** in Tonight/Film File/Library — now no-ops.
- **Visual-spec coverage gaps** for Browse/Collection/Lists/Account/Preferences/Onboarding/
  legal — add authenticated/public specs as follow-up.
- **Rose density on Profile / People** — these routes carry denser rose accents (eyebrows,
  editorial lines, the white-on-rose share pill) inherited from the earlier F4 rose sweep.
  This is within the "one bounded rose" rule (§13) and uses only §12-permitted rose roles
  (editorial emphasis, the approved white-on-rose pill, inline brand moments on the canvas
  where contrast passes), and the legacy purple/pink gradient system is fully removed. A
  design-polish follow-up may tighten rose further toward maximal restraint (move secondary
  rose eyebrows to ivory); it is not a migration regression. Baseline inspection confirmed
  no legacy violet/purple renders on these routes.

## 21. Deferred share/export artifacts

`src/features/share/ShareCard.jsx` (the downloadable "Tonight's Pick" card, rendered via
`html-to-image`) is a **separate export rendering environment** and is explicitly deferred
(per scope). It still references `var(--font-editorial)` (now Inter) + `ROSE` (now
canonical) so it inherits the theme where it overlaps, but its export-specific composition
is not part of this browser-route migration. Social/exported imagery and any
server/canvas-generated artifacts are likewise deferred and scheduled separately.

## 22. Darwin baseline status

The website-wide migration regenerates **Linux** baselines via CI (no local credentials for
the authenticated `visual-app` project). The `*-darwin.png` baselines remain at the
pre-migration render and are intentionally stale until a credentialed local pass; this is
documented and unrelated to the CI gate. The exact stale Darwin set = every
`*-visual-app-darwin.png` under `e2e/visual-auth/*-snapshots` + the public
`*-darwin.png` under `e2e/visual/*-snapshots`.

## 23. Rollback instructions

Two distinct levels:

**Runtime emergency theme fallback (partial).** Set `VITE_UI_THEME=legacy` (build/deploy env)
→ the app root renders `.theme-legacy`, the canonical `--color-*` tokens are undefined, and
every consumer resolves its legacy literal (and the untouched `:root` `--bg-*`/`--brand-*`/
`--purple-*`/`--font-*` tokens resolve again **where those fallbacks still exist**). This is a
runtime token-layer fallback for emergency palette / theme-boundary mitigation and needs no
route edits — but it is a **partial** visual rollback. It does **not** restore the removed
Newsreader/Outfit font loading, the changed shared-component defaults, the directly-edited
shell/route/CSS/SVG/JS presentation, or the regenerated visual baselines, so the result is
**not** the exact pre-migration appearance.

**Full visual rollback.** A full return to the exact pre-#315 appearance requires **reverting
this PR's squash commit** (the theme scaffold + the presentation edits + the regenerated
baselines together). The single theme-boundary class makes that revert clean and isolated, but
it is the file revert, not the env switch alone.

## 24. Legacy-mode removal plan

The legacy mode + the compatibility aliases are **temporary**. Removal stage (a dedicated
follow-up PR, after a production monitoring window confirms no regression):
1. Delete the `.theme-legacy` branch in App.jsx + the `VITE_UI_THEME` switch (default-only).
2. Remove the compatibility aliases from `src/index.css` (the `--bg-*`/`--brand-*`/
   `--purple-*`/`--pink-*`/`--font-editorial` block) and the `--ts-*` aliases from
   foundations.css; migrate any remaining `--ts-*`/`HP`/`ROSE` consumers to read `--color-*`
   directly.
3. Delete `HP_GRAD`, `FILM_PALETTE`, and the redundant `<ThoughtfulRoot>` wrappers.
4. Drop the legacy `:root` `--purple-*`/`--pink-*`/`--brand-gradient`/`--font-editorial`
   tokens; reduce the legacy-gradient guard baseline to zero.
Do not maintain two visual systems beyond the monitoring window.
