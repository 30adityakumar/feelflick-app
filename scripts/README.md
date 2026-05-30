# scripts/

Operational + developer tooling. **None of this ships in the app bundle** — it's
run on a developer machine or by the scheduled GitHub Actions cron workflows.
Has its own `package.json` (CommonJS, separate deps from the Vite app).

## Layout

| Dir | Purpose |
|---|---|
| `pipeline/` | The production data pipeline (discover → enrich → score → embed → similarity). Run nightly/weekly/monthly by `.github/workflows/{daily,weekly,monthly}-*.yml`. Writes run logs to `../logs/` (gitignored). |
| `utils/` | Shared helpers the pipeline + tools import (`supabase` client, logger, …). |
| `maintenance/` | Dev/ops one-offs that are still useful: `find-unused-files.js`, `check-status.sh`, `check-database.js`, `get-user-id.js`. |
| `phase1/` | One-time catalog-bootstrap scripts. **Already run** — kept for reference; archival candidates. |
| `migrations/` | Standalone data-migration helper(s). |

## Loose root scripts — status (flagged for human review)

These sit at `scripts/` root. Reviewed during the repo-tidy pass; **kept, not
deleted**, because they're ambiguous and harmless in place:

| Script | Status |
|---|---|
| `validate-schema.js` | **Keep** — referenced by `scripts/package.json`. |
| `spot-check.js`, `test-status-flow.js` | Dev/debug helpers (import `./utils/supabase`). Left in place to avoid breaking their relative paths; move into `maintenance/` only with the import fixed. |
| `test-recommendation-cache-final.js` | Debug script (the `-final` name is a smell). **Review / archive.** |
| `fix-complete-movies-missing-embeddings.js`, `fix-limits.js` | **Spent** one-time data fixes — already run. **Review / archive.** |
| `run-fix-keywords.sh`, `run-health-check.sh` | ⚠️ **Dead** — they invoke `scripts/monitoring/*.js`, a directory that does not exist. Either restore the monitoring scripts or delete these. |

> Run logs were previously committed under `../logs/`; those are now gitignored
> (regenerated each cron run, uploaded as CI artifacts). The dir is kept via
> `logs/.gitkeep`.
