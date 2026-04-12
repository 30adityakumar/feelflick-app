# ADR 003 — Recommendation Engine: pgvector on Supabase, Not a Third-Party API

**Status:** Accepted  
**Date:** 2025-07  
**Decided by:** Aditya Kumar

## Context

FeelFlick's core differentiator is mood-based, personalised movie recommendations. Options considered:

1. **Third-party recommendation API** (e.g. Recombee, AWS Personalize)
2. **pgvector on Supabase** — store OpenAI embeddings in PostgreSQL, query by cosine similarity

## Decision

Build the recommendation engine in-house using pgvector on Supabase with OpenAI `text-embedding-3-small` embeddings.

Engine version: `2.4` (see `ENGINE_VERSION` in `recommendations.js:36`).  
Pipeline: content-based filtering + pgvector cosine similarity + behavioural signals (skips, re-watches, ratings).  
Anti-recency bias and signal decay are applied. User profiles cached in `user_profiles_computed` with TTL.  
Tracked via `recommendation_impressions` + `mood_sessions`.

## Rationale

- Supabase is already the auth + database layer — zero additional infrastructure
- pgvector queries are fast enough at FeelFlick's current scale (< 100K movies)
- Full control over the scoring algorithm, thresholds, and signal weights
- No vendor lock-in or per-request API costs from a recommendation SaaS
- OpenAI embeddings are already used for mood parsing — reusing the same model reduces complexity

## Consequences

- ✅ No third-party recommendation service cost or dependency
- ✅ Full algorithm control — thresholds tunable in `recommendations.js`
- ✅ Behavioural signals (skips, re-watches) feed directly from the same DB
- ⚠️  Scaling beyond ~1M movies would require pgvector index tuning (IVFFlat/HNSW)
- ⚠️  OpenAI embedding calls are server-side only — `VITE_OPENAI_*` must never be exposed

## Key Thresholds (change deliberately)

| Constant | Value | Meaning |
|---|---|---|
| `MIN_FF_RATING` | `6.5` | Min score to surface a title |
| `MIN_FF_CONFIDENCE` | `50` | Min confidence to show a recommendation |
| `ENGINE_VERSION` | `'2.4'` | Bump on any algorithm change |

## Rule

> **OpenAI key is server-side only. Never add `VITE_OPENAI_*`. Never replace pgvector with an external API without a new ADR.**
