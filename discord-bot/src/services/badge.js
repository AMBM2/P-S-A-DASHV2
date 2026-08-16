import { supabase } from "../supabase.js";

// ---- Rank badge code pools (military code assignment) ----
// Every rank owns a sequential range of C- codes (higher rank = lower number).
// The bot assigns the LOWEST available (unused) code in the rank's range.
const BADGE_POOLS = [
  { rankId: "r-pm",       start: 0,   count: 1 },   // رئيس الوزراء        C-0
  { rankId: "r-vpm",      start: 1,   count: 1 },   // نائب رئيس الوزراء   C-1
  { rankId: "r-pmadv",    start: 2,   count: 2 },   // مستشار رئاسة الوزراء C-2..C-3
  { rankId: "r-minister", start: 4,   count: 1 },   // وزير الداخلية       C-4
  { rankId: "r-vminister",start: 5,   count: 1 },   // نائب وزير الداخلية  C-5
  { rankId: "r-dir",      start: 6,   count: 2 },   // مدير الأمن العام    C-6..C-7
  { rankId: "r-dirdep",   start: 8,   count: 2 },   // نائب المدير         C-8..C-9
  { rankId: "r-lgen",     start: 10,  count: 3 },   // فريق أول            C-10..C-12
  { rankId: "r-mgen",     start: 13,  count: 4 },   // لواء                C-13..C-16
  { rankId: "r-brig",     start: 17,  count: 5 },   // عميد                C-17..C-21
  { rankId: "r-col",      start: 22,  count: 8 },   // عقيد                C-22..C-29
  { rankId: "r-ltcol",    start: 30,  count: 10 },  // مقدم                C-30..C-39
  { rankId: "r-major",    start: 40,  count: 15 },  // رائد                C-40..C-54
  { rankId: "r-capt",     start: 55,  count: 20 },  // نقيب                C-55..C-74
  { rankId: "r-1lt",      start: 75,  count: 25 },  // ملازم أول           C-75..C-99
  { rankId: "r-lt",       start: 100, count: 30 },  // ملازم               C-100..C-129
  { rankId: "r-msg",      start: 130, count: 20 },  // رئيس رقباء           C-130..C-149
  { rankId: "r-sfc",      start: 150, count: 20 },  // رقيب أول            C-150..C-169
  { rankId: "r-sgt",      start: 170, count: 30 },  // رقيب                C-170..C-199
  { rankId: "r-lcpl",     start: 200, count: 30 },  // عريف                C-200..C-229
  { rankId: "r-cpl",      start: 230, count: 40 },  // وكيل رقيب           C-230..C-269
  { rankId: "r-pfc",      start: 270, count: 50 },  // جندي أول            C-270..C-319
  { rankId: "r-pvt",      start: 320, count: 50 },  // جندي                C-320..C-369
  { rankId: "r-tr4",      start: 370, count: 30 },  // عريف متدرب          C-370..C-399
  { rankId: "r-tr3",      start: 400, count: 30 },  // وكيل رقيب متدرب     C-400..C-429
  { rankId: "r-tr2",      start: 430, count: 40 },  // جندي أول متدرب      C-430..C-469
  { rankId: "r-tr1",      start: 470, count: 40 },  // جندي متدرب          C-470..C-509
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
