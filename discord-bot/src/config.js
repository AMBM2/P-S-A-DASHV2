import "dotenv/config";

const required = ["DISCORD_BOT_TOKEN", "SUPABASE_URL"];

for (const key of required) {
  if (!process.env[key]) {
    console.error(`[config] MISSING required env var: ${key}`);
    process.exit(1);
  }
}

// Prefer the service-role key (bypasses RLS). Fall back to the anon key so the
// bot can run immediately (anon has full RLS access on the portal tables).
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!serviceKey && !anonKey) {
  console.error("[config] MISSING SUPABASE_SERVICE_ROLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY)");
  process.exit(1);
}
if (!serviceKey) {
  console.warn("[config] ⚠ No SUPABASE_SERVICE_ROLE_KEY — falling back to anon key. Add the service key for production.");
}

export const config = {
  token: process.env.DISCORD_BOT_TOKEN,
  clientId: process.env.DISCORD_CLIENT_ID,
  guildId: process.env.DISCORD_GUILD_ID,
  supabaseUrl: process.env.SUPABASE_URL,
  serviceKey: serviceKey || anonKey,
  isServiceRole: !!serviceKey,
  patrolChannelId: process.env.PATROL_CHANNEL_ID,
  loginChannelId: process.env.LOGIN_CHANNEL_ID,
  collegeChannelId: process.env.COLLEGE_CHANNEL_ID,
  // Dedicated channel where the bot posts every audit-log entry (لوق العمليات).
  auditChannelId: process.env.AUDIT_CHANNEL_ID || "1538885966025195601",
  // Dedicated channel for citizen recruitment announcements (توظيف مواطن).
  recruitChannelId: process.env.RECRUIT_CHANNEL_ID,
  // Channel where news images/videos are uploaded as Discord attachments.
  newsChannelId: process.env.NEWS_CHANNEL_ID,
  botSecret: process.env.PATROL_BOT_SECRET || "",
  masterAdminId: process.env.MASTER_ADMIN_ID || "",
  masterAdminIds: (process.env.MASTER_ADMIN_IDS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),

  recruitmentRoleId: process.env.RECRUITMENT_ROLE_ID,
  newRecruitRoleId: process.env.NEW_RECRUIT_ROLE_ID,
  onLeaveRoleId: process.env.ON_LEAVE_ROLE_ID,
  strikeWarningRoleId: process.env.STRIKE_WARNING_ROLE_ID,
  suspensionRoleId: process.env.SUSPENSION_ROLE_ID,
  adminRoleId: process.env.ADMIN_ROLE_ID,
  commandRoleId: process.env.COMMAND_ROLE_ID,
  // Role granted to fully approved officers (رتبة العضو الرسمي). Granted by
  // enrollCadet along with the badge nickname ([PSA-XXXX] Name).
  officialMemberRoleId: process.env.OFFICIAL_MEMBER_ROLE_ID,

  // Categorized admin permissions (Discord role IDs → capability grants).
  executiveRoleId: process.env.EXECUTIVE_ROLE_ID || process.env.COMMAND_ROLE_ID,
  fieldRoleId: process.env.FIELD_ROLE_ID,
  hrRoleId: process.env.HR_ROLE_ID || process.env.RECRUITMENT_ROLE_ID,
  personnelRoleId: process.env.PERSONNEL_ROLE_ID,

  voiceRoomIds: (process.env.VOICE_ROOM_IDS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),

  // Primary voice room scanned during patrol dispatch (defaults to first of voiceRoomIds).
  voiceRoomId: process.env.VOICE_ROOM_ID || "",

  // Fallback role categories for member sorting when role_categories is empty
  // (prefer the role_categories table; env is only a seed).
  officerRoleIds: (process.env.OFFICER_ROLE_IDS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
  enlistedRoleIds: (process.env.ENLISTED_ROLE_IDS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),

  // Role IDs mentioned by the field-patrol dispatch template (fixed template).
  patrolOfficerRoleIds: (process.env.PATROL_OFFICER_ROLE_IDS ||
    "1527321852266021005,1527321853247492158,1527321854023565433,1527321854857969774,1527321855667736586,1527321856581832855,1527321857445990550,1527321858263748788")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
  patrolEnlistedRoleIds: (process.env.PATROL_ENLISTED_ROLE_IDS || "1527321813325971577")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),

  // Only sync members who hold this role (empty = sync everyone)
  memberRoleId: process.env.MEMBER_ROLE_ID || null,

  // Field dispatch UI: optionally restrict to members holding this Public
  // Security role (empty = list every member with an officer/enlisted rank,
  // including the leadership / ministry / presidency roles).
  fieldMemberRoleId: process.env.FIELD_MEMBER_ROLE_ID || "",

  portalUrl: process.env.PORTAL_URL || "http://localhost:3000",
};
