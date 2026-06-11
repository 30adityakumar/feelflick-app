-- beta-health.sql — READ-ONLY aggregate operator health snapshot for private beta.
-- Prints COUNTS ONLY — never emails, names, ids, titles, or any private row content.
-- Run with the service role / SQL editor. Product-event funnels live in PostHog (see
-- docs/beta/operator-dashboard-b1.md); this covers the first-party / DB-side signals.

\echo '== Beta membership =='
select
  (select count(*) from public.beta_members) as beta_members_total,
  (select count(*) from public.beta_members where status = 'active') as beta_members_active;

\echo '== Activation (onboarding) — aggregate counts only =='
select
  (select count(*) from public.users) as users_total,
  (select count(*) from public.users where onboarding_complete is true) as onboarding_complete;

\echo '== Discovery opt-in / analytics opt-out (from user_settings.privacy) =='
select
  count(*) filter (where (settings->'privacy'->>'showOnLeaderboards')::boolean is true) as taste_discovery_opt_in,
  count(*) filter (where (settings->'privacy'->>'analytics')::boolean is false)        as analytics_opted_out
from public.user_settings;

\echo '== Recommendation outcome health (first-party impressions, last 7 days) =='
select
  count(*) as impressions_7d,
  count(*) filter (where clicked) as clicked_7d,
  count(*) filter (where added_to_watchlist) as saved_7d,
  count(*) filter (where marked_watched) as watched_7d
from public.recommendation_impressions
where shown_at > now() - interval '7 days';

\echo '== Daily-briefing cron health (email_sends, last 3 days) — counts only, no recipients =='
select sent_day,
       count(*) filter (where status = 'sent')   as sent,
       count(*) filter (where status <> 'sent')  as failed
from public.email_sends
where sent_day > (now() - interval '3 days')::date
group by sent_day order by sent_day desc;

\echo '== pg_cron job health (last run per FeelFlick job) =='
select j.jobname,
       max(r.start_time) as last_run,
       (array_agg(r.status order by r.start_time desc))[1] as last_status
from cron.job j left join cron.job_run_details r on r.jobid = j.jobid
where j.jobname ilike '%feelflick%' or j.jobname ilike '%briefing%' or j.jobname ilike '%deletion%'
group by j.jobname order by j.jobname;
