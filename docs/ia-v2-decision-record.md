# FeelFlick — Information Architecture v2 (Decision Record)

> ⚠️ **Historical record — superseded product framing.** This document's single-pick /
> "single justified nightly pick" product framing is **no longer current product
> authority**. FeelFlick's canonical definition is now **personal movie discovery**
> through three complementary modes (Made for you · Tuned to the moment · Yours to
> explore) with bounded choice — see [product-doctrine.md](product-doctrine.md)
> (rationale: [ADR 020](decisions/020-personal-movie-discovery-and-bounded-choice.md)).
> This record is preserved as an accurate account of the F2 nav decisions as shipped;
> its body is intentionally not rewritten. Re-leveling navigation around three
> complementary modes is later, separately-scoped work.

> **Phase F2 of the rebuild.** This is the source of truth for the IA changes made
> in F2 and the reasoning behind them. Read alongside
> [product-doctrine.md](product-doctrine.md) (the surface hierarchy this enforces)
> and [architecture.md](architecture.md) (the route table it sits on).
>
> **Date:** 2026-06-03 · **Status:** implemented in F2.

> **⇄ Addendum — DNA/profile route swap (later, uncommitted).** The URLs for the two
> Cinematic-DNA surfaces were **swapped** so each address matches what the page *is*:
> **`/DNA` (+ `/DNA/:userId`) now serves the private Cinematic DNA portrait/dossier**
> (`TasteProfile`), and **`/profile` (+ `/profile/:userId`) now serves the public,
> shareable cinematic social profile** (`DnaPage`). The primary "DNA" nav tab keeps its
> label and still points at `/DNA` (now the portrait); the social profile is reached from
> the account menu ("View profile"), connections, and share links. Privacy is unchanged —
> each page branches self-vs-visitor on the `:userId` param and is backed by owner-only
> RLS + profilePublic-/dnaPrivate-gated RPCs, all of which travel with the component, not
> the URL. This reverses the "DNA → social, /profile → dossier" mapping described in the
> body below.

---

## 1. Current problem

FeelFlick's doctrine is a *single justified nightly pick* — but the navigation
treated every surface as a co-equal product, and in one place actively elevated a
*supporting* surface above the core one:

- **Mobile bottom nav made Discover the "prime action"** — gradient core, conic
  ring, ambient bloom — while the Briefing (`/home`) was a plain tab. The visual
  hierarchy said "Discover is the product," contradicting the wedge. (Discover is
  a *plural* recommender; the Briefing is the *single* pick.)
- **Desktop header showed five co-equal pills** — Home · Browse · Discover ·
  Watchlist · DNA — so a Utility surface (Browse) and a deferral utility
  (Watchlist) carried the same weight as the nightly pick.
- **The primary label was "Home"** — generic, not the nightly-ritual framing the
  product is built around.

Net effect: nothing in the IA told the user *the Briefing is the destination;
everything else supports it.*

---

## 2. Product-doctrine constraint

From [product-doctrine.md](product-doctrine.md), the surface hierarchy the IA must
make legible:

- **Core:** Home / The Briefing, Film File, Onboarding.
- **Supporting:** Discover, Profile / Cinematic DNA, Preferences.
- **Utility:** Watchlist, History / Diary, Browse, Lists.
- **Parked / later:** People, Feed, Challenges.

> Rule: if a Utility or Supporting surface competes with the Briefing for the
> user's "what do I watch tonight?" intent, that's drift — re-subordinate it.

The wedge: *Mood-first, taste-deep — one justified nightly pick that makes its
case. Anti-scroll.*

---

## 3. Route hierarchy (unchanged by F2)

F2 changes **navigation**, not the **route table**. Every route in
[src/app/router.jsx](../src/app/router.jsx) is preserved (see §8). Grouped by role:

| Role | Routes |
|---|---|
| **Core** | `/home` (Briefing), `/movie/:id` (Film File), `/onboarding` |
| **Supporting** | `/discover`, `/profile` (+ `/profile/:userId`), `/preferences` |
| **Utility** | `/watchlist`, `/history` (+ `/watched`), `/browse`, `/mood/:tag`, `/tone/:tag`, `/browse/fit/:profile`, `/collection/:id`, `/lists` (+ curated/personal/`:listId`) |
| **Parked** | `/people` (built; demoted), `/feed` → `/home`, `/challenges` → `/home` |
| **Public** | `/`, `/auth/callback`, `/about`, `/privacy`, `/terms`, legacy auth aliases → `/`, `/logout` |
| **Admin** | `/admin/cache-monitoring` (auth + email allowlist) |

---

## 4. Navigation hierarchy (what F2 makes the nav say)

### Desktop header (authed) — `src/app/header/Header.jsx`
- **Primary pills:** **Tonight** (`/home`) · **Discover** · **DNA** (`/profile`)
  — Core + the two Supporting surfaces that build trust/exploration.
- **Account menu (avatar dropdown):** Account · **Browse** · Watchlist · Watch
  history · People · Lists · Settings · Send feedback · Sign out — Utility +
  parked + settings live here.
- **Brand wordmark → `/home`** (the primary anchor back to the Briefing).
- **Search** stays a command-palette modal (a tool, not a destination).

### Mobile bottom nav (authed) — `src/app/header/components/BottomNav.jsx`
- Five tabs, with the **Briefing as the centered hero** (gradient core, conic ring,
  ambient bloom): `Browse · Discover · ✦ Tonight (/home) ✦ · DNA · Account`.
- The hero treatment moved **from Discover to Tonight** — the nightly pick is now
  the one-tap prime action, thumb-centered.

### Desktop/mobile (anonymous) — unchanged
- App-chrome anon nav stays catalog-exploration (`Discover`, `Browse`) because an
  anon user can't reach the auth-gated Briefing; their primary action is **Sign in**.
- Public/legal `TopNav` (How it works · Privacy · Sign in) is untouched.

---

## 5. Public vs authenticated routes (guards unchanged)

F2 preserves every guard exactly:
- **Public** (`PublicShell`): `/`, `/auth/callback`, legal, auth aliases, `/logout`.
- **Public-viewable app** (`AppShell`, no auth required): `/movie/:id`, `/browse`,
  `/discover`, mood/tone/fit pages, `/collection/:id`, curated/personal lists.
- **Auth-required + onboarding-gated** (`RequireAuth` → `PostAuthGate`): `/home`,
  `/account`, `/preferences`, `/watchlist`, `/history`, `/profile`, `/people`, `/lists`.
- **Admin** (`AdminOnly` = auth + email allowlist): `/admin/cache-monitoring`.

No route moved across a guard boundary. No change to `main.jsx` OAuth handling,
`RequireAuth`, `PostAuthGate`, or `AdminOnly`.

---

## 6. Core vs Supporting vs Utility vs Parked — how each is surfaced after F2

| Surface | Tier | Desktop | Mobile | Notes |
|---|---|---|---|---|
| Briefing (`/home`) | Core | **Primary pill "Tonight"** + wordmark | **Center hero "Tonight"** | The one-tap prime destination. |
| Film File (`/movie/:id`) | Core | reached from picks/cards | same | Not a nav item by design (you arrive *at* a film). |
| Onboarding | Core | post-auth gate | same | Not user-navigable; gated. |
| Discover | Supporting | pill (secondary) | normal tab | Accessible, no longer the hero. |
| Profile / DNA (`/profile`) | Supporting | pill "DNA" | tab "DNA" | Taste identity / trust; stays visible. |
| Preferences | Supporting | account menu (Settings) | Account | Engine dials. |
| Watchlist | Utility | account menu | via Account | Demoted from a primary pill. |
| History | Utility | account menu | via Account | Unchanged location. |
| Browse | Utility | account menu | tab | Reachable, not a primary pill. |
| Lists | Utility | account menu | via Account | Unchanged. |
| People | Parked | account menu | via Account | Already demoted; kept reachable. |
| Feed / Challenges | Parked | — | — | Routes redirect to `/home` (unchanged). |

