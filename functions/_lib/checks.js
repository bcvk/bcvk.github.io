// Health checks for the moving parts. Each returns true or false, never a secret.
import { userToken, appToken } from './spotify.js';

async function check(fn) {
  try { return !!(await fn()); } catch { return false; }
}

export async function runChecks(env) {
  const checks = {};
  checks.database = await check(async () => (await env.DB.prepare('SELECT 1 AS ok').first()).ok === 1);
  checks.spotify = await check(() => userToken(env));
  checks.spotifySearch = await check(() => appToken(env));
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
  checks.privacyKeys = !!(env.IP_HASH_KEY && env.SETTINGS_KEY && env.ADMIN_SESSION_KEY);
  let unsent = 0;
  checks.delivery = await check(async () => {
    const now = Date.now();
    const r = await env.DB.prepare('SELECT COUNT(*) AS n FROM messages WHERE notified = 0 AND created_at < ?1 AND created_at > ?2')
      .bind(now - 600_000, now - 30 * 86_400_000).first();
    unsent = r ? r.n : 0;
    return unsent === 0;
  });
  // Song search is optional for the overall status; everything else must pass.
  const ok = ['database', 'spotify', 'email', 'spamCheck', 'privacyKeys', 'delivery'].every((k) => checks[k]);
  return { ok, checks, unsent, at: new Date().toISOString() };
}
