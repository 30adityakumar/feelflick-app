# FeelFlick — Thoughtful Seatmate Visual Migration Plan

> **This is a plan. It is not executed here, and it authorizes no production change.**
> It stages the eventual surface migration toward the system consolidated in
> [`thoughtful-seatmate-visual-system-closure.md`](thoughtful-seatmate-visual-system-closure.md).
> Implementation happens later, one surface group at a time, under the migration gates in
> [`design-authority-thoughtful-seatmate.md`](design-authority-thoughtful-seatmate.md) §21
> and [`.claude/rules/design-system.md`](../../.claude/rules/design-system.md).

## Target (what every stage migrates toward)

- **Typography:** Inter only (Newsreader/Outfit removed only when the owning surface is migrated).
- **Background:** near-black → warm-graphite **neutral depth** treatment (radial preferred;
  linear only where geometry requires) on large backgrounds; solid graphite cards.
- **Surfaces:** solid graphite (`--surface-1/2/raised`); subtle graphite borders; minimal warm
  shadows; no coloured/rose/purple glow.
- **Primary action:** neutral projection-ivory fill (`#efe7d7`) + dark text (`#221b13`).
- **Decision/selected:** ivory-only marker (`#f3ecdf`) + ≥2 non-colour cues.
- **Brand accent:** one restrained solid rose (`#DD4E83`; `#C0356C` only for white-on-rose contrast),
  used sparingly.
- **Legacy purple–pink gradient:** removed (no replacement, no new token).
- **Contextual film colour:** deferred — not implemented in any stage.

## Gate alignment (resolves order vs. gates)

The stage order below is the **sequence of surface groups**. It operates **under** the
accepted gates, which govern *when shared tokens become production defaults*:

- **Stage 1 defines and scaffolds** the shared token set and primitives as the source of truth.
  It does **not** globalize them into production consumers. Per the migration rules, there is
  **no hidden token globalisation before two representative surfaces validate**.
- **Stages 3 (Tonight) and 4 (Film File) are the validating pilots** — they adopt the target using
  **scoped/local** values referencing the Stage 1 definitions.
- **Only after both pilots validate** are the shared tokens/primitives **promoted** to global
  defaults; the global shell (Stage 2) and the remaining stages then consume the promoted layer.
  In practice Stage 2's global swap lands together with or just after pilot promotion, not before it.

This keeps the plan consistent with ADR 014–018 and the gates: pilots first, global promotion after.

## Rules that apply to every stage

- one surface group at a time; **no** feature-logic, data-model, or recommendation-behaviour changes;
- **no** navigation restructuring unless separately approved; **no** contextual-colour implementation;
- **no** gradient exceptions; **no** new fonts; **no** new colour families;
- **no** hidden token globalisation before two representative surfaces validate;
- visual diff review required; desktop **and** mobile required;
- reduced motion, forced colours, 200% and 400% zoom, and contrast checks required;
- a rollback plan required; the shipped F3/F4 baseline stays untouched until its surface is in scope;
- do **not** combine all surfaces into one giant implementation PR — one stage (or sub-surface) per PR.

Per-stage **visual-regression** uses the project conventions in
[`.claude/rules/testing.md`](../../.claude/rules/testing.md) (`npm run test:visual`; inspect diffs;
confirm intentional; review desktop + mobile; re-baseline deliberately, never to silence failures).

---

## Stage 1 — Shared tokens and primitives (define + scaffold; do not globalize)

> **Status: IMPLEMENTED (foundations only), not adopted, not merged.** Built on branch
> `migration/thoughtful-seatmate-stage1-foundations` off `origin/main` `5c7191ea`. Scoped `--ts-*` tokens
> + primitives live in `src/shared/ui/thoughtful-seatmate/`, with a dev-only showcase and a legacy-gradient
> guard. No production surface adopts it; it is excluded from the production bundle. Details:
> [`thoughtful-seatmate-stage1-foundations-implementation.md`](thoughtful-seatmate-stage1-foundations-implementation.md).
> Token globalization still waits for the two pilots (gate 5).

- **Current typography:** font pipeline registers Inter + Newsreader + Outfit (`--font-body`/`--font-ui`
  Inter; `--font-display`/`--font-editorial` Newsreader).
