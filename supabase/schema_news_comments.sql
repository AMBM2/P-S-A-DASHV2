-- جدول التعليقات على الأخبار
create table if not exists public.news_comments (
  id uuid primary key,
  "newsId" uuid references public.news(id) on delete cascade,
  author text not null default '',
  text text not null default '',
  "createdAt" timestamptz not null default now()
);

-- تفعيل Realtime للتعليقات (اختياري)
alter publication supabase_realtime add table public.news_comments;