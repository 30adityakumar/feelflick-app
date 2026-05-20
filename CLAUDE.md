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
**Stack:** React 18 · React Router v7 · Framer Motion · Tailwind CSS · Vite · Supabase (PostgreSQL + pgvector) · TMDB API · OpenAI (text-embedding-3-small) · Resend · Google OAuth · Vitest
**Language:** JavaScript (JSX). No TypeScript yet — avoid patterns that block future migration.

## Folder Map
```
src/
├── app/
│   ├── homepage/         # Authenticated homepage (carousels, moods)
│   │   └── components/   # HeroTopPick, BecauseYouWatchedSection, MoodCarouselRow, etc.
│   ├── header/           # Global nav
│   ├── pages/            # Route components
│   ├── providers/        # React context providers
│   ├── admin/            # Email-allowlist-gated admin tools
│   └── dev/              # Dev-only tooling (not shipped)
├── components/
│   └── carousel/
│       ├── Card/index.jsx             # Card WRAPPER — height, z-index, shadow
│       ├── CardContent/MovieCard.jsx  # Card CONTENT — poster, expanded info, actions
│       ├── Row/index.jsx              # CarouselRow — scroll, hover timing, virtualization
│       └── hooks/useVirtualization.js
├── features/
│   ├── auth/             # Google OAuth flow
│   ├── landing/          # Unauthenticated landing page
│   └── onboarding/       # New user onboarding
├── contexts/             # WatchlistContext, etc.
├── shared/
│   ├── api/tmdb.js       # tmdbImg(), TMDB fetch helpers
│   ├── hooks/            # useUserMovieStatus, etc.
│   ├── services/         # recommendations.js, interactions.js, embeddings
│   ├── lib/              # Pure utilities, supabase client
│   └── ui/               # Low-level UI primitives
└── test/                 # Vitest helpers, fixtures, setup
```

## Auth + Recommendation Engine
Auth initialises in `main.jsx` before React mounts: parses OAuth hash → sets Supabase session → `/auth/callback`. `RootEntry` routes authenticated → `/home`, unauthenticated → Landing. `RequireAuth` guards protected routes.

Recommendation pipeline: content-based filtering + pgvector cosine similarity + behavioral signals (skips, re-watches, ratings). Anti-recency bias, signal decay. Tracked via `recommendation_impressions` + `mood_sessions`. User profiles cached in `user_profiles_computed` with TTL.

## Environment Variables
```
VITE_SUPABASE_URL      # Supabase project URL (non-secret)
VITE_SUPABASE_ANON_KEY # Supabase anon key (RLS enforces access)
VITE_TMDB_API_KEY      # TMDB read-only key (rate-limited 40 req/10s)
VITE_ADMIN_EMAILS      # Comma-separated admin emails for AdminOnly guard
```
`import.meta.env.DEV` / `.PROD` and `process.env.NODE_ENV` are automatic.
**OpenAI key is server-side only. Never add `VITE_OPENAI_*`.**

## Dev Environment

MCP-driven dev test credentials live in `.claude/local-secrets.json` (gitignored). Read this on session start before running SIGN_IN.

## Code Standards
**Workflow (never skip):** `lint → test → build`
```bash
npm run dev          # Vite dev server (port 5173)
npm run lint         # ESLint (flat config, eslint.config.js)
npm run lint:fix     # Auto-fix safe issues
npm run test         # Vitest
npm run build        # Production build
```
- One component per file. PascalCase components, camelCase hooks prefixed `use`.
- No inline styles — Tailwind classes or `shared/styles` only.
- No hardcoded hex values — Tailwind tokens or CSS custom properties.
- Strict null safety — never assume nullable values are present without a guard.
- All interactive elements need `aria-label` / keyboard handlers. No a11y regressions.
- JSDoc types on public-facing functions.
- Tests in `__tests__/` adjacent to the feature, or `src/test/` for helpers.
- Run `lint → test → build` before declaring any task done. Never mark done if build fails.

<!-- WHY: The workflow gate prevents shipping broken code. Claude must own the
     verification step, not leave it to you. -->

