-- 2026-05-19 — nightly cron for refresh_feelflick_stats()
--
-- Enables pg_cron (Supabase ships it but it's opt-in) and schedules the
-- stats refresh once per day at 03:15 UTC. profile-v2's "How you skew"
-- bars depend on these medians being fresh; we don't want them frozen
-- the day after launch.
--
-- 03:15 UTC keeps the job in a quiet window for most user timezones
-- (late evening EU, early morning Americas, mid-day APAC) — no overlap
-- with the morning briefing refresh.

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

GRANT USAGE ON SCHEMA cron TO postgres;

-- Unschedule any prior job under the same name so the migration is
-- safely re-runnable. cron.unschedule errors if the job doesn't exist,
-- so wrap in a DO block.
DO $$
BEGIN
  PERFORM cron.unschedule('refresh_feelflick_stats_nightly');
EXCEPTION WHEN OTHERS THEN
  NULL;  -- job didn't exist; that's fine
END $$;

SELECT cron.schedule(
  'refresh_feelflick_stats_nightly',
  '15 3 * * *',
  $$SELECT public.refresh_feelflick_stats();$$
);
