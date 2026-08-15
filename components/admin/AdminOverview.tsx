"use client";

import { useState } from "react";
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
} from "lucide-react";
import { useStore } from "@/lib/store";
import { Button, Card, Stat, Badge } from "@/components/ui";
import { formatDate } from "@/lib/format";
import { getMasterKey, setMasterKey, setAuthed, meetsPolicy } from "@/lib/security";
import { useRouter } from "next/navigation";

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

export function AdminOverview() {
  const { news, officers, codes, leaders, audit, settings, updateSettings, exportJSON, resetData } = useStore();
  const router = useRouter();
  const [confirmReset, setConfirmReset] = useState(false);
  const [newKey, setNewKey] = useState("");
  const [keyMsg, setKeyMsg] = useState("");

  const changeKey = () => {
    if (!meetsPolicy(newKey)) {
      setKeyMsg("المفتاح يجب أن يكون 24 حرفاً على الأقل ويتضمن أحرف كبيرة وصغيرة وأرقاماً ورموزاً خاصة");
      return;
    }
    setMasterKey(newKey);
    setNewKey("");
    setKeyMsg("تم تحديث مفتاح الوصول بنجاح");
  };

  const logout = () => {
    setAuthed(false);
    router.refresh();
  };

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
          {audit.length === 0 ? (
            <p className="text-sm text-zinc-500">لا يوجد نشاط مسجل بعد. ستظهر الإجراءات في لوحة التحكم هنا.</p>
          ) : (
            <div className="max-h-80 space-y-2 overflow-y-auto scrollbar-thin">
              {audit.map((a) => (
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
        <h3 className="mb-3 flex items-center gap-2 font-display text-lg font-bold gold-text">
          <KeyRound size={18} /> الأمان: مفتاح الوصول السري
        </h3>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              type="password"
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              placeholder="مفتاح جديد (24 حرفاً على الأقل)"
              dir="ltr"
              className="flex-1 rounded-lg border border-gold-400/25 bg-obsidian-900/70 px-3 py-2 font-mono text-sm text-zinc-100 outline-none focus:border-gold-400/70"
            />
            <Button variant="outline" onClick={changeKey}>تحديث المفتاح</Button>
          </div>
          {keyMsg && <p className="text-xs text-rose-300">{keyMsg}</p>}
          <div className="flex items-center justify-between">
            <p className="text-xs text-zinc-500">
              {settings.language === "ar"
                ? "يتطلب المفتاح: 24+ حرفاً، أحرف كبيرة وصغيرة، أرقام، ورموز خاصة"
                : "Key requires: 24+ chars, upper/lowercase, numbers, and symbols"}
            </p>
            <Button variant="danger" onClick={logout}>تسجيل الخروج</Button>
          </div>
        </div>
      </Card>

      <Card className="mt-4">
        <h3 className="mb-3 flex items-center gap-2 font-display text-lg font-bold gold-text">
          <KeyRound size={18} /> إعدادات Discord للاستعلام التلقائي
        </h3>
        <p className="mb-3 text-xs text-zinc-500">
          ألصق رمز بوت Discord هنا ليتم التعرف تلقائياً على الاسم والصورة من معرّف المستخدم.
          يُحفظ محلياً ولا يُعرض في المتصفح.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            type="password"
            value={settings.discordBotToken || ""}
            onChange={(e) => updateSettings({ discordBotToken: e.target.value })}
            placeholder="Discord Bot Token"
            dir="ltr"
            className="flex-1 rounded-lg border border-gold-400/25 bg-obsidian-900/70 px-3 py-2 font-mono text-sm text-zinc-100 outline-none focus:border-gold-400/70"
          />
          <Button variant="outline" onClick={() => updateSettings({ discordBotToken: "" })}>
            مسح الرمز
          </Button>
        </div>
        <div className="mt-3 rounded-lg border border-gold-400/20 bg-gold-400/5 p-3 text-xs text-gold-200">
          <KeyRound size={14} className="mr-1 inline" />
          تحكم الوصول: وزير / مدير / ضابط / مجند
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