## UI & Design System
Dark-first. Cinema palette. Surfaces: `bg-black` (page base) · `bg-white/5` (card) · `bg-neutral-900` (legacy, avoid on new surfaces).
Accent: `from-purple-500 to-pink-500` (brand gradient — 500→500, not 400→500). Ratings: `yellow-400`.
Glass tint: `bg-purple-500/10 border-purple-400/25`. Skeletons: `animate-pulse bg-purple-500/[0.04]`. **Never spinners.**

**Fonts:**
- **Inter** — body, UI, the entire landing/auth surface family. Loaded globally via [tailwind.config.js](tailwind.config.js#L76) (`sans` + `display` both map to Inter).
- **Outfit** — display face for all authenticated `v2` surfaces (`/home-v2`, `/discover-v5`, `/profile-v2`, `/people-v2`, `/lists-v2`, `/preferences-v2`, `/account-v2`, `/watchlist-v2`, `/history-v2`, `/movie-v2`). Loaded per-page via Google Fonts `@import` in each surface's CSS file. Weights 200–700 + italic.
- **JetBrains Mono** — meta labels only (rarely used today).
- Do **not** reference `Playfair Display`, `Satoshi`, or `Fraunces` — they're not installed.

Transitions: 280ms cubic-bezier(0.4,0,0.2,1) standard · 450ms spring for dramatic.

Two surface families now coexist:
- **Landing / auth surfaces** → see **Brand Surface — The Law (Landing)** below. Inter `font-black` headlines, Tailwind utility classes.
- **App v2 surfaces** → see **App v2 Surface — Editorial Magazine** below. Outfit display + Inter body, magazine layout, inline styles. This is the direction new surfaces should follow.

### MovieCard Hover — THE LAW
Three files own card hover. Read all three before touching any:
- `hooks/useMovieCardHover.js` — owns `hoveredId` state + timers (`CARD_EXPAND_DELAY_MS = 0`, `CLOSE_DELAY_MS = 90ms`). Scroll listener filters out intra-carousel scroll; page-level scroll still closes. Full audit history in `docs/audits/2026-04-27-carousel-hover.md`.
- `Row/index.jsx` — derives `hovered = hover.hoveredId === item.id` per card; passes `scrollRef` to the hook.
- `Card/index.jsx` — fixed-size slot (no height expansion). `MovieCard.jsx` owns poster scale-up on `hovered`.

**No portal. No floating overlay. No expanding panel. Pure poster scale-up (Apple TV+ style).**
On hover: poster `scale(1.04)` (220ms cubic-bezier(0.22,1,0.36,1)), border/shadow ramp up, bottom glow intensifies. No sibling dim or shift. Below-card title is always visible as a static div — never hidden or animated.

Overflow: scroll container `overflow-x: auto` with `paddingTop: 0.75rem`.

### Section Header Pattern (all rows must match)
```jsx
<div className="w-[3px] h-5 rounded-full bg-gradient-to-b from-purple-400 to-pink-500" />
<h2 className="text-[1.05rem] sm:text-[1.15rem] font-bold text-white tracking-tight whitespace-nowrap">{title}</h2>
<div className="h-px flex-1 bg-gradient-to-r from-purple-400/20 via-white/5 to-transparent" />
```

## Brand Surface — The Law (Landing)

Applies to the **public** surfaces: landing page, auth, onboarding. For
authenticated v2 surfaces, see **App v2 Surface — Editorial Magazine** below.

When in doubt on a landing surface, open
`src/features/landing/sections/HeroSection.jsx` and match it exactly.

### Fonts (actual, not aspirational)
- Body + display: `Inter` (loaded globally; both `sans` and `display` map to Inter in [tailwind.config.js](tailwind.config.js))
- Monospace: `JetBrains Mono` — meta labels only
- **Not installed, do not reference**: `Playfair Display`, `Satoshi`, `Fraunces`

### Headlines (copy the landing exactly)
- Weight: `font-black`
- Tracking: `tracking-tight`
- Leading: `leading-[1.05]` for hero-scale, `leading-tight` for section
- Size scale (clamp-based, landing-proven):
  - Hero: `clamp(2.75rem, 7vw, 5rem)`
  - Section: `clamp(2.25rem, 6vw, 3.75rem)`
  - Sub-section: `clamp(1.5rem, 3.5vw, 2.25rem)`

### Brand gradient (the single source of truth)
- Tailwind: `bg-gradient-to-r from-purple-500 to-pink-500`
- For text: add `bg-clip-text text-transparent`
- For shadow: `shadow-lg shadow-purple-500/20`
- Hover: `hover:brightness-110 hover:scale-[1.02]`
- Active: `active:scale-[0.97]`
- Transition: `transition-all duration-200`
- **Never** invent per-vibe or per-genre gradients. One brand gradient, always.

### Primary CTA (copy from HeroSection.jsx verbatim)
- Shape: `rounded-full`
- Padding: `px-10 py-[0.875rem]`
- Gradient: brand gradient above
- Type: `text-white font-semibold text-[0.9375rem]`
- Shadow: `shadow-lg shadow-purple-500/20`
- Motion: hover brightness/scale, active scale, 200ms

### Secondary CTA (ghost)
- Shape: `rounded-full`
- Background: transparent
- Border: `border border-white/15`
- Hover: `hover:border-white/30 hover:bg-white/5`
- Type: `text-white/80 font-medium`

### Text color hierarchy (landing uses this exact ladder)
- Primary: `text-white`
- Secondary: `text-white/60`
- Tertiary/micro: `text-white/40`
- Quaternary: `text-white/20`
- **Do not** use `text-neutral-400`, `text-gray-500`, etc.

### Surface backgrounds
- Page base: `bg-black` (not `bg-neutral-950` — landing uses pure black)
- Ambient glow (when content feels flat):
  `radial-gradient(ellipse 100% 55% at 50% -5%, rgba(88,28,135,0.50) 0%, transparent 70%)`
- Card surface: `bg-white/5` with `border border-white/10`
- Hover card: `bg-white/10`

### Motion (match landing's Framer Motion defaults)
- Entrance: `initial={{ opacity: 0, y: 18 }}` → `whileInView={{ opacity: 1, y: 0 }}`
- Duration: 0.45–0.5s
- Stagger: 0.08s delay between siblings
- Always respect `prefers-reduced-motion`
- Viewport: `{ once: true, margin: '-60px' }`

### Approved copy (do not drift)
- Hero eyebrow: "FILMS THAT KNOW YOU"
- Hero headline: "The right film. Right now." ("Right now." is the brand-gradient line)
- Hero sub: "Picks shaped by your mood, taste, and cinematic history."
- Hero CTA: "Get Started Free"
- Final CTA headline: "Stop scrolling. Start watching." (rendered with `\n` between sentences via `whitespace-pre-line`)
- Final CTA sub: "Free forever. No ads. No credit card. Just better picks."
- Final CTA button: "Get Started Free"
- Final CTA micro: "47 seconds to your first pick. Free forever."
- Final CTA copy lives in [src/features/landing/data.js](src/features/landing/data.js) `TONE_COPY.confident` — single source of truth.

### What NOT to do on landing/auth surfaces (bugs caught in past PRs)
- ❌ Do not use `font-serif` / Fraunces (Onboarding polish attempt introduced this — removed)
- ❌ Do not invent per-category gradients (Discover vibe cards introduced this — removed)
- ❌ Do not hardcode hex colors — use Tailwind tokens or CSS vars
- ❌ Do not use `text-neutral-*` or `text-gray-*` — use `text-white/*`
- ❌ Do not use spinners — use `animate-pulse` skeletons
- ❌ Do not add new font imports without updating this section

> Inline hex + per-page Google Fonts `@import` ARE allowed inside the
> `App v2 Surface` family — see that section below for its conventions.
> The two surface families have different typographic rules on purpose.

### When building a new landing/auth surface
1. Open `HeroSection.jsx` and `FinalCTASection.jsx` side by side
2. Copy the gradient, CTA, and type patterns verbatim
3. Run `grep -r "from-purple-500 to-pink-500" src/features/landing` to find all brand-gradient usages — reuse, don't reinvent
4. Before PR: screenshot your surface next to landing hero. If they look like different products, fix yours.

<!-- DECISION: src/index.css and src/styles/tokens.css define two competing palettes.
     Neither is currently authoritative. Future task: keep tokens.css (cleaner),
     migrate index.css to import from it, delete the duplicate palette. -->

## App v2 Surface — Editorial Magazine

Applies to every authenticated surface that lives under `src/features/*-v2/`
(plus `discover-v5`). When building a new app surface, this is the default;
the landing rules above are only for the public-facing pages.

The design language is **editorial print** — magazine masthead typography,
ultra-thin display weights, italic accent words, kicker rules in tiny caps,
mood-tuned ambient gradients, hairline borders between sections.

Reference surfaces (best examples to imitate):
- [src/features/home-v2/HomeV2.jsx](src/features/home-v2/HomeV2.jsx) — masthead + 3-up briefing
- [src/features/profile-v2/top.jsx](src/features/profile-v2/top.jsx) — sticky-left meta + display headline
- [src/features/lists-v2/ListDetailV2.jsx](src/features/lists-v2/ListDetailV2.jsx) — magazine spread layout

### Fonts (this is the v2 law)
Every v2 surface's CSS file must include this `@import` at the top:

```css
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@200;300;400;500;600;700&family=Inter:wght@400;500;600&display=swap');
```

- **Outfit** → headlines, kickers, numbers, buttons, eyebrows. Use weights 200–300 for hero-scale (≥56px), 400–500 for section headers, 600 for buttons/strong UI.
- **Inter** → paragraphs, body prose, italic blurbs, micro labels. Weights 400–600.
- Italic Outfit is the brand's accent face — apply it to *single fragments* inside a headline, never to whole sentences.

### Headline typography (the v2 fingerprint)

This is what makes the page feel editorial rather than SaaS:

```jsx
<h1 style={{
  fontFamily: 'Outfit, Inter, sans-serif',
  fontSize: 88,                  // hero scale; range 56–104px
  lineHeight: 0.92,
  fontWeight: 300,               // 200–300 only at this size
  letterSpacing: '-0.05em',      // tight tracking; -0.04 to -0.05em
  color: HP.text,
  margin: 0,
  textWrap: 'balance',
}}>
  Your <em style={{ fontStyle:'italic', fontWeight: 400, color: HP.textSoft }}>taste twins.</em>
</h1>
```

Rules:
- **Weight 200–300 only for ≥56px display sizes.** Below that, jump to 400–500.
- **Negative letter-spacing on display** (`-0.04em` to `-0.05em`). Tightens the type like print headlines do.
- **Italic accent words** on a *single* emphasised fragment — softer color (`textSoft` / `textMuted`) and one weight heavier than the surrounding text.
- `textWrap: 'balance'` on every headline, `textWrap: 'pretty'` on body paragraphs.
- Never use `font-black` / weight 900 in v2 (that's the landing's signature, not v2's).

### Kicker pattern (above every section header)
```jsx
<div style={{
  fontSize: 10, fontWeight: 700,
  letterSpacing: '0.28em', textTransform: 'uppercase',
  color: HP.purple,
  marginBottom: 12,
  display: 'inline-flex', alignItems: 'center', gap: 10,
}}>
  <span style={{ height: 1, width: 22, background: HP.purple, opacity: 0.6 }} />
  Mood weights
</div>
```

A 22px purple horizontal rule + ALL-CAPS Outfit 700 at 10–11px with `0.22–0.32em` letter-spacing. This is the magazine-issue eyebrow. Used everywhere.

### Color tokens (HP — shared across all v2 surfaces)
Defined per-surface in `data.js` files; all use identical values:
```js
const HP = {
  bg:'#000000', bgDeep:'#06060a',
  border:'rgba(255,255,255,0.08)', borderStrong:'rgba(255,255,255,0.14)',
  text:'#FAFAFA', textSoft:'rgba(250,250,250,0.72)',
  textMuted:'rgba(250,250,250,0.45)', textFaint:'rgba(250,250,250,0.28)',
  purple:'#A78BFA', purpleDeep:'#7C3AED', pink:'#EC4899',
  amber:'#F59E0B', red:'#EF4444', green:'#34D399',
}
const HP_GRAD = 'linear-gradient(135deg, #A78BFA 0%, #EC4899 100%)'
```

These map to Tailwind's `purple-400/-500` and `pink-500` — same brand colors as the landing, just expressed as hex so inline styles can reference them.

### Layout grid
- Max-width container: **1440px** (page shell) with **1080px** editorial content where prose readability matters.
- Horizontal padding: **88px** on desktop. Never 56px (that's a discover-v5-era leftover).
- Vertical section rhythm: `padding: 56–72px 88px`, separated by `borderTop: 1px solid HP.border`.

### Section-hide rule
Sections must self-hide when their data source is empty (`return null`)
rather than render a placeholder. ContinueWatching, Friends, Lists, Recent
all do this. Never fabricate content to fill a slot.

### Action button (matches the landing brand gradient)
```jsx
<button style={{
  padding: '12px 22px', borderRadius: 8,
  background: HP_GRAD, border: 'none', color: '#fff',
  fontFamily: 'Outfit', fontSize: 13, fontWeight: 600,
  letterSpacing: '0.02em', cursor: 'pointer',
  boxShadow: '0 12px 28px -8px rgba(236,72,153,0.5)',
}}>Save and retune</button>
```

Ghost variant:
```jsx
<button style={{
  padding: '12px 22px', borderRadius: 8,
  background: 'rgba(255,255,255,0.06)',
  border: `1px solid ${HP.borderStrong}`,
  color: HP.textSoft, fontFamily: 'Outfit',
  fontSize: 13, fontWeight: 600, cursor: 'pointer',
}}>Discard</button>
```

### Drop the AppShell-bleed footgun
Every v2 surface must drop its internal `Nav` / `HPNav` / `Footer` if it
has one in the prototype. AppShell already provides the global TopNav.
Two nav bars = bug. The internal nav inside a prototype is *editorial copy*,
not chrome — delete it.

### What NOT to do on v2 surfaces
- ❌ Don't use Tailwind utility classes for typography (`text-4xl font-black`). v2 uses inline styles for fonts + spacing because the editorial scale is more granular than Tailwind's defaults.
- ❌ Don't use `font-black` / weight 900. The v2 signature is *thin* (200–300) display type, not heavy.
- ❌ Don't import `FILMS` or `MOODS.pool` from `data.js` as hardcoded arrays — every v2 surface has a `useXData.jsx` provider that owns runtime data. `data.js` only owns static tokens (HP colors, MOOD_META, gradient pools).
- ❌ Don't fabricate content to fill a section. Self-hide when empty.
- ❌ Don't navigate to v1 routes from a v2 surface (`/movie/:id` → use `/movie-v2/:tmdbId`; `/profile/:id` → use `/profile-v2/:id`; `/lists/:id` → use `/lists-v2/:id`; `/discover` → use `/discover-v5`). Mixing v1/v2 nav creates visual cliffs.
- ❌ Don't use Playfair / Fraunces / Satoshi — none are loaded and CLAUDE.md forbids them.

### When building a new app surface
1. Open the closest reference v2 page (Home, Profile, Lists) side by side
2. Copy the masthead pattern: eyebrow rule + huge Outfit 200/300 headline with italic accent + body paragraph
3. Build a `useXData.jsx` Context Provider for live data; sections consume via `useX()`
4. Drop any internal Nav / Footer from the prototype
5. All navigation targets must be v2 routes
6. Sections self-hide when empty
7. Before PR: screenshot next to `/home-v2` or `/profile-v2`. If the typography rhythm feels different, fix yours.

## Planning Behaviour (never skip)
Before writing any code for a task touching 3+ files:
1. List every file you plan to read, edit, or create — and why
2. Flag any irreversible or destructive steps
3. Wait for explicit go-ahead before proceeding

For single-file or clearly scoped tasks: state your approach in one sentence, then proceed.

<!-- WHY: Claude's worst habit is diving straight into implementation. A short
     plan catches misunderstandings before code is written, not after. -->

## Ambiguity Protocol
- For low-risk unknowns: make the most reasonable assumption, add a `// ASSUMPTION:`
  comment inline, and surface it in your closing summary.
- For irreversible/destructive unknowns (schema changes, file deletes, config edits):
  stop and ask. Do not proceed on a guess.

<!-- WHY: Interrupting for every minor uncertainty wastes time. But guessing on
     destructive operations is how data gets lost. This split matches FeelFlick's
     stage — fast iteration, but with guard rails on the things that hurt. -->

## Blocker Communication
End every task with a one-line status:
- ✅ Done — what changed, what to verify
- ⚠️ Blocked — what you hit, what you need from me
- 🔺 Assumption made — what you assumed and where it's documented

<!-- WHY: Forces a clear handoff. Prevents silent failures where Claude finishes
     but leaves the codebase in a broken intermediate state. -->

## Coding Conventions

### Import Order (match existing codebase pattern)
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

<!-- WHY: Mirrors the pattern already in HeroTopPick.jsx and MovieDetail/index.jsx.
     Consistent import order makes diffs cleaner and grep easier. -->

### Naming
- Components: `PascalCase` — file name must match export name exactly
- Hooks: `camelCase` with `use` prefix — e.g. `useMovieStatus`, never `movieStatusHook`
- Booleans: `is/has/should` prefix — `isLoading`, `hasError`, `shouldRefetch`
- Constants: `SCREAMING_SNAKE_CASE` for module-level — e.g. `LANGUAGE_LABELS`
- Event handlers: `handle` prefix — `handleClick`, `handleSubmit`; never name an internal function `onClick`
- Vague names are a hard no: `data`, `item`, `temp`, `thing` must always be domain-specific

<!-- WHY: FeelFlick already follows these patterns. Codifying them prevents drift
     as the codebase grows. -->

### Comments
- Section dividers for long files: `// === SECTION NAME ===` (match existing style)
- JSDoc on every exported hook and service function — `@param`, `@returns` minimum
- Inline `// WHY:` comments for non-obvious decisions — not for obvious code
- No commented-out dead code — delete it

<!-- WHY: JSDoc enables future IDE autocomplete and TS migration. WHY comments
     explain intent, not mechanics — the only comments worth writing. -->

## Hard Stops — Ask Before Doing
These require explicit confirmation before any action:
- Installing or removing npm packages
- Any Supabase change: schema, migrations, RLS policies, Edge Functions
- Renaming or moving existing files
- Modifying `vite.config.js`, `eslint.config.js`, `tailwind.config.js`
- Any `git commit` or `git push`
- Deleting any file

<!-- WHY: At FeelFlick's current stage (solo, learning, live at app.feelflick.com),
     these are the operations most likely to cause irreversible damage. Everything
     else can be iterated on quickly. -->

## File Scope
Only touch files directly required by the task. If you spot an unrelated issue in a file you're already in, call it out in your closing summary — do not fix it silently.

<!-- WHY: Scope creep makes diffs unreviewable and introduces unintended regressions.
     "While I was in there" changes are how working code breaks. -->

## Never Do
1. **No `.env` edits.** Environment variables are managed outside this repo.
2. **No force pushes to `main`.** Open a PR.
3. **No deleting migrations.** Create new ones instead.
4. **No fake social proof.** No fabricated counts, testimonials, or activity copy.
5. **No `rm -rf` on `src/`.** Destructive commands require explicit confirmation.
6. **No committing secrets.** Flag immediately if a key/token is detected in source.
7. **No TypeScript.** This codebase is JSX. Never convert `.jsx` to `.tsx`.
8. **No new files when an existing file should be edited.** Check the folder map first.
9. **No spinners.** Always `animate-pulse` skeletons matching content shape.
10. **No two buttons doing the same thing** on one card.

> For tuneable constants, dev environment setup, and known codebase issues — see `CLAUDE-REFERENCE.md`.