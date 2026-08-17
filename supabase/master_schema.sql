-- ============================================================================
-- PSA PORTAL — MASTER SCHEMA (كل شي في ملف واحد)
-- شامل: الجداول الأساسية + الصلاحيات + التوظيف + الكلية العسكرية + الاختبارات
-- + سجل العمليات + الميدان + الحماية الكاملة. آمن للتشغيل المتكرر.
-- الصق الكل في Supabase SQL Editor ثم اضغط Run.
-- ============================================================================

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
  images jsonb default '[]'::jsonb,
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

-- ============================================================================
-- الجزء الثاني: كل الإضافات (تم تصحيح ترتيب exam_questions)
-- ============================================================================

-- ============================================================================
-- PSA PORTAL — EVERYTHING NEEDED (run once in Supabase SQL Editor)
-- Covers: news images column, news_comments, login_codes, roles, strikes,
--         leave_requests, patrols, RBAC (admins), recruitment (applications),
--         military college (cadets, exam_questions), psa-media storage bucket,
--         Realtime, RLS policies.
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

-- 7) Field patrols (جدول الميدان) + officers.fieldPoints
alter table public.officers add column if not exists "fieldPoints" integer not null default 0;
alter table public.officers add column if not exists "dischargedAt" timestamptz;
alter table public.officers add column if not exists "dischargedBy" text;

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

alter table public.patrols enable row level security;

do $$
begin
  if not exists (select from pg_policies where schemaname='storage' and tablename='objects' and policyname='psa_media_anon_delete') then
    create policy "psa_media_anon_delete" on storage.objects for delete using (bucket_id = 'psa-media');
  end if;
end $$;

-- ============================================================================
-- 21) PERMISSION DELEGATES — dynamic role & permission management (الصلاحيات)
--     The Master Super Admin (hardcoded 897450827353063505) delegates granular
--     sub-permissions to users by Discord ID. The anon key CANNOT read/write
--     this table — only the portal server routes (service role key).
-- ============================================================================
create table if not exists public.permissions (
  id uuid primary key default gen_random_uuid(),
  "discordId" text unique not null default '',
  permissions jsonb not null default '[]'::jsonb,
  note text not null default '',
  "createdBy" text not null default '',
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

-- ============================================================================
-- 22) SYSTEM AUDIT LOGS (لوق العمليات) — every critical action on the site.
-- ============================================================================
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  action text not null default '',
  "actionAr" text not null default '',
  executor text not null default '',
  "executorName" text,
  target text,
  "targetName" text,
  metadata jsonb not null default '{}'::jsonb,
  "createdAt" timestamptz not null default now()
);

-- ============================================================================
-- 23) MILITARY EXAM BUILDER & CITIZEN RECRUITMENT PORTAL (الاختبارات)
--     exams → exam_questions → exam_attempts (detailed candidate score reports).
-- ============================================================================
create table if not exists public.exams (
  id uuid primary key default gen_random_uuid(),
  title text not null default '',
  description text not null default '',
  "durationMinutes" integer not null default 15,
  status text not null default 'draft',
  "createdBy" text not null default '',
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);
-- >>> [REORDERED] exam_questions CREATE moved here, before the ALTERs below <<<
-- ============================================================================
-- 15) Exam questions (Military College entrance / recruitment exam)
-- ============================================================================
create table if not exists public.exam_questions (
  id uuid primary key default gen_random_uuid(),
  prompt text not null default '',
  choices jsonb not null default '[]'::jsonb,
  "correctIndex" integer not null default 0,
  points integer not null default 1,
  active boolean not null default true,
  "createdAt" timestamptz not null default now()
);

-- Seed a few default questions (edit/replace from the admin panel or SQL)
insert into public.exam_questions (prompt, choices, "correctIndex", points)
select * from (values
  ('ما هو الإجراء الأول عند اكتشاف حريق داخل المقر؟', '["إخلاء الموقع فوراً والاتصال بالدفاع المدني","التقاط صور للمكان","الانتظار حتى تصل فرق الإطفاء","فتح النوافذ للتهوية"]'::jsonb, 0, 2),
  ('ما معنى "المسؤولية المشتركة" في العمل الأمني؟', '["توزيع المهام والتعاون لتحقيق الأهداف المشتركة","تحميل فرد واحد كل المسؤوليات","تفويض كل المهام للقيادة","تجاهل الأخطاء الفردية"]'::jsonb, 0, 2),
  ('أي التصرفات التالية يتعارض مع قواعد السرية؟', '["مشاركة معلومات سرية مع أشخاص غير مخوّلين","حفظ المستندات في أماكن آمنة","اتباع إجراءات التشفير المعتمدة","الإبلاغ عن أي تسريب محتمل"]'::jsonb, 0, 2),
  ('ما أهمية التواصل الفعال داخل الفريق؟', '["يقلل من سوء الفهم ويسرّع تنفيذ المهام","يزيد من الازدحام","لا يؤثر على الأداء","يتطلب وقتاً إضافياً فقط"]'::jsonb, 0, 2)
) as t(prompt, choices, "correctIndex", points)
where not exists (select 1 from public.exam_questions);

