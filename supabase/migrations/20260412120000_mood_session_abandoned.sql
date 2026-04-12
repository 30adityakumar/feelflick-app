-- Track wizard abandonment events for funnel analytics
-- Fires client-side on Discover page unmount when stage < 3

create table if not exists mood_session_abandoned (
  id               bigint generated always as identity primary key,
  user_id          uuid references auth.users(id) on delete cascade,
  selected_mood_id integer,
  reached_stage    smallint not null default 0,
  had_free_text    boolean not null default false,
  created_at       timestamptz not null default now()
);

alter table mood_session_abandoned enable row level security;

-- Users can insert their own events; anonymous inserts allowed (user_id may be null
-- if auth state is momentarily unavailable on unmount)
create policy "Users can insert own abandonment events"
  on mood_session_abandoned for insert
  with check (auth.uid() = user_id or user_id is null);
