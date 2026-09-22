-- Async Imagine jobs (video poll) so a long render can finish after the chat turn.
create table if not exists studio_jobs (
  id text primary key,
  kind text not null,
  prompt text not null,
  request_id text,
  media_url text,
  status text not null default 'pending',
  error text,
  created_at timestamptz not null default now()
);

create index if not exists studio_jobs_status_idx on studio_jobs (status, created_at);
