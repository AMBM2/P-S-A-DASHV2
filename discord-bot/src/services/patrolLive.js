import { supabase } from "../supabase.js";
import { getGuild } from "./nickname.js";

// Feature 6: Live Patrol Room Tracking.
// Returns officers currently present in the configured voice rooms.
export async function getLivePatrol(client) {
  const guild = getGuild(client);
  if (!guild) return { ok: false, rooms: [] };

  const rooms = [];
  for (const roomId of guild.channels.cache.filter((c) => c.isVoiceBased()).keys()) {
    const vc = guild.channels.cache.get(roomId);
    const members = [...vc.members.values()];
    rooms.push({
      roomId,
      name: vc.name,
      count: members.length,
      members: members.map((m) => ({
        discordId: m.id,
        username: m.displayName || m.user.username,
        avatar: m.user.displayAvatarURL?.({ extension: "png" }) || null,
      })),
    });
  }

  return { ok: true, rooms, timestamp: new Date().toISOString() };
}

// Rich version: join live members with their portal officer records
export async function getLivePatrolDetailed(client) {
  const base = await getLivePatrol(client);
  if (!base.ok) return base;

  const discordIds = base.rooms.flatMap((r) => r.members.map((m) => m.discordId));
  const { data: officers } = discordIds.length
    ? await supabase.from("officers").select("*").in("discordId", discordIds)
    : { data: [] };

  const byId = new Map((officers || []).map((o) => [o.discordId, o]));

  return {
    ok: true,
    timestamp: base.timestamp,
    rooms: base.rooms.map((r) => ({
      ...r,
      members: r.members.map((m) => ({
        ...m,
        officer: byId.get(m.discordId) || null,
      })),
    })),
  };
}
