-- ============================================================================
-- STANDALONE DISCORD BOT — Additional Schema
-- Run in Supabase SQL Editor. Requires schema.sql + schema_field.sql first.
-- ============================================================================

-- Discord roles snapshot (synced by the bot's member/role extractor)
create table if not exists public.roles (
  id uuid primary key default gen_random_uuid(),
  "roleId" text unique not null default '',
  name text not null default '',
  "nameAr" text not null default '',
  type text not null default 'functional',   -- rank | department | functional
  "rankId" text,
  "level" integer not null default 0,
  color text,
  permissions jsonb not null default '{}'::jsonb
);

-- Administrative strikes / warnings
create table if not exists public.strikes (
  id uuid primary key default gen_random_uuid(),
  "officerId" uuid references public.officers(id) on delete cascade,
  "discordId" text,
  reason text not null default '',
  issuer text not null default '',            -- commander name / discord
  severity integer not null default 1,
  status text not null default 'active',      -- active | expunged
  "createdAt" timestamptz not null default now()
);

-- Leave / LOA requests
create table if not exists public.leave_requests (
  id uuid primary key default gen_random_uuid(),
  "officerId" uuid references public.officers(id) on delete cascade,
  "discordId" text,
  reason text not null default '',
  "startDate" date,
  "endDate" date,
  status text not null default 'pending',     -- pending | approved | denied | revoked
  "approvedBy" text,
  "createdAt" timestamptz not null default now()
);

-- ===== RLS (service role bypasses anyway; keep anon read for dashboard) =====
alter table public.roles enable row level security;
alter table public.strikes enable row level security;
alter table public.leave_requests enable row level security;

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
end $$;

-- Enable Realtime for the bot's tables
alter publication supabase_realtime add table public.officers;
alter publication supabase_realtime add table public.patrols;
alter publication supabase_realtime add table public.strikes;
alter publication supabase_realtime add table public.leave_requests;