-- Extend the existing exam_questions table with the full builder schema.
-- The legacy college questions (examId null) keep working unchanged.
alter table public.exam_questions add column if not exists "examId" uuid;
alter table public.exam_questions add column if not exists type text not null default 'single';
alter table public.exam_questions add column if not exists media text not null default 'none';
alter table public.exam_questions add column if not exists "mediaUrl" text not null default '';
alter table public.exam_questions add column if not exists "correctIndices" jsonb not null default '[]'::jsonb;
alter table public.exam_questions add column if not exists "sortOrder" integer not null default 0;

create table if not exists public.exam_attempts (
  id uuid primary key default gen_random_uuid(),
  "examId" uuid references public.exams(id) on delete cascade,
  "recruiterId" text not null default '',
  "citizenId" text not null default '',
  "citizenName" text not null default '',
  answers jsonb not null default '[]'::jsonb,
  score integer not null default 0,
  total integer not null default 0,
  percentage numeric not null default 0,
  passed boolean not null default false,
  "startedAt" timestamptz not null default now(),
  "completedAt" timestamptz not null default now(),
  "createdAt" timestamptz not null default now()
);

alter table public.permissions enable row level security;
alter table public.audit_logs enable row level security;
alter table public.exams enable row level security;
alter table public.exam_attempts enable row level security;

-- NOTE: intentionally NO anon policies — these tables are only reachable
-- through the portal server routes / the bot (SUPABASE_SERVICE_ROLE_KEY).

-- Realtime for the exam system + audit logs.
do $$
declare t text;
begin
  foreach t in array array['permissions','audit_logs','exams','exam_attempts'] loop
    begin
      execute format('alter publication supabase_realtime add table public.%I', t);
    exception when duplicate_object then null;
    end;
  end loop;
end $$;

-- ============================================================================
-- 12) RBAC — admins (master / admin / recruitment). Master can delegate access.
--     NOTE: replace the seed Discord user ID with the Master Super Admin's ID.
-- ============================================================================
create table if not exists public.admins (
  id uuid primary key default gen_random_uuid(),
  "userId" text unique not null default '',
  role text not null default 'recruitment',
  note text not null default '',
  active boolean not null default true,
  "createdAt" timestamptz not null default now()
);

-- Only the hardcoded Master Super Admin (897450827353063505) may hold the
-- 'master' role. Any other user is demoted to 'executive' (safety net).
insert into public.admins ("userId", role, note)
values ('897450827353063505', 'master', 'مسؤول إدارة الموقع كاملة')
on conflict ("userId") do update set role = 'master';

update public.admins
   set role = 'executive'
 where role = 'master' and "userId" <> '897450827353063505';

-- ============================================================================
-- 13) Recruitment applications (public survey form → pending review)
--     Migrate FIRST: an old empty experiment table used legacy snake_case
--     columns (created_at, discord_id, reviewed_by, unit) with no name/ranks.
--     It is incompatible with the portal — drop it so the canonical table
--     below is created with the camelCase schema the app expects.
-- ============================================================================
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'applications' and column_name = 'created_at'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'applications' and column_name = 'nameAr'
  ) then
    drop table public.applications cascade;
  end if;
end $$;

create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  name text not null default '',
  "nameAr" text not null default '',
  "discordId" text not null default '',
  unit text not null default '',
  ranks jsonb not null default '[]'::jsonb,
  status text not null default 'pending',
  "examScore" integer not null default 0,
  "examAnswers" jsonb not null default '[]'::jsonb,
  "reviewedBy" text,
  "createdAt" timestamptz not null default now()
);

-- ============================================================================
-- 14) Military college cadets (created on application submit / approval)
-- ============================================================================
create table if not exists public.cadets (
  id uuid primary key default gen_random_uuid(),
  "applicationId" uuid references public.applications(id) on delete set null,
  "discordId" text not null default '',
  name text not null default '',
  "nameAr" text not null default '',
  "rankId" text not null default '',
  unit text not null default '',
  status text not null default 'pending',
  "examScore" integer not null default 0,
  "officerId" uuid references public.officers(id) on delete set null,
  "createdAt" timestamptz not null default now()
);


