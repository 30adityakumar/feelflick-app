# Thoughtful Seatmate — Stage 3: Film File Pilot (implementation record)

## 1. Status

**Implemented. Behavior verified locally; authenticated visuals verified in CI. Not merged, not deployed.**
The second production-surface pilot using the Stage 1 foundation (PR #308), after the Tonight pilot
(PR #309, live in production). Film File (`/movie/:id`) is migrated to the consolidated Thoughtful Seatmate
visual system **locally** — a scoped `<ThoughtfulRoot>` boundary independent from Tonight, with **no** global
token change. All recommendation/data/analytics/routing/copy behavior is preserved; only the visual layer
changed. No other surface is migrated; tokens are **not** globalized.

> **Visual verification boundary:** the authenticated Film File surface needs Supabase test credentials,
> not available locally. Per the agreed approach (same as Tonight), behavior is verified locally (the full
> Film File unit suites + the whole suite) and the **authenticated visual evidence + baseline regeneration
> run in CI** (the `visual-app` / `movie.visual.js` project, which has the secrets). Because this is an
> intentional visual change, the **committed Film File visual baselines mismatch and the
> "Visual Regression — Authenticated App" check fails until the Linux baselines are regenerated**
> (`npm run test:visual:movie:update`) via the repo's `visual-baselines/movie-*` CI flow — expected.

## 2. Starting main SHA

`3c0c561fa912773f681a498eb4b20324323ee670` (main after the Tonight pilot #309 merged). origin/main had not
advanced; the worktree branched cleanly from it.

## 3. Exact route

`/movie/:id` → `src/features/movie/MovieDetail.jsx` (lazy, inside the shared `AppShell` → auth gates).
`:id` is the **TMDB id** (string), parsed via `useParams()` and passed to `useMovieDataFetch(id)`. The
`AppShell` Header / BottomNav are global chrome, **not** Film-File-owned.

## 4. Ownership boundary

**Rendered Film File surface** (the dependency tree under `MovieDetail`): the `.ff-movie` body with
`ScrollProgress` / `FilmGrain` / `AccessibleMediaDialog` overlays, `MovieHero`, the `main#film-file-content`
decision dossier (`PrimaryCaseCard` → `Synopsis` → `ProvidersSection` → `YourTake` → `DecisionEvidence`
[`WhyForYou` + `MoodRadar` + `ViewerNotes`] → `VideosSection` → `CastSection` → `SocialContext` →
`ExplorationTail` → `FilmFileDisclosure`[`TimelineSection` + `DetailsSection`] → `MovieFooter`), and the
`StickyActionBar`. CSS: `movie.css` (all `.ff-movie-*` / `.ff-disclosure-*` classes are Film-File-owned —
zero external usage). `data.js` re-exports the **global** `HP`/`ROSE`/`RADIUS`/`SPACE` from
`@/shared/lib/tokens`, so it was **not** edited; each rendered file shadows `HP` locally instead.
`DecisionEvidence.jsx` and `FilmFileDisclosure.jsx` carry no inline colour/font, so they were not edited.

## 5. Files changed

12 files, **+399 / −160**:

- **9 Film-File-owned source/style:** `MovieDetail.jsx`, `sections-top.jsx`, `sections-bottom.jsx`,
  `PrimaryCaseCard.jsx`, `ViewerNotes.jsx`, `components/SocialContext.jsx`, `components/ExplorationTail.jsx`,
  `components/AccessibleMediaDialog.jsx`, `movie.css`.
- **3 tests:** new `src/features/movie/__tests__/FilmFileStage3Migration.test.js`; a narrow update to the
  Stage 1 `thoughtful-seatmate/__tests__/purity-and-non-adoption.test.js` adopter allowlist (adds
  `src/features/movie/`); and a one-block update to the Tonight `home/__tests__/HomeStage2Migration.test.js`
  cross-pilot non-adoption assertion (Film File is now the 2nd authorized adopter — Tonight **source** is
  untouched).

No global token / font / shell / nav / AccentPanel / engine / data change.

## 6. Behavioral inventory (preserved)

Captured from the read-only mapping and **proven preserved by the full Film File unit suites** (hierarchy,
landmarks, final-a11y, reduced-motion, trust-framing, watched-flow, provider-truth, viewer-notes,
route-error, your-take-hierarchy, decision-evidence, exploration-tail, social-context, taste-twin-privacy,
trailer-dialog — all green): route `:id` parsing; `useMovieDataFetch` parallel fetch (TMDB + release dates +
providers + Supabase `movies`/overlay/user_settings); recommendation evidence (`deriveWhyReasons`,
`deriveWhyHeader`, overlay precedence); `useUserMovieStatus` watched/watchlist toggles + **mutual
exclusivity** + the settlement model (intent refs, loading transitions) + `recordRecommendationOutcome`;
the watched→YourTake unlock+scroll+confetti (celebrate / reduced-motion gated) + the `prompt-movie-feedback`
custom event; the rating form (`useUserRating`, stars click-twice-to-clear, reaction, textarea); analytics
event names (`movie_detail_v2` via `trackTrailerPlay`/`trackShare`, `trackInteraction`) + payloads + data-*;
`handlePlayTrailer`/`handlePlayVideo`; `handleShare` (native share → clipboard fallback, canonical URL);
provider classification (idle/loading/found/empty/error); the 4+4 exploration cap + source order;
taste-twin anonymization; disclosure self-hide gates + `hasFilmDetails`; the skip-link /
`main#film-file-content` tabIndex; the polite live region; JSON-LD + `usePageMeta`; section order / IA;
all copy. **No handler, hook, event name, payload, route, query, or copy changed.**

## 7. Foundation activation boundary

`MovieDetail` wraps the Film File body in `<ThoughtfulRoot><PageDepth depth="radial" className="ff-movie">…`
(inside `MovieDataProvider`, inside the shared `AppShell`). `PageSkeleton` and `PageError` are each wrapped
in their own `<ThoughtfulRoot><PageDepth>` so loading/error states get the neutral canvas + token
resolution. This is the **smallest boundary** covering the whole Film File surface without styling the
shell: `.ts-root` is **not** added to html / body / `#root` / `AppShell` / Header / BottomNav. The boundary
is **independent from Tonight** — Tonight has its own `<ThoughtfulRoot>` in `Home.jsx`; neither references
the other, and there is no shared parent wrapper.

## 8. Background treatment

The flat near-black `#06060a` page background and the **poster/mood-derived `FILM_PALETTE` radial
atmosphere overlays** on the hero are replaced by the Stage 1 `<PageDepth depth="radial">` — a neutral
near-black→warm-graphite canvas carrying no meaning. No poster/backdrop-derived colour, contextual aura,
purple/pink, mood colour, coloured glow, or animated atmosphere remains in the chrome. The poster/backdrop
**image itself** is preserved (the film stays visually expressive through its own artwork). `minHeight:100vh`
+ the canvas fill keep short / long / loading / error content correct.

## 9. Typography migration

Inter only. All **19** `var(--font-editorial)` (Newsreader) usages across the rendered files →
`Inter, system-ui, sans-serif` (hero title, section h2/h3s, synopsis body + drop-cap, mood-radar heading,
primary-case lead + editorial impression, viewer-notes quote, friend/twin notes). No Newsreader / Outfit /
serif / display family remains. Semantic heading order (h1 title, section h2s, the rare h3) is unchanged;
long-form prose keeps comfortable line-length / line-height / safe wrapping.

## 10. Surface migration

The leading `PrimaryCaseCard` panel — formerly a legacy purple **gradient** (`AccentPanel
variant="gradient" tone="purple"`) — is now the Stage 1 `<Surface level={1} border="subtle" radius="lg">`
(solid graphite + subtle graphite keyline, same maxWidth/padding/radius). The shared `AccentPanel`
primitive itself is **not** modified (other consumers stay pixel-identical). Cast/director/YourTake card
tints, the glassmorphism blur on icon buttons, and the coloured glows are replaced by solid graphite
surfaces with subtle borders and neutral/no shadow. No glassmorphism, gradient border, rose/purple glow, or
hover-lift was added.

## 11. Primary-action migration

The single primary action — **"Play Trailer"** (hero CTA + the `StickyActionBar` CTA) — is now the Stage 1
`<PrimaryAction>` (neutral projection-ivory fill `#efe7d7` / dark text `#221b13`). `onClick`
(`handlePlayTrailer`), label, the play icon, `disabled={!hasTrailer}`, analytics (`trackTrailerPlay`),
accessible name, and keyboard behavior are unchanged. Mark Watched / Save / Share remain visibly
subordinate. No new action hierarchy was invented; there is one ivory primary.

> **Addendum — Slice E (canonical-Button consumer migration, current).** The Stage-3 pilot above adopted the
> `<PrimaryAction>` wrapper, which is accurate for the pilot. After the Button ↔ PrimaryAction convergence
> (Slices A/B) and the Watchlist + Home migrations (Slices C/D), **both Film File trailer controls now render
> the canonical `<Button variant="primary">` directly** (`src/features/movie/sections-top.jsx`) — Movie no
> longer imports the `PrimaryAction` component, making **production wrapper imports zero**. The exact
> **size / style / grouping contracts are unchanged**: the hero stays `size="md"` with its route classes
> (`ff-movie-hero-action-btn ff-movie-hero-action-btn--primary`), `disabled`/`title`/inline `cursor`+`opacity`,
> and an outer grouping `<span>` holding the original `<svg>` + `Play Trailer`; the sticky bar stays `size="sm"`
> with its inline `padding`/`borderRadius`(`RADIUS.sm`)/`fontSize`/`fontWeight`/`cursor`/`opacity` and one plain
> `<span>`. The legacy flat-ivory recipe is preserved via the `ts-action-primary*` compat classes (route-local
> `MOVIE_PRIMARY_COMPAT_MD` / `MOVIE_PRIMARY_COMPAT_SM`) + Movie's own `PrimaryAction.css` import, so **DOM and
> visual output are unchanged** (byte-identical across four SSR cases — hero/sticky × enabled/disabled — plus a
> browser computed-style capture). **Authenticated Movie E2E and all eight Film File visuals pass without
> baseline regeneration.** Neither control uses `loading`. Compatibility-CSS removal and the final visual
> convergence remain separate work (only retirement-gate condition 1 is now met — see
> [`docs/ui/composition-system-ownership.md`](composition-system-ownership.md) → Status — Slice E). The
> historical record above is unchanged and remains true for the pilot.

## 12. Committed-state migration

Ivory-only. **Mark Watched** and **Save** (hero + sticky) drop the `FILM_PALETTE`/purple/rose active tint
for an ivory keyline + ivory text, keeping `aria-pressed` + the icon swap + the label change as ≥2
non-colour cues. The **YourTake reaction tags** (`role="radio"`/`aria-checked`) use an ivory keyline + an
ivory inset ring + `fontWeight 700` when selected (≥2 non-colour cues, no layout shift). The **SaveIndicator
"Saved ✓"** is ivory text + the ✓ glyph + the live-region announcement. The **taste-twin match% badge**
(a read-only display, not an interactive state) is ivory text + graphite keyline. **Rating stars stay
amber** and **error states stay red** (semantic, load-bearing — not brand colour). All state transitions
and writes are unchanged.

## 13. Rose usage

After migration the rendered Film File uses rose only in the `movie.css` `::selection` highlight
(`rgba(221,78,131,0.35)`, a permitted brand selection tint — not text/chrome). Every former rose usage
(section eyebrows/kickers, the daypart pill, the WhyForYou card chip, the "FF" footer mark, the
DecisionEvidence eyebrow, the trailer-dialog curtains, the error eyebrow) was neutralized to ivory because
each was small text or chrome where rose fails WCAG AA on the depth canvas. Rose is **not** used for the
film title, primary action, committed states, confidence, providers, page atmosphere, card fills, or any
small label. (Contrast computed against the actual stop behind each element: rose `#DD4E83` is only
≈4.31:1 on `--ts-surface-2` and ≈3.89:1 on `--ts-surface-raised` — below AA for small text.)

## 14. Imagery / fallback treatment

Poster and backdrop fetching, `srcSet`, `object-fit`, and alt behavior are unchanged. Missing/failed
imagery now falls back to **neutral graphite** (`--ts-surface-1/2`) — the per-film `FILM_PALETTE` placeholder
gradient and the poster colour-glow are removed. No purple/pink placeholder, no contextual/inferred colour.

## 15. Provider treatment

Provider data, dedupe, region logic, ordering, external (JustWatch) links, and availability fallback copy
are unchanged. Provider **logos keep their own brand colours** (and a provider's text-logo fallback colour
is preserved). The containing interface chrome (section, eyebrow, state copy) is neutral graphite/ivory.
The found / empty / error provider states are preserved (no merge/simplify). No availability is implied.

## 16. Trailer / share / modal treatment

`AccessibleMediaDialog` (the Film-File-local trailer/featurette modal) keeps its focus trap, scroll lock,
Escape, focus return, portal, iframe (autoplay only when open), and ARIA **byte-identical** — only colour
values changed (rose curtains → neutral ivory tint, close-button surface → graphite, "Now Playing" eyebrow
→ ivory, caption → ivory). The generic shared modal system is **not** touched. Share uses the existing
`navigator.share` → clipboard fallback with the canonical URL and `trackShare`; **share-card export
artifacts** (`src/features/share/ShareCard.jsx`) are a separate feature, out of scope, and remain legacy
(deferred to the dedicated share-artifact stage).

## 17. Legacy styling removed (from Film File only)

The flat `#06060a` page bg + the `FILM_PALETTE` hero atmosphere overlays; Newsreader (`var(--font-editorial)`,
all 19); the `FILM_PALETTE` poster/mood-derived colour across the chrome (hero glow, scroll-progress bar,
confetti, cast/director/YourTake card tints, DNADelta value+bar, timeline dot, mood-radar shape + per-axis
mood hues); the `AccentPanel` purple gradient panel (→ `Surface`); the glassmorphism blur on icon buttons +
the sticky bar; the purple `#a78bfa` focus rings + skip-link pill; the rose eyebrows/kickers + daypart pill +
WhyForYou chip + footer "FF" mark + dialog curtains + error eyebrow/CTA; the near-white `#FAFAFA`/
`rgba(250,250,250,…)` text literals → projection-ivory tokens. Nothing was removed outside Film File.

## 18. Responsive results

Local: the existing responsive structure (1440 container + 88px gutters; the 1100/880/720/420 breakpoint
class hooks in `movie.css`; the sticky bar; the mobile hero) is preserved — only style values changed.
**The full breakpoint matrix (1440/1280/1024/768/430/390/360 + 200%/400% zoom + portrait/landscape +
safe-area + long title/explanation + no poster/backdrop + many cast + deep scroll) is verified in CI's
authenticated visual project** (not renderable locally without creds — see §1).

## 19. Accessibility results

Local (jsdom): the Film File a11y / landmarks / hierarchy / reduced-motion suites pass — skip-link first +
`main#film-file-content` focus target, heading order, the live region, disclosure native keyboard, the
four action buttons' `aria-pressed`/focus, the rating radiogroup, taste-twin anonymization. Committed
states carry ≥2 non-colour cues. **Contrast (computed against the real PageDepth stops):** projection-ivory
`#f3ecdf` (~15:1) and secondary `#beb8ad` (~8–9:1) pass AA on every stop; muted `#8d887f` passes on
canvas/surface-1/surface-2 (≈5.3/5.0/4.68:1) but is ~4.22:1 on surface-raised, so the two readable
supporting-copy items (provider attribution, disclosure copy) were bumped from muted → secondary; the
skip-link focus ring was changed from white-on-ivory (≈1.2:1, failed) to a dark inset ring. No rose remains
on small text. Full keyboard / SR / forced-colours / zoom / touch-target verification runs in CI on the
authenticated surface; an adversarial review (5 dimensions) ran on the diff and its findings were resolved.

## 20. State coverage

Migrated + locally test-covered: initial loading (skeleton), loaded Film File, missing recommendation
reason / synopsis (self-hide), provider available / unknown / no-provider / error, watched / unwatched,
saved / unsaved, rated/logged (YourTake), trailer open / unavailable, recoverable + unrecoverable error
(safe copy), long title / explanation (wrap), missing poster/backdrop (neutral graphite), mobile deep
scroll (sticky bar). No fabricated states were added; deterministic fixtures drive the visual suite.

## 21. Visual evidence

The authenticated harness `e2e/visual-auth/movie.visual.js` (`--project=visual-app`, deterministic fixture
`e2e/fixtures/movie.js` with fixed clock + seeded RNG + reduced motion) captures the Film File states
(hero-case / hero-fold / decision-evidence / synopsis-provider / synopsis-provider-empty + the your-take /
tail states, desktop + mobile). It runs **in CI on the PR** (secrets available); locally the authenticated
surface is not renderable, so before/after PNGs are produced by that CI job.

## 22. Baseline review and determinism

Pending on the PR (same disciplined process as Tonight): the authenticated `visual-app` job fails first
(intended change) and uploads the `visual-diff-app` artifact; every diff is classified; only the
**Film-File-owned Linux** `movie.visual.js-snapshots/*-visual-app-linux.png` are regenerated via the
`visual-baselines/movie-*` CI flow (`npm run test:visual:movie:update`); the suite is then run twice and
must be deterministically green with no further baseline change; no Home/Tonight or other-route baseline is
touched; no threshold is relaxed; no diff artifact/trace is committed. The Darwin baselines remain at the
pre-Stage-3 render (no local creds; the CI gate is Linux) — disclosed.

## 23. Tests

New `FilmFileStage3Migration.test.js`: the local `<ThoughtfulRoot>`+`<PageDepth>` boundary; `PrimaryAction`
(sections-top) + `Surface` (PrimaryCaseCard) consumption; **only Tonight + Film File + the dev-only showcase
import the foundation** (no third surface); the rendered Film File files free of `var(--font-editorial)` /
Newsreader / Outfit / `FILM_PALETTE` / mood-hex / rose hex; no global `.ts-root`; no `--ts-*` in the global
token sources. The Stage 1 adopter allowlist was narrowed-updated to `['src/features/home/',
'src/features/movie/']` (explicit, never a broad `src/features/`); the Tonight cross-pilot assertion now
allows the 2nd adopter + asserts Tonight stays independent. Local: `npm ci` ✓, `guard:foundations` ✓
(baseline **unchanged**, 6 files / 16 occ), `lint` ✓ (clean), `test` ✓ (**1582 passed**), `build` ✓,
`git diff --check` ✓.

## 24. Non-regression proof

Film File data flow, network requests, recommendation evidence, provider/cast/crew data, trailer/modal,
save/watchlist/history, watched/rating/logging, share, analytics, and copy are unchanged — proven by the
full Film File behavioral suites passing + a diff that touches only visual properties (font/colour/
background/surface/CTA-component) and never the handlers, hooks, services, derive/, or copy. Tonight, all
non-Film-File surfaces, the global shell, global tokens (`src/shared/lib/tokens.js`, `src/index.css`),
global fonts (`index.html`), global focus/selection (`globals.css`), and the shared `AccentPanel` are
untouched (verified by the diff + the Stage 3 test's no-global assertions).

## 25. Rollback plan

Independently reversible: revert the 9 Film-File source/style files + the new `FilmFileStage3Migration.test.js`
+ the Film File Linux visual baselines (in CI) + the narrow Stage 1 adopter-allowlist update + the one-block
Tonight cross-pilot-assertion update + this doc + the migration-plan status line. Rollback requires **no**
change to Stage 1 primitives, Tonight's source/baselines, global tokens, the shared `AccentPanel`, or any
other route — Film File adopts the foundation only locally via its own `<ThoughtfulRoot>` boundary.

## 26. Known limitations

- Authenticated visual evidence + baseline regeneration are CI-only here (no local Supabase creds); the
  authenticated check fails on the PR until the **Linux** Film File baselines are regenerated. The
  `*-visual-app-darwin.png` baselines remain at the pre-Stage-3 render (macOS-only, no CI gate) pending a
  credentialed local refresh.
- The non-rendered `src/features/movie` modules (`useMovieData`, `data.js`, `derive/*`, `hooks/*`) carry no
  rendered styling and were not edited; `data.js` re-exports the global `HP` (not a Film File token), so it
  was deliberately left untouched.
- Per-friend / taste-twin **avatar identity colours** (`f.avatarBg` / `twin.avatarBg`) and **provider logo
  colours** are kept (identity/brand imagery, not poster-derived chrome).
- Share-card export artifacts (`ShareCard.jsx`) remain legacy (deferred to the share-artifact stage).

## 27. Tonight comparison

| Dimension | Tonight (Stage 2) | Film File (Stage 3) | Same? |
|---|---|---|---|
| Token values (`--ts-*` canvas/surface/text/border/action/focus) | adopted as-is | adopted as-is | **yes** |
| Neutral `PageDepth depth="radial"` | page canvas | page canvas (+ skeleton/error) | **yes** |
| `PrimaryAction` (ivory) | "Open Film File" | "Play Trailer" (hero + sticky) | **yes** |
| Ivory-only decision states | mood pills + Watched/Save | Watched/Save + reaction tags + Save indicator | **yes** |
| Inter for short + long-form | titles + briefing | titles + dense synopsis/cast/evidence/notes | **yes** |
| Rose bounded | one large editorial `em` + wordmark | only `::selection` (everything else failed AA as small text) | **mostly** |
| Primitive API friction | none (PageDepth/PrimaryAction) | none; needed `<Surface>` (Tonight didn't) to replace the `AccentPanel` gradient | minor |
| Repeated local overrides | local token consts | local **shadowed `HP`** (global re-export forced it) + per-site `FILM_PALETTE` removal | more |

## 28. Two-pilot conclusion

Both pilots adopt the identical Stage 1 token set, neutral depth, `PrimaryAction`, and ivory-only decision
treatment with **no primitive changes** and consistent results — strong evidence the shared layer is
coherent across a sparse, single-pick surface (Tonight) and a dense, long-form dossier (Film File). Two
deltas worth noting before globalization: (a) Film File needed `<Surface>` (Tonight only used
PageDepth/PrimaryAction), so the Surface API is now pilot-validated too; (b) Film File required a
**shadowed-`HP`** pattern + per-site `FILM_PALETTE` removal because it consumed the global `HP` palette and
a poster-derived colour system — a global token promotion would naturally retire both, but it also means
more surfaces will need the same de-contextualization care. Rose's bound is tighter on Film File (it fell to
`::selection` only) — confirming the contrast rule that rose is large-text/wordmark-only on the depth canvas.

## 29. Globalization recommendation

The two pilots validate the token set and primitives, but **globalization should still be staged carefully,
not rushed**: promote the `--ts-*` tokens + primitives to global defaults in a dedicated Stage (the plan's
global-shell stage) with its own visual-regression pass across every route's shell, **after** these two
pilot PRs are reviewed/merged. The shadowed-`HP` + `FILM_PALETTE`-removal experience shows remaining
surfaces (Library, Diary, DNA, Lists, Profile/People, Discover, Landing, Share) still carry global `HP`
purple/pink and contextual colour that a global swap would expose — so each should migrate (or be audited)
behind the promotion, one stage per PR, exactly as the migration plan sequences. This record is **evidence**
for that decision, not authorization for it.

## 30. No globalization was executed

This pilot used the foundation **locally** (scoped `.ts-root`). **No `--ts-*` token was promoted to the
global token files, and none was**; the shared `AccentPanel` and `HP` token object are unchanged. Token
globalization remains deferred per the migration gates. ADR 014–018 are unchanged; no new ADR was created.
