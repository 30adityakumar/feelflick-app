# F12A — UI Skills & Tooling Evaluation

> **Phase F12A (docs-only).** Which skills/tools to use for the F12B+ premium polish work, and which
> to keep out. **No installs in F12A** (audit phase). Engine frozen `2.17`.

**Date:** 2026-06-04.

---

## Principle

FeelFlick has a **strict, hand-tuned editorial design language** (`design-system-guard`) that
**overrides generic design guidance**. Tooling must serve that system, not import a foreign aesthetic.
**Never install a third-party skill without reading its source first** — the harness has auto-installed
3rd-party skills mid-session before (F11A.1: `grill-me`, `skill-creator`, `vercel-*`,
`web-design-guidelines`), which were **removed** because install was phase-forbidden + unreviewed.

## Evaluation

| Tool / skill | Helps with | Use now? | Risk | Install rec | Source review? | Commit to repo? |
|---|---|---|---|---|---|---|
| **Playwright e2e harness** (in-repo) | authed browser QA, screenshots, computed metrics, tap-target + overflow audits | ✅ **yes — primary** | low | already in repo | n/a | already committed |
| **`design-system-guard`** (in-repo) | enforce fonts/palette/gradient/hero/hover/microcopy | ✅ **yes — gate every UI phase** | low | present | n/a | committed |
| **`a11y-audit`** (in-repo) | touch targets, focus, contrast, aria/keyboard, reduced-motion | ✅ **yes** (used this phase) | low | present | n/a | committed |
| **`perf-guard`** (in-repo) | LCP/CLS, lazy posters, bundle budget | ✅ yes (F12E/poster work) | low | present | n/a | committed |
| **`code-review` / `refactor`** (in-repo) | structured review / scoped cleanup | ✅ as needed | low | present | n/a | committed |
| **official `webapp-testing`** (Anthropic) | Playwright-style browser QA helpers | ⚠️ **optional** — our harness already covers it | low | only if it adds value over our specs | yes (read before enabling) | no (don't vendor) |
| **`frontend-design`** (generic) | bold aesthetic generation | ⚠️ **critic only** — it pushes aesthetics that **violate** our system; `design-system-guard` must run after it | med | do not let it implement unchecked | yes | no |
| **AccessLint** (3rd-party a11y) | a11y linting | ⚠️ our `@axe-core/playwright` CI + `eslint-plugin-jsx-a11y` + `a11y-audit` already cover this | med | **skip** unless a gap appears | yes | no |
| **Vercel `web-design-guidelines` / `react-best-practices` / `composition-patterns`** | React/UI patterns | 🔴 **do NOT auto-install** — these are the 3rd-party skills auto-added + removed in F11A.1 | **high** (unreviewed, foreign aesthetic) | only after explicit source review + user approval | **required** | no |
| **third-party "UI/UX Pro Max" & similar** | all-in-one UI/UX | 🔴 **no** — unknown provenance | high | **skip** | required | no |

## Recommended stack for F12B+

1. **Playwright authed harness** for all before/after visual parity (proven this session).
2. **`design-system-guard`** as the gate on every UI diff (run after any `frontend-design` ideation).
3. **`a11y-audit`** for the touch-target/label/contrast work (F12C/F12D).
4. **`perf-guard`** for the poster/card pass (F12E).
5. **`frontend-design`** *only* as a creative critic for ideas — never as an unchecked implementer.

## Do-not

- ❌ No third-party skill installs without source review **and** explicit user approval (and never in an
  audit/no-install phase).
- ❌ Don't vendor external skills into the repo.
- ❌ Don't let a generic design skill override `design-system-guard`.
