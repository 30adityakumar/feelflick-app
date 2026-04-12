# Runbook — Dev Environment Setup

> Use this when setting up a fresh machine, new Codespace, or after a long break.

## Runtime

- **Node.js:** v20.20.2 via nvm
- **npm:** v10.8.2
- **gh CLI:** v2.71.0
- **Claude Code:** v2.1.87
- **CI runners:** ubuntu-latest, node-version: `'22'` (CI uses 22 LTS — local dev uses 20 via nvm)

nvm is sourced in `~/.zshrc` — available in every terminal automatically.

## First-Time Setup

```bash
# 1. Clone
git clone https://github.com/30adityakumar/feelflick-app
cd feelflick-app

# 2. Environment variables
# Fill in: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_TMDB_API_KEY, VITE_ADMIN_EMAILS
# OpenAI key is server-side only — NEVER add VITE_OPENAI_*

# 3. Install dependencies
npm ci

# 4. Start dev server
npm run dev
# Vite binds to all interfaces on port 5173
# Codespaces: hmr.clientPort is set to 443 in vite.config.js — no extra config needed
```

## Daily Workflow

```bash
npm run dev          # Dev server (port 5173)
npm run lint         # ESLint check
npm run lint:fix     # Auto-fix safe issues
npm run test         # Vitest
npm run build        # Production build — must pass before any PR
```

## Mandatory Pre-PR Checklist

```bash
npm ci               # Ensure deps are in sync
npm run lint:fix     # Fix safe issues first
npm run lint         # Confirm zero remaining errors
npm run test         # All tests pass
npm run build        # Zero build errors
```

> **Never open a PR if `npm run build` fails.**

## Codespaces-Specific Notes

- Vite is configured with `host: true` and `hmr.clientPort: 443` for Codespaces compatibility
- No extra port-forwarding config needed
- nvm is sourced automatically in `~/.zshrc`

## Branch & PR Conventions

- Branch naming: `fix/description`, `feat/description`, `chore/description`
- PR title: `fix: ...`, `feat: ...`, `chore: ...`
- No force pushes to `main`. Always open a PR.
- No deleting Supabase migrations — create new ones in `supabase/migrations/`

## Environment Variables Reference

| Variable | Secret? | Notes |
|---|---|---|
| `VITE_SUPABASE_URL` | No | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | No | RLS enforces access |
| `VITE_TMDB_API_KEY` | Yes | Read-only, 40 req/10s limit |
| `VITE_ADMIN_EMAILS` | No | Comma-separated admin emails |
| `VITE_SENTRY_DSN` | Yes | Only fires in PROD |
| `OPENAI_API_KEY` | **Yes** | Server-side ONLY — never `VITE_*` |
