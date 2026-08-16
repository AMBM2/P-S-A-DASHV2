-- ============================================================================
-- PSA PORTAL — EVERYTHING NEEDED (run once in Supabase SQL Editor)
-- Covers: news images column, news_comments, login_codes, roles, strikes,
--         leave_requests, psa-media storage bucket, Realtime, RLS policies.
-- Safe to run multiple times (all statements are idempotent).
-- ============================================================================

-- 1) News: multiple images column + Realtime
alter table public.news add column if not exists images jsonb default '[]'::jsonb;

-- 2) Comments on news
create table if not exists public.news_comments (
  id uuid primary key,
  "newsId" uuid references public.news(id) on delete cascade,
  author text not null default '',
  text text not null default '',
  "createdAt" timestamptz not null default now()
);

-- 3) Discord login codes (bot sends them in DMs)
create table if not exists public.login_codes (
  id uuid primary key default gen_random_uuid(),
  "userId" text not null,
  code text not null,
  "expiresAt" timestamptz not null,
  used boolean not null default false,
  "createdAt" timestamptz not null default now()
);
create index if not exists login_codes_user_idx on public.login_codes ("userId");

-- 4) Discord roles snapshot (synced by the bot)
create table if not exists public.roles (
  id uuid primary key default gen_random_uuid(),
  "roleId" text unique not null default '',
  name text not null default '',
  "nameAr" text not null default '',
  type text not null default 'functional',
  "rankId" text,
  "level" integer not null default 0,
  color text,
  permissions jsonb not null default '{}'::jsonb
);

-- 5) Administrative strikes / warnings
create table if not exists public.strikes (
  id uuid primary key default gen_random_uuid(),
  "officerId" uuid references public.officers(id) on delete cascade,
  "discordId" text,
  reason text not null default '',
  issuer text not null default '',
  severity integer not null default 1,
  status text not null default 'active',
  "createdAt" timestamptz not null default now()
);

-- 6) Leave / LOA requests
create table if not exists public.leave_requests (
  id uuid primary key default gen_random_uuid(),
  "officerId" uuid references public.officers(id) on delete cascade,
  "discordId" text,
  reason text not null default '',
  "startDate" date,
  "endDate" date,
  status text not null default 'pending',
  "approvedBy" text,
  "createdAt" timestamptz not null default now()
);

-- ===== RLS policies (anon can read/write these tables) =====
alter table public.roles enable row level security;
alter table public.strikes enable row level security;
alter table public.leave_requests enable row level security;
alter table public.news_comments enable row level security;
alter table public.login_codes enable row level security;

do $$
begin
  if not exists (select from pg_policies where schemaname='public' and tablename='roles' and policyname='anon_all_roles') then
    create policy "anon_all_roles" on public.roles for all to anon using (true) with check (true);
  end if;
  if not exists (select from pg_policies where schemaname='public' and tablename='strikes' and policyname='anon_all_strikes') then
    create policy "anon_all_strikes" on public.strikes for all to anon using (true) with check (true);
  end if;
  if not exists (select from pg_policies where schemaname='public' and tablename='leave_requests' and policyname='anon_all_leave') then
    create policy "anon_all_leave" on public.leave_requests for all to anon using (true) with check (true);
  end if;
  if not exists (select from pg_policies where schemaname='public' and tablename='news_comments' and policyname='anon_all_comments') then
    create policy "anon_all_comments" on public.news_comments for all to anon using (true) with check (true);
  end if;
  if not exists (select from pg_policies where schemaname='public' and tablename='login_codes' and policyname='anon_all_login') then
    create policy "anon_all_login" on public.login_codes for all to anon using (true) with check (true);
  end if;
end $$;

-- ===== Realtime for all tables used by the bot / portal =====
do $$
declare t text;
begin
  foreach t in array array['news','officers','patrols','roles','strikes','leave_requests','login_codes','news_comments'] loop
    begin
      execute format('alter publication supabase_realtime add table public.%I', t);
    exception when duplicate_object then null;
    end;
  end loop;
end $$;

-- ===== Storage bucket "psa-media" (public) for anthem / welcome / news media =====
insert into storage.buckets (id, name, public)
values ('psa-media', 'psa-media', true)
on conflict (id) do update set public = true;

do $$
begin
  if not exists (select from pg_policies where schemaname='storage' and tablename='objects' and policyname='psa_media_public_read') then
    create policy "psa_media_public_read" on storage.objects for select using (bucket_id = 'psa-media');
  end if;
  if not exists (select from pg_policies where schemaname='storage' and tablename='objects' and policyname='psa_media_anon_insert') then
    create policy "psa_media_anon_insert" on storage.objects for insert with check (bucket_id = 'psa-media');
  end if;
  if not exists (select from pg_policies where schemaname='storage' and tablename='objects' and policyname='psa_media_anon_update') then
    create policy "psa_media_anon_update" on storage.objects for update using (bucket_id = 'psa-media');
  end if;
  if not exists (select from pg_policies where schemaname='storage' and tablename='objects' and policyname='psa_media_anon_delete') then
    create policy "psa_media_anon_delete" on storage.objects for delete using (bucket_id = 'psa-media');
  end if;
end $$;