---
name: code-review
description: >
  Perform a structured code review for FeelFlick. Trigger on: "review", "audit",
  "check this code", "review this file", "look for issues", "is this safe".
---

# Code Review Skill

When invoked, perform a thorough review against the following checklist. Report each finding with: severity (error / warning / info), file:line, and a concrete suggestion.

## Checklist

### 1. TypeScript / JavaScript Correctness
- [ ] No implicit `any` or untyped dynamic access patterns that would block a future TS migration
- [ ] Nullable values are guarded before use (`?.`, `??`, explicit null checks)
- [ ] No `console.log` / `console.error` left in production code paths (dev tooling excluded)
- [ ] No `TODO` or `FIXME` comments merged without a tracking issue

### 2. Error Handling
- [ ] All `async/await` blocks have try/catch or `.catch()` — no silent failures
- [ ] Supabase query results: always check `error` before using `data`
- [ ] Fetch/axios calls handle network errors and non-2xx responses
- [ ] User-visible error states are handled gracefully (not just `console.error`)

### 3. Unused / Dead Code
- [ ] No unused imports (`import X from ...` with X never referenced)
- [ ] No unused variables, props, or function parameters
- [ ] No dead branches (`if (false)`, conditions that can never be true)
- [ ] No commented-out code blocks (use git history instead)

### 4. Accessibility (UI Components)
- [ ] Interactive elements (`button`, `a`, custom click handlers) have accessible labels (`aria-label` or visible text)
- [ ] Images have meaningful `alt` text (or `alt=""` for decorative images)
- [ ] Focus management is correct for modals/drawers (trap focus, restore on close)
- [ ] Color contrast meets WCAG AA minimum (4.5:1 for normal text)
- [ ] Keyboard navigation works for all interactive components

### 5. Security
- [ ] No hardcoded secrets, API keys, tokens, or passwords in source
- [ ] No user-supplied strings interpolated directly into SQL or shell commands
- [ ] No sensitive data (emails, tokens) logged to the console
- [ ] No `dangerouslySetInnerHTML` with unescaped user content
- [ ] Supabase RLS: any new tables have RLS policies defined

### 6. FeelFlick-Specific Rules
- [ ] No fake/fabricated metrics, user counts, or testimonial copy
- [ ] No `.env` files read or modified
- [ ] No migration files deleted or altered — only new migrations added
- [ ] TMDB API key is read-only client usage; OpenAI key stays server-side

### 7. Performance
- [ ] Images are lazy-loaded (`loading="lazy"` or Intersection Observer)
- [ ] No unnecessary re-renders (check for missing dependency arrays in `useEffect`/`useMemo`/`useCallback`)
- [ ] No blocking operations on the main thread in render paths

## Output Format

For each issue found:
```
[SEVERITY] file/path.jsx:42 — Description of the issue
  → Suggestion: what to change and why
```

Finish with a summary: total errors, warnings, and infos, and a one-line overall assessment.
