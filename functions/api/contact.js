// Contact form backend.
// GET  returns the public bits the page needs (Turnstile site key, booking link).
// POST checks Turnstile, stores the message in D1 and sends a notification.
// Notifications are optional and only run when their secrets exist:
//   Telegram: TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID
//   Email via Resend: RESEND_API_KEY + NOTIFY_EMAIL (+ optional NOTIFY_FROM)
// Messages are always kept in D1, so nothing is lost if a notifier fails.

const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }
});

const REASONS = ['collab', 'role', 'automation', 'hello', 'call'];
const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{2,}$/;

export async function onRequestGet({ env }) {
  return json({
    ok: true,
    turnstile: env.TURNSTILE_SECRET && env.TURNSTILE_SITE_KEY ? env.TURNSTILE_SITE_KEY : null,
    booking: env.BOOKING_URL || null,
    bookingEmbed: env.BOOKING_EMBED || null
  });
}

async function sha(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 32);
}

async function verifyTurnstile(env, token, ip) {
  const form = new FormData();
  form.append('secret', env.TURNSTILE_SECRET);
  form.append('response', token);
  if (ip) form.append('remoteip', ip);
  const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: form });
  const d = await r.json().catch(() => ({}));
  return d.success === true;
}

const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

async function notifyTelegram(env, m) {
  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) return false;
  const text = `<b>burak.pm</b> · ${esc(m.reason)}\n<b>${esc(m.name)}</b> &lt;${esc(m.email)}&gt;${m.country ? ' · ' + m.country : ''}\n\n${esc(m.body)}`;
  const r = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: env.TELEGRAM_CHAT_ID, text, parse_mode: 'HTML', disable_web_page_preview: true })
  });
  return r.ok;
}

const REASON_LABEL = {
  collab: 'Birlikte çalışmak', role: 'Pozisyon ya da fırsat', automation: 'Otomasyon fikri', hello: 'Merhaba', call: 'Görüşme'
};

async function notifyEmail(env, m) {
  if (!env.RESEND_API_KEY || !env.NOTIFY_EMAIL) return false;
  const label = REASON_LABEL[m.reason] || m.reason;
  const when = new Date().toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul', dateStyle: 'long', timeStyle: 'short' });
  const text = `burak.pm iletişim formundan yeni bir mesaj var.\n\nKimden: ${m.name} <${m.email}>\nKonu: ${label}${m.country ? '\nÜlke: ' + m.country : ''}\nZaman: ${when}\n\n${m.body}\n\nCevaplamak için bu maili yanıtlaman yeterli, cevabın doğrudan ${m.email} adresine gider.`;
  const html = `<!doctype html><html lang="tr"><body style="margin:0;padding:24px;background:#E9ECF2;font-family:Arial,Helvetica,sans-serif;color:#191C2E">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#F4F6FA;border:1px solid #C8CEDC;border-radius:16px">
<tr><td style="padding:24px 28px 8px"><p style="margin:0;font-size:13px;color:#4A5068">burak.pm iletişim formu</p>
<h1 style="margin:6px 0 0;font-size:22px">${esc(m.name)}</h1>
<p style="margin:4px 0 0;font-size:14px;color:#4A5068">${esc(m.email)} · ${esc(label)}${m.country ? ' · ' + esc(m.country) : ''}</p></td></tr>
<tr><td style="padding:16px 28px"><div style="white-space:pre-wrap;font-size:16px;line-height:1.55;background:#fff;border:1px solid #C8CEDC;border-radius:12px;padding:16px">${esc(m.body)}</div></td></tr>
<tr><td style="padding:0 28px 24px;font-size:13px;color:#4A5068">${esc(when)}. Bu maili yanıtladığında cevabın doğrudan ${esc(m.email)} adresine gider.</td></tr>
</table></body></html>`;
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: env.NOTIFY_FROM || 'burak.pm İletişim <iletisim@burak.pm>',
      to: [env.NOTIFY_EMAIL],
      reply_to: `${m.name.replace(/[<>"]/g, '')} <${m.email}>`,
      subject: `Yeni mesaj: ${m.name} (${label})`,
      text,
      html
    })
  });
  return r.ok;
}

export async function onRequestPost({ request, env, waitUntil }) {
  if (!env.DB || !env.TURNSTILE_SECRET) return json({ ok: false, error: 'unavailable' }, 503);

  const origin = request.headers.get('Origin');
  if (origin && !/^https:\/\/(www\.)?burak\.pm$|^https:\/\/([a-z0-9]+\.)?burakpm\.pages\.dev$/.test(origin)) {
    return json({ ok: false, error: 'origin' }, 403);
  }

  let d;
  try { d = await request.json(); } catch { return json({ ok: false, error: 'bad_request' }, 400); }

  // Honeypot: real people never fill the hidden "website" field.
  if (d.website) return json({ ok: true });

  const name = String(d.name || '').trim().slice(0, 120);
  const email = String(d.email || '').trim().slice(0, 254);
  const body = String(d.msg || '').trim().slice(0, 4000);
  const reason = REASONS.includes(d.reason) ? d.reason : 'hello';
  const lang = d.lang === 'tr' ? 'tr' : 'en';
  if (!name || !body || !EMAIL_RE.test(email)) return json({ ok: false, error: 'invalid' }, 400);

  const ip = request.headers.get('CF-Connecting-IP') || '';
  if (!(await verifyTurnstile(env, String(d.token || ''), ip))) return json({ ok: false, error: 'captcha' }, 400);

  const now = Date.now();
  const ipHash = await sha(ip + '|' + new Date().toISOString().slice(0, 10));
  const recent = await env.DB.prepare('SELECT COUNT(*) AS n FROM messages WHERE ip_hash = ?1 AND created_at > ?2')
    .bind(ipHash, now - 3600_000).first();
  if (recent && recent.n >= 3) return json({ ok: false, error: 'rate' }, 429);

  const country = request.cf && request.cf.country ? String(request.cf.country) : null;
  const { meta } = await env.DB.prepare(
    'INSERT INTO messages (created_at, reason, name, email, body, lang, country, ip_hash) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)'
  ).bind(now, reason, name, email, body, lang, country, ipHash).run();

  const m = { reason, name, email, body, country };
  waitUntil((async () => {
    const results = await Promise.allSettled([notifyTelegram(env, m), notifyEmail(env, m)]);
    if (results.some((r) => r.status === 'fulfilled' && r.value)) {
      await env.DB.prepare('UPDATE messages SET notified = 1 WHERE id = ?1').bind(meta.last_row_id).run();
    }
  })());

  return json({ ok: true });
}
