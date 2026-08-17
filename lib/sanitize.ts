// Input sanitization + strict URL validation for API payloads.
// Prevents stored XSS, control-character injection, and oversized payloads.
// Parameterized queries (Supabase PostgREST) already prevent SQL injection;
// this layer hardens the string data before it is stored or rendered.

const CONTROL_RE = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g;

// Trim + strip control characters + cap length. Returns "" for undefined/null.
export function cleanString(value: unknown, maxLen = 500): string {
  if (value == null) return "";
  const s = String(value).replace(CONTROL_RE, "").trim();
  return s.length > maxLen ? s.slice(0, maxLen) : s;
}

// Deep-clean an object: every string field is trimmed/stripped/capped; arrays
// are bounded; keys are limited; nested depth is capped to avoid deep-bomb DoS.
export function cleanObject(
  value: unknown,
  opts: { maxLen?: number; maxKeys?: number; maxDepth?: number } = {}
): any {
  const maxLen = opts.maxLen ?? 500;
  const maxKeys = opts.maxKeys ?? 200;
  const maxDepth = opts.maxDepth ?? 5;

  const walk = (v: unknown, depth: number): any => {
    if (depth > maxDepth) return null;
    if (typeof v === "string") return cleanString(v, maxLen);
    if (typeof v === "number") return Number.isFinite(v) ? v : 0;
    if (typeof v === "boolean") return v;
    if (v === null || v === undefined) return null;
    if (Array.isArray(v)) return v.slice(0, 200).map((x) => walk(x, depth + 1));
    if (typeof v === "object") {
      const out: Record<string, unknown> = {};
      let i = 0;
      for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
        if (i++ >= maxKeys) break;
        out[k.slice(0, 64)] = walk(val, depth + 1);
      }
      return out;
    }
    return null;
  };

  return walk(value, 0);
}

// Strict http(s) URL check — blocks javascript:, data:, vbscript:, and relative
// URLs from reaching <img>/<iframe>/<video> src attributes (stored XSS vector).
export function isSafeHttpUrl(value: unknown): boolean {
  if (value == null) return false;
  const s = String(value).trim();
  if (s.length > 2048) return false;
  try {
    const u = new URL(s);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

// Base64 image data-URL check for the field dispatch image upload.
export function isSafeDataImage(value: unknown): boolean {
  if (value == null) return false;
  const s = String(value);
  if (s.length > 2_000_000) return false; // ~2MB cap
  return /^data:image\/(png|jpe?g|gif|webp);base64,[A-Za-z0-9+/=\s]+$/.test(s);
}