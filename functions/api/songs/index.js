// "Suggest me a song".
// GET  the latest songs Burak added to the visitors' playlist, plus the playlist link.
// POST a suggestion: Turnstile checked, at most three a day per visitor, stored for review.
//      Track details are fetched from Spotify here, never trusted from the browser.
import { json, badOrigin, readJson, clean, cached } from '../../_lib/http.js';
import { verifyTurnstile } from '../../_lib/turnstile.js';
import { visitorKey } from '../../_lib/crypto.js';
import { appToken, api, pickTrack, TRACK_ID } from '../../_lib/spotify.js';
import { getSetting, maintain } from '../../_lib/store.js';
import { sendMail, card, istanbulTime } from '../../_lib/mail.js';

const PER_DAY = 3;

export async function onRequestGet(ctx) {
  const { env } = ctx;
  if (!env.DB) return json({ ok: false });
  return cached(ctx, '/__cache/songs', 120, async () => {
    const { results } = await env.DB.prepare(
      "SELECT title, artist, art, url FROM songs WHERE status = 'approved' ORDER BY decided_at DESC LIMIT 6"
    ).all();
    const playlist = await getSetting(env, 'playlist_url').catch(() => null);
    return json({ ok: true, playlist, recent: results });
  });
}

export async function onRequestPost({ request, env, waitUntil }) {
  if (!env.DB || !env.TURNSTILE_SECRET) return json({ ok: false, error: 'unavailable' }, 503);
  if (badOrigin(request)) return json({ ok: false, error: 'origin' }, 403);
  const d = await readJson(request, 4000);
  if (!d) return json({ ok: false, error: 'bad_request' }, 400);
  if (d.website) return json({ ok: true });

  const trackId = String(d.track || '');
  if (!TRACK_ID.test(trackId)) return json({ ok: false, error: 'invalid' }, 400);
  const name = clean(d.name, 60);
  const note = clean(d.note, 280, { multiline: true });
  const lang = d.lang === 'tr' ? 'tr' : 'en';

  if (!(await verifyTurnstile(env, String(d.token || ''), request, 'song'))) return json({ ok: false, error: 'captcha' }, 400);

  let track;
  try {
    const r = await api(await appToken(env), `/tracks/${trackId}`);
    if (!r.ok) return json({ ok: false, error: 'invalid' }, 400);
    track = pickTrack(await r.json());
  } catch (e) {
    return json({ ok: false, error: 'spotify' }, 502);
  }

  const now = Date.now();
  const country = request.cf && /^[A-Z]{2}$/.test(String(request.cf.country)) ? String(request.cf.country) : null;
  const key = await visitorKey(env, request, 'song');
  let r;
  try {
    r = await env.DB.prepare(
      `INSERT OR IGNORE INTO songs (created_at, track_id, title, artist, album, art, url, name, note, lang, country, ip_hash)
       SELECT ?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12
       WHERE ?12 IS NULL OR (SELECT COUNT(*) FROM songs WHERE ip_hash = ?12 AND created_at > ?13) < ?14`
    ).bind(now, track.id, track.title, track.artist, track.album, track.art, track.url, name || null, note || null, lang, country, key, now - 86_400_000, PER_DAY).run();
  } catch (e) {
    return json({ ok: false, error: 'send' }, 502);
  }
  if (!r.meta.changes) {
    // Either the daily limit, or the same song is already waiting or on the playlist.
    const dup = await env.DB.prepare("SELECT status FROM songs WHERE track_id = ?1 AND status IN ('pending','approved')").bind(track.id).first();
    return dup ? json({ ok: true, already: dup.status }) : json({ ok: false, error: 'rate' }, 429);
  }

  const id = r.meta.last_row_id;
  waitUntil((async () => {
    const sent = await sendMail(env, {
      subject: `Yeni şarkı önerisi: ${track.title} (${track.artist})`,
      text: `burak.pm üzerinden yeni bir şarkı önerisi geldi.\n\n${track.title} · ${track.artist}\n${track.url}\n${name ? '\nÖneren: ' + name : ''}${note ? '\nNot: ' + note : ''}\n\nOnaylamak ya da reddetmek için: https://burak.pm/admin#songs`,
      html: card({
        kicker: 'burak.pm şarkı önerisi',
        title: track.title,
        meta: `${track.artist}${name ? ' · öneren: ' + name : ''}${country ? ' · ' + country : ''}`,
        body: note || null,
        button: { href: 'https://burak.pm/admin#songs', label: 'Yönetim panelinde aç' },
        foot: istanbulTime(now)
      })
    });
    if (sent) await env.DB.prepare('UPDATE songs SET notified = 1 WHERE id = ?1').bind(id).run().catch(() => {});
    await maintain(env).catch(() => {});
  })());
  return json({ ok: true, song: { title: track.title, artist: track.artist } });
}
