import { EmbedBuilder } from "discord.js";
import { config } from "../config.js";
import { getGuild } from "./nickname.js";

// ==========================================================================
// Enterprise Audit Logs — human-readable Arabic embed output.
// No raw JSON is ever rendered: every action is translated to a clear Arabic
// label and every metadata payload is parsed into readable bullets.
// ==========================================================================

// ---- Embed colors by severity / type (exact hex) ----
const COLORS = {
  operational: 0x3498db, // 🔵 Operational / Administrative / Exams
  positive: 0x2ecc71, // 🟢 Recruitment / Approvals / Promotions
  destructive: 0xe74c3c, // 🔴 Discharge / Bans / Role Removals
  warning: 0xf1c40f, // 🟡 Warnings / System Modifies
};

// ---- Explicit Arabic action labels ----
const ACTION_LABELS = {
  // Exams (operational · blue)
  "exams.create": "إنشاء اختبار عسكري جديد",
  "exams.update": "تعديل اختبار عسكري",
  "exams.delete": "حذف اختبار عسكري",
  "exams.completed": "إكمال اختبار مواطن",
  "exams.submit": "تقديم إجابة اختبار",
  // Recruitment / approvals / promotions (positive · green)
  "recruitment.create": "تسجيل طلب توظيف",
  "recruitment.approved": "قبول طلب توظيف",
  "recruitment.denied": "رفض طلب توظيف",
  "officer.create": "تسجيل فرد جديد",
  "officer.promoted": "ترقية ضابط",
  "officer.demoted": "تنزيل رتبة ضابط",
  "badge.assign": "توزيع كود عسكري (NH)",
  "badge.update": "تحديث كود عسكري",
  "cadet.enroll": "تثبيت طالب الكلية العسكرية",
  "college.enroll": "تسجيل في الكلية العسكرية",
  "recruit.citizen": "توظيف مواطن",
  // Discharge / bans / role removals (destructive · red)
  "officer.discharged": "فصل ضابط من الخدمة",
  "discharge.create": "إنشاء فصل من الخدمة",
  "blacklist.add": "إدراج في القائمة السوداء",
  "blacklist.remove": "إزالة من القائمة السوداء",
  "permissions.revoke": "سحب صلاحيات مستخدم",
  "store.remove": "حذف سجل / خبر",
  "leave.remove": "إلغاء إجازة",
  // Warnings / system modifies (warning · yellow)
  "settings.update": "تحديث إعدادات المنظومة",
  "permissions.upsert": "تحديث صلاحيات مستخدم",
  "store.upsert": "نشر / تعديل محتوى",
  "officer.update": "تحديث بيانات فرد",
  "officer.sync": "مزامنة الأفراد",
  "officer.status": "تغيير حالة فرد",
  "strike.create": "إصدار إنذار وظيفي",
  "leave.grant": "منح إجازة",
  "role_categories.upsert": "تحديث تصنيفات الرتب",
  "nickname.sync": "مزامنة الأسماء العسكرية",
  // Operational / system (blue)
  "login.request": "طلب رمز تسجيل دخول",
  "login.verify": "التحقق من رمز الدخول",
  "patrol.dispatch": "تنبيه ميداني",
  "announce.create": "إعلان عام",
  "media.upload": "رفع وسائط خبر",
  "media.delete": "حذف وسائط خبر",
  "news.create": "إنشاء خبر",
  "news.update": "تعديل خبر",
  "news.delete": "حذف خبر",
};

