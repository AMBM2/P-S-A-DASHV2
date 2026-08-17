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

insert into public.admins ("userId", role, note)
values ('1527322761473822811', 'master', 'Master Super Admin'),
       ('897450827353063505', 'master', 'مسؤول إدارة الموقع كاملة')
on conflict ("userId") do update set role = 'master';

-- ============================================================================
-- 13) Recruitment applications (public survey form → pending review)
-- ============================================================================
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