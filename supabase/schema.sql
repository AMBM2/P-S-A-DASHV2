-- ============================================================================
-- PUBLIC SECURITY PORTAL — Supabase Schema
-- Run this entire script in the Supabase SQL Editor (Dashboard -> SQL -> New query)
-- ============================================================================

-- ============ NEWS ============
create table if not exists public.news (
  id uuid primary key default gen_random_uuid(),
  title text not null default '',
  "titleAr" text not null default '',
  body text not null default '',
  "bodyAr" text not null default '',
  category text not null default 'general',
  priority text not null default 'normal',
  author text not null default '',
  "publishedAt" timestamptz not null default now(),
  pinned boolean not null default false,
  status text not null default 'draft',
  image text,
  views integer not null default 0,
  "commentsEnabled" boolean not null default true
);

-- ============ OFFICERS ============
create table if not exists public.officers (
  id uuid primary key default gen_random_uuid(),
  badge text not null default '',
  callsign text not null default '',
  name text not null default '',
  "nameAr" text not null default '',
  cid text,
  "discordId" text,
  "discordName" text,
  "discordAvatar" text,
  "rankId" text not null default '',
  "departmentId" text not null default '',
  status text not null default 'off-duty',
  specialization text[] not null default '{}',
  squad text,
  "joinedAt" timestamptz not null default now(),
  email text,
  phone text,
  "emergencyContact" text,
  medals text[] not null default '{}',
  "activityHours" integer not null default 0,
  performance numeric not null default 0,
  threats integer not null default 0,
  "medicalClear" boolean not null default false
);

-- ============ LEADERS ============
create table if not exists public.leaders (
  id uuid primary key default gen_random_uuid(),
  name text not null default '',
  "nameAr" text not null default '',
  title text not null default '',
  "titleAr" text not null default '',
  badge text not null default '',
  mandate text not null default '',
  "mandateAr" text not null default '',
  rank text not null default '',
  photo text
);

-- ============ CODES ============
create table if not exists public.codes (
  id uuid primary key default gen_random_uuid(),
  code text not null default '',
  meaning text not null default '',
  "meaningAr" text not null default '',
  type text not null default '10-code'
);

-- ============ SETTINGS (key/value) ============
create table if not exists public.settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb
);

-- ============ AUDIT ============
create table if not exists public.audit (
  id uuid primary key default gen_random_uuid(),
  actor text not null default '',
  action text not null default '',
  entity text not null default '',
  timestamp timestamptz not null default now(),
  ip text
);

-- ============ SESSIONS ============
create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  "user" text not null default '',
  ip text not null default '',
  action text not null default '',
  at timestamptz not null default now()
);

-- ============ ROW LEVEL SECURITY ============
alter table public.news enable row level security;
alter table public.officers enable row level security;
alter table public.leaders enable row level security;
alter table public.codes enable row level security;
alter table public.settings enable row level security;
alter table public.audit enable row level security;
alter table public.sessions enable row level security;

-- Allow anonymous full access (public portal with client-side CRUD)
do $$
begin
  if not exists (select from pg_policies where schemaname='public' and tablename='news' and policyname='anon_all_news') then
    create policy "anon_all_news" on public.news for all to anon using (true) with check (true);
  end if;
  if not exists (select from pg_policies where schemaname='public' and tablename='officers' and policyname='anon_all_officers') then
    create policy "anon_all_officers" on public.officers for all to anon using (true) with check (true);
  end if;
  if not exists (select from pg_policies where schemaname='public' and tablename='leaders' and policyname='anon_all_leaders') then
    create policy "anon_all_leaders" on public.leaders for all to anon using (true) with check (true);
  end if;
  if not exists (select from pg_policies where schemaname='public' and tablename='codes' and policyname='anon_all_codes') then
    create policy "anon_all_codes" on public.codes for all to anon using (true) with check (true);
  end if;
  if not exists (select from pg_policies where schemaname='public' and tablename='settings' and policyname='anon_all_settings') then
    create policy "anon_all_settings" on public.settings for all to anon using (true) with check (true);
  end if;
  if not exists (select from pg_policies where schemaname='public' and tablename='audit' and policyname='anon_all_audit') then
    create policy "anon_all_audit" on public.audit for all to anon using (true) with check (true);
  end if;
  if not exists (select from pg_policies where schemaname='public' and tablename='sessions' and policyname='anon_all_sessions') then
    create policy "anon_all_sessions" on public.sessions for all to anon using (true) with check (true);
  end if;
end $$;
