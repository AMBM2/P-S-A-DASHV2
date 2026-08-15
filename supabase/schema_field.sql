-- ============================================================================
-- FIELD PATROL SCHEDULE — Supabase Schema (run after schema.sql)
-- 1) adds fieldPoints to officers
-- 2) creates patrols table
-- ============================================================================

-- Add points column to officers (if not present)
do $$
begin
  if not exists (select 1 from information_schema.columns
                 where table_schema='public' and table_name='officers'
                 and column_name='fieldPoints') then
    alter table public.officers add column "fieldPoints" integer not null default 0;
  end if;
end $$;

-- Patrol scenarios
create table if not exists public.patrols (
  id uuid primary key default gen_random_uuid(),
  name text not null default '',
  "nameAr" text not null default '',
  image text,
  "roomId" text not null default '',
  points integer not null default 0,
  participants jsonb not null default '[]'::jsonb,
  "participantCount" integer not null default 0,
  status text not null default 'dispatched',
  "createdAt" timestamptz not null default now()
);

-- RLS
alter table public.patrols enable row level security;

do $$
begin
  if not exists (select from pg_policies where schemaname='public' and tablename='patrols' and policyname='anon_all_patrols') then
    create policy "anon_all_patrols" on public.patrols for all to anon using (true) with check (true);
  end if;
end $$;
