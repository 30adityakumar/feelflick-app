# FeelFlick — Claude Code Guide

## What is FeelFlick

Mood-first movie discovery. Users say how they feel. We return films —
not what's trending, what's right for them right now.

Every surface, every doc, every feature serves this one sentence. If a
change doesn't make mood-to-film clearer, faster, or more personal —
it's not the priority.

## Project
Mood-first movie/TV discovery. Users express how they feel → get curated recommendations.
**Quality bar:** Netflix / Apple TV+ polish. Every surface is production-facing.
**Stack:** React 18 · React Router v7 · Framer Motion · Tailwind CSS · Vite · Supabase (PostgreSQL + pgvector) · TMDB API · OpenAI (text-embedding-3-small) · Resend · Google OAuth · Vitest · Sentry
**Language:** JavaScript (JSX). No TypeScript yet — avoid patterns that block future migration.

## Folder Map

```
src/
├── main.jsx · App.jsx · index.css   # entry → providers → router
├── app/                  # App shell + routing ONLY (cross-cutting wiring)
│   ├── AppShell.jsx      # layout frame (header + <Outlet/>)
│   ├── router.jsx        # all routes, lazy-loaded (highest-traffic file)
│   ├── ErrorBoundary.jsx
│   ├── NotFound.jsx      # live 404
│   ├── header/           # production global Header, BottomNav, SearchBar
│   ├── providers/        # React context providers (WatchlistContext, …)
│   └── admin/            # email-allowlist-gated admin tools
├── features/             # one folder per product surface — NO version suffix
│   ├── landing/          # the v3 editorial landing at /
│   ├── onboarding/       # mood-reactive onboarding
│   ├── auth/             # Google OAuth flow + post-auth gate
│   ├── browse/           # /mood, /collection editorial browse
│   ├── legal/            # /about, /privacy, /terms
│   ├── home/             # /home — masthead + briefing + carousels
│   ├── movie/            # /movie/:id — editorial Film File
│   ├── discover/         # /discover — AI discovery
│   ├── account/          # /account — settings
│   ├── preferences/      # /preferences — engine dials
│   ├── watchlist/        # /watchlist — The Queue
│   ├── history/          # /history — Diary
│   ├── profile/          # /profile/:userId — taste profile
│   ├── people/           # /people — taste twins
│   ├── lists/            # /lists + curated detail (+ Create/AddToList modals)
│   └── feed/, challenges/ # ⚠️ unwired stubs (routes redirect to /home) — delete candidates
├── components/           # canonical app-wide UI
│   ├── carousel/         # the MovieCard hover LAW (Card, Row, hooks)
│   ├── layout/           # TopNav, Footer (shared chrome)
│   └── ToastNotification.jsx
├── shared/               # the kernel — cross-cutting logic + primitives
│   ├── api/tmdb.js       # tmdbImg(), TMDB fetch helpers
│   ├── hooks/            # useAuthSession, usePageMeta, useGoogleAuth, …
│   ├── services/         # recommendations.js, interactions.js, embeddings
│   ├── lib/              # pure utils, supabase client, curatedLists, format/
│   ├── components/       # domain widgets (StarRating, FollowButton, Pagination…)
│   └── ui/               # low-level primitives (Button, Modal, Input, EmptyState…)
├── legacy/               # ALL v1 — quarantined, frozen, reachable via *-legacy routes
│   ├── homepage/  movie-detail/  discover/  profile/  lists/
│   ├── watchlist/  watched/  people/  movies/  browse-curated/
│   ├── account/  preferences/  header/   # legacy header account/prefs panels
│   └── landing/          # archived v2 landing at /v2 (rollback-only)
├── styles/  assets/      # global CSS + static assets
└── test/                 # Vitest helpers, fixtures, setup
```

