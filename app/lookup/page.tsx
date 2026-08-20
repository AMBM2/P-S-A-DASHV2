"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Search, UserRound, ShieldCheck, BadgeCheck, ExternalLink, Fingerprint, Loader2, AlertTriangle, Layers } from "lucide-react";
import { useStore } from "@/lib/store";
import { PageHeader } from "@/components/PageHeader";
import { Card, Badge, EmptyState } from "@/components/ui";
import { RANKS, DEPARTMENTS } from "@/lib/seed";
import { formatDate } from "@/lib/format";
import { AR } from "@/lib/ar";

const STATUS_TONE: Record<string, any> = {
  "on-duty": "green",
  "off-duty": "slate",
  suspended: "rose",
  leave: "amber",
  discharged: "slate",
};

function discordAvatarUrl(id: string, hash?: string | null, size = 256) {
  if (!id) return "";
  if (hash) return `https://cdn.discordapp.com/avatars/${id}/${hash}.png?size=${size}`;
  const idx = Number(id) % 5;
  return `https://cdn.discordapp.com/embed/avatars/${idx}.png`;
}

type LiveUser = {
  id: string;
  username: string;
  global_name: string;
  avatar: string | null;
};

type MemberRoles = {
  ok: boolean;
  found: boolean;
  nickname?: string | null;
  roles?: { id: string; name: string; position: number; color: string }[];
};

function normalize(name: string) {
  return String(name || "")
    .toLowerCase()
    .replace(/[\u0640]/g, "")
    .replace(/[\u0610-\u061a\u064b-\u065f\u0670]/g, "")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\u0600-\u06ff\u0660-\u0669]+/g, " ")
    .trim();
}

function matchRank(name: string) {
  const norm = normalize(name);
  if (!norm) return null;
  let exact: any = null;
  for (const r of RANKS) {
    const names = [r.id, r.title, r.titleAr].map(normalize).filter(Boolean);
    if (names.includes(norm) && (!exact || r.level > exact.level)) exact = r;
  }
  if (exact) return exact;
  let best: any = null;
  for (const r of RANKS) {
    const names = [r.id, r.title, r.titleAr].map(normalize).filter(Boolean);
    if (names.some((n) => n.length >= 4 && norm.includes(n)) && (!best || r.level > best.level)) best = r;
  }
  return best;
}

