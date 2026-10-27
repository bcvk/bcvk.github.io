// Visitor map: one count per country per visitor per day.
// To stop a script from inflating the numbers (and burning the database quota the contact
// form also needs), each visitor is remembered for the day by a keyed code of their IP.
// The code cannot be turned back into an address and is deleted the next day.
import { json, badOrigin, cached } from '../_lib/http.js';
import { visitorKey } from '../_lib/crypto.js';
import { maintain } from '../_lib/store.js';

const okCountry = (cc) => typeof cc === 'string' && /^[A-Z]{2}$/.test(cc) && cc !== 'XX' && cc !== 'T1';

async function totals(env) {
  const { results } = await env.DB.prepare('SELECT country, count FROM visits ORDER BY count DESC').all();
  return { total: results.reduce((a, r) => a + r.count, 0), countries: results };
}

export async function onRequestGet(ctx) {
  const { request, env } = ctx;
  if (!env.DB) return json({ ok: false });
  const cc = request.cf && request.cf.country;
  // The shared totals are cached for a minute; only "you" differs per visitor.
  const res = await cached(ctx, '/__cache/visits', 60, async () => json({ ok: true, ...(await totals(env)) }, 200));
  const d = await res.json();
  return json({ ...d, you: okCountry(cc) ? cc : null });
}

export async function onRequestPost({ request, env, waitUntil }) {
  if (!env.DB) return json({ ok: false });
  if (badOrigin(request)) return json({ ok: false, error: 'origin' }, 403);
  const cc = request.cf && request.cf.country;
  const today = new Date().toISOString().slice(0, 10);
  const counted = (request.headers.get('Cookie') || '').includes('bp_seen=' + today);
  if (okCountry(cc) && !counted) {
    const key = await visitorKey(env, request, 'visit|' + today);
    try {
      let fresh = true;
      if (key) {
        const r = await env.DB.prepare('INSERT OR IGNORE INTO visit_seen (h, day) VALUES (?1, ?2)').bind(key, today).run();
        fresh = r.meta.changes === 1;
      }
      if (fresh) {
        await env.DB.prepare('INSERT INTO visits (country, count, last_seen) VALUES (?1, 1, ?2) ON CONFLICT(country) DO UPDATE SET count = count + 1, last_seen = ?2')
          .bind(cc, Date.now()).run();
      }
    } catch (e) { /* counting is best effort */ }
    waitUntil(maintain(env).catch(() => {}));
  }
  const headers = counted ? {} : { 'Set-Cookie': `bp_seen=${today}; Path=/api; Max-Age=86400; HttpOnly; Secure; SameSite=Lax` };
  return json({ ok: true, you: okCountry(cc) ? cc : null, ...(await totals(env)) }, 200, 'no-store', headers);
}
