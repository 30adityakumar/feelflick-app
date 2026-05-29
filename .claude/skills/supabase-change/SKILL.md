---
name: supabase-change
description: >
  Gate and guide any Supabase backend change for FeelFlick. Trigger on:
  "migration", "schema", "RLS", "policy", "edge function", "alter table",
  "add column", "pg_cron", "database change", or any task touching
  supabase/ — including recommendation-engine filter/scoring/limit tweaks
  that depend on table data.
---

# Supabase Change Protocol

FeelFlick's backend is Supabase (PostgreSQL + pgvector + RLS + 4 edge
functions). Backend changes are a **Hard Stop** in CLAUDE.md. This skill
enforces the process so nothing irreversible happens on a guess.

## Step 1 — STOP and confirm (mandatory)
Any of these require **explicit user confirmation before acting**:
- Schema changes, migrations, `ALTER`/`CREATE`/`DROP`
- RLS policies
- Edge Function code (`ai-mood-context`, `generate-movie-overlay`,
  `generate-reflection-prompt`, `generate-taste-summary`)
- `pg_cron` jobs (e.g. nightly `refresh_feelflick_stats()`)

State exactly what will change and wait for go-ahead. Do **not** proceed on
assumption. (The one exception: client-side auth sign-in/out against the dev
test user for MCP testing — that's allowed without asking.)

## Step 2 — DB-first analysis (before any engine change)
For recommendation/filter/scoring/limit changes, **query the actual data
first** — never reason from assumptions about what the tables contain:
- Catalog distribution (genres, decades, runtime, language spread)
- Tag / mood coverage and sparsity
- Candidate **pool composition** at each pipeline stage
- Embedding coverage in `user_profiles_computed` / movie vectors

Only after seeing real numbers, propose the filter/scoring/limit change.
Show the query results that justify it.

## Step 3 — Migration safety
- [ ] ❌ Never delete or edit an existing migration — create a **new** one.
- [ ] Forward-only. Include a clear, dated migration name.
- [ ] Confirm RLS still enforces per-user access after the change.
- [ ] Note any TTL / cache implications (`user_profiles_computed` is cached).

## Step 4 — Verify
- [ ] If schema changed, confirm the client (`@supabase/supabase-js`) calls
      still match (null-safety on new/changed columns).
- [ ] Edge function changes: keep CORS aligned across all functions
      (hardened in #81/#82 — don't regress it).
- [ ] State what the user should check in the Supabase dashboard.

## Output
Lead with the gate result:
- 🛑 **Needs confirmation** — here's exactly what would change.
- 📊 **Analysis first** — here's the data, here's what it implies.
- ✅ **Safe to proceed** — proceeding, here's the new migration / change.
