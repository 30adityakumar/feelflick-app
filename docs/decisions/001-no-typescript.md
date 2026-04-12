# ADR 001 — JavaScript (JSX) Only, No TypeScript

**Status:** Accepted  
**Date:** 2025-06  
**Decided by:** Aditya Kumar

## Context

FeelFlick started as a rapid-iteration prototype. The codebase is JavaScript/JSX throughout. TypeScript would add compile-time safety but also migration overhead during early-stage feature velocity.

## Decision

Stay in JavaScript (JSX). Do not convert any `.jsx` file to `.tsx`. Do not introduce TypeScript config, `tsconfig.json`, or `@types/*` packages.

Type safety is achieved through:
- Strict null guards on all nullable values
- JSDoc types on all public-facing functions and service exports
- ESLint rules catching common JS pitfalls
- Vitest tests covering critical data paths

## Future Migration Path

When the codebase stabilises post-launch:
1. Add `tsconfig.json` with `allowJs: true`, `checkJs: true` — zero breaking changes
2. Gradually rename files `.jsx` → `.tsx` feature by feature
3. Replace JSDoc types with inline TypeScript types

## Consequences

- ✅ Zero migration cost during feature-velocity phase
- ✅ All AI coding tools (Claude Code, Codex) work without TypeScript config complexity
- ⚠️  Type errors caught at runtime rather than compile time — mitigated by JSDoc + ESLint
- ❌ No autocomplete inference on complex nested types without JSDoc

## Rule

> **Never convert `.jsx` to `.tsx`. Never add TypeScript config.** Revisit after v1.0 launch.
