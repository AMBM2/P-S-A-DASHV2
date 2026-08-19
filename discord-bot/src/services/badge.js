import { supabase } from "../supabase.js";
import { config } from "../config.js";
import { getHighestRank } from "../ranks.js";

// ---- NH military badge ranges (strict dual-role system) ----
// A member qualifies for an NH- code ONLY when they hold BOTH the rank role
// AND the "الأمن العام" department role simultaneously. Members of other
// departments (الاستخبارات / الطوارئ …) holding the same rank never receive
// an NH- prefix code.
export const NH_RANGES = {
  "r-pvt": { labelAr: "جندي", start: 120, end: 150 },
  "r-pfc": { labelAr: "جندي أول", start: 90, end: 119 },
};

export function nhRangeForRank(rank) {
  return rank ? NH_RANGES[rank.id] || null : null;
}

// Highest active NH badge number already issued within a rank range.
async function highestNHInRange(range) {
  const { data } = await supabase.from("officers").select("badge");
  let max = -1;
  for (const row of data || []) {
    const m = String(row.badge || "").match(/^NH-(\d+)$/);
    if (!m) continue;
    const n = parseInt(m[1], 10);
    if (n >= range.start && n <= range.end && n > max) max = n;
  }
  return max;
}

// Automated badge sequence generator with strict role-checking rules:
//   1. Mandatory dual-role: rank role + "الأمن العام" department role.
//   2. Sequential ranges by rank: جندي NH-120..NH-150, جندي أول NH-90..NH-119.
//   3. Highest active badge in the range +1; else the lowest boundary.
export async function assignMilitaryBadge(guildMember) {
  const rank = getHighestRank(guildMember);
  const range = nhRangeForRank(rank);
  if (!range) return { ok: false, reason: "rank-not-eligible" };

  const departmentRoleId = config.fieldMemberRoleId;
  if (!departmentRoleId || !guildMember.roles.cache.has(departmentRoleId)) {
    return { ok: false, reason: "not-public-security" };
  }

  const max = await highestNHInRange(range);
  const next = max < 0 ? range.start : max + 1;
  if (next > range.end) return { ok: false, reason: "range-exhausted" };

  return { ok: true, badge: `NH-${next}`, rank: rank.id, range: `${range.start}–${range.end}` };
}

// ---- Rank badge code pools (military code assignment) ----
// Command/officer ranks own a sequential range of C- codes (higher rank =
// lower number). Senior NCOs (رئيس رقباء → رقيب) share a sequential N-1..N
// pool. Junior NCOs & enlisted (وكيل رقيب → جندي) — together with training
// ranks — share an NT-100+ pool. The bot assigns the LOWEST available
// (unused) code in the rank's pool, and codes are recycled automatically:
// when a member is promoted/discharged their old code returns to its pool.
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
];

const POOL_PREFIX = "C";

// Senior NCOs (رئيس رقباء → رقيب): shared sequential N-1..N pool.
const N_RANKS = new Set(["r-msg", "r-sfc", "r-sgt"]);
const N_START = 1;

// Junior NCOs & enlisted (وكيل رقيب → جندي): NT-100+ (shared with training).
const NT_RANKS = new Set(["r-lcpl", "r-cpl", "r-pfc", "r-pvt"]);
const NT_START = 100;