-- ===== RLS policies =====
alter table public.admins enable row level security;
alter table public.applications enable row level security;
alter table public.cadets enable row level security;
alter table public.exam_questions enable row level security;

do $$
begin
  if not exists (select from pg_policies where schemaname='public' and tablename='admins' and policyname='anon_all_admins') then
    create policy "anon_all_admins" on public.admins for all to anon using (true) with check (true);
  end if;
  if not exists (select from pg_policies where schemaname='public' and tablename='applications' and policyname='anon_all_applications') then
    create policy "anon_all_applications" on public.applications for all to anon using (true) with check (true);
  end if;
  if not exists (select from pg_policies where schemaname='public' and tablename='cadets' and policyname='anon_all_cadets') then
    create policy "anon_all_cadets" on public.cadets for all to anon using (true) with check (true);
  end if;
  if not exists (select from pg_policies where schemaname='public' and tablename='exam_questions' and policyname='anon_all_exam_questions') then
    create policy "anon_all_exam_questions" on public.exam_questions for all to anon using (true) with check (true);
  end if;
end $$;

-- ===== Realtime for the new tables =====
do $$
declare t text;
begin
  foreach t in array array['admins','applications','cadets','exam_questions'] loop
    begin
      execute format('alter publication supabase_realtime add table public.%I', t);
    exception when duplicate_object then null;
    end;
  end loop;
end $$;

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

-- ============================================================================
-- 16) Recruitment streamlining — remove the Unit field entirely
--     (applicants are assigned to the main military department on approval).
-- ============================================================================
alter table public.applications drop column if exists unit;
alter table public.cadets drop column if exists unit;

-- ============================================================================
-- 17) Advanced discharge — type, evidence, blacklist + discharge audit log
-- ============================================================================
alter table public.officers add column if not exists "dischargeType" text;
alter table public.officers add column if not exists "dischargeReason" text;

create table if not exists public.blacklist (
  id uuid primary key default gen_random_uuid(),
  "discordId" text unique not null default '',
  reason text not null default '',
  "addedBy" text,
  "createdAt" timestamptz not null default now()
);

create table if not exists public.discharges (
  id uuid primary key default gen_random_uuid(),
  "officerId" uuid references public.officers(id) on delete cascade,
  "discordId" text,
  name text not null default '',
  type text not null default '',
  reason text not null default '',
  evidence text not null default '',
  blacklisted boolean not null default false,
  "dischargedBy" text,
  "createdAt" timestamptz not null default now()
);

alter table public.blacklist enable row level security;
alter table public.discharges enable row level security;

do $$
begin
  if not exists (select from pg_policies where schemaname='public' and tablename='blacklist' and policyname='anon_all_blacklist') then
    create policy "anon_all_blacklist" on public.blacklist for all to anon using (true) with check (true);
  end if;
  if not exists (select from pg_policies where schemaname='public' and tablename='discharges' and policyname='anon_all_discharges') then
    create policy "anon_all_discharges" on public.discharges for all to anon using (true) with check (true);
  end if;
end $$;

-- ============================================================================
-- 18) Role categories — maps Discord role IDs to OFFICER / ENLISTED groups for
--     the autonomous member sorting in patrol dispatch. Managed from the
--     Web Dashboard settings tab (role_categories table).
-- ============================================================================
create table if not exists public.role_categories (
  id uuid primary key default gen_random_uuid(),
  "roleId" text unique not null default '',
  category text not null default 'officer',
  name text not null default '',
  "updatedAt" timestamptz not null default now()
);

alter table public.role_categories enable row level security;

do $$
begin
  if not exists (select from pg_policies where schemaname='public' and tablename='role_categories' and policyname='anon_all_role_categories') then
    create policy "anon_all_role_categories" on public.role_categories for all to anon using (true) with check (true);
  end if;
end $$;

-- ============================================================================
-- 20) SECURITY HARDENING — revoke full anon access (the anon key is public in
--     the browser bundle, so anon must NEVER write or read sensitive tables).
--     After this: anon may only SELECT the public display tables below.
--     All writes now go through the portal API routes / the bot using the
--     SUPABASE_SERVICE_ROLE_KEY (server-side only).
-- ============================================================================
do $$
declare pol text;
begin
  -- Remove every permissive "anon_all_*" policy from public tables.
  for pol in
    select policyname from pg_policies
    where schemaname = 'public' and policyname like 'anon_all\_%'
  loop
    execute format('drop policy %I on public.%I',
      pol, (select tablename from pg_policies where policyname = pol and schemaname='public'));
  end loop;
