-- Unowned studio campaigns: generated creatives + 4× daily Facebook slots.
create table if not exists studio_campaigns (
  id text primary key,
  page_id text not null,
  page_name text not null,
  theme text not null,
  kind text not null default 'banner',
  timezone text not null default 'Asia/Manila',
  hours text not null default '9,13,17,21',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists studio_slots (
  id text primary key,
  campaign_id text not null,
  publish_at timestamptz not null,
  caption text not null,
  media_url text,
  media_kind text not null default 'image',
  fb_post_id text,
  status text not null default 'pending',
  error text,
  created_at timestamptz not null default now()
);

create index if not exists studio_slots_publish_at_idx on studio_slots (publish_at);
create unique index if not exists studio_slots_campaign_at_idx on studio_slots (campaign_id, publish_at);
