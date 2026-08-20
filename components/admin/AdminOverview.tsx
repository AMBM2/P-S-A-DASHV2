"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from "recharts";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import {
  Newspaper,
  Users,
  Radio,
  Download,
  RefreshCcw,
  Lock,
  Unlock,
  Wrench,
  ShieldAlert,
  Activity,
  KeyRound,
  Music2,
  MonitorPlay,
  Tags,
  Plus,
  X,
  UploadCloud,
  BarChart3,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { Button, Card, Stat, Badge, Switch } from "@/components/ui";
import { formatDate, cn } from "@/lib/format";
import { uploadMedia, isYoutubeUrl } from "@/lib/upload";
import type { AuditEntry } from "@/lib/types";

const ENTITY_AR: Record<string, string> = {
  news: "الأخبار",
  officers: "الأفراد",
  codes: "الأكواد",
  leaders: "القادة",
};

const ACTION_AR: Record<string, string> = {
  Created: "إنشاء",
  Updated: "تحديث",
  Deleted: "حذف",
};

function MediaToggle({
  value,
  onChange,
}: {
  value: "url" | "upload";
  onChange: (v: "url" | "upload") => void;
}) {
  return (
    <div className="mb-3 flex gap-2">
      {(["url", "upload"] as const).map((m) => (
        <button
          key={m}
          type="button"
          onClick={() => onChange(m)}
          className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
            value === m
              ? "border-gold-400 bg-gold-400/15 text-gold-200"
              : "border-gold-400/25 text-zinc-400 hover:text-zinc-200"
          }`}
        >
          {m === "url" ? "رابط YouTube" : "رفع من الجهاز"}
        </button>
      ))}
    </div>
  );
}

function DropzoneField({
  accept,
  label,
  uploading,
  onFile,
}: {
  accept: Record<string, string[]>;
  label: string;
  uploading: boolean;
  onFile: (f: File) => void;
}) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept,
    multiple: false,
    onDrop: (files) => {
      const f = files[0];
      if (f) onFile(f);
    },
  });
  return (
    <div
      {...getRootProps()}
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors",
        isDragActive
          ? "border-gold-400 bg-gold-400/10"
          : "border-gold-400/30 bg-obsidian-900/40 hover:border-gold-400/60 hover:bg-gold-400/5"
      )}
    >
      <input {...getInputProps()} />
      <UploadCloud size={22} className="text-gold-300" />
      <span className="text-xs font-medium text-zinc-200">{uploading ? "جارٍ الرفع..." : label}</span>
      <span className="text-[11px] text-zinc-500">اسحب الملف وأفلته هنا أو انقر للاختيار</span>
    </div>
  );
}

export function AdminOverview() {
  const { news, officers, codes, leaders, audit, settings, session, updateSettings, exportJSON, resetData, logout } = useStore();
  const lang = settings.language;
  const [confirmReset, setConfirmReset] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [welcomeVideoMsg, setWelcomeVideoMsg] = useState("");
  const [anthemUploading, setAnthemUploading] = useState(false);
  const [anthemMsg, setAnthemMsg] = useState("");
  const [anthemMode, setAnthemMode] = useState<"url" | "upload">(
    isYoutubeUrl(settings.anthemUrl) ? "url" : "upload"
  );
  const [welcomeMode, setWelcomeMode] = useState<"url" | "upload">(
    isYoutubeUrl(settings.welcome?.videoUrl) ? "url" : "upload"
  );
  const [newCatAr, setNewCatAr] = useState("");

  const [logs, setLogs] = useState<AuditEntry[]>([]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const actor = session?.discordId || "";
        const r = await fetch(`/api/audit?actor=${encodeURIComponent(actor)}`, { cache: "no-store" });
        if (r.ok) {
          const d = await r.json();
          if (active && d.ok && Array.isArray(d.entries)) setLogs(d.entries);
        }
      } catch {
        // fallback to optimistic store entries
      }
    })();
    return () => {
      active = false;
    };
  }, [session?.discordId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Server log is authoritative; optimistic store entries fill in immediately.
  const displayedAudit = useMemo(() => {
    const server = new Map(logs.map((l) => [l.id, l]));
    audit.forEach((a) => {
      if (!server.has(a.id)) server.set(a.id, a);
    });
    return [...server.values()].slice(0, 200);
  }, [logs, audit]);

  const addCategory = () => {
    const labelAr = newCatAr.trim();
    if (!labelAr) return;
    const id = labelAr.replace(/\s+/g, "-").toLowerCase() || `cat-${Date.now()}`;
    const current = settings.newsCategories || [];
    if (current.some((c) => c.id === id || c.labelAr === labelAr)) return;
    updateSettings({ newsCategories: [...current, { id, labelAr, label: labelAr }] });
    setNewCatAr("");
  };

  const removeCategory = (id: string) => {
    const current = settings.newsCategories || [];
    if (current.length <= 1) return;
    updateSettings({ newsCategories: current.filter((c) => c.id !== id) });
  };

  const handleWelcomeVideo = async (file: File) => {
    if (!file) return;
    setUploading(true);
    setWelcomeVideoMsg("");
    const res = await uploadMedia(file);
    setUploading(false);
    if (res.error) {
      setWelcomeVideoMsg(`خطأ: ${res.error}`);
    } else {
      setWelcomeVideoMsg("تم رفع الفيديو بنجاح ✅");
      toast.success("تم تحديث فيديو النافذة الترحيبية");
      updateSettings({ welcome: { ...settings.welcome!, videoUrl: res.url } });
    }
  };

  const handleAnthemUpload = async (file: File) => {
    if (!file) return;
    setAnthemUploading(true);
    setAnthemMsg("");
    const res = await uploadMedia(file);
    setAnthemUploading(false);
    if (res.error) {
      setAnthemMsg(`خطأ: ${res.error}`);
    } else {
      setAnthemMsg("تم رفع النشيد بنجاح ✅");
      toast.success("تم تحديث النشيد الرسمي");
      updateSettings({ anthemUrl: res.url });
    }
  };

  const statusChart = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const o of officers) counts[o.status] = (counts[o.status] || 0) + 1;
    const LABELS: Record<string, string> = {
      "on-duty": "في الواجب",
      "off-duty": "خارج الواجب",
      suspended: "موقوف",
      leave: "إجازة",
      discharged: "مفصول",
    };
    const COLORS = ["#eab308", "#10b981", "#f43f5e", "#a78bfa", "#64748b"];
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([k, v], i) => ({
        name: LABELS[k] || k,
        count: v,
        fill: COLORS[i % COLORS.length],
      }));
  }, [officers]);

  return (
    <div>
      <div className="mb-6 flex flex-wrap gap-3">
        <Button
          variant={settings.lockdown ? "danger" : "primary"}
          onClick={() => updateSettings({ lockdown: !settings.lockdown })}
        >
          {settings.lockdown ? <Unlock size={16} /> : <Lock size={16} />}
          {settings.lockdown ? "وضع الإغلاق مفعل" : "تفعيل وضع الإغلاق"}
        </Button>
        <Button variant="outline" onClick={() => updateSettings({ maintenance: !settings.maintenance })}>
          <Wrench size={16} />
          {settings.maintenance ? "وضع الصيانة مفعل" : "وضع الصيانة"}
        </Button>
        <Button variant="outline" onClick={exportJSON}>
          <Download size={16} /> تصدير نسخة احتياطية
        </Button>
        <Button
          variant="danger"
          onClick={() => {
            if (confirmReset) resetData();
            else {
              setConfirmReset(true);
              setTimeout(() => setConfirmReset(false), 3000);
            }
          }}
        >
          <RefreshCcw size={16} /> {confirmReset ? "تأكيد الحذف؟" : "إعادة تعيين"}
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="الأخبار" value={news.length} icon={<Newspaper />} />
        <Stat label="الأفراد" value={officers.length} icon={<Users />} tone="green" />
        <Stat label="القادة" value={leaders.length} icon={<KeyRound />} tone="gold" />
        <Stat label="الأكواد" value={codes.length} icon={<Radio />} tone="amber" />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <h3 className="mb-4 flex items-center gap-2 font-display text-lg font-bold gold-text">
            <Activity size={18} /> سجل التدقيق
          </h3>
          {displayedAudit.length === 0 ? (
            <p className="text-sm text-zinc-500">لا يوجد نشاط مسجل بعد. ستظهر الإجراءات في لوحة التحكم هنا.</p>
          ) : (
            <div className="max-h-80 space-y-2 overflow-y-auto scrollbar-thin">
              {displayedAudit.map((a) => (
                <div key={a.id} className="flex items-center justify-between rounded-lg border border-gold-400/15 bg-obsidian-900/50 px-4 py-2 text-sm">
                  <span className="text-zinc-300">
                    <span className="font-semibold text-gold-200">{ACTION_AR[a.action] || a.action}</span> → {ENTITY_AR[a.entity] || a.entity}
                  </span>
                  <span className="text-xs text-zinc-500">
                    {a.actor} · {formatDate(a.timestamp, "en")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <h3 className="mb-4 flex items-center gap-2 font-display text-lg font-bold gold-text">
            <ShieldAlert size={18} /> حالة النظام
          </h3>
          <div className="space-y-3">
            <StatusRow label="المصادقة الثنائية" on={settings.twoFactor} />
            <StatusRow label="وضع الإغلاق" on={settings.lockdown} danger />
            <StatusRow label="وضع الصيانة" on={settings.maintenance} danger />
          </div>
        </Card>
      </div>

      <Card className="mt-4">
        <h3 className="mb-4 flex items-center gap-2 font-display text-lg font-bold gold-text">
          <BarChart3 size={18} /> توزيع حالة القوة
        </h3>
        {statusChart.length === 0 ? (
          <p className="text-sm text-zinc-500">لا توجد بيانات أفراد بعد.</p>
        ) : (
          <div className="h-56 w-full" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusChart} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <XAxis
                  dataKey="name"
                  stroke="#71717a"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
                />
                <YAxis
                  allowDecimals={false}
                  stroke="#71717a"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  cursor={{ fill: "rgba(234,179,8,0.06)" }}
                  contentStyle={{
                    background: "rgba(18,21,29,0.95)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: "0.7rem",
                    fontSize: "12px",
                  }}
                  labelStyle={{ color: "#e4e4e7" }}
                  formatter={(v) => [`${v} عضو`, "العدد"]}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={42}>
                  {statusChart.map((s, i) => (
                    <Cell key={i} fill={s.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      <Card className="mt-4">
        <h3 className="mb-3 flex items-center gap-2 font-display text-lg font-bold gold-text">
          <ShieldAlert size={18} /> رول قيادة الميدان
        </h3>
        <p className="mb-3 text-xs text-zinc-500">
          الميدان يعمل فقط لأعضاء رول الأمن العام — سجّل معرّف الرول هنا من لوحة التحكم، ويقرأه البوت مباشرة.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            type="text"
            dir="ltr"
            value={settings.fieldRoleId || ""}
            onChange={(e) => updateSettings({ fieldRoleId: e.target.value.replace(/\D/g, "").slice(0, 20) })}
            placeholder="1527321813325971577"
            className="flex-1 rounded-lg border border-gold-400/25 bg-obsidian-900/70 px-3 py-2 font-mono text-sm text-zinc-100 outline-none focus:border-gold-400/70"
          />
          <Button variant="outline" onClick={() => updateSettings({ fieldRoleId: "1527321813325971577" })}>
            استعادة الافتراضي
          </Button>
        </div>
        <p className="mt-2 text-[11px] text-zinc-500">
          الرول المسجل حاليًا: <span dir="ltr" className="font-mono text-gold-300">{settings.fieldRoleId || "—"}</span>
        </p>
      </Card>

      <Card className="mt-4">
        <h3 className="mb-3 flex items-center gap-2 font-display text-lg font-bold gold-text">
          <Tags size={18} /> أقسام الأخبار
        </h3>
        <p className="mb-3 text-xs text-zinc-500">
          أضف أو احذف أقسام الأخبار — تظهر للزوار كفلاتر في الرئيسية.
        </p>
        <div className="mb-3 flex flex-wrap gap-2">
          {(settings.newsCategories || []).map((c) => (
            <span
              key={c.id}
              className="flex items-center gap-1.5 rounded-full border border-gold-400/25 bg-gold-400/5 px-3 py-1 text-xs text-gold-200"
            >
              {lang === "ar" ? c.labelAr : c.label}
              <button
                onClick={() => removeCategory(c.id)}
                className="text-zinc-500 transition-colors hover:text-rose-300"
                aria-label="حذف القسم"
              >
                <X size={13} />
              </button>
            </span>
          ))}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            type="text"
            value={newCatAr}
            onChange={(e) => setNewCatAr(e.target.value)}
            placeholder="اسم القسم — مثال: زيارات القطاعات"
            className="flex-1 rounded-lg border border-gold-400/25 bg-obsidian-900/70 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-gold-400/70"
          />
          <Button onClick={addCategory}>
            <Plus size={15} /> إضافة
          </Button>
        </div>
      </Card>

      <Card className="mt-4">
        <h3 className="mb-3 flex items-center gap-2 font-display text-lg font-bold gold-text">
          <Music2 size={18} /> النشيد الرسمي
        </h3>
        <p className="mb-3 text-xs text-zinc-500">
          النشيد الذي يُشغَّل كخلفية صوتية في الموقع — اختر إما رفع ملف صوتي من الجهاز أو رابط YouTube.
        </p>
        <MediaToggle value={anthemMode} onChange={setAnthemMode} />
        {anthemMode === "url" ? (
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              type="text"
              value={isYoutubeUrl(settings.anthemUrl) ? settings.anthemUrl || "" : ""}
              onChange={(e) => updateSettings({ anthemUrl: e.target.value })}
              placeholder="https://www.youtube.com/watch?v=..."
              dir="ltr"
              className="flex-1 rounded-lg border border-gold-400/25 bg-obsidian-900/70 px-3 py-2 font-mono text-sm text-zinc-100 outline-none focus:border-gold-400/70"
            />
            <Button variant="outline" onClick={() => updateSettings({ anthemUrl: "https://www.youtube.com/watch?v=ecdPScS0MKo" })}>
              استعادة الافتراضي
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <DropzoneField
              accept={{ "audio/*": [], "video/*": [] }}
              label="رفع النشيد من الجهاز"
              uploading={anthemUploading}
              onFile={handleAnthemUpload}
            />
            {anthemUploading ? (
              <p className="text-xs text-gold-200">جارٍ رفع النشيد...</p>
            ) : anthemMsg ? (
              <p className={anthemMsg.startsWith("خطأ") ? "text-xs text-rose-300" : "text-xs text-emerald-300"}>
                {anthemMsg}
              </p>
            ) : null}
            {!isYoutubeUrl(settings.anthemUrl) && settings.anthemUrl && (
              <audio src={settings.anthemUrl} controls className="h-10 w-full" />
            )}
            <Button variant="outline" onClick={() => { setAnthemMode("url"); updateSettings({ anthemUrl: "https://www.youtube.com/watch?v=ecdPScS0MKo" }); }}>
              العودة إلى النشيد الافتراضي (YouTube)
            </Button>
          </div>
        )}
      </Card>

      <Card className="mt-4">
        <h3 className="mb-3 flex items-center gap-2 font-display text-lg font-bold gold-text">
          <MonitorPlay size={18} /> النافذة الترحيبية المنبثقة
        </h3>
        <p className="mb-3 text-xs text-zinc-500">
          نافذة تظهر للزائر عند دخول الموقع، تعرض فيديو ونصاً ترحيبياً.
        </p>

        <label className="mb-3 flex cursor-pointer items-center gap-2 text-sm text-zinc-200">
          <Switch
            checked={!!settings.welcome?.enabled}
            onCheckedChange={(checked) => updateSettings({ welcome: { ...settings.welcome!, enabled: checked } })}
            aria-label="تفعيل النافذة المنبثقة"
          />
          تفعيل النافذة المنبثقة
        </label>

        <div className="grid gap-3">
          <div>
            <label className="mb-1 block text-xs text-zinc-400">عنوان النافذة</label>
            <input
              type="text"
              value={settings.welcome?.title || ""}
              onChange={(e) => updateSettings({ welcome: { ...settings.welcome!, title: e.target.value } })}
              className="w-full rounded-lg border border-gold-400/25 bg-obsidian-900/70 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-gold-400/70"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-zinc-400">النص الترحيبي</label>
            <textarea
              value={settings.welcome?.text || ""}
              onChange={(e) => updateSettings({ welcome: { ...settings.welcome!, text: e.target.value } })}
              rows={3}
              className="w-full resize-none rounded-lg border border-gold-400/25 bg-obsidian-900/70 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-gold-400/70"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-zinc-400">فيديو النافذة</label>
            <MediaToggle value={welcomeMode} onChange={setWelcomeMode} />
            {welcomeMode === "url" ? (
              <div className="flex flex-col gap-2">
                <input
                  type="text"
                  value={isYoutubeUrl(settings.welcome?.videoUrl) ? settings.welcome?.videoUrl || "" : ""}
                  onChange={(e) => updateSettings({ welcome: { ...settings.welcome!, videoUrl: e.target.value } })}
                  placeholder="https://www.youtube.com/watch?v=..."
                  dir="ltr"
                  className="w-full rounded-lg border border-gold-400/25 bg-obsidian-900/70 px-3 py-2 font-mono text-sm text-zinc-100 outline-none focus:border-gold-400/70"
                />
                {isYoutubeUrl(settings.welcome?.videoUrl) && (
                  <Button variant="outline" onClick={() => updateSettings({ welcome: { ...settings.welcome!, videoUrl: "" } })}>
                    إزالة الفيديو
                  </Button>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <DropzoneField
                  accept={{ "video/*": [] }}
                  label="رفع فيديو الترحيب من الجهاز"
                  uploading={uploading}
                  onFile={handleWelcomeVideo}
                />
                {uploading ? (
                  <p className="text-xs text-gold-200">جارٍ رفع الفيديو...</p>
                ) : welcomeVideoMsg && (
                  <p className={welcomeVideoMsg.startsWith("خطأ") ? "text-xs text-rose-300" : "text-xs text-emerald-300"}>
                    {welcomeVideoMsg}
                  </p>
                )}
                {!isYoutubeUrl(settings.welcome?.videoUrl) && settings.welcome?.videoUrl && (
                  <div className="flex items-center gap-2">
                    <video src={settings.welcome.videoUrl} className="h-16 w-28 rounded-lg border border-gold-400/25 bg-black object-cover" controls />
                    <Button
                      variant="outline"
                      onClick={() => updateSettings({ welcome: { ...settings.welcome!, videoUrl: "" } })}
                    >
                      إزالة الفيديو
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}

function StatusRow({ label, on, danger = false }: { label: string; on: boolean; danger?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-zinc-300">{label}</span>
      <Badge tone={danger ? (on ? "rose" : "green") : on ? "green" : "slate"}>
        {on ? "مفعل" : "معطل"}
      </Badge>
    </div>
  );
}
