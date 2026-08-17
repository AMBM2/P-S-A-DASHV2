// CSRF defense-in-depth for state-changing API routes.
//
// These routes accept JSON bodies only, so classic form-based CSRF is already
// blocked (req.json() rejects form-encoded payloads). Cross-origin fetch of a
// JSON POST triggers a CORS preflight, and we never emit Access-Control-Allow-
// Origin headers, so browsers refuse the response. This helper adds a final
// guard: if a browser-supplied Origin/Referer is present and does not match the
// portal's own origin(s), the request is rejected outright.

const ALLOWED_ORIGINS = [
  "https://p-s-a-dashv-2.vercel.app",
  "http://localhost:3000",
  "http://localhost:4000",
];

// Returns an error message when the request fails the origin check, else null.
export function checkOrigin(req: Request): string | null {
  const origin = req.headers.get("origin");
  if (origin) {
    if (ALLOWED_ORIGINS.includes(origin)) return null;
    // Allow the request's own host (preview deployments on the same origin).
    try {
      const host = new URL(req.url).host;
      if (origin === `https://${host}` || origin === `http://${host}`) return null;
    } catch {
      /* fall through to reject */
    }
    return "invalid origin";
  }

  // No Origin (curl / bots / server-to-server). Only accept same-host Referer.
  const referer = req.headers.get("referer");
  if (referer) {
    try {
      const refHost = new URL(referer).host;
      const host = new URL(req.url).host;
      if (refHost !== host) return "invalid referer";
    } catch {
      return "invalid referer";
    }
  }
  return null;
}