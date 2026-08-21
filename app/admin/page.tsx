"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ShieldCheck,
  LogOut,
  Plus,
  Pencil,
  Trash2,
  Newspaper,
  Users,
  Crown,
  Radio,
  BarChart3,
  Save,
} from "lucide-react";
import { Card, Button, Badge, Modal, Field, Input, Textarea, SectionTitle, EmptyState } from "@/components/ui";
import { useStore } from "@/lib/store";
import { AR } from "@/lib/ar";
import { number } from "@/lib/format";

type NewsDraft = {
  id: string;
  titleAr: string;
  title: string;
  bodyAr: string;
  body: string;
  category: string;
  priority: "low" | "normal" | "high" | "critical";
  author: string;
  image: string;
  video: string;
  pinned: boolean;
  status: "draft" | "published";
  publishedAt: string;
};

const emptyDraft = (): NewsDraft => ({
  id: "n_" + Math.random().toString(36).slice(2, 9),
  titleAr: "",
  title: "",
  bodyAr: "",
  body: "",
  category: "general",
  priority: "normal",
  author: "",
  image: "",
  video: "",
  pinned: false,
  status: "published",
  publishedAt: new Date().toISOString(),
});

export default function AdminPage() {
  const router = useRouter();
  const { session, login, logout, news, officers, leaders, codes, upsert, remove } =
    useStore();

  const [authId, setAuthId] = useState("");
  const [editor, setEditor] = useState<NewsDraft | null>(null);

  const me = session?.officer; // officer record currently stored as session

  async function handleLogin() {
    if (!authId.trim()) return toast.error("Ø£Ø¯Ø®Ù„ Ù…Ø¹Ø±Ù‘Ù Discord");
    const officer = officers.find((o) => o.discordId === authId.trim());
    if (!officer) return toast.error("Ù…Ø¹Ø±Ù‘Ù ØºÙŠØ± Ù…Ø³Ø¬Ù‘Ù„ ÙƒØ¶Ø§Ø¨Ø·");
    login(authId.trim(), officer);
  }

  if (!me) {
    return (
      <div className="mx-auto mt-16 max-w-md">
        <Card className="text-center">
          <div className="clip-hex mx-auto mb-4 flex h-16 w-16 items-center justify-center border border-accent-500/40 bg-accent-500/10">
            <ShieldCheck className="h-8 w-8 text-accent-400" />
          </div>
          <h1 className="font-display text-2xl font-bold text-slate-50">Ù„ÙˆØ­Ø© Ø§Ù„ØªØ­ÙƒÙ…</h1>
          <p className="mt-1 text-sm text-slate-400">Ø³Ø¬Ù‘Ù„ Ø§Ù„Ø¯Ø®ÙˆÙ„ Ø¨Ø§Ø³ØªØ®Ø¯Ø§Ù… Ù…Ø¹Ø±Ù‘Ù Discord Ø§Ù„Ø®Ø§Øµ Ø¨Ùƒ</p>
          <div className="mt-6 text-right">
            <Field label="Ù…Ø¹Ø±Ù‘Ù Discord">
              <Input value={authId} onChange={(e) => setAuthId(e.target.value)} placeholder="Ù…Ø«Ø§Ù„: 123456789012345678" />
            </Field>
          </div>
          <Button className="mt-4 w-full" onClick={handleLogin}>
            <ShieldCheck size={16} /> Ø¯Ø®ÙˆÙ„
          </Button>
        </Card>
      </div>
    );
  }

  const stats = [
    { icon: Newspaper, label: "Ø§Ù„Ø£Ø®Ø¨Ø§Ø±", value: news.length },
    { icon: Users, label: "Ø§Ù„Ø£ÙØ±Ø§Ø¯", value: officers.length },
    { icon: Crown, label: "Ø§Ù„Ù‚Ø§Ø¯Ø©", value: leaders.length },
    { icon: Radio, label: "Ø§Ù„Ø£ÙƒÙˆØ§Ø¯", value: codes.length },
  ];

  async function saveDraft() {
    if (!editor) return;
    if (!editor.titleAr.trim()) return toast.error("Ø§Ù„Ø¹Ù†ÙˆØ§Ù† Ø§Ù„Ø¹Ø±Ø¨ÙŠ Ù…Ø·Ù„ÙˆØ¨");
    await upsert("news", editor as any);
    toast.success("ØªÙ… Ø­ÙØ¸ Ø§Ù„Ø®Ø¨Ø±");
    setEditor(null);
  }

  async function deleteNews(n: any) {
    if (!confirm(`Ø­Ø°Ù Ø§Ù„Ø®Ø¨Ø±: ${n.titleAr}ØŸ`)) return;
    await remove("news", n.id);
    toast.success("ØªÙ… Ø§Ù„Ø­Ø°Ù");
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="clip-hex flex h-12 w-12 items-center justify-center border border-accent-500/40 bg-accent-500/10">
            <BarChart3 className="h-6 w-6 text-accent-400" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-slate-50">Ù„ÙˆØ­Ø© Ø§Ù„ØªØ­ÙƒÙ…</h1>
            <p className="text-xs text-slate-400">Ù…Ø±Ø­Ø¨Ø§Ù‹ {me?.nameAr} Â· {session?.discordId}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setEditor(emptyDraft())}>
            <Plus size={16} /> Ø®Ø¨Ø± Ø¬Ø¯ÙŠØ¯
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              logout();
              router.refresh();
            }}
          >
            <LogOut size={16} /> Ø®Ø±ÙˆØ¬
          </Button>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-display text-3xl font-bold text-slate-50">{number(s.value)}</div>
                <div className="text-xs text-slate-400">{s.label}</div>
              </div>
              <span className="clip-notch-sm flex h-9 w-9 items-center justify-center bg-accent-500/10 text-accent-300">
                <s.icon size={16} />
              </span>
            </div>
          </Card>
        ))}
      </div>

      <SectionTitle icon={Newspaper}>Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„Ø£Ø®Ø¨Ø§Ø±</SectionTitle>
      {news.length === 0 ? (
        <EmptyState message="Ù„Ø§ ØªÙˆØ¬Ø¯ Ø£Ø®Ø¨Ø§Ø±" />
      ) : (
        <div className="space-y-2">
          {[...news]
            .sort((a, b) => +new Date(b.publishedAt) - +new Date(a.publishedAt))
            .map((n) => (
              <div key={n.id} className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#0e1320] p-3">
                {n.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={n.image} alt="" className="h-12 w-16 rounded-lg object-cover" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold text-slate-50">{n.titleAr}</div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Badge tone="gold">{n.category}</Badge>
                    <Badge tone={n.priority === "critical" ? "rose" : n.priority === "high" ? "amber" : "slate"}>
                      {AR.priority[n.priority]}
                    </Badge>
                    <span>{n.author}</span>
                  </div>
                </div>
                <Button variant="outline" onClick={() => setEditor(n as any)}>
                  <Pencil size={14} /> ØªØ¹Ø¯ÙŠÙ„
                </Button>
                <Button variant="danger" onClick={() => deleteNews(n)}>
                  <Trash2 size={14} />
                </Button>
              </div>
            ))}
        </div>
      )}

      <Modal open={!!editor} onClose={() => setEditor(null)} title={editor?.titleAr ? "ØªØ¹Ø¯ÙŠÙ„ Ø®Ø¨Ø±" : "Ø®Ø¨Ø± Ø¬Ø¯ÙŠØ¯"} wide>
        {editor && (
          <div className="grid gap-4">
            <Field label="Ø§Ù„Ø¹Ù†ÙˆØ§Ù† Ø§Ù„Ø¹Ø±Ø¨ÙŠ">
              <Input value={editor.titleAr} onChange={(e) => setEditor({ ...editor, titleAr: e.target.value })} />
            </Field>
            <Field label="Ø§Ù„Ø¹Ù†ÙˆØ§Ù† Ø§Ù„Ø¥Ù†Ø¬Ù„ÙŠØ²ÙŠ">
              <Input value={editor.title} onChange={(e) => setEditor({ ...editor, title: e.target.value })} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Ø§Ù„Ù‚Ø³Ù…">
                <Input value={editor.category} onChange={(e) => setEditor({ ...editor, category: e.target.value })} />
              </Field>
              <Field label="Ø§Ù„Ø£ÙˆÙ„ÙˆÙŠØ©">
                <select
                  className="w-full rounded-lg border-2 border-white/15 bg-[#0e1320] px-3 py-3 text-sm text-slate-50 outline-none focus:border-accent-500"
                  value={editor.priority}
                  onChange={(e) => setEditor({ ...editor, priority: e.target.value as any })}
                >
                  <option value="low">Ù…Ù†Ø®ÙØ¶</option>
                  <option value="normal">Ø¹Ø§Ø¯ÙŠ</option>
                  <option value="high">Ø¹Ø§Ù„ÙŠ</option>
                  <option value="critical">Ø­Ø±Ø¬</option>
                </select>
              </Field>
            </div>
            <Field label="Ø§Ù„ÙƒØ§ØªØ¨">
              <Input value={editor.author} onChange={(e) => setEditor({ ...editor, author: e.target.value })} />
            </Field>
            <Field label="Ø§Ù„Ù…Ø­ØªÙˆÙ‰ Ø§Ù„Ø¹Ø±Ø¨ÙŠ">
              <Textarea value={editor.bodyAr} onChange={(e) => setEditor({ ...editor, bodyAr: e.target.value })} />
            </Field>
            <Field label="Ø§Ù„Ù…Ø­ØªÙˆÙ‰ Ø§Ù„Ø¥Ù†Ø¬Ù„ÙŠØ²ÙŠ">
              <Textarea value={editor.body} onChange={(e) => setEditor({ ...editor, body: e.target.value })} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Ø±Ø§Ø¨Ø· Ø§Ù„ØµÙˆØ±Ø©">
                <Input value={editor.image} onChange={(e) => setEditor({ ...editor, image: e.target.value })} />
              </Field>
              <Field label="Ø±Ø§Ø¨Ø· Ø§Ù„ÙÙŠØ¯ÙŠÙˆ">
                <Input value={editor.video} onChange={(e) => setEditor({ ...editor, video: e.target.value })} />
              </Field>
            </div>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 text-sm text-slate-200">
                <input type="checkbox" checked={editor.pinned} onChange={(e) => setEditor({ ...editor, pinned: e.target.checked })} />
                Ù…Ø«Ø¨Øª
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-200">
                <input type="checkbox" checked={editor.status === "published"} onChange={(e) => setEditor({ ...editor, status: e.target.checked ? "published" : "draft" })} />
                Ù…Ù†Ø´ÙˆØ±
              </label>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setEditor(null)}>Ø¥Ù„ØºØ§Ø¡</Button>
              <Button onClick={saveDraft}>
                <Save size={16} /> Ø­ÙØ¸
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}



