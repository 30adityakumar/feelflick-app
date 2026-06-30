-- Turn showOnLeaderboards ON for all existing users and change the RPC default to true.
-- This removes the "Cinematic DNA is private" block on public profiles — DNA tags are
-- now always returned when available, regardless of this flag. Users who have not
-- logged enough films simply have no taste_fingerprint yet (shown as "No DNA data yet").

begin;

-- 1. Backfill: set showOnLeaderboards = true for any user who doesn't have it set to true
UPDATE public.user_settings
SET settings = jsonb_set(
  coalesce(settings, '{}'::jsonb),
  '{privacy,showOnLeaderboards}',
  'true'::jsonb
)
WHERE (settings -> 'privacy' ->> 'showOnLeaderboards')::boolean IS DISTINCT FROM true;

-- 2. Recreate get_person_public_profile with showOnLeaderboards default → true,
--    so new users also get their DNA returned before they ever visit Account → Privacy.
create or replace function public.get_person_public_profile(target_user_id uuid)
returns table (
  id               uuid,
  name             text,
  avatar_url       text,
  top_mood_tags    jsonb,
  top_tone_tags    jsonb,
  top_fit_profiles jsonb,
  dna_total        int,
  share_history    boolean,
  share_watchlist  boolean
)
language sql
security definer
stable
set search_path = public, extensions, pg_catalog
as $$
  select
    u.id,
    u.name,
    u.avatar_url,
    case
      when coalesce((s.settings -> 'privacy' ->> 'showOnLeaderboards')::boolean, true)
      then p.taste_fingerprint -> 'topMoodTags'
      else null::jsonb
    end,
    case
      when coalesce((s.settings -> 'privacy' ->> 'showOnLeaderboards')::boolean, true)
      then p.taste_fingerprint -> 'topToneTags'
      else null::jsonb
    end,
    case
      when coalesce((s.settings -> 'privacy' ->> 'showOnLeaderboards')::boolean, true)
      then p.taste_fingerprint -> 'topFitProfiles'
      else null::jsonb
    end,
    case
      when coalesce((s.settings -> 'privacy' ->> 'showOnLeaderboards')::boolean, true)
      then (p.taste_fingerprint ->> 'total')::int
      else null::int
    end,
    coalesce((s.settings -> 'privacy' ->> 'shareHistory')::boolean,   true) as share_history,
    coalesce((s.settings -> 'privacy' ->> 'shareWatchlist')::boolean, true) as share_watchlist
  from public.users u
  left join public.user_profiles_computed p on p.user_id = u.id
  left join public.user_settings          s on s.user_id  = u.id
  where u.id = target_user_id
    and (select auth.uid()) is not null
    and (select auth.uid()) != target_user_id
  limit 1;
$$;

grant execute on function public.get_person_public_profile(uuid) to authenticated;

commit;
