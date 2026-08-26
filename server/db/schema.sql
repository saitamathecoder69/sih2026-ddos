-- LakshmanRekha — Supabase schema
-- Run this once in the Supabase SQL Editor (see INSTRUCTIONS.md step 2).

create table if not exists traffic_events (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  source_ip text not null,
  endpoint text not null,
  rule_score int not null,
  rules_triggered text[] not null default '{}',
  ml_confidence int,
  ml_source text not null,
  risk_score int not null,
  classification text not null,
  action text not null
);

create index if not exists traffic_events_created_at_idx on traffic_events (created_at desc);

alter table traffic_events enable row level security;

-- The frontend reads with the anon key: allow read-only access to anyone
-- holding that key (it is public by design — never put write access here).
create policy "anon can read traffic_events"
  on traffic_events for select
  to anon
  using (true);

-- Only the backend (using the service_role key, which bypasses RLS anyway)
-- writes rows. No insert policy is granted to anon/authenticated, so the
-- frontend's anon key cannot forge events even if it wanted to.