- **Current background:** production base tokens are the legacy palette (`#000000`/`#06060a`); the
  target `--canvas`/`--surface-*` exist only in the design docs.
- **Current accent/gradient:** `--brand-rose: #DD4E83`, `--brand-gradient`/`--gradient-primary`
  (legacy purple→pink), `HP_GRAD`, plus a `--purple-*`/`--pink-*` scale, all live.
- **Target changes:** author the accepted foundation tokens (`--canvas`/`--surface-1/2/raised`,
  `--text-primary/secondary/muted`, `--border-subtle/strong`, `--neutral-action-fill`/`-text`,
  `--neutral-focus`), the neutral depth-treatment recipe, and the bounded rose accent token as the
  defined source of truth + the primitives that consume them (Button, Card, PageContainer, etc.).
  **Define only** — do not repoint production consumers or remove legacy tokens yet.
- **Visual-regression scope:** none expected (definitions only); any primitive scaffolding must be
  byte-identical on existing consumers or behind a scoped flag.
- **Accessibility checks:** contrast of the new neutral/ivory/rose roles computed and recorded
  (`#C0356C` reserved for white-on-rose); no behavioural change.
- **Rollback boundary:** revert the token/primitive definitions; production consumers are untouched.
- **Expected affected files:** `src/shared/lib/tokens.js`, `src/index.css`, `src/styles/tokens.css`,
  `tailwind.config.js`, `src/shared/ui/*` primitives.
- **Must not change functionally:** nothing — no consumer repointed, no legacy token removed.

## Stage 2 — Global shell and page canvas

- **Current typography:** AppShell chrome mixes Inter with legacy styling; wordmark uses the gradient.
- **Current background:** global canvas uses the legacy base; AppShell header carries the gradient wordmark.
- **Current accent/gradient:** gradient wordmark, "Tonight" tab, avatar ring; legacy purple/pink chrome.
- **Target changes:** swap the global canvas to the neutral depth treatment; retire the gradient
  wordmark to a solid ivory/rose-accent treatment; neutralize chrome. Lands **with or after** pilot
  promotion (see Gate alignment) — not before.
- **Visual-regression scope:** every route's shell frame, desktop + mobile; global `:focus-visible`.
- **Accessibility checks:** focus ring visibility; nav contrast; reduced motion on canvas depth;
  forced colours; 200%/400% zoom on the shell.
- **Rollback boundary:** revert shell + global canvas; feature surfaces unaffected.
- **Expected affected files:** `src/app/*` (AppShell, router-level layout), global `src/index.css`.
- **Must not change functionally:** routing, auth gating, nav destinations, tab behaviour.

## Stage 3 — Tonight / home (pilot A)

> **Status: IMPLEMENTED (the "Stage 2 — Tonight pilot"), not merged.** Branch
> `migration/thoughtful-seatmate-tonight-pilot` off `origin/main` `b3691f45`. Tonight activates the
> foundation locally via `<ThoughtfulRoot>` + `<PageDepth>`; Inter-only, neutral ivory PrimaryAction,
> ivory-only decisions, bounded rose; behavior preserved (103 Home tests green). Authenticated visual
> evidence + baseline regeneration are verified in CI. Details:
> [`thoughtful-seatmate-stage2-tonight-pilot.md`](thoughtful-seatmate-stage2-tonight-pilot.md). Film File
> (Stage 4 / pilot B) remains a separate later stage; token globalization still waits for both pilots.

- **Current typography:** Newsreader editorial + Inter; numbered `I ·`/`II ·` case (test-asserted).
- **Current background:** warm dark neutrals.
- **Current accent/gradient:** rose `#DD4E83` accent; neutral primary CTA already on `/home`.
- **Target changes:** Inter-only; neutral depth canvas; solid graphite cards; ivory-only decision
  marker; rose only as a bounded accent; no gradient. Use **scoped/local** values referencing Stage 1.
- **Visual-regression scope:** `/home` desktop + mobile; the recommendation case; skeletons/CLS.
- **Accessibility checks:** decision marker has ≥2 non-colour cues; contrast; reduced motion; zoom;
  touch targets (44px).
- **Rollback boundary:** revert `/home` to the F3/F4 baseline; other surfaces unaffected.
- **Expected affected files:** `src/features/home/*` (Briefing, WhyThisPick, PrimaryCase), home tests.
- **Must not change functionally:** the recommendation engine, scoring, "Not tonight"/skip behaviour,
  one-visible-pick + single sequential replacement, honesty/no-fabrication rules.

## Stage 4 — Film File (pilot B)

- **Current typography:** Inter body + Newsreader headings; long-form prose already Inter (P2D).
- **Current background:** warm dark; PrimaryCaseCard uses a tone-driven gradient surface.
- **Current accent/gradient:** AccentPanel `gradient` variant (tone wash), match-badge, chips.
- **Target changes:** Inter-only; neutral depth page; solid graphite trust surfaces; remove the
  tone-driven gradient surface (no replacement gradient); rose bounded accent; **no** contextual aura.
- **Visual-regression scope:** `/movie/:id` desktop + mobile; PrimaryCaseCard, ViewerNotes, DnaConfidence.
- **Accessibility checks:** evidence/quote contrast; non-colour confidence cues; reduced motion; zoom.
- **Rollback boundary:** revert `/movie/:id`; tokens stay scoped/local.
- **Expected affected files:** `src/features/movie/*` (PrimaryCaseCard, AccentPanel usage, DnaConfidence).
- **Must not change functionally:** Film File data, critic-quote→ViewerNotes mapping, DnaConfidence formula.

> **Promotion checkpoint:** after Stages 3 and 4 both validate (visual + a11y, desktop + mobile),
> promote the Stage 1 token/primitive layer to global defaults. Stages 5–12 consume the promoted layer.

## Stage 5 — Library / Browse

- **Current typography:** Inter-dominant with residual legacy styling.
- **Current background:** legacy base; grid/rail surfaces.
- **Current accent/gradient:** filter/sort chips; residual purple/pink on unmigrated controls.
- **Target changes:** Inter-only; neutral depth canvas; solid graphite cards; neutral controls; rose
  bounded; no gradient.
- **Visual-regression scope:** Browse desktop + mobile; filter/sort bars; card grid.
- **Accessibility checks:** control contrast; 44px targets; keyboard nav; zoom/reflow on grids.
- **Rollback boundary:** revert Browse; promoted tokens remain.
- **Expected affected files:** `src/features/browse/*` (and shared MovieCard usage — preserve hover LAW).
- **Must not change functionally:** MovieCard hover behaviour (ADR 002), filter/search/sort logic.

## Stage 6 — Diary / History

- **Current typography:** Inter; dense diary rows.
- **Current background:** legacy base.
- **Current accent/gradient:** rose on migrated bits; remove-button controls.
- **Target changes:** Inter-only; neutral depth; solid rows; neutral controls; rose bounded; no gradient.
- **Visual-regression scope:** History/Diary desktop + mobile; per-row controls; remove button (44px).
- **Accessibility checks:** row-control targets; non-colour state; keyboard; zoom.
- **Rollback boundary:** revert History.
- **Expected affected files:** `src/features/history/*`.
- **Must not change functionally:** history data, remove/edit behaviour, taste-memory recording.

## Stage 7 — Cinematic DNA

- **Current typography:** Inter; data-viz labels.
- **Current background:** legacy base; confidence visualizations.
- **Current accent/gradient:** any tone/gradient in confidence/section accents.
- **Target changes:** Inter-only; neutral depth; solid surfaces; **non-colour** confidence cues
  (no gradient, no contextual aura); rose bounded.
- **Visual-regression scope:** Cinematic DNA desktop + mobile; confidence components.
- **Accessibility checks:** confidence not colour-only; contrast; reduced motion; zoom.
- **Rollback boundary:** revert Cinematic DNA.
- **Expected affected files:** `src/features/dna/*` (DnaConfidence and related).
- **Must not change functionally:** the DNA/confidence computation and honesty layer (formula unchanged).

## Stage 8 — Lists

- **Current typography:** Inter.
- **Current background:** legacy base.
- **Current accent/gradient:** list chrome; residual legacy styling.
- **Target changes:** Inter-only; neutral depth; solid cards; neutral controls; rose bounded; no gradient.
- **Visual-regression scope:** Lists + list detail desktop + mobile.
- **Accessibility checks:** control contrast; targets; keyboard; zoom.
- **Rollback boundary:** revert Lists.
- **Expected affected files:** `src/features/lists/*`.
- **Must not change functionally:** list CRUD, visibility/privacy/RLS behaviour.

## Stage 9 — Profile / People

- **Current typography:** Inter.
- **Current background:** legacy base.
- **Current accent/gradient:** identity rails; closest-matches; residual legacy styling.
- **Target changes:** Inter-only; neutral depth; solid surfaces; rose bounded; no gradient; no aura.
- **Visual-regression scope:** Account/Profile + People desktop + mobile.
- **Accessibility checks:** contrast; targets; keyboard; zoom.
- **Rollback boundary:** revert Profile/People.
- **Expected affected files:** `src/features/account/*`, `src/features/people/*`.
- **Must not change functionally:** privacy boundaries, owner-only RLS, identity-resolution RPCs.

## Stage 10 — Landing

- **Current typography:** mixed (eyebrow patterns; Newsreader/Inter); **visual-regression baselined**.
- **Current background:** legacy hero/gradient treatments.
- **Current accent/gradient:** gradient-pill CTA; rose/legacy accents.
- **Target changes:** Inter-only; neutral depth hero; neutral primary CTA; rose bounded; no gradient.
- **Visual-regression scope:** landing desktop + mobile — **deliberate re-baseline** (landing is a
  baselined route; never fake the baseline locally — regenerate via the approved flow).
- **Accessibility checks:** hero contrast; CTA contrast; reduced motion; zoom; SEO/landmarks intact.
- **Rollback boundary:** revert landing + restore prior baseline.
- **Expected affected files:** `src/features/landing/*` and its visual baselines.
- **Must not change functionally:** auth entry/redirect, marketing claims (no fabricated proof).

## Stage 11 — Share artifacts

- **Current typography:** share card typography (Inter target; verify at migration time).
- **Current background:** share-card surface.
- **Current accent/gradient:** any rose/gradient in the exported card.
- **Target changes:** Inter-only (incl. exported artifacts); solid/neutral artifact surface; rose
  bounded; **no gradient** in the exported artifact (the P2E share-only role is **not** adopted).
- **Visual-regression scope:** generated share-card output (deterministic capture), desktop + mobile.
- **Accessibility checks:** exported text contrast; legibility at export size.
- **Rollback boundary:** revert the share-card surface.
- **Expected affected files:** `src/features/share/ShareCard.jsx` (and share styles).
- **Must not change functionally:** share generation, copy/link behaviour, no fabricated content.

## Stage 12 — Remaining legacy and edge surfaces

- **Current typography:** residual Outfit/Newsreader on unmigrated/edge surfaces.
- **Current background:** residual legacy base/gradient treatments.
- **Current accent/gradient:** residual `--purple-*`/`--pink-*`, `--brand-gradient`/`--gradient-primary`,
  `HP_GRAD`, Outfit.
- **Target changes:** finish Inter-only; neutral depth; solid surfaces; rose bounded; **remove the
  legacy gradient tokens and the purple/pink scale and Outfit registration** once no consumer remains.
- **Visual-regression scope:** every remaining edge route + error/empty/loading states, desktop + mobile.
- **Accessibility checks:** full sweep (contrast, focus, non-colour state, reduced motion, forced
  colours, zoom, targets) across remaining surfaces.
- **Rollback boundary:** per-surface revert; remove legacy tokens only in a final, separate cleanup PR
  after confirming zero consumers.
- **Expected affected files:** remaining `src/features/*`, `src/index.css` (legacy token removal),
  `src/shared/lib/tokens.js` (`HP_GRAD` removal), `index.html` (Outfit/Newsreader unload — last).
- **Must not change functionally:** any feature behaviour, engine, data contracts, or auth.

---

## Sequencing summary

1. shared tokens and primitives (define/scaffold)
2. global shell and page canvas
3. Tonight / home **(pilot A)**
4. Film File **(pilot B)** → **promote tokens after pilots validate**
5. Library
6. Diary / History
7. Cinematic DNA
8. Lists
9. profile / people
10. landing
11. share artifacts
12. remaining legacy and edge surfaces

Each stage is its own PR (or smaller). No stage starts before the previous validates; token
globalization waits for the two pilots. Contextual film colour is implemented in **no** stage.
