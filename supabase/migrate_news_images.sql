-- إضافة عمود الصور المتعددة للأخبار
alter table public.news add column if not exists images jsonb default '[]'::jsonb;

-- تفعيل Realtime للأخبار (إن لم يكن مفعلاً)
alter publication supabase_realtime add table public.news;