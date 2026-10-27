// Outgoing mail through Resend. Only ever sends to the site owner.
import { esc } from './http.js';

export async function sendMail(env, { subject, text, html, replyTo }) {
  if (!env.RESEND_API_KEY || !env.NOTIFY_EMAIL) return false;
  const body = {
    from: env.NOTIFY_FROM || 'burak.pm <iletisim@burak.pm>',
    to: [env.NOTIFY_EMAIL],
    subject: String(subject).replace(/[\r\n]+/g, ' ').slice(0, 200),
    text,
    html
  };
  if (replyTo) body.reply_to = replyTo;
  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    return r.ok;
  } catch {
    return false;
  }
}

// A simple card layout shared by every notification.
export function card({ kicker, title, meta, body, foot, button }) {
  return `<!doctype html><html lang="tr"><body style="margin:0;padding:24px;background:#E9ECF2;font-family:Arial,Helvetica,sans-serif;color:#191C2E">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#F4F6FA;border:1px solid #C8CEDC;border-radius:16px">
<tr><td style="padding:24px 28px 8px"><p style="margin:0;font-size:13px;color:#4A5068">${esc(kicker)}</p>
<h1 style="margin:6px 0 0;font-size:22px">${esc(title)}</h1>
${meta ? `<p style="margin:4px 0 0;font-size:14px;color:#4A5068">${esc(meta)}</p>` : ''}</td></tr>
${body ? `<tr><td style="padding:16px 28px"><div style="white-space:pre-wrap;font-size:16px;line-height:1.55;background:#fff;border:1px solid #C8CEDC;border-radius:12px;padding:16px">${esc(body)}</div></td></tr>` : ''}
${button ? `<tr><td style="padding:8px 28px 8px"><a href="${esc(button.href)}" style="display:inline-block;background:#191C2E;color:#fff;text-decoration:none;font-weight:bold;padding:12px 20px;border-radius:10px">${esc(button.label)}</a></td></tr>` : ''}
${foot ? `<tr><td style="padding:8px 28px 24px;font-size:13px;color:#4A5068">${esc(foot)}</td></tr>` : '<tr><td style="padding:0 0 16px"></td></tr>'}
</table></body></html>`;
}

export const istanbulTime = (ms = Date.now()) =>
  new Date(ms).toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul', dateStyle: 'long', timeStyle: 'short' });
