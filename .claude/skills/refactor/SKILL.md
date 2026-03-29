---
name: refactor
description: >
  Refactor and clean up code in the FeelFlick codebase. Trigger on: "refactor",
  "clean up", "simplify", "extract this", "reduce duplication", "tidy up".
---

# Refactor Skill

When invoked, follow this structured process. Do not make changes beyond what is asked — keep solutions simple and focused.

## Process

### Step 1 — Read Before Touching
Read every file involved before proposing or making any change. Understand the full context: what it does, who calls it, what it imports/exports.

### Step 2 — Identify Duplication
- Look for repeated logic across components, hooks, or services
- Look for copy-pasted JSX blocks that differ only in data
- Look for inline logic that appears in more than one place
- Look for multiple `useEffect` blocks that could be a single custom hook

### Step 3 — Extract Reusable Hooks
If stateful logic is duplicated across components, extract it to `src/shared/hooks/`:
- Name it `use[Noun].js` (e.g., `useRecommendations.js`, `useMoodState.js`)
- The hook must encapsulate all related state and side-effects
- Ensure the hook is self-contained and has no hidden dependencies on component structure

### Step 4 — Extract Utility Functions
If pure functions are duplicated or inlined where they shouldn't be:
- Move them to `src/shared/lib/`
- Functions must be pure (no side effects, no React imports)
- Add JSDoc types for parameters and return values

### Step 5 — Simplify Components
- Break components over ~150 lines into smaller focused components
- Move non-presentational logic out of JSX (into hooks or services)
- Remove props that are derived from other props (compute them inside)
- Replace nested ternaries with early returns or helper functions

### Step 6 — Preserve Tests
- Run `npm test` before and after any refactor
- **Do not change test behavior** — tests are the contract
- If a refactor requires a test update, explain why the old test was testing an implementation detail rather than behavior
- If tests don't exist for the code being refactored, note it but do not add tests unless the user asks

### Step 7 — Validate
After changes:
```bash
npm run test    # must pass
npm run build   # must succeed
```

## Rules
- **Never change external behavior** to make code "cleaner". Behavior first, structure second.
- **No premature abstraction.** Three similar lines of code is better than a new utility that's used once.
- **No new dependencies** without asking. If lodash would "simplify" something, write it plainly instead.
- **One concern per extraction.** Don't combine a hook extraction with a component rename with a file move in one step — do them separately and verify each.
- **Preserve git history legibility.** Prefer one focused commit per logical change over one giant refactor commit.

## Output Format

Before making changes, present a brief plan:
```
Refactor Plan:
1. Extract X → src/shared/hooks/useX.js (used in A.jsx and B.jsx)
2. Inline helper Y into Z.jsx (only used once, no value in extracting)
3. Split LargeComponent.jsx into SmallA.jsx + SmallB.jsx

Tests affected: none / [list]
Files changed: [list]
```

Wait for confirmation if the plan involves moving files or changing exports.
