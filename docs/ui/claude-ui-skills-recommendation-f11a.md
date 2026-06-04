# F11A — Claude Code UI Skills / Tooling Recommendation

> **Phase F11A. A *safe* recommendation — installs nothing.** Evaluates skills/tooling for the
> F11B UI polish work. **No third-party skill is installed in this phase; no unknown script is run.**
> For any third-party skill, inspect its scripts first and document risk. Prefer official skills +
> the repo's existing project guards. **No code change. F8C stays blocked.**

**Status:** ✅ documented (no installs). **Date:** 2026-06-04.

---

## What's already available in this repo (no install needed)

The repo already ships strong guards — **lean on these first**:

| Skill | Type | Helps with | Use now? | Risk |
|---|---|---|---|---|
| **`design-system-guard`** | project | Enforces FeelFlick's editorial language (fonts, palette, gradient, hero weights, MovieCard LAW, skeletons, microcopy). **The primary F11B guard.** | ✅ **yes** | none (local, read/advise) |
| **`a11y-audit`** | project | aria/keyboard/contrast/`prefers-reduced-motion` checks beyond eslint-plugin-jsx-a11y. | ✅ **yes** (A1/A2) | none |
| **`perf-guard`** | project | LCP/CLS, lazy+srcset posters, bundle budget for the media-heavy UI. | ✅ **yes** | none |
| **`refactor`** | project | scoped clean-up (extract primitives, de-dupe) — ideal for F11B.1. | ✅ **yes** | none |
| **`code-review`** | project | structured review of each F11B diff. | ✅ **yes** | none |
| **`frontend-design` (Anthropic)** | official | aesthetic direction / distinctive UI generation. | ⚠️ **with the guard** | low — but it "pushes bold aesthetics"; **always run `design-system-guard` after** |
| **`web-design-guidelines`** | official-style | Web Interface Guidelines / a11y / UX best-practice review of UI code. | ✅ **yes** | none (review-only) |
| **`vercel-react-best-practices`** | Vercel | React/Next perf + component patterns. | ✅ **yes** (component architecture) | low (advisory) |
| **`vercel-composition-patterns`** | Vercel | compound components / reusable APIs — useful for the primitives pass. | ✅ **yes** (F11B.1) | low |

## Skills the phase named — status here

| Named in brief | Status in this repo | Recommendation |
|---|---|---|
| Anthropic `frontend-design` | ✅ available | use for *direction*, gate with `design-system-guard` |
| Vercel `web-design-guidelines` | ✅ available | use for a11y/UI review |
| Vercel `react-best-practices` | ✅ available (`vercel-react-best-practices`) | use for component architecture |
| `webapp-testing` | ❌ not installed | **not needed** — the **chrome-devtools MCP** already does browser walkthroughs (used in F11A/F10D). Don't add a new skill for this. |
| AccessLint / accessibility skill | ❌ not installed | the project `a11y-audit` + `web-design-guidelines` + axe (already in CI via `@axe-core/playwright`) cover it. Don't add. |
| "UI/UX Pro Max" / third-party UI/UX | ❌ not installed | **do not install** without source review (see below). |
| design-research / design-system skills | ❌ not installed | only if trustworthy + source-reviewed; not now. |

## Third-party skills — the rule

- **Do not install in F11A.** No unknown scripts run.
- Before *ever* installing a third-party skill: **read its `SKILL.md` + every script/hook it ships**, check for network calls / file writes / shell exec, and document the risk here. Prefer skills that are docs/prompt-only (no executable hooks).
- The repo's `PostToolUse` lint hook (`.claude/hooks/lint-on-edit.sh`) is the only auto-exec we trust; a third-party skill adding hooks is a **red flag** — reject unless audited + explicitly approved.

## Recommended F11B workflow (official + project skills only)

1. **`frontend-design`** → generate aesthetic options for a target surface (direction only).
2. **`design-system-guard`** → **immediately** check that output against FeelFlick's language (catches the bold-aesthetic drift `frontend-design` introduces). *Non-negotiable gate.*
3. **`vercel-react-best-practices` / `vercel-composition-patterns`** → component architecture for the new primitives (Card, button system, radius scale).
4. **chrome-devtools MCP** → browser walkthrough each changed route (live observation; the `webapp-testing` role).
5. **`web-design-guidelines` + `a11y-audit`** → a11y/UX review (reduced-motion, contrast, focus, touch targets).
6. **`perf-guard`** → confirm no LCP/CLS/bundle regression (poster-heavy).
7. **`code-review`** → final structured review of the diff.
8. **(optional) third-party UI/UX skill** → **only after** a documented source review + explicit approval. Not before.

## Install commands (documented, NOT executed)

> Official skills are typically already present (above). If a future phase needs to (re)install one,
> document + get approval first — **do not run installs in F11A** (CLAUDE.md Hard Stop: no package
> changes; skill installs are out of scope here). Example *for reference only*:
> `npx skills add <namespace>/<skill>` — **only after** source review + approval.

## Bottom line

FeelFlick is **already well-equipped**: `design-system-guard` + `a11y-audit` + `perf-guard` +
`web-design-guidelines` + the Vercel React skills + chrome-devtools MCP cover the entire F11B
workflow. **Install nothing third-party now.** The one discipline that matters: **always gate
`frontend-design` output through `design-system-guard`** so polish sharpens the wedge instead of
chasing a generic award-site look.