export default function LookupPage() {
  const { officers, settings } = useStore();
  const lang = settings.language;
  const [input, setInput] = useState("");
  const [query, setQuery] = useState("");
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [live, setLive] = useState<LiveUser | null>(null);
  const [member, setMember] = useState<MemberRoles | null>(null);
  const [error, setError] = useState("");

  const officer = query ? officers.find((o) => o.discordId === query) : null;

  const submit = async () => {
    const id = input.trim();
    setQuery(id);
    setSearched(true);
    setError("");
    setLive(null);
    setMember(null);

    if (!id) return;

    setLoading(true);
    try {
      const [u, m] = await Promise.all([
        fetch(`/api/discord/${id}`).then((r) => r.json()),
        fetch(`/api/discord/member/${id}`).then((r) => r.json()).catch(() => ({ ok: false })),
      ]);
      if (u && !u.error && (u.id || u.username)) {
        setLive(u);
      } else {
        setError(u?.error || "discord_error");
      }
      setMember(m);
    } catch {
      setError("network_error");
    } finally {
      setLoading(false);
    }
  };

  const displayName = live?.global_name || officer?.discordName || officer?.name || live?.username || "—";
  const avatarHash = live?.avatar || officer?.discordAvatar || null;
  const username = live?.username || officer?.discordName || null;

  return (
    <div>
      <PageHeader
        title={lang === "ar" ? "الاستعلام عن فرد عبر Discord" : "Officer Lookup by Discord"}
        subtitle={
          lang === "ar"
            ? "أدخل معرّف مستخدم ديسكورد للتعرف التلقائي على الحساب وعرض بطاقة البروتوكولات العسكرية"
            : "Enter a Discord user ID for automatic recognition and military protocol card"
        }
      />

      {/* Search Bar */}
      <Card className="mb-8 p-5 md:p-6">
        <label className="mb-3 flex items-center gap-2 text-sm font-semibold text-zinc-300">
          <Fingerprint size={16} className="text-gold-300" />
          {lang === "ar" ? "معرّف مستخدم ديسكورد (USER ID)" : "Discord User ID"}
        </label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="123456789012345678"
            dir="ltr"
            className="flex-1 rounded-xl border border-gold-400/25 bg-obsidian-900/70 px-4 py-3 text-left font-mono text-sm text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-gold-400/70"
          />
          <button
            onClick={submit}
            disabled={loading}
            className="gold-shimmer flex items-center justify-center gap-2 rounded-xl border border-gold-400/40 bg-gold-400/10 px-6 py-3 text-sm font-bold text-gold-200 transition-colors hover:border-gold-400/70 disabled:opacity-60"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
            {lang === "ar" ? "بحث" : "Search"}
          </button>
        </div>
        <p className="mt-3 text-xs text-zinc-500">
          {lang === "ar"
            ? "جرّب: 1530685609704820856 (حساب مسجّل) · أو أي USER ID موجود لدى Discord"
            : "Try: 1530685609704820856 (registered) · or any existing Discord USER ID"}
        </p>
      </Card>

      {searched && !loading && !live && !officer && (
        <EmptyState
          message={
            error === "not_found"
              ? (lang === "ar" ? "هذا المعرف غير موجود لدى Discord" : "This Discord ID does not exist")
              : error === "invalid_token"
              ? (lang === "ar" ? "رمز البوت غير صحيح" : "Bot token is invalid")
              : error
              ? (lang === "ar" ? "تعذّر الجلب من Discord" : "Could not fetch from Discord")
              : (lang === "ar" ? "لم يتم العثور على فرد بهذا المعرف" : "No officer found with this Discord ID")
          }
        />
      )}

      {(live || officer) && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid gap-6 lg:grid-cols-2"
        >
          {/* Discord Account Card */}
          <Card className="gold-shimmer overflow-hidden">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-gold-400 via-gold-500 to-gold-400" />
            <div className="relative flex flex-col items-center gap-4 p-6 text-center">
              <div className="relative">
                <div className="absolute -inset-1.5 rounded-full border border-gold-400/30" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={discordAvatarUrl(query, avatarHash)}
                  alt="Discord avatar"
                  className="relative h-24 w-24 rounded-full border-2 border-gold-400/40 object-cover"
                />
              </div>
              <div>
                <div className="flex items-center justify-center gap-2">
                  <UserRound size={16} className="text-gold-300" />
                  <h2 className="font-display text-xl font-bold text-white">{displayName}</h2>
                  <BadgeCheck size={16} className="text-gold-300" />
                </div>
                {username && <div className="mt-1 font-mono text-xs text-zinc-400">@{username}</div>}
                <div className="mt-0.5 font-mono text-xs text-zinc-500">#{query}</div>
              </div>
              <a
                href={`https://discord.com/users/${query}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-gold-400/40 bg-gold-400/10 px-4 py-2 text-sm font-bold text-gold-200 transition-colors hover:border-gold-400/70"
              >
                <ExternalLink size={15} />
                {lang === "ar" ? "فتح حساب ديسكورد" : "Open Discord profile"}
              </a>
            </div>
          </Card>

          {/* Military Protocol Card */}
          <Card className="relative">
            <div className="mb-4 flex items-center gap-2">
              <ShieldCheck size={18} className="text-gold-300" />
              <h2 className="font-display text-lg font-bold gold-text">
                {lang === "ar" ? "البطاقة العسكرية" : "Military Protocol"}
              </h2>
            </div>
            {officer ? (
              <div className="space-y-3 text-sm">
                <Row label={lang === "ar" ? "الشارة" : "Badge"}>{officer.badge}</Row>
                <Row label={lang === "ar" ? "الاسم" : "Name"}>
                  {lang === "ar" ? officer.nameAr : officer.name}
                </Row>
                <Row label={lang === "ar" ? "النداء" : "Call sign"}>
                  <span className="font-mono">{officer.callsign}</span>
                </Row>
                <Row label={lang === "ar" ? "الرتبة" : "Rank"}>
                  {RANKS.find((r) => r.id === officer.rankId)
                    ? (lang === "ar"
                        ? RANKS.find((r) => r.id === officer.rankId)!.titleAr
                        : RANKS.find((r) => r.id === officer.rankId)!.title)
                    : "—"}
                </Row>
                <Row label={lang === "ar" ? "القسم" : "Division"}>
                  {DEPARTMENTS.find((d) => d.id === officer.departmentId)
                    ? (lang === "ar"
                        ? DEPARTMENTS.find((d) => d.id === officer.departmentId)!.nameAr
                        : DEPARTMENTS.find((d) => d.id === officer.departmentId)!.name)
                    : "—"}
                </Row>
                <Row label={lang === "ar" ? "تاريخ الانضمام" : "Date joined"}>
                  {formatDate(officer.joinedAt + "T00:00:00", lang)}
                </Row>
                <Row label={lang === "ar" ? "الحالة" : "Status"}>
                  <Badge tone={STATUS_TONE[officer.status]}>{AR.officerStatus[officer.status] || officer.status}</Badge>
                </Row>
                <Row label={lang === "ar" ? "ساعات النشاط" : "Active hours"}>
                  {officer.activityHours} ساعة
                </Row>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 py-10 text-center">
                <AlertTriangle size={28} className="text-amber-300/70" />
                <p className="text-sm text-zinc-400">
                  {lang === "ar"
                    ? "هذا الحساب غير مسجّل ضمن قوات الأمن العام"
                    : "This account is not registered with Public Security"}
                </p>
              </div>
            )}

            {member?.ok && member.found && member.roles?.length ? (
              <div className="mt-5 border-t border-gold-400/15 pt-4">
                <div className="mb-3 flex items-center gap-2">
                  <Layers size={16} className="text-gold-300" />
                  <h3 className="text-sm font-bold text-zinc-200">
                    {lang === "ar" ? "الرتب التي يحملها هذا العضو" : "Ranks held by this member"}
                  </h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {member.roles
                    .map((r) => {
                      const rank = matchRank(r.name);
                      return { r, rank };
                    })
                    .filter((x) => x.rank)
                    .sort((a, b) => b.rank!.level - a.rank!.level)
                    .map(({ r, rank }) => (
                      <span
                        key={r.id}
                        className="inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold"
                        style={{
                          borderColor: r.color === "#000000" ? "rgba(var(--accent-rgb),.35)" : `${r.color}88`,
                          color: r.color === "#000000" ? "#e4e4e7" : r.color,
                          background: `${r.color}14`,
                        }}
                      >
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ background: r.color === "#000000" ? "rgb(var(--accent-rgb))" : r.color }}
                        />
                        {rank!.titleAr}
                      </span>
                    ))}
                  {member.roles.filter((r) => !matchRank(r.name)).map((r) => (
                    <span
                      key={r.id}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-gold-400/20 px-2.5 py-1 text-xs text-zinc-400"
                    >
                      <span className="h-2 w-2 rounded-full" style={{ background: r.color === "#000000" ? "#71717a" : r.color }} />
                      {r.name}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </Card>
        </motion.div>
      )}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-gold-400/10 pb-2.5 last:border-0 last:pb-0">
      <span className="text-zinc-400">{label}</span>
      <span className="font-semibold text-zinc-100">{children}</span>
    </div>
  );
}
