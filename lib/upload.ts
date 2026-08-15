import { supabase } from "./supabase";

const BUCKET = "psa-media";

export function isYoutubeUrl(url?: string): boolean {
  if (!url) return false;
  return /youtube\.com|youtu\.be|youtube-nocookie\.com/.test(url);
}

export async function uploadMedia(file: File): Promise<{ url: string; error?: string }> {
  if (!file) return { url: "", error: "لا يوجد ملف" };
  const maxMb = 50;
  if (file.size > maxMb * 1024 * 1024) {
    return { url: "", error: `الملف أكبر من ${maxMb}MB` };
  }
  const ext = file.name.split(".").pop()?.toLowerCase() || "mp4";
  const path = `welcome/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) return { url: "", error: error.message };
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { url: data.publicUrl };
}
