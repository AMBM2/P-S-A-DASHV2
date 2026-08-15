"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCw, Shield, Save, Loader2, CheckCircle2 } from "lucide-react";
import { Button, Card, EmptyState } from "@/components/ui";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/format";

type RoleRow = {
  id: string;
  roleId: string;
  name: string;
  nameAr: string;
  type: string;
  level: number;
  color: string | null;
};

export function RolesManager() {
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [msg, setMsg] = useState<null | { ok: boolean; text: string }>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("roles").select("*").order("level", { ascending: false });
    setRoles((data as RoleRow[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const sync = async () => {
    setSyncing(true);
    setMsg(null);
    try {
      const r = await fetch("/api/sync", { method: "POST" });
      const d = await r.json();
      setMsg({
        ok: d.ok,
        text: d.ok
          ? `تمت المزامنة: ${d.rolesSynced ?? 0} رول، ${d.created ?? 0} فرد جديد، ${d.updated ?? 0} محدّث`
          : `فشلت المزامنة: ${d.error || "البوت غير متصل"}`,
      });
      await load();
    } catch {
      setMsg({ ok: false, text: "تعذر الوصول للبوت" });
    } finally {
      setSyncing(false);
    }
  };

  const save = async (row: RoleRow) => {
    setSavingId(row.id);
    const { error } = await supabase.from("roles").update(row).eq("id", row.id);
    setSavingId(null);
    setMsg({ ok: !error, text: error ? "تعذر الحفظ" : "تم الحفظ" });
  };

  const setField = (id: string, field: keyof RoleRow, value: string | number) => {
    setRoles((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 font-display text-lg font-bold gold-text">
            <Shield size={18} /> الرتب العسكرية (من ديسكورد)
          </h3>
          <p className="text-xs text-zinc-500">الرولات المسحوبة من سيرفر ديسكورد مع معرفاتها — عدّل وسمّها بالعربية</p>
        </div>
        <Button onClick={sync} disabled={syncing}>
          {syncing ? <Loader2 size={16} className="ml-2 animate-spin" /> : <RefreshCw size={16} className="ml-2" />}
          مزامنة من ديسكورد
        </Button>
      </div>

      {msg && (
        <div
          className={cn(
            "flex items-center gap-2 rounded-lg border p-3 text-sm",
            msg.ok ? "border-gold-300/40 bg-gold-400/10 text-gold-100" : "border-red-400/30 bg-red-500/10 text-red-200"
          )}
        >
          {msg.ok ? <CheckCircle2 size={16} /> : null}
          {msg.text}
        </div>
      )}

      {loading ? (
        <div className="py-10 text-center text-zinc-500">جارٍ التحميل...</div>
      ) : roles.length === 0 ? (
        <EmptyState message="لا توجد رولات — اضغط «مزامنة من ديسكورد» بعد ربط البوت بالسيرفر" />
      ) : (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-gold-400/20 bg-obsidian-900/60 text-xs uppercase tracking-wider text-zinc-400">
                  <th className="px-4 py-3 text-right">الرول (Discord)</th>
                  <th className="px-4 py-3 text-right">الاسم العربي</th>
                  <th className="px-4 py-3 text-right">النوع</th>
                  <th className="px-4 py-3 text-right">المستوى</th>
                  <th className="px-4 py-3 text-right">ID</th>
                  <th className="px-4 py-3 text-right">حفظ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gold-400/15">
                {roles.map((r) => (
                  <tr key={r.id} className="transition-colors hover:bg-gold-400/5">
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full border" style={{ background: r.color || "#999" }} />
                        <span className="font-semibold text-white">{r.name}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        value={r.nameAr}
                        onChange={(e) => setField(r.id, "nameAr", e.target.value)}
                        className="w-40 rounded-md border border-gold-400/20 bg-obsidian-800/80 px-2 py-1 text-sm text-zinc-100 outline-none focus:border-gold-300/70"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={r.type}
                        onChange={(e) => setField(r.id, "type", e.target.value)}
                        className="rounded-md border border-gold-400/20 bg-obsidian-800/80 px-2 py-1 text-sm text-zinc-100 outline-none focus:border-gold-300/70"
                      >
                        <option value="rank">رتبة</option>
                        <option value="functional">وظيفي</option>
                        <option value="department">إدارة</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        value={r.level}
                        onChange={(e) => setField(r.id, "level", Number(e.target.value))}
                        className="w-16 rounded-md border border-gold-400/20 bg-obsidian-800/80 px-2 py-1 text-sm text-zinc-100 outline-none focus:border-gold-300/70"
                      />
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-zinc-500">{r.roleId}</td>
                    <td className="px-4 py-3">
                      <Button variant="outline" className="px-2.5 py-1.5" onClick={() => save(r)} disabled={savingId === r.id}>
                        {savingId === r.id ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
