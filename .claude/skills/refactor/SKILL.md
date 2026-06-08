---
name: refactor
description: >
  Refactor and clean up FeelFlick code. Trigger on refactor, clean up,
  simplify, extract, reduce duplication, tidy up, move files, or improve structure.
---

# Refactor Skill

Read `.claude/rules/repo-structure.md` before broad structural changes. Read `.claude/rules/testing.md` when behavior preservation depends on tests.

Maintained rules take precedence over this skill.

## Goal

Improve ownership, clarity, testability, or dependency direction without hiding behavior changes.

A refactor should have a defined purpose. Do not refactor solely because a file is long or visually untidy.

## Process

1. Read the relevant files and identify callers, imports, exports, tests, and runtime ownership.
2. State what behavior must remain unchanged.
3. Choose the smallest coherent change that improves the structure.
4. Prefer feature-local ownership unless code has a clear cross-feature role.
5. Preserve public APIs unless changing them is part of the task.
6. Add or update tests when risk justifies it.
7. Validate with checks proportionate to the change.
8. Report any intentional behavior change separately from the refactor.

## Extraction guidance

Extract when it improves clarity or reuse:

- duplicated stateful behavior may become a hook, but not automatically `src/shared/hooks/`
- pure duplicated logic may become a utility, but only when the concept has a coherent name
- large components may stay together when responsibilities are cohesive
- small local duplication may be better than a premature abstraction

Do not use a line-count threshold as a rule. Line count is only a signal to inspect responsibilities.

## File moves and exports

File moves, renames, and export changes are allowed when they materially improve ownership or are required by the task.

Before moving files:

- identify consumers
- update imports intentionally
- avoid circular dependencies
- preserve route and test behavior
- keep the diff reviewable

Do not wait for extra confirmation when the current task explicitly asks for refactoring or autonomous delivery and the move is reversible.

## Validation

For behavior-preserving refactors, prefer:

```bash
npm run test
npm run build
```

Add `npm run lint`, Playwright, visual checks, or targeted tests when the changed surface warrants them.

Do not update tests only to preserve obsolete implementation details.

## Output

Report:

- purpose of the refactor
- files changed
- behavior preserved
- validation run
- risks or follow-up work