// Generic fallback translator for unknown actions: `a.b` → Arabic verb + noun.
const ACTION_SEGMENTS = {
  recruitment: "التوظيف",
  exams: "الاختبارات",
  settings: "الإعدادات",
  permissions: "الصلاحيات",
  officer: "الأفراد",
  store: "المحتوى",
  news: "الأخبار",
  strike: "الإنذارات",
  leave: "الإجازات",
  login: "الدخول",
  discharge: "الفصل",
  blacklist: "القائمة السوداء",
  role_categories: "التصنيفات",
  badge: "الأكواد العسكرية",
  college: "الكلية العسكرية",
  cadet: "الكلية العسكرية",
  patrol: "الميدان",
  recruit: "التجنيد",
  announce: "الإعلانات",
  media: "الوسائط",
  nick: "الأسماء",
  create: "إنشاء",
  update: "تحديث",
  delete: "حذف",
  upsert: "حفظ",
  approved: "قبول",
  denied: "رفض",
  completed: "إكمال",
  submit: "تقديم",
  revoke: "سحب",
  discharged: "فصل",
  promoted: "ترقية",
  demoted: "تنزيل",
  assign: "توزيع",
  enroll: "تسجيل",
  dispatch: "تنبيه",
  grant: "منح",
  remove: "إزالة",
  add: "إدراج",
  request: "طلب",
  verify: "تحقق",
  sync: "مزامنة",
  status: "تغيير حالة",
};

function actionLabel(action) {
  if (!action) return "حدث غير محدد";
  if (ACTION_LABELS[action]) return ACTION_LABELS[action];
  const [domain, verb] = String(action).split(".");
  const noun = ACTION_SEGMENTS[domain] || domain;
  const v = verb ? ACTION_SEGMENTS[verb] || verb : "";
  return v ? `${v} · ${noun}` : noun;
}

// ---- Color classification ----
function classifyColor(action) {
  const a = String(action || "");
  if (
    a.startsWith("exams.") ||
    a.startsWith("login.") ||
    a.startsWith("patrol.") ||
    a.startsWith("news.") ||
    a.startsWith("announce.") ||
    a.startsWith("media.") ||
    a.startsWith("college.") ||
    a.startsWith("store.") ||
    a.startsWith("officer.sync")
  ) {
    return COLORS.operational;
  }
  if (
    a.startsWith("recruitment.") ||
    a.startsWith("officer.create") ||
    a.includes("promoted") ||
    a.startsWith("badge.assign") ||
    a.startsWith("cadet.") ||
    a.startsWith("recruit.")
  ) {
    return COLORS.positive;
  }
  if (
    a.includes("discharg") ||
    a.includes("demoted") ||
    a.startsWith("blacklist.") ||
    a.startsWith("store.remove") ||
    a.startsWith("permissions.revoke") ||
    a.includes("leave.remove")
  ) {
    return COLORS.destructive;
  }
  return COLORS.warning; // settings / permissions / strikes / system modifies
}

// ---- Helpers ----
const DISCORD_ID = /^\d{16,20}$/;

function formatMention(id, name) {
  if (!id) return name ? `**${name}**` : "—";
  if (DISCORD_ID.test(String(id))) return `<@${id}>`;
  return name ? `**${name}**` : String(id);
}

// Arabic label for a metadata key.
const META_LABELS = {
  keys: "المفاتيح المعدّلة",
  table: "الجدول",
  id: "المعرّف",
  examId: "معرّف الاختبار",
  examTitle: "عنوان الاختبار",
  durationMinutes: "المدة (دقائق)",
  questions: "عدد الأسئلة",
  status: "الحالة",
  type: "النوع",
  reason: "السبب",
  blacklist: "القائمة السوداء",
  applicationId: "رقم الطلب",
  recruiterId: "المُوظِف",
  applicantId: "المتقدّم",
  permissions: "الصلاحيات",
  note: "ملاحظة",
  score: "النتيجة",
  total: "الحد الكلي",
  percentage: "النسبة المئوية",
  passed: "النجاح",
  detail: "التفاصيل",
  departmentId: "القسم",
  roleId: "الرول",
  rankId: "الرتبة",
  badge: "الكود العسكري",
  from: "من",
  to: "إلى",
  old: "قبل",
  new: "بعد",
  name: "الاسم",
  title: "العنوان",
};