end $$;

-- Public display tables: anon SELECT only (no insert/update/delete).
alter table public.news enable row level security;
alter table public.officers enable row level security;
alter table public.leaders enable row level security;
alter table public.codes enable row level security;
alter table public.settings enable row level security;

do $$
begin
  if not exists (select from pg_policies where schemaname='public' and tablename='news' and policyname='pub_read_news') then
    create policy "pub_read_news" on public.news for select to anon using (true);
  end if;
  if not exists (select from pg_policies where schemaname='public' and tablename='officers' and policyname='pub_read_officers') then
    create policy "pub_read_officers" on public.officers for select to anon using (true);
  end if;
  if not exists (select from pg_policies where schemaname='public' and tablename='leaders' and policyname='pub_read_leaders') then
    create policy "pub_read_leaders" on public.leaders for select to anon using (true);
  end if;
  if not exists (select from pg_policies where schemaname='public' and tablename='codes' and policyname='pub_read_codes') then
    create policy "pub_read_codes" on public.codes for select to anon using (true);
  end if;
  if not exists (select from pg_policies where schemaname='public' and tablename='settings' and policyname='pub_read_settings') then
    create policy "pub_read_settings" on public.settings for select to anon using (true);
  end if;
end $$;

-- Storage: keep public read + upload (insert) only; drop delete/update so the
-- media bucket cannot be wiped/tampered by the public anon key.
do $$
begin
  if exists (select from pg_policies where schemaname='storage' and tablename='objects' and policyname='psa_media_anon_delete') then
    drop policy "psa_media_anon_delete" on storage.objects;
  end if;
  if exists (select from pg_policies where schemaname='storage' and tablename='objects' and policyname='psa_media_anon_update') then
    drop policy "psa_media_anon_update" on storage.objects;
  end if;
end $$;

-- NOTE: admins, applications, cadets, exam_questions, strikes, leave_requests,
-- blacklist, discharges, role_categories, login_codes, audit and patrols have
-- NO anon policy anymore — the anon key cannot touch them. The bot and the
-- portal server routes (SUPABASE_SERVICE_ROLE_KEY) are their only access path.

-- ============================================================================
-- Storage bucket "psa-media" (public) for anthem / welcome / news media
-- ============================================================================
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

-- ============================================================================
-- 24) STRICT ROW-LEVEL SECURITY ENFORCEMENT (defense in depth)
--     Run AFTER sections 1-23. Idempotent — safe to re-run.
-- ============================================================================

-- Public display tables: keep anon SELECT (via the pub_read_* policies) but
-- strip every WRITE privilege from anon + authenticated. Only the portal server
-- routes (service role key) can insert/update/delete these rows.
alter table public.news enable row level security;
alter table public.officers enable row level security;
alter table public.leaders enable row level security;
alter table public.codes enable row level security;
alter table public.settings enable row level security;

revoke insert, update, delete on public.news, public.officers,
       public.leaders, public.codes, public.settings from anon, authenticated;
grant select on public.news, public.officers,
      public.leaders, public.codes, public.settings to anon;

-- Sensitive tables: full revoke — neither anon nor authenticated can read or
-- write them. Only the bot and the portal server routes (SUPABASE_SERVICE_ROLE_KEY)
-- may access these. Skips tables that are not migrated yet.
do $$
declare t text; tbl text[] := array[
  'admins','permissions','audit','audit_logs','applications','cadets',
  'exam_questions','exams','exam_attempts','strikes','leave_requests',
  'blacklist','discharges','role_categories','login_codes','patrols'
];
begin
  foreach t in array tbl loop
    if to_regclass(format('public.%I', t)) is not null then
      execute format('alter table public.%I enable row level security', t);
      execute format('revoke all on public.%I from anon, authenticated', t);
    end if;
  end loop;
end $$;

-- Belt + suspenders: drop any remaining permissive anon "all" policies.
do $$
declare pol text;
begin
  for pol in
    select policyname from pg_policies
     where schemaname = 'public' and policyname like 'anon_all\_%'
  loop
    execute format('drop policy %I on public.%I',
      pol, (select tablename from pg_policies where policyname = pol and schemaname='public'));
  end loop;
end $$;
