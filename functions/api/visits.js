// Counts visits per country. Only the two letter country code Cloudflare already
// knows is stored, no IPs and no cookies beyond a one day "already counted" flag.
const ok = (cc) => typeof cc === 'string' && /^[A-Z]{2}$/.test(cc) && cc !== 'XX' && cc !== 'T1';

async function snapshot(env, cc) {
  const { results } = await env.DB.prepare('SELECT country, count FROM visits ORDER BY count DESC').all();
  const total = results.reduce((a, r) => a + r.count, 0);
  return { ok: true, you: ok(cc) ? cc : null, total, countries: results };
}

const reply = (body, extra = {}) => new Response(JSON.stringify(body), {
  headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...extra }
});

export async function onRequestGet({ request, env }) {
  if (!env.DB) return reply({ ok: false });
  return reply(await snapshot(env, request.cf && request.cf.country));
}

export async function onRequestPost({ request, env }) {
  if (!env.DB) return reply({ ok: false });
  const cc = request.cf && request.cf.country;
  const cookie = request.headers.get('Cookie') || '';
  const today = new Date().toISOString().slice(0, 10);
  const counted = cookie.includes('bp_seen=' + today);
  if (ok(cc) && !counted) {
    await env.DB.prepare('INSERT INTO visits (country, count, last_seen) VALUES (?1, 1, ?2) ON CONFLICT(country) DO UPDATE SET count = count + 1, last_seen = ?2')
      .bind(cc, Date.now()).run();
  }
  const headers = counted ? {} : { 'Set-Cookie': `bp_seen=${today}; Path=/api; Max-Age=86400; HttpOnly; Secure; SameSite=Lax` };
  return reply(await snapshot(env, cc), headers);
}
