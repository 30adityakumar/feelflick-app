-- Fix get_person_public_profile: correct JSONB extractions from taste_fingerprint.
-- The original migration (20260630000000) referenced p.top_mood_tags etc. as direct
-- columns, but user_profiles_computed stores taste data inside the taste_fingerprint
-- JSONB column. Use the same extraction pattern as get_discoverable_taste_profiles.

begin;

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
      when coalesce((s.settings -> 'privacy' ->> 'showOnLeaderboards')::boolean, false)
      then p.taste_fingerprint -> 'topMoodTags'
      else null::jsonb
    end,
    case
      when coalesce((s.settings -> 'privacy' ->> 'showOnLeaderboards')::boolean, false)
      then p.taste_fingerprint -> 'topToneTags'
      else null::jsonb
    end,
    case
      when coalesce((s.settings -> 'privacy' ->> 'showOnLeaderboards')::boolean, false)
      then p.taste_fingerprint -> 'topFitProfiles'
      else null::jsonb
    end,
    case
      when coalesce((s.settings -> 'privacy' ->> 'showOnLeaderboards')::boolean, false)
      then (p.taste_fingerprint ->> 'total')::int
      else null::int
    end,
    coalesce((s.settings -> 'privacy' ->> 'shareHistory')::boolean,   false) as share_history,
    coalesce((s.settings -> 'privacy' ->> 'shareWatchlist')::boolean, false) as share_watchlist
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
