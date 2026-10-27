// Cloudflare Turnstile check. Besides "success" it also requires the token to have been
// issued on this site and for the expected form, so a token from another page is useless.
const HOSTS = new Set(['burak.pm', 'localhost', '127.0.0.1']);

export async function verifyTurnstile(env, token, request, action) {
  if (!env.TURNSTILE_SECRET || typeof token !== 'string' || !token || token.length > 2048) return false;
  const form = new FormData();
  form.append('secret', env.TURNSTILE_SECRET);
  form.append('response', token);
  const ip = request.headers.get('CF-Connecting-IP');
  if (ip) form.append('remoteip', ip);
  try {
    const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: form });
    const d = await r.json();
    if (d.success !== true) return false;
    // Cloudflare's always passing test keys report "example.com"; real keys report the site host.
    if (d.hostname && !HOSTS.has(d.hostname) && !(env.TURNSTILE_TEST && d.hostname === 'example.com')) return false;
    if (action && d.action !== action && !env.TURNSTILE_TEST) return false;
    return true;
  } catch {
    return false;
  }
}
