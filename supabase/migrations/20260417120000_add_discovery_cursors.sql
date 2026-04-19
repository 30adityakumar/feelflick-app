-- Cursor tracking for discovery strategies
-- Allows incremental page fetching across pipeline runs

create table if not exists discovery_cursors (
  strategy_name    text primary key,
  last_page_fetched int not null default 0,
  exhausted        boolean not null default false,
  last_run_at      timestamptz
);
