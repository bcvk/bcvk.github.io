// Small response and request helpers shared by every endpoint.

export const SITE = 'https://burak.pm';
const LOCAL = /^(localhost|127\.0\.0\.1)$/;

export function json(body, status = 200, cache = 'no-store', extra = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': cache, ...extra }
  });
}

// Cross site posts are refused. A missing Origin (curl, some privacy tools) is allowed
// because every write is also behind Turnstile or a signed session.
export function badOrigin(request) {
  const origin = request.headers.get('Origin');
  if (!origin) return false;
  if (origin === SITE) return false;
  // Local development only: the page and the request are both on this machine.
  const self = new URL(request.url);
  return !(LOCAL.test(self.hostname) && origin === self.origin);
}

export const isJson = (request) => /^application\/json\s*(;|$)/i.test(request.headers.get('Content-Type') || '');

// Reads a JSON body of at most `max` bytes. Returns an object or null.
export async function readJson(request, max = 16_000) {
  const len = Number(request.headers.get('Content-Length') || 0);
  if (len > max) return null;
  try {
    const text = await request.text();
    if (text.length > max) return null;
    const d = JSON.parse(text);
    return d && typeof d === 'object' && !Array.isArray(d) ? d : null;
  } catch {
    return null;
  }
}

// Removes control characters and squeezes whitespace. Keeps letters from every script.
export function clean(value, max, { multiline = false } = {}) {
  let s = String(value ?? '');
  s = multiline ? s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').replace(/\r\n?/g, '\n')
    : s.replace(/[\u0000-\u001F\u007F]/g, ' ').replace(/\s+/g, ' ');
  return s.trim().slice(0, max);
}

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Serves a GET from the edge cache for `ttl` seconds, keyed on a fixed URL.
// Only 200s are cached unless `any` is set (health caches failures too, so it cannot be hammered).
export async function cached(ctx, key, ttl, make, { any = false } = {}) {
  const cache = caches.default;
  const req = new Request(SITE + key);
  const hit = await cache.match(req);
  if (hit) return hit;
  const res = await make();
  if (res.status === 200 || any) {
    const copy = new Response(res.clone().body, res);
    copy.headers.set('Cache-Control', `public, max-age=${ttl}`);
    ctx.waitUntil(cache.put(req, copy));
  }
  return res;
}