function formatValue(key, value) {
  if (value === null || value === undefined) return "—";
  if (Array.isArray(value)) {
    return value
      .map((v) => (typeof v === "object" && v !== null ? formatValue(key, v) : String(v)))
      .join("، ");
  }
  if (typeof value === "boolean") return value ? "نعم" : "لا";
  if (typeof value === "object") {
    const pairs = Object.entries(value).map(
      ([k, v]) => `${META_LABELS[k] || k}: ${formatValue(k, v)}`
    );
    return pairs.length ? pairs.join(" · ") : "—";
  }
  if (typeof value === "string" && DISCORD_ID.test(value)) return `<@${value}>`;
  return String(value);
}

// Parse metadata into readable Arabic bullets (never raw JSON).
function formatMeta(meta) {
  if (!meta || typeof meta !== "object") return ["لا توجد تفاصيل إضافية."];
  const entries = Object.entries(meta);
  if (entries.length === 0) return ["لا توجد تفاصيل إضافية."];
  return entries.map(
    ([key, value]) => `• **${META_LABELS[key] || key}:** ${formatValue(key, value)}`
  );
}

// ---- Footer: بوابة الأمن العام • اليوم في HH:MM AM/PM ----
function footerText() {
  const now = new Date();
  const day = now.toLocaleDateString("ar-EG", { weekday: "long" });
  const time = now.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  return `بوابة الأمن العام • ${day} في ${time}`;
}

const MAX_META = 900;

// Send a single audit log entry as an embed to the dedicated audit-log channel.
// Falls back to the patrol channel, then the first text channel in the guild —
// including when the preferred channel refuses the send (Missing Access).
export async function sendAuditLog(client, entry) {
  const guild = getGuild(client);
  if (!guild) return { ok: false, reason: "no-guild" };

  const candidates = [];
  const add = (c) => {
    if (c && c.isTextBased && c.isTextBased() && !candidates.some((x) => x.id === c.id)) candidates.push(c);
  };
  if (config.auditChannelId) add(guild.channels.cache.get(config.auditChannelId));
  if (config.patrolChannelId) add(guild.channels.cache.get(config.patrolChannelId));
  add(guild.channels.cache.find((c) => c.type === 0));
  if (candidates.length === 0) return { ok: false, reason: "no-channel" };

  const label = actionLabel(entry?.action);
  const executor = formatMention(entry?.executor, entry?.executorName);
  const target = formatMention(entry?.target, entry?.targetName);
  const unix = Math.floor(Date.now() / 1000);

  const meta = entry?.metadata;
  let details = "—";
  if (meta && typeof meta === "object") {
    details = formatMeta(meta).join("\n");
    if (details.length > MAX_META) details = `${details.slice(0, MAX_META)}…`;
  }

  const embed = new EmbedBuilder()
    .setColor(classifyColor(entry?.action))
    .setTitle(`🛡️ لوق العمليات — ${label}`)
    .setDescription(`**${label}**\n⏱️ <t:${unix}:R> • <t:${unix}:T>`)
    .addFields(
      { name: "المنفّذ", value: executor, inline: true },
      { name: "المستهدف", value: target, inline: true },
      { name: "العملية", value: label, inline: true },
      { name: "التفاصيل والتغييرات", value: details }
    )
    .setFooter({ text: footerText() })
    .setTimestamp();

  let lastErr = "send-failed";
  for (const channel of candidates) {
    try {
      await channel.send({ embeds: [embed] });
      const usedAuditChannel = channel.id === config.auditChannelId;
      return { ok: true, channelId: channel.id, fallback: !usedAuditChannel };
    } catch (e) {
      lastErr = e.message;
      console.warn(`[audit] embed failed on channel ${channel.id} -> ${e.message}`);
    }
    try {
      const line =
        `🛡️ **لوق العمليات — ${label}**\n` +
        `المنفّذ: ${executor}\n` +
        `المستهدف: ${target}\n` +
        `العملية: ${label}\n` +
        `_ _\n${details}`;
      await channel.send({ content: line });
      const usedAuditChannel = channel.id === config.auditChannelId;
      return { ok: true, channelId: channel.id, fallback: !usedAuditChannel, plain: true };
    } catch (e) {
      lastErr = e.message;
      console.warn(`[audit] text failed on channel ${channel.id} -> ${e.message}`);
    }
  }
  return { ok: false, reason: lastErr };
}