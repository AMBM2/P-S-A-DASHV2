"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ClipboardList,
  Send,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  UserPlus,
  Check,
} from "lucide-react";
import { Button, Card, Field, Input } from "@/components/ui";
import { BorderBeam } from "@/components/effects";
import { cn } from "@/lib/format";

type DiscordRole = {
  id: string;
  name: string;
  rankId: string | null;
  rankAr: string | null;
  position: number;
};

const recruitSchema = z.object({
  nameAr: z.string().trim().min(3, "يرجى إدخال الاسم الكامل (3 أحرف على الأقل)"),
  discordId: z
    .string()
    .trim()
    .regex(/^\d{15,20}$/, "يرجى إدخال معرّف ديسكورد صحيح (15-20 رقماً)"),
});
type RecruitValues = z.infer<typeof recruitSchema>;

export default function RecruitPage() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RecruitValues>({
    resolver: zodResolver(recruitSchema),
    defaultValues: { nameAr: "", discordId: "" },
  });
  const [roles, setRoles] = useState<DiscordRole[]>([]);
  const [rolesError, setRolesError] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [primaryRankId, setPrimaryRankId] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<null | { ok: boolean; error?: string }>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const r = await fetch("/api/discord/roles", { cache: "no-store" });
        const d = await r.json();
        if (!active) return;
        if (d.ok && Array.isArray(d.roles)) {
          const all = (d.roles as DiscordRole[])
            .filter((x) => x.name !== "@everyone")
            .sort((a, b) => b.position - a.position);
          setRoles(all);
        } else {
          setRolesError(d.error || "تعذر جلب الرتب من ديسكورد");
        }
      } catch {
        if (active) setRolesError("تعذر الوصول للبوت — الرتب من ديسكورد");
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
        if (!primaryRankId) {
          const role = roles.find((r) => r.id === id);
          if (role?.rankId) setPrimaryRankId(role.rankId);
        }
      }
      return next;
    });
  };

  const submit = async (values: RecruitValues) => {
    setResult(null);
    if (selected.size === 0) {
      setResult({ ok: false, error: "يرجى اختيار رتبة واحدة على الأقل من قائمة ديسكورد" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/recruit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nameAr: values.nameAr.trim(),
          name: values.nameAr.trim(),
          discordId: values.discordId.trim(),
          ranks: [...selected],
          primaryRankId,
        }),
      });
      const data = await res.json();
      setResult({ ok: data.ok, error: data.error });
      if (data.ok) {
        reset({ nameAr: "", discordId: "" });
        setSelected(new Set());
        setPrimaryRankId("");
      }
    } catch {
      setResult({ ok: false, error: "تعذر الاتصال بالخادم" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <Card className="relative overflow-hidden">
        <BorderBeam size={240} duration={9} />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-gold-400 to-transparent" />
        <div className="flex items-center gap-3 border-b border-gold-400/15 p-6">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-gold-300/40 bg-gold-400/10 text-gold-200">
            <UserPlus size={20} />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-white">التجنيد — الكلية العسكرية</h1>
            <p className="text-sm text-zinc-400">قدّم طلبك للانضمام إلى الأمن العام. يُراجع من قبل مسؤولي التوظيف.</p>
          </div>
        </div>

        <div className="space-y-4 p-6">
          <Field label="الاسم الكامل">
            <Input {...register("nameAr")} placeholder="الاسم الثلاثي" dir="rtl" />
            {errors.nameAr && (
              <span className="text-xs text-rose-300">{errors.nameAr.message}</span>
            )}
          </Field>

          <Field label="Discord ID">
            <Input
              {...register("discordId")}
              placeholder="مثال: 123456789012345678 (من الديسكورد: كليك يمين على اسمك → نسخ المعرّف)"
              dir="ltr"
              className="text-left"
            />
            {errors.discordId && (
              <span className="text-xs text-rose-300">{errors.discordId.message}</span>
            )}
          </Field>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm font-semibold text-zinc-300">
                <ClipboardList size={15} className="text-gold-300" />
                الرتب المطلوبة (جميع رولات ديسكورد)
              </span>
              <span className="text-xs text-zinc-400">
                المحددة: <span className="font-bold text-gold-200">{selected.size}</span>
              </span>
            </div>

            {rolesError && (
              <p className="mb-3 rounded-lg border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-200">
                {rolesError}
              </p>
            )}

            {roles.length === 0 && !rolesError ? (
              <p className="rounded-lg border border-gold-400/15 bg-obsidian-900/50 p-4 text-sm text-zinc-400">
                جارٍ جلب الرتب من ديسكورد...
              </p>
            ) : (
              <div className="grid max-h-80 grid-cols-1 gap-2 overflow-y-auto pr-1 scrollbar-thin sm:grid-cols-2">
                {roles.map((r) => {
                  const active = selected.has(r.id);
                  return (
                    <button
                      key={r.id}
                      onClick={() => toggle(r.id)}
                      className={cn(
                        "flex items-center gap-3 rounded-xl border p-2.5 text-right transition-all",
                        active
                          ? "border-gold-300/70 bg-gold-400/15"
                          : "border-gold-400/15 bg-obsidian-900/50 hover:border-gold-400/40"
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-all",
                          active
                            ? "border-gold-300 bg-gold-300 text-obsidian-900"
                            : "border-zinc-600 text-transparent"
                        )}
                      >
                        <Check size={12} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-white">
                          {r.rankAr || r.name}
                        </span>
                        {r.rankAr && r.rankAr !== r.name && (
                          <span className="block truncate text-xs text-zinc-400">{r.name}</span>
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <Button onClick={handleSubmit(submit)} disabled={loading} className="mt-2 w-full py-3 text-base font-bold">
            {loading ? <Loader2 size={18} className="ml-2 animate-spin" /> : <Send size={18} className="ml-2" />}
            تقديم الطلب
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
              {result.ok ? <CheckCircle2 size={20} className="mt-0.5 shrink-0" /> : <AlertTriangle size={20} className="mt-0.5 shrink-0" />}
              <div className="space-y-1">
                {result.ok ? (
                  <>
                    <div className="font-bold">تم استلام طلبك بنجاح</div>
                    <div className="text-xs text-zinc-300">سيتم مراجعته من قبل مسؤولي التوظيف وتتلقى إشعاراً عبر ديسكورد.</div>
                  </>
                ) : (
                  <div className="font-bold">فشل التقديم: {result.error}</div>
                )}
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}