// In-memory sliding-window rate limiter for Next.js API routes.
// NOTE: on Vercel each serverless instance keeps its own map, so this is a
// per-instance throttle (still effective against burst abuse / brute force).
// Production-scale DDoS protection should add a distributed store, but the
// in-memory limiter meaningfully blocks scripted abuse and credential stuffing.

type Bucket = { hits: number[] };

const buckets = new Map<string, Bucket>();
let lastSweep = Date.now();

const SWEEP_MS = 60_000;

function sweep() {
  const now = Date.now();
  if (now - lastSweep < SWEEP_MS) return;
  lastSweep = now;
  for (const [k, b] of buckets) {
    b.hits = b.hits.filter((t) => now - t < 60_000 * 5);
    if (b.hits.length === 0) buckets.delete(k);
  }
}

export function getClientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim().slice(0, 64);
  const real = req.headers.get("x-real-ip");
  if (real) return real.slice(0, 64);
  return "unknown";
}

function safePath(url: string): string {
  try {
    return new URL(url).pathname.slice(0, 80);
  } catch {
    return "unknown";
  }
}

// Returns true when the request is allowed, false when it exceeds the limit.
export function rateLimit(
  req: Request,
  opts: { limit: number; windowMs?: number; key?: string }
): boolean {
  const windowMs = opts.windowMs ?? 60_000;
  const now = Date.now();
  const ip = getClientIp(req);
  // Default scope is the route path so every endpoint keeps its own budget per
  // IP (callers can pass `key` to scope more tightly, e.g. per user ID).
  const route = opts.key || safePath(req.url);
  const bucketKey = `${route}:${ip}`;

  sweep();
  let bucket = buckets.get(bucketKey);
  if (!bucket) {
    bucket = { hits: [] };
    buckets.set(bucketKey, bucket);
  }
  bucket.hits = bucket.hits.filter((t) => now - t < windowMs);
  if (bucket.hits.length >= opts.limit) {
    return false;
  }
  bucket.hits.push(now);
  return true;
}

// Helper for callers that want an immediate 429 response.
export function tooMany(): Response {
  return Response.json(
    { ok: false, error: "طلبات كثيرة جداً — حاول لاحقاً" },
    { status: 429 }
  );
}