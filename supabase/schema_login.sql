-- جدول رموز تسجيل الدخول (يرسلها البوت في الخاص)
create table if not exists public.login_codes (
  id uuid primary key default gen_random_uuid(),
  "userId" text not null,
  code text not null,
  "expiresAt" timestamptz not null,
  used boolean not null default false,
  "createdAt" timestamptz not null default now()
);

create index if not exists login_codes_user_idx on public.login_codes ("userId");