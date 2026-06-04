# F11A — UI Consistency Audit (classified, no fixes)

> **Phase F11A. Drift audit — findings only, NOTHING fixed here.** Classifies UI consistency
> issues against the [inventory](ui-inventory-f11a.md) + the [doctrine](../product-doctrine.md).
> Fixes are queued in the [F11B plan](ui-polish-implementation-plan-f11b.md). **No code change in
> F11A.** Severity: **P0** broken/inaccessible · **P1** trust/clarity · **P2** consistency polish ·
> **P3** nice-to-have.

**Status:** ✅ audited. **Date:** 2026-06-04. **Note:** these are *code-grounded* findings; some
need a live authenticated walkthrough (F11B / Wave 1) to confirm severity in context.

---

## Severity summary

| Sev | Count | Theme |
|---|---|---|
| **P0** | 0 found (code-level) | none blocking; a11y contrast floors were already raised (F3) |
| **P1** | 2 | reduced-motion gaps; AA risk on mood-tinted text |
| **P2** | 7 | radius/button/eyebrow/elevation/token drift → primitives |
| **P3** | 3 | shadow scale, C-palette fold-in, CLAUDE.md staleness |

> No P0 *code-level* defects surfaced in the static audit — but **P0 candidates can only be confirmed
> live** (broken layout / unreachable control on a real authenticated route). Re-run at F11B.1 with a
> browser pass.

## P1 — trust / clarity / accessibility

### A1 · `prefers-reduced-motion` coverage gaps — **P1 (a11y)**
- **Finding:** reduced-motion handled in ~10 files but **not** in `movie` / `profile` / `watchlist` / `history` / `account`. Animated reveals/transitions there ignore the user preference.
- **Why P1:** vestibular-safety + CLAUDE.md "no a11y regressions." Not blocking, but a real accessibility gap.
- **Where:** `src/features/{movie,profile,watchlist,history,account}/*`.

### A2 · Mood-tinted text contrast risk — **P1 (a11y, verify live)**
- **Finding:** mood-tinted backgrounds (Discover starfield/canvas, accent-tinted callouts) risk dropping text below AA in some moods. `textFaint`/`textLow` are at the AA-large floor (.40) — *small* informational text near that floor over a tint is the risk.
- **Why P1:** readability must never be sacrificed for mood (doctrine). **Verify with axe live** (F11B.4).
- **Where:** Discover, accent-tinted callouts, faint meta labels.

## P2 — consistency polish (→ become primitives)

### B1 · No radius scale — **P2 (highest-frequency drift)**
- **Finding:** inline `borderRadius` uses **3, 4, 5, 6, 8, 10, 14, 999** ad-hoc (300+ occurrences); primitives use `rounded-full` (Button) and `rounded-2xl`/16 (EmptyState). No shared scale.
- **Fix later:** define a radius scale (e.g. `xs 4 · sm 8 · md 12 · lg 16 · pill 999`) in tokens; migrate. **F11B.1.**

### B2 · Two button languages — **P2**
- **Finding:** the shared `Button` is a **gradient pill** (`rounded-full`, Tailwind); feature surfaces also use **inline action buttons** (`borderRadius: 6–8`, inline `HP_GRAD`, e.g. DnaConfidence "See tonight's pick →"). Live landing CTA is **Inter 600 pill**; CLAUDE.md's documented action button is **Outfit 600**. So shape (pill vs rounded-rect) *and* font (Inter vs Outfit) both drift.
- **Fix later:** one button system — extend `Button` to cover the inline cases, or codify a documented inline variant; settle font (Outfit per doctrine). **F11B.1.**

### B3 · Eyebrow divergence — **P2**
- **Finding:** shared `Eyebrow` = Outfit **700** / `HP.purple`; landing `.ff-eyebrow` = Outfit **600** / white **.42**. Two "same" kickers, different weight + color.
- **Fix later:** reconcile (likely keep both *tones* but document them as one system with a quiet vs accent variant). **F11B.1.** *(Landing is visual-regression-tested — re-baseline deliberately.)*

### B4 · `Discover` `purpleDeep` override — **P2**
- **Finding:** `Discover.jsx` sets `purpleDeep: '#9333ea'` (vs HP `#7C3AED`) + local `surface`/`paper` tints. A brand hue diverges on one surface.
- **Fix later:** justify or align to HP; if Discover genuinely needs `#9333ea`, name it in tokens. **F11B.1.**

### B5 · No elevation scale — **P2**
- **Finding:** shadows are inline/ad-hoc (`0 12px 28px -8px rgba(236,72,153,.5)`, `0 10px 26px -10px …`, etc.); no shadow tokens. Borders carry most elevation (fine + on-brand) but the few shadows are unsystematic.
- **Fix later:** a 2–3 step shadow scale (or codify "borders not shadows" as the rule + 1 CTA glow). **F11B.1.**

### B6 · Card language is per-surface — **P2**
- **Finding:** no `<Card>` primitive; callout/case panels are inline (radius 8–14, varied gradient tints + border alphas). Visually related but each hand-built.
- **Fix later:** a `Card`/`Panel` primitive (or a documented inline recipe) for callouts (WhyThisPick, PrimaryCaseCard, DnaConfidence share a shape). **F11B.2/B3.**

### B7 · Empty-state duplication — **P2**
- **Finding:** canonical `EmptyState` exists, but some surfaces hand-roll empties (watchlist/history). Inconsistent tone/spacing.
- **Fix later:** route all empties through `EmptyState` (with a cinematic tone). **F11B.4.**

## P3 — nice-to-have

### C1 · No formal shadow/elevation tokens — **P3** (overlaps B5; lower priority if "borders-not-shadows" is adopted).
### C2 · `C` landing palette not folded into `HP` — **P3** (deferred by design — landing is visual-regression-tested; fold-in is a careful, separate task).
### C3 · CLAUDE.md staleness — **P3 (doc, not UI)** — CLAUDE.md still calls `browse/data.js` a local-HP "holdout"; it now spreads `baseHP`. Update the doc when next editing CLAUDE.md (out of F11A scope — flagged per the File-Scope rule).

## Where polish would FIGHT the doctrine (anti-drift guards)

These are **traps** to avoid while polishing — they'd improve "aesthetics" but betray the wedge:

| Tempting polish | Why it's drift | Guard |
|---|---|---|
| Make the `/home` tail carousels richer/taller | strengthens the scroll the product kills | keep the tail visibly **secondary**; Briefing primary (cf. F10D D-3) |
| Add ambient purple glow / glassmorphism everywhere | over-brands; "fake luxury" | ration the gradient to identity moments |
| Decorative scroll/parallax motion | Awwwards-showreel drift | motion only to guide the eye / acknowledge an action |
| Bigger, glossier cards with heavy shadows | "card soup"; fights calm/type-led | structure from spacing + type, not boxes |
| Fabricated-looking confidence (badges, "98% match!") | breaks the honesty moat | keep honest gloss ("how it fits your taste so far") |

## How to use

- **Nothing is fixed in F11A.** Each finding maps to an [F11B](ui-polish-implementation-plan-f11b.md) wave.
- **Confirm live before fixing** A1/A2 (a11y) and any P0 candidate.
- The anti-drift guards bind **every** F11B change — polish must sharpen the wedge, never blunt it.
