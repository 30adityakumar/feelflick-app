-- SECURITY DEFINER RPC that exposes editorial + computed DNA data for another user.
-- Used by PublicDnaProfile to render the full archetype hero + passport for a follower.
-- Access is gated: caller must be authenticated, not self, and target must have
-- showOnLeaderboards = true (defaulted to true by migration 00004).
-- Only counts (not raw rows) of user_ratings are exposed.

create or replace function public.get_person_public_dna(target_user_id uuid)
returns table (
  name                   text,
  avatar_url             text,
  editorial_archetype    jsonb,
  editorial_summary      text,
  editorial_signature    text,
  editorial_generated_at timestamptz,
  taste_fingerprint      jsonb,
  total_watched          int,
  total_rated            int
)
language sql
security definer
stable
set search_path = public, extensions, pg_catalog
as $$
  select
    u.name,
    u.avatar_url,
    p.editorial_archetype,
    p.editorial_summary,
    p.editorial_signature,
    p.editorial_generated_at,
    p.taste_fingerprint,
    coalesce(u.total_movies_watched, (p.taste_fingerprint ->> 'total')::int, 0)::int  as total_watched,
    (select count(*)::int from public.user_ratings r where r.user_id = target_user_id) as total_rated
  from public.users u
  left join public.user_profiles_computed p on p.user_id = u.id
  where u.id = target_user_id
    and (select auth.uid()) is not null
    and (select auth.uid()) != target_user_id
    and coalesce((
      select (s.settings -> 'privacy' ->> 'showOnLeaderboards')::boolean
      from public.user_settings s where s.user_id = target_user_id
    ), true)
  limit 1;
$$;

grant execute on function public.get_person_public_dna(uuid) to authenticated;