---

## 7. What changes F2 makes (exhaustive)

1. **Mobile `BottomNav`**: hero moves Discover → **Tonight (`/home`)**; tabs
   reordered to center Tonight (`Browse · Discover · Tonight* · DNA · Account`);
   `/home` tab relabeled **"Tonight"** (icon `Clapperboard`); Discover becomes a
   normal tab. `TABS` is exported for a contract test.
2. **Desktop `Header`**: primary pills reduced to **Tonight · Discover · DNA**
   (removed Browse + Watchlist pills); `/home` pill relabeled **"Tonight"**;
   **Browse** added to the account dropdown so it stays reachable. `NAV_AUTHED`
   documented as the IA contract.
3. **Label change** "Home" → **"Tonight"** (desktop pill + mobile tab only).
4. **Docs**: this record; small alignments in README, architecture, doctrine,
   docs index, and PLANNING.
5. **Test**: a `BottomNav` IA-contract unit test (hero = Tonight/`/home`; Discover
   present but not hero; no "Home" label).

---

## 8. What F2 intentionally does NOT change

- **No route added, removed, or moved across a guard.** All paths still resolve.
- **No `router.jsx` structural change** beyond none — routing untouched.
- **No file/folder renames** (the route is still `/home`; only the *label* is "Tonight").
- **No auth/onboarding/admin guard changes.**
- **No visual redesign** of any page; no design-system refactor; no component
  rewrites. The bottom-nav hero treatment already existed — F2 only moves *which
  tab* wears it.
- **Public `TopNav` and anon `UnauthMobileNav`** left as-is (anon has no Briefing).
- **`SearchBar`** unchanged (a tool, not a destination).
- **Parked-route redirects** (`/feed`, `/challenges` → `/home`) unchanged.
- **Engine, schema, RLS, Supabase functions, packages** — untouched (out of scope).
- The parked **Eyebrow WIP stash** is not touched.

---

## 9. Why routes are NOT being deleted

The doctrine demotes several surfaces (People, Browse, Lists) but **demotion ≠
deletion**:
- Deleting routes is irreversible, risks dead links/bookmarks, and is a Hard Stop
  without explicit justification + safe redirects.
- Several "Utility/Parked" surfaces are real future levers (People is a post-scale
  moat; Browse/Lists serve intent-driven exploration). They earn their keep as
  *secondary* access, not primary nav.
- F2's job is to make the **hierarchy legible**, not to remove capability. Hiding a
  surface from primary nav while keeping it reachable (account menu / direct URL)
  achieves the doctrine without destroying anything.

---

## 10. Future implications (F3–F8)

- **F3 (Design System Hardening):** the bottom-nav hero, the pill nav, and the
  account menu are now the canonical IA affordances — harden their styling (retire
  amber/orange drift) without changing the hierarchy decided here.
- **F4 (Landing/Onboarding):** onboarding should hand off into the **Tonight**
  framing (the first Briefing), reinforcing the nightly ritual.
- **F5 (Home/Briefing vNext):** with the Briefing now unambiguously primary, F5 can
  invest in the pick + its case and trim the carousel tail without IA ambiguity.
- **F6 (Film File):** still reached *from* picks, not nav — F2 keeps it that way.
- **F8 (Recommendation trust/eval):** Discover-vs-Briefing is now visibly resolved
  (Briefing = the answer; Discover = exploration), so eval can treat them distinctly.

---

## 11. Validation checklist

- [x] Every route still reachable or intentionally redirected (no deletions).
- [x] `/home` is one tap from any authed entry (mobile hero + desktop pill + wordmark).
- [x] Discover accessible but no longer the visual prime action.
- [x] Browse + Watchlist reachable (account menu / tab / direct URL) though demoted.
- [x] People stays demoted (account menu), not deleted; Feed/Challenges still redirect.
- [x] Auth/onboarding/admin guards unchanged; public routes still public.
- [x] Accessibility preserved (aria-labels follow the new labels; keyboard intact).
- [x] `npm run lint && npm run test && npm run build` green.
</content>
