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
  botSecret: process.env.PATROL_BOT_SECRET || "",
  masterAdminId: process.env.MASTER_ADMIN_ID || "",

  recruitmentRoleId: process.env.RECRUITMENT_ROLE_ID,
  newRecruitRoleId: process.env.NEW_RECRUIT_ROLE_ID,
  onLeaveRoleId: process.env.ON_LEAVE_ROLE_ID,
  strikeWarningRoleId: process.env.STRIKE_WARNING_ROLE_ID,
  suspensionRoleId: process.env.SUSPENSION_ROLE_ID,
  adminRoleId: process.env.ADMIN_ROLE_ID,
  commandRoleId: process.env.COMMAND_ROLE_ID,

  voiceRoomIds: (process.env.VOICE_ROOM_IDS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),

  // Only sync members who hold this role (empty = sync everyone)
  memberRoleId: process.env.MEMBER_ROLE_ID || null,

  portalUrl: process.env.PORTAL_URL || "http://localhost:3000",
};
