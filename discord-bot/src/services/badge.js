import { supabase } from "../supabase.js";

// ---- Rank badge code pools (military code assignment) ----
// Each rank owns a sequential range of codes starting from C-0.
// The bot assigns the LOWEST available (unused) code in the rank's range.
const BADGE_POOLS = [
  { rankId: "r-brig", start: 0, count: 5 },   // عميد:  C-0 .. C-4
  { rankId: "r-col", start: 5, count: 5 },    // عقيد:  C-5 .. C-9
  { rankId: "r-ltcol", start: 10, count: 7 }, // مقدم:  C-10 .. C-16
  { rankId: "r-major", start: 17, count: 8 }, // رائد:  C-17 .. C-24
  { rankId: "r-capt", start: 25, count: 10 }, // نقيب:  C-25 .. C-34
  { rankId: "r-1lt", start: 35, count: 20 },  // ملازم أول: C-35 .. C-54
  { rankId: "r-lt", start: 55, count: 30 },   // ملازم: C-55 .. C-84
];

const POOL_PREFIX = "C";

// Generic prefixes for ranks outside the pool (command/troop/training)
const BADGE_PREFIX_BY_DIVISION = {
  command: "A",
  officer: "C",
  troop: "D",
  training: "R",
};

async function allBadges() {
  const { data } = await supabase.from("officers").select("badge");
  return (data || []).map((o) => String(o.badge || ""));
}

// Next available badge code for a rank (lowest unused in its pool).
export async function nextBadge(rank) {
  const pool = BADGE_POOLS.find((p) => p.rankId === rank?.id);
  if (pool) {
    const end = pool.start + pool.count - 1;
    const badges = await allBadges();
    const taken = new Set();
    for (const b of badges) {
      const m = b.match(/^C-(\d+)$/);
      if (m) {
        const n = parseInt(m[1], 10);
        if (n >= pool.start && n <= end) taken.add(n);
      }
    }
    for (let n = pool.start; n <= end; n++) {
      if (!taken.has(n)) return `${POOL_PREFIX}-${n}`;
    }
    return null; // pool exhausted
  }

  // Generic: next free in the division prefix
  const prefix = BADGE_PREFIX_BY_DIVISION[rank?.division] || "A";
  const badges = await allBadges();
  const re = new RegExp(`^${prefix}-(\\d+)$`);
  let max = 0;
  for (const b of badges) {
    const m = b.match(re);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  return `${prefix}-${String(max + 1).padStart(3, "0")}`;
}

export function badgePrefix(badge) {
  const m = String(badge || "").match(/^([A-Za-z]+)-\d+$/);
  return m ? m[1].toUpperCase() : "";
}

// True if the officer's current badge belongs to the given rank's pool.
export function matchesPool(badge, rank) {
  const pool = BADGE_POOLS.find((p) => p.rankId === rank?.id);
  if (pool) {
    const m = String(badge || "").match(/^C-(\d+)$/);
    if (!m) return false;
    const n = parseInt(m[1], 10);
    return n >= pool.start && n <= pool.start + pool.count - 1;
  }
  const prefix = BADGE_PREFIX_BY_DIVISION[rank?.division] || "A";
  return badgePrefix(badge) === prefix;
}
