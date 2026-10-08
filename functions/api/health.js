// Health check for the moving parts of the site. Returns only true or false per check,
// never a secret. Results are cached for 10 minutes so the endpoint cannot be used to
// hammer Spotify, Resend or Turnstile.
import { accessToken } from './_spotify.js';

const TTL = 600;

async function check(fn) {
  try { return await fn(); } catch (e) { return false; }
}

async function run(env) {
  const checks = {};

  checks.database = await check(async () => {
    const r = await env.DB.prepare('SELECT 1 AS ok').first();
    return r && r.ok === 1;
  });

  checks.spotify = await check(async () => !!(await accessToken(env)));

  // A sending key cannot list anything, so send an empty request: a valid key gets a
  // validation error back, an invalid or revoked key gets an authentication error.
  checks.email = await check(async () => {
    if (!env.RESEND_API_KEY || !env.NOTIFY_EMAIL) return false;
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: '{}'
    });
    if (r.status === 401 || r.status === 403) return false;
    const d = await r.json().catch(() => ({}));
    return !/api key/i.test(String(d.message || ''));
  });

  checks.spamCheck = await check(async () => {
    if (!env.TURNSTILE_SECRET || !env.TURNSTILE_SITE_KEY) return false;
    const form = new FormData();
    form.append('secret', env.TURNSTILE_SECRET);
    form.append('response', 'health-probe');
    const d = await (await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: form })).json();
    return !(d['error-codes'] || []).some((c) => /secret/.test(c));
  });

  // Messages that were saved but never reached the mailbox (older than 10 minutes, last 30 days).
  let unsent = null;
  checks.delivery = await check(async () => {
    const now = Date.now();
    const r = await env.DB.prepare('SELECT COUNT(*) AS n FROM messages WHERE notified = 0 AND created_at < ?1 AND created_at > ?2')
      .bind(now - 600_000, now - 30 * 86400_000).first();
    unsent = r ? r.n : 0;
    return unsent === 0;
  });

  const ok = Object.values(checks).every(Boolean);
  return { ok, checks, unsent, at: new Date().toISOString() };
}

export async function onRequestGet({ request, env, waitUntil }) {
  const cache = caches.default;
  const key = new Request(new URL('/api/health', request.url).toString());
  const hit = await cache.match(key);
  if (hit) return hit;
  const body = await run(env);
  const res = new Response(JSON.stringify(body), {
    status: body.ok ? 200 : 503,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': `public, max-age=${TTL}` }
  });
  waitUntil(cache.put(key, res.clone()));
  return res;
}
