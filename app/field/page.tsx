"use client";

import { useState, useRef } from "react";
import { Send, Image as ImageIcon, Radio, Trophy, Loader2, CheckCircle2, AlertTriangle, Users } from "lucide-react";
import { Button, Card, Field, Input } from "@/components/ui";
import { useStore } from "@/lib/store";

export default function FieldPage() {
  const { addAudit } = useStore();
  const [name, setName] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [roomId, setRoomId] = useState("");
  const [points, setPoints] = useState("10");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<null | { ok: boolean; bot: boolean; count: number; awarded: number; botError?: string }>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const preview = imageUrl.trim();

  const onFile = async (f: File | undefined) => {
    if (!f) return;
    const base = await new Promise<string>((resolve) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result));
      r.readAsDataURL(f);
    });
    setImageUrl(base);
  };

  const submit = async () => {
    if (!name.trim() || !roomId.trim()) {
      setResult({ ok: false, bot: false, count: 0, awarded: 0, botError: "يرجى تعبئة اسم السيناريو وآيدي الروم الصوتية" });
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/field", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          nameAr: name.trim(),
          image: imageUrl.trim() || null,
          roomId: roomId.trim(),
          points: Number(points) || 0,
        }),
      });
      const data = await res.json();
      setResult({
        ok: data.ok,
        bot: data.bot,
        count: data.count ?? 0,
        awarded: data.awarded ?? 0,
        botError: data.botError || data.error,
      });
      if (data.ok) addAudit("field", `إرسال تنبيه ميداني: ${name.trim()}`);
    } catch {
      setResult({ ok: false, bot: false, count: 0, awarded: 0, botError: "تعذر الاتصال بالخادم" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <Card className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-gold-400 to-transparent" />
        <div className="flex items-center gap-3 border-b border-gold-400/15 p-6">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-gold-300/40 bg-gold-400/10 text-gold-200">
            <Radio size={20} />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-white">جدول الميدان</h1>
            <p className="text-sm text-zinc-400">جدولة السيناريو الميداني وتنبيه المشاركين عبر Discord</p>
          </div>
        </div>

        <div className="space-y-4 p-6">
          <Field label="اسم السيناريو">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: سيناريو حماية المنشآت الحيوية"
              dir="rtl"
            />
          </Field>

          <Field label="صورة السيناريو (رابط أو رفع)">
            <div className="flex gap-2">
              <Input
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://... أو ارفع صورة"
                dir="ltr"
                className="text-left"
              />
              <Button type="button" variant="outline" onClick={() => fileRef.current?.click()} className="shrink-0">
                <ImageIcon size={16} className="ml-1" />
                رفع
              </Button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => onFile(e.target.files?.[0])}
              />
            </div>
            {preview && (
              <div className="mt-2 overflow-hidden rounded-lg border border-gold-300/30">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={preview} alt="معاينة" className="max-h-52 w-full object-cover" />
              </div>
            )}
          </Field>

          <Field label="آيدي الروم الصوتية (Voice Channel ID)">
            <Input
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              placeholder="ضع معرف القناة الصوتية هنا"
              dir="ltr"
              className="text-left"
            />
          </Field>

          <Field label="النقاط الممنوحة لكل مشارك">
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={0}
                value={points}
                onChange={(e) => setPoints(e.target.value)}
                className="max-w-40 text-left"
                dir="ltr"
              />
              <span className="text-sm text-zinc-400">نقطة</span>
            </div>
          </Field>

          <Button
            onClick={submit}
            disabled={loading}
            className="mt-2 w-full py-3 text-base font-bold"
          >
            {loading ? <Loader2 size={18} className="ml-2 animate-spin" /> : <Send size={18} className="ml-2" />}
            إرسال وتنبيه الميدان
          </Button>

          {result && (
            <div
              className={
                "flex items-start gap-3 rounded-lg border p-4 text-sm " +
                (result.ok
                  ? "border-gold-300/40 bg-gold-400/10 text-gold-100"
                  : "border-red-400/30 bg-red-500/10 text-red-200")
              }
            >
              {result.ok ? (
                <CheckCircle2 size={20} className="mt-0.5 shrink-0" />
              ) : (
                <AlertTriangle size={20} className="mt-0.5 shrink-0" />
              )}
              <div className="space-y-1">
                {result.ok ? (
                  <>
                    <div className="font-bold">تم إرسال تنبيه الميدان بنجاح</div>
                    <div className="flex flex-wrap gap-3 text-xs text-zinc-300">
                      <span className="inline-flex items-center gap-1"><Users size={13} /> المشاركون المكتشفون: {result.count}</span>
                      <span className="inline-flex items-center gap-1"><Trophy size={13} /> ضباط حصلوا على النقاط: {result.awarded}</span>
                      {!result.bot && <span className="text-amber-300">⚠️ البوت غير متصل ({result.botError})</span>}
                    </div>
                  </>
                ) : (
                  <div className="font-bold">فشل التنبيه: {result.botError}</div>
                )}
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
