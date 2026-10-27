// Contact form.
// GET  returns what the page needs (Turnstile site key, booking links).
// POST checks Turnstile, stores the message in D1 and mails it to the owner.
// If the database is unavailable the message is still mailed, so nothing is lost.
import { json, badOrigin, readJson, clean } from '../_lib/http.js';
import { verifyTurnstile } from '../_lib/turnstile.js';
import { visitorKey } from '../_lib/crypto.js';
import { sendMail, card, istanbulTime } from '../_lib/mail.js';
import { maintain } from '../_lib/store.js';

const REASONS = ['collab', 'automation', 'hello', 'call'];
const REASON_LABEL = { collab: 'Birlikte çalışmak', automation: 'Otomasyon fikri', hello: 'Merhaba', call: 'Görüşme' };
// Plain addresses only: no spaces, quotes, commas, angle brackets or a second @.
const EMAIL_RE = /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]{1,64}@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$/;
const PER_HOUR = 3;

export async function onRequestGet({ env }) {
  return json({
    ok: true,
    turnstile: env.TURNSTILE_SECRET && env.TURNSTILE_SITE_KEY ? env.TURNSTILE_SITE_KEY : null,
    booking: env.BOOKING_URL || null,
    bookingEmbed: env.BOOKING_EMBED || null
  }, 200, 'public, max-age=300');
}

async function notify(env, m) {
  const label = REASON_LABEL[m.reason] || m.reason;
  const when = istanbulTime(m.at);
  const text = `burak.pm iletişim formundan yeni bir mesaj var.\n\nKimden: ${m.name} <${m.email}>\nKonu: ${label}${m.country ? '\nÜlke: ' + m.country : ''}\nZaman: ${when}\n\n${m.body}\n\nBu maili yanıtladığında cevabın doğrudan ${m.email} adresine gider.`;
  const html = card({
    kicker: 'burak.pm iletişim formu',
    title: m.name,
    meta: `${m.email} · ${label}${m.country ? ' · ' + m.country : ''}`,
    body: m.body,
    foot: `${when}. Bu maili yanıtladığında cevabın doğrudan ${m.email} adresine gider.`
  });
  // The display name is quoted and stripped of anything that could start a second address.
  const display = m.name.replace(/["\\<>,;:()@\[\]]/g, '').trim() || 'burak.pm';
  return sendMail(env, { subject: `Yeni mesaj: ${display} (${label})`, text, html, replyTo: `"${display}" <${m.email}>` });
}

export async function onRequestPost({ request, env, waitUntil }) {
  if (!env.TURNSTILE_SECRET) return json({ ok: false, error: 'unavailable' }, 503);
  if (badOrigin(request)) return json({ ok: false, error: 'origin' }, 403);

  const d = await readJson(request);
  if (!d) return json({ ok: false, error: 'bad_request' }, 400);
  if (d.website) return json({ ok: true }); // honeypot

  const name = clean(d.name, 120);
  const email = clean(d.email, 254).replace(/\s/g, '');
  const body = clean(d.msg, 4000, { multiline: true });
  const reason = REASONS.includes(d.reason) ? d.reason : 'hello';
  const lang = d.lang === 'tr' ? 'tr' : 'en';
  if (!name || !body || !EMAIL_RE.test(email)) return json({ ok: false, error: 'invalid' }, 400);

  if (!(await verifyTurnstile(env, String(d.token || ''), request, 'contact'))) return json({ ok: false, error: 'captcha' }, 400);

  const now = Date.now();
  const country = request.cf && /^[A-Z]{2}$/.test(String(request.cf.country)) ? String(request.cf.country) : null;
  const key = await visitorKey(env, request, 'contact');
  const m = { reason, name, email, body, country, at: now };

  let id = null;
  if (env.DB) {
    try {
      // One statement, so parallel posts cannot slip past the hourly limit.
      const r = await env.DB.prepare(
        `INSERT INTO messages (created_at, reason, name, email, body, lang, country, ip_hash)
         SELECT ?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8
         WHERE ?8 IS NULL OR (SELECT COUNT(*) FROM messages WHERE ip_hash = ?8 AND created_at > ?9) < ?10`
      ).bind(now, reason, name, email, body, lang, country, key, now - 3600_000, PER_HOUR).run();
      if (!r.meta.changes) return json({ ok: false, error: 'rate' }, 429);
      id = r.meta.last_row_id;
    } catch (e) {
      id = null; // database trouble: fall through and still mail it
    }
  }

  const sent = await notify(env, m);
  if (!sent && id === null) return json({ ok: false, error: 'send' }, 502);
  if (id !== null) {
    waitUntil((async () => {
      if (sent) await env.DB.prepare('UPDATE messages SET notified = 1 WHERE id = ?1').bind(id).run().catch(() => {});
      await maintain(env).catch(() => {});
    })());
  }
  return json({ ok: true });
}