// Generic prefixes for ranks outside a pool (safety fallback only)
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

  // Senior NCOs (رئيس رقباء → رقيب): sequential shared N-1..N pool
  if (N_RANKS.has(rank?.id)) {
    const badges = await allBadges();
    const taken = new Set();
    for (const b of badges) {
      const m = b.match(/^N-(\d+)$/);
      if (m) taken.add(parseInt(m[1], 10));
    }
    let n = N_START;
    while (taken.has(n)) n++;
    return `N-${n}`;
  }

  // Junior NCOs & enlisted (وكيل رقيب → جندي) + training: NT-100+
  if (NT_RANKS.has(rank?.id) || rank?.division === "training") {
    const badges = await allBadges();
    const taken = new Set();
    for (const b of badges) {
      const m = b.match(/^NT-(\d+)$/);
      if (m) taken.add(parseInt(m[1], 10));
    }
    let n = NT_START;
    while (taken.has(n)) n++;
    return `NT-${n}`;
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
  // NH military badges (جندي / جندي أول + الأمن العام) match their rank range.
  const nhRange = nhRangeForRank(rank);
  if (nhRange) {
    const m = String(badge || "").match(/^NH-(\d+)$/);
    return !!m && parseInt(m[1], 10) >= nhRange.start && parseInt(m[1], 10) <= nhRange.end;
  }
  const pool = BADGE_POOLS.find((p) => p.rankId === rank?.id);
  if (pool) {
    const m = String(badge || "").match(/^C-(\d+)$/);
    if (!m) return false;
    const n = parseInt(m[1], 10);
    return n >= pool.start && n <= pool.start + pool.count - 1;
  }
  if (N_RANKS.has(rank?.id)) {
    return /^N-\d+$/.test(String(badge || ""));
  }
  if (NT_RANKS.has(rank?.id) || rank?.division === "training") {
    const m = String(badge || "").match(/^NT-(\d+)$/);
    return !!m && parseInt(m[1], 10) >= NT_START;
  }
  const prefix = BADGE_PREFIX_BY_DIVISION[rank?.division] || "A";
  return badgePrefix(badge) === prefix;
}

// Pool statistics for the "إدارة الأكواد العسكرية" admin module.
export async function badgePoolStats() {
  const badges = await allBadges();
  const parse = (re) => {
    const n = badges.map((b) => {
      const m = String(b).match(re);
      return m ? parseInt(m[1], 10) : -1;
    });
    return n.filter((x) => x >= 0);
  };

  const cCodes = parse(/^C-(\d+)$/);
  const pools = BADGE_POOLS.map((p) => {
    const end = p.start + p.count - 1;
    const used = cCodes.filter((n) => n >= p.start && n <= end).sort((a, b) => a - b);
    return {
      rankId: p.rankId,
      prefix: POOL_PREFIX,
      start: p.start,
      end,
      used: used.length,
      available: p.count - used.length,
      next: used.length >= p.count ? null : `${POOL_PREFIX}-${p.start + used.length}`,
    };
  });

  const nCodes = parse(/^N-(\d+)$/).sort((a, b) => a - b);
  const nEnd = nCodes.length ? nCodes[nCodes.length - 1] : N_START - 1;
  const ntCodes = parse(/^NT-(\d+)$/).sort((a, b) => a - b);
  const ntEnd = ntCodes.length ? ntCodes[ntCodes.length - 1] : NT_START - 1;

  const nhCodes = parse(/^NH-(\d+)$/).sort((a, b) => a - b);
  const NH = Object.entries(NH_RANGES).map(([rankId, range]) => {
    const used = nhCodes.filter((n) => n >= range.start && n <= range.end).sort((a, b) => a - b);
    const max = used.length ? used[used.length - 1] : range.start - 1;
    return {
      rankId,
      labelAr: range.labelAr,
      prefix: "NH",
      start: range.start,
      end: range.end,
      used: used.length,
      available: Math.max(0, range.end - range.start + 1 - used.length),
      next: max >= range.end ? null : `NH-${max + 1}`,
    };
  });

  return {
    pools,
    N: {
      prefix: "N",
      start: N_START,
      end: Math.max(N_START, nEnd),
      used: nCodes.length,
      next: `N-${nEnd + 1}`,
    },
    NT: {
      prefix: "NT",
      start: NT_START,
      end: Math.max(NT_START, ntEnd),
      used: ntCodes.length,
      next: `NT-${ntEnd + 1}`,
    },
    NH,
  };
}