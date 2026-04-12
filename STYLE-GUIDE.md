# FeelFlick — Style Guide

> **For Claude Code:** This is extracted from `CLAUDE.md` for completeness. `CLAUDE.md` is the source of truth — if there is a conflict, `CLAUDE.md` wins.
> **For Thinker / Strategy sessions:** Upload this file to the Claude Project so the Thinker has full design context when brainstorming UI features.

---

## Design Philosophy

**Quality bar:** Netflix / Apple TV+ polish. Every surface is production-facing.  
**Theme:** Dark-first cinema aesthetic. Mood-driven. Immersive.  
**No generic UI patterns** — no spinners, no coloured side borders, no gradient buttons, no icon-in-coloured-circle sections.

---

## Colour Palette

| Role | Value |
|---|---|
| Deep background | `bg-neutral-950` |
| Card surface | `bg-neutral-900` |
| Primary accent | `purple-500` / `purple-400` |
| Accent gradient | `purple-400 → pink-500` |
| Ratings | `yellow-400` |
| Glass tint | `bg-purple-500/10 border-purple-400/25` |
| Ambient glow | `radial-gradient(ellipse, rgba(88,28,135,0.35), transparent)` |
| Skeleton | `animate-pulse bg-purple-500/[0.04]` |

**Rules:**
- No hardcoded hex values anywhere — use Tailwind tokens or CSS custom properties
- No spinners — always `animate-pulse` skeletons matching the content shape
- No coloured side borders on cards (`border-left: 3px solid ...`)

---

## Typography

| Font | Role | Min Size |
|---|---|---|
| `Playfair Display` | Display / headings | 24px+ only |
| `Satoshi` | Body text | Any size |
| `JetBrains Mono` | Meta / technical labels | Any size |

**Rules:**
- Display font (`Playfair Display`) must never appear below 24px
- Body font (`Satoshi`) handles everything below 24px
- Never mix more than these three fonts

---

## Motion & Transitions

| Type | Value |
|---|---|
| Standard transition | `280ms cubic-bezier(0.4, 0, 0.2, 1)` |
| Dramatic (card expand) | `450ms spring` |

**Rules:**
- No instant show/hide — every state change has a transition
- Respect `prefers-reduced-motion` — all animations must have a reduced-motion fallback
- Card hover intent timer is exactly 450ms — do not change this value

---

## Section Header Pattern

Every carousel row section header must match this pattern exactly:

```jsx
<div className="flex items-center gap-3 mb-4">
  <div className="w-[3px] h-5 rounded-full bg-gradient-to-b from-purple-400 to-pink-500" />
  <h2 className="text-[1.05rem] sm:text-[1.15rem] font-bold text-white tracking-tight whitespace-nowrap">
    {title}
  </h2>
  <div className="h-px flex-1 bg-gradient-to-r from-purple-400/20 via-white/5 to-transparent" />
</div>
```

> Do not deviate from this pattern for any row header. Consistency is the law.

---

## MovieCard Hover — The Law

Three files own card hover. **Read all three before touching any:**

- `Row/index.jsx` — owns `expandedId` state + 450ms intent timer
- `Card/index.jsx` — owns height transition: `isExpanded ? height * 1.55 : height`
- `MovieCard.jsx` — owns content rendering

**No portal. No floating overlay. One card, expands in place.**

### Expanded Card Content Order (top → bottom)
1. Poster (always visible)
2. Bottom gradient fade
3. Similarity tag — `absolute bottom-2 left-2`
4. Title — `text-[1.05rem] font-bold`
5. Meta row (year, runtime, rating)
6. Genre pills
7. Description — `line-clamp-3` + bottom fade overlay
8. Action buttons + 1 streaming logo + "More →" CTA

**Description source priority:** `movie.overview → movie.tagline → genre string`  
**Streaming priority:** `flatrate[0] → rent[0] → buy[0]` (region CA → US). One logo only. Fetch on hover only. Cache 24h.

**Sibling cards when one is expanded:** `opacity-60 scale-[0.97] transition-all duration-200`

**Overflow rule:** Scroll container must be `overflow-x: auto; overflow-y: visible`. No ancestor `overflow: hidden`.

---

## Accessibility Rules

- All interactive elements need `aria-label` and keyboard handlers
- No a11y regressions — every PR must maintain or improve accessibility
- Icon-only buttons always have `aria-label`
- No static elements with interaction handlers — use `<button>` or add `role`

---

## What FeelFlick Never Does

1. No spinners — only `animate-pulse` skeletons
2. No hardcoded hex values
3. No coloured side borders on cards
4. No gradient buttons
5. No icon-in-coloured-circle feature sections
6. No two buttons doing the same thing on one card
7. No fake social proof (no fabricated counts, testimonials, or activity)
8. No TypeScript — JSX only
9. No `VITE_OPENAI_*` environment variables
10. No force pushes to `main`