> **`legacy/` is frozen.** Everything under it is the original v1, kept only so the
> `*-legacy` routes (and `/v2`) still resolve for rollback/comparison. Never extend it,
> never import *from* it into a `features/` surface, and never import a `features/` surface
> *into* it. It's slated for deletion in a follow-up once those routes are confirmed unused.
>
> **No version suffixes.** The old `*-v2`/`*-v5` folder names were dropped in the
> repo-structure refactor (onboarding led the way in #77). A feature folder is a plain
> lowercase domain noun (`home`, not `home-v2`); the entry component matches it
> (`features/home/Home.jsx`). `router.jsx` keeps `…V2` *local const* names only to
> disambiguate a current surface from its still-present legacy twin — that's deliberate.
>
> **`components/` vs `shared/components/`:** `components/` is app-wide canonical UI
> (carousel, layout chrome, toasts); `shared/components/` is reusable *domain* widgets
> (ratings, follow button, pagination). `shared/ui/` is the lowest-level primitive layer.

## Auth + Recommendation Engine

Auth initialises in `main.jsx` before React mounts: parses OAuth hash → sets Supabase session → `/auth/callback`. `RootEntry` routes authenticated → `/home`, unauthenticated → Landing. `RequireAuth` guards protected routes. `PostAuthGate` redirects new users to `/onboarding`.

Recommendation pipeline: content-based filtering + pgvector cosine similarity + behavioral signals (skips, re-watches, ratings). Anti-recency bias, signal decay. Tracked via `recommendation_impressions` + `mood_sessions`. User profiles cached in `user_profiles_computed` with TTL.

## Environment Variables

```
VITE_SUPABASE_URL      # Supabase project URL (non-secret)
VITE_SUPABASE_ANON_KEY # Supabase anon key (RLS enforces access)
VITE_TMDB_API_KEY      # TMDB read-only key (rate-limited 40 req/10s)
VITE_ADMIN_EMAILS      # Comma-separated admin emails for AdminOnly guard
VITE_SENTRY_DSN        # Sentry DSN (optional; defaults to prod DSN)
```

`import.meta.env.DEV` / `.PROD` and `process.env.NODE_ENV` are automatic.
**OpenAI key is server-side only. Never add `VITE_OPENAI_*`.**

## Dev Environment

MCP-driven dev test credentials live in `.claude/local-secrets.json` (gitignored). Read this on session start before running SIGN_IN.

## MCP-Driven Auth Workflows

When testing with chrome-devtools MCP, you may sign in and out autonomously as needed — no need to ask. This is the only exception to the "ask before any Supabase change" Hard Stop, because it's a client-side auth call against an existing dev test user, not a schema or config change.

Credentials: read `.claude/local-secrets.json` → `feelflickDevUser.{email, password}`.

SIGN_IN:
1. Ensure the dev server is running on http://localhost:5173. If not, start `npm run dev` in the background and wait for it to respond.
2. Open chrome-devtools to http://localhost:5173 if not already.
3. evaluate_script: `await window.supabase.auth.signInWithPassword({ email, password })` with the creds above.
4. Verify session via `await window.supabase.auth.getSession()`.
5. Confirm URL settles on /home (not /onboarding — the test user is already onboarded).

SIGN_OUT:
1. evaluate_script: `await window.supabase.auth.signOut()`.
2. Fallback: clear localStorage keys matching /^sb-.*-auth-token$/.
3. Navigate to /, hard-reload, confirm Landing renders ("Films that know you.").

Use SIGN_IN when testing authenticated surfaces (/home, /discover, /movie/:id, etc.). Use SIGN_OUT when testing the v3 landing or any unauthenticated route. Switch freely.

## Code Standards

**Workflow (never skip):** `lint → test → build`

```bash
npm run dev          # Vite dev server (port 5173)
npm run lint         # ESLint (flat config, eslint.config.js)
npm run lint:fix     # Auto-fix safe issues
npm run test         # Vitest (unit/component)
npm run test:e2e     # Playwright E2E (auto-starts dev server; see note below)
npm run build        # Production build
```

> **E2E (Playwright):** tests live in `e2e/` as `*.e2e.js` (named so Vitest skips
> them). Auth uses a client-side `window.supabase.signInWithPassword` against the
> dev test user, so set `E2E_TEST_EMAIL` / `E2E_TEST_PASSWORD` (from
> `.claude/local-secrets.json` → `feelflickDevUser`) before running:
> `E2E_TEST_EMAIL=… E2E_TEST_PASSWORD=… npm run test:e2e`. Saved session →
> `e2e/.auth/` (gitignored). `public/` specs run logged-out; `app/` specs authenticated.

- One component per file *except* in editorial surfaces (e.g. `landing/Landing.jsx`) where sub-components are colocated as a single composition.
- PascalCase components, camelCase hooks prefixed `use`.
- Inline styles are allowed in the feature surfaces + editorial landing (typography rhythm is finer than Tailwind's defaults). Tailwind utilities everywhere else.
- No hardcoded hex outside the `HP` token object (feature surfaces) or the v3 landing's `C` palette — use Tailwind tokens or CSS custom properties.
- Strict null safety — never assume nullable values are present without a guard.
- All interactive elements need `aria-label` / keyboard handlers. No a11y regressions.
- JSDoc types on public-facing functions.
- Tests in `__tests__/` adjacent to the feature, or `src/test/` for helpers.
- Run `lint → test → build` before declaring any task done. Never mark done if build fails.

## Editorial Language

This is the unified design language used by both the public v3 landing and
every authenticated feature surface. The two families look related on purpose.

### Fonts

- **Outfit** — display headlines, kickers, numbers, buttons, eyebrows. Weights
  200–300 for hero scale (≥56px), 400–500 for section headers, 600 for buttons.
- **Inter** — body prose, italic blurbs, micro labels. Weights 400–600.
- **JetBrains Mono** — meta labels (rarely used today).
- **Forbidden**: Playfair Display, Satoshi, Fraunces — not installed; do not reference.

Inline `fontFamily:` should reference the CSS variables:

```css
--font-display: 'Outfit', 'Inter', sans-serif;
--font-body: 'Inter', sans-serif;
```

Italic Outfit is the brand's accent face — apply it to *single fragments*
inside a headline, never to whole sentences:

```jsx
<h1>Your <em style={{ fontStyle:'italic', color: HP.textSoft }}>taste twins.</em></h1>
```

### Color tokens

Brand palette: purple + pink only. No amber/rose/orange in gradients.

CSS vars in `src/index.css :root` are the authoritative source:

```
--purple-50…900, --pink-50…900   (the full Tailwind scales)
--brand-gradient                  (purple-600 → pink-500, 135deg)
--font-display, --font-body
--bg-base (#06060a), --bg-elevated (#0d0b14)
```

Inline-style feature surfaces use the `HP` object (defined per `<feature>/data.js`), and
the v3 landing uses a local `C` object. Both align with the same hex values —
just named differently. Eventually these will collapse into one shared
`shared/lib/tokens.js`.

### Brand gradient — single source of truth

```
linear-gradient(135deg, #9333ea 0%, #ec4899 100%)
```

That's purple-600 → pink-500 in the Tailwind scale. Use it via `var(--brand-gradient)`
in inline styles or `bg-gradient-to-r from-purple-600 to-pink-500` in Tailwind.

Never invent per-vibe / per-genre gradients. One brand gradient, always.

### Hero typography (the v2/v3 fingerprint)

```jsx
<h1 style={{
  fontFamily: 'var(--font-display)',
  fontSize: 88,              // hero scale; 56–104px range
  lineHeight: 0.92,
  fontWeight: 300,           // 200–300 only at this size
  letterSpacing: '-0.05em',  // -0.04 to -0.05em
  textWrap: 'balance',
  margin: 0,
}}>
  The <em style={{ fontStyle:'italic', fontWeight: 400, color: HP.textSoft }}>diary.</em>
</h1>
```

Rules:
- Weight 200–300 only for ≥56px display sizes. Below that, jump to 400–500.
- Negative letter-spacing on display (`-0.04em` to `-0.05em`).
- Italic accent words on a *single* emphasised fragment.
- `textWrap: 'balance'` on every headline, `textWrap: 'pretty'` on body paragraphs.
- Never use `font-black` / weight 900 in v2 or v3 landing surfaces.

### Kicker pattern (above every section header)

```jsx
<div style={{
  fontSize: 10, fontWeight: 700,
  letterSpacing: '0.28em', textTransform: 'uppercase',
  color: HP.purple, marginBottom: 12,
  display: 'inline-flex', alignItems: 'center', gap: 10,
}}>
  <span style={{ height: 1, width: 22, background: HP.purple, opacity: 0.6 }} />
  Mood weights
</div>
```

A 22px purple horizontal rule + ALL-CAPS Outfit 700 at 10–11px with
`0.22–0.32em` letter-spacing.

### Section Header Pattern (carousel rows)

```jsx
<div className="w-[3px] h-5 rounded-full bg-gradient-to-b from-purple-400 to-pink-500" />
<h2 className="text-[1.05rem] sm:text-[1.15rem] font-bold text-white tracking-tight whitespace-nowrap">{title}</h2>
<div className="h-px flex-1 bg-gradient-to-r from-purple-400/20 via-white/5 to-transparent" />
```

The canonical [src/shared/ui/SectionHeader.jsx](src/shared/ui/SectionHeader.jsx)
follows this spec exactly. Use the primitive; don't hand-roll the bar.

### Action button

v2 inline-style version:

```jsx
<button style={{
  padding: '12px 22px', borderRadius: 8,
  background: 'var(--brand-gradient)', border: 'none', color: '#fff',
  fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 600,
  letterSpacing: '0.02em', cursor: 'pointer',
  boxShadow: '0 12px 28px -8px rgba(236,72,153,0.5)',
}}>Save and retune</button>
```

Tailwind / shared primitive version:

```jsx
<Button variant="primary">Save and retune</Button>
```

`Button.jsx` primary variant uses `from-purple-600 to-pink-500` +
`hover:brightness-110 hover:scale-[1.02] active:scale-[0.97]`.

### Layout grid

- Page shell max-width: **1440px** (v2) or **1280px** (v3 landing).
- Editorial content max-width: **1080px** where prose readability matters.
- Horizontal padding: **88px** on desktop for v2. 32px for v3 landing
  (more breathing room befits a marketing page).
- Vertical section rhythm: `padding: 56–72px 88px`, separated by
  `borderTop: 1px solid HP.border`.

### Section-hide rule

Sections must self-hide when their data source is empty (`return null`)
rather than render a placeholder. ContinueWatching, Friends, Lists, Recent
all do this. Never fabricate content to fill a slot.

### Skeletons, not spinners

Per CLAUDE.md "Never Do" item 9: always `animate-pulse` skeletons matching
content shape. **Exception**: in-button micro-spinners (e.g. `<Loader2 className="h-4 w-4 animate-spin" />`
inside a `<Button>` when `loading=true`) for action-in-progress states —
see `src/shared/ui/Button.jsx:41`.

Page/route Suspense fallback: `RouteSkeleton` in `src/app/router.jsx`.
Full-screen auth/onboarding splashes: `<BrandSplash />`.

### MovieCard hover — THE LAW

Three files own card hover. Read all three before touching any:

- `src/components/carousel/hooks/useMovieCardHover.js` — owns `hoveredId` state + timers
  (`CARD_EXPAND_DELAY_MS = 0`, `CLOSE_DELAY_MS = 90ms`).
  Full audit history in `docs/audits/2026-04-27-carousel-hover.md`.
- `src/components/carousel/Row/index.jsx` — derives `hovered = hover.hoveredId === item.id` per card.
- `src/components/carousel/Card/index.jsx` — fixed-size slot. `MovieCard.jsx` owns poster scale-up.

**No portal. No floating overlay. No expanding panel. Pure poster scale-up (Apple TV+ style).**

On hover: poster `scale(1.04)` (220ms cubic-bezier(0.22,1,0.36,1)), border/shadow ramp,
bottom glow intensifies. No sibling dim or shift. Below-card title is always
visible as a static div — never hidden or animated.

### Landing — v3-specific deltas

The v3 landing at `/` is canonical for public surfaces (PR #84 promoted it
from `/v3`). It uses the editorial language above, with these specifics:

- File: `src/features/landing/Landing.jsx` (688 LOC, single editorial composition — sub-components colocated by design).
- Type primitives via `landing.css` CSS classes:
  - `.ff-d1` — Outfit 200, ls -0.055em, lh 0.92 (hero scale).
  - `.ff-d2` — Outfit 200, ls -0.045em, lh 0.96 (section scale).
  - `.ff-eyebrow` — Outfit 600, 11px, ls 0.28em, uppercase.
  - `.ff-italic` — Outfit 300 italic — accent fragments.
- Hero size: `clamp(56px, 7vw, 118px)`.
- Section size: `clamp(44px, 5.6vw, 80px)`.
- Reveal-on-scroll via `<Reveal>` IntersectionObserver wrapper (threshold 0.15).
- Mood-tinted starfield via `<Stars>`.

### Approved copy (v3 landing)

- Hero eyebrow: `FeelFlick · {day} {part-of-day}` (greeting-aware, render-computed).
- Hero headline: "Films that know **you.**" (italic accent on "you.")
- Hero sub: "The right film. Right now. Tuned to your mood, your taste, and everything you've ever loved on screen."
- Hero CTA: `Start free →`
- Final CTA eyebrow: "Stop scrolling. Start watching."
- Final CTA headline: "Tonight is **yours.**"
- Final CTA sub: "One film, for the way you feel. Open it anytime."
- Final CTA button: `Begin →`
- Footer micro: "Free · No credit card · Cancel anytime"
- Footer tagline: "The right film. Right now."
- Footer signature: "Made for the patient."

### CTA / loading microcopy (everywhere)

- Sign-in label: sentence-case "Sign in" (not "Sign In").
- Pending state: "Signing in…" with Unicode ellipsis `…` (not three dots).
- OAuth in flight: "Opening Google…"
- General save/load: "Saving…", "Loading…", "Adding…" — all Unicode ellipsis.

### Page titles & meta

Every Tier 1 surface should call `usePageMeta({ title, description?, image?, url? })`
near the top of its main component. Title format: `'<X> — FeelFlick'` (em-dash).

Already wired across `/home`, `/movie/:id`, `/discover`, `/account`, `/preferences`,
`/watchlist`, `/history`, `/profile`, `/people`, `/lists`, `/lists/:listId`,
`/lists/curated/:slug`, `/about`, `/privacy`, `/terms`.

### What NOT to do

- ❌ Don't use Inter `font-black` for feature-surface or v3 landing headlines — that's
  the legacy v1 signature (frozen under `src/legacy/`).
- ❌ Don't reference `src/features/landing/sections/HeroSection.jsx` — it doesn't exist.
- ❌ Don't invent per-vibe gradients. Use `var(--brand-gradient)` always.
- ❌ Don't add new font imports without updating this section.
- ❌ Don't hardcode hex outside the `HP` (feature surfaces) or `C` (v3 landing) palettes.
- ❌ Don't use `text-neutral-*` / `text-gray-*` — use `text-white/*`.
- ❌ Don't use page/section spinners — `animate-pulse` skeletons only.
  (In-button micro-spinners inside Button.jsx are the documented exception.)
- ❌ Don't navigate to v1 legacy routes from a current feature surface (`/movie-legacy/:id` →
  use `/movie/:id`; `/profile-legacy/:id` → use `/profile/:id`; etc.).
- ❌ Don't fabricate content to fill an empty section. `return null`.

## Shared UI primitives

Use these from `@/shared/ui`. They share the same focus ring, opacity ladder,
and motion language.

- `<Button variant="primary|secondary|ghost|icon|destructive" size="sm|md|lg" loading? />`
- `<Modal open onClose label size="sm|md|lg" dismissible?>{children}</Modal>` — backdrop + Escape + click-outside + focus management.
- `<Input>` / `<Textarea>` / `<Select>` — pure styling primitives (no built-in label).
- `<Checkbox id checked onChange label />` — toggle switch.
- `<EmptyState icon title description action />` — canonical empty state.
- `<SectionHeader title subtitle? seeAllTo? eyebrow? />` — carousel row header (matches the section header pattern above).
- `<BrandSplash label? error? />` — full-screen brand splash (200ms delayed visibility; errors immediate).

## Planning Behaviour (never skip)

Before writing any code for a task touching 3+ files:

1. List every file you plan to read, edit, or create — and why
2. Flag any irreversible or destructive steps
3. Wait for explicit go-ahead before proceeding

For single-file or clearly scoped tasks: state your approach in one sentence, then proceed.

## Ambiguity Protocol

- For low-risk unknowns: make the most reasonable assumption, add a `// ASSUMPTION:` comment inline, and surface it in your closing summary.
- For irreversible/destructive unknowns (schema changes, file deletes, config edits): stop and ask. Do not proceed on a guess.

## Blocker Communication

End every task with a one-line status:

- ✅ Done — what changed, what to verify
- ⚠️ Blocked — what you hit, what you need from me
- 🔺 Assumption made — what you assumed and where it's documented

## Coding Conventions

### Import Order

```js
// 1. React core
import { useState, useEffect } from 'react'
// 2. Third-party (router, motion, libraries)
import { useNavigate } from 'react-router-dom'
// 3. Icons (lucide-react)
import { Play, Check } from 'lucide-react'
// 4. Internal aliases (@/shared → @/app → @/features)
import { supabase } from '@/shared/lib/supabase/client'
// 5. Relative imports
import MovieCast from './MovieCast'
```

No blank lines within a group. One blank line between groups.

### Naming

- Components: PascalCase, file name matches export — *except* in editorial
  compositions (e.g. `src/features/landing/Landing.jsx`) where many small
  sub-components colocate in one file. Treat those files as art, not library code.
- Hooks: camelCase with `use` prefix.
- Booleans: prefer `is/has/should` prefix. `loading=` is accepted for
  compatibility with React Query convention.
- Constants: SCREAMING_SNAKE_CASE for module-level — *except* inside editorial
  surfaces where palettes/data tables may use short uppercase names (`C`,
  `GRAD`, `PICKS`).
- Event handlers: `handle` prefix — `handleClick`, `handleSubmit`. Never name
  an internal function `onClick`.
- Vague names hard no: `data`, `item`, `temp`, `thing` — always domain-specific.

### Comments

- Section dividers for long files: `// === SECTION NAME ===`.
- JSDoc on every exported hook and service function — `@param`, `@returns` minimum.
- Inline `// WHY:` comments for non-obvious decisions — not for obvious code.
- No commented-out dead code — delete it.

## Hard Stops — Ask Before Doing

These require explicit confirmation before any action:

- Installing or removing npm packages
- Any Supabase change: schema, migrations, RLS policies, Edge Functions
- Renaming or moving existing files
- Modifying `vite.config.js`, `eslint.config.js`, `tailwind.config.js`
- Any `git commit` or `git push`
- Deleting any file

## File Scope

Only touch files directly required by the task. If you spot an unrelated issue
in a file you're already in, call it out in your closing summary — do not fix
it silently.

## Never Do

1. **No `.env` edits.** Environment variables are managed outside this repo.
2. **No force pushes to `main`.** Open a PR.
3. **No deleting migrations.** Create new ones instead.
4. **No fake social proof.** No fabricated counts, testimonials, or activity copy.
5. **No `rm -rf` on `src/`.** Destructive commands require explicit confirmation.
6. **No committing secrets.** Flag immediately if a key/token is detected in source.
7. **No TypeScript.** This codebase is JSX. Never convert `.jsx` to `.tsx`.
8. **No new files when an existing file should be edited.** Check the folder map first.
9. **No page/section spinners.** Always `animate-pulse` skeletons matching content shape.
   In-button micro-spinners inside `Button.jsx` are the documented exception.
10. **No two buttons doing the same thing** on one card.

## Project Guardrails — Claude Code skills & hooks

This repo ships with auto-triggering guardrail skills in `.claude/skills/` and a
lint hook in `.claude/settings.json`. Lean on them — they encode the rules below
so they aren't re-derived each session.

**Skills (auto-invoke on matching work):**
- `design-system-guard` — enforces the editorial language (fonts, palette, brand
  gradient, hero weights, MovieCard hover law, skeletons, microcopy). Also runs as
  a check after `frontend-design` (which pushes bold aesthetics that can violate it).
- `recommendation-engine` — gates engine work (scoring, pgvector similarity,
  mood→film, decay/anti-recency); mandates DB-first analysis before any tuning.
- `supabase-change` — gates schema/RLS/edge/cron changes (confirm before DDL) and
  enforces DB-first analysis.
- `a11y-audit` — aria/keyboard/contrast checks on UI changes (the runtime layer
  `eslint-plugin-jsx-a11y` can't cover).
- `perf-guard` — LCP/CLS, lazy+srcset posters, bundle budget, query hygiene for the
  media-heavy frontend.

**Hook:** `PostToolUse` runs `.claude/hooks/lint-on-edit.sh` after every Edit/Write
to a `src/**/*.{js,jsx}` file — advisory ESLint (warnings + errors surfaced, never
blocks). It enforces the `lint → test → build` discipline automatically.

## Direction signals (recent shipped roadmap)

- Security hardening pass (2026-05-29): RLS + write lockdown on 18 catalog/engine
  tables, cron-function + IDOR-function lockdown, pinned function `search_path`
  (migrations `20260529000000`–`000400`). See memory `project_rls_exposure`.
- v3 landing replaced v2 landing at `/` (PR #84). The archived v2 landing now lives at
  `src/legacy/landing/` and is still served at `/v2` for rollback.
- Repo-structure refactor: dropped all `*-v2`/`*-v5` suffixes, quarantined v1 into
  `src/legacy/`, decoupled the archived landing, and consolidated `contexts/` → `app/providers/`.
  The feature surfaces are the canonical direction (#79). See the Folder Map above.
- Spinner → skeleton migration started (#66) — `router.jsx` and auth splashes done.
- Sentry wired in `main.jsx` + `ErrorBoundary.jsx` (#67).
- Edge function CORS hardened (#81, #82).
- Nightly `refresh_feelflick_stats()` via pg_cron (#80).

> For tuneable constants, dev environment setup, and known codebase issues — see `CLAUDE-REFERENCE.md`.
