// Private admin API behind a mailed sign in link.
//
// Sign in: POST /api/admin/login (Turnstile) mails a one time link to ADMIN_EMAIL. The link
// opens a confirm page whose button POSTs the token back, so mail scanners that prefetch
// links cannot use it up. A valid token sets a signed, HttpOnly session cookie for 7 days.
// "Sign out everywhere" bumps an epoch stored in D1, which invalidates every cookie.
// Every write needs a same origin POST with a JSON body.
import { json, badOrigin, readJson, esc, isJson, SITE } from '../../_lib/http.js';
import { hmac, sha256, randomToken, same, visitorKey } from '../../_lib/crypto.js';
import { verifyTurnstile } from '../../_lib/turnstile.js';
import { getSetting, setSetting, delSetting, setSecret, maintain } from '../../_lib/store.js';
import { runChecks } from '../../_lib/checks.js';
import { sendMail, card } from '../../_lib/mail.js';
import { userToken, forgetUserToken, api, exchangeCode, refreshToken } from '../../_lib/spotify.js';

const COOKIE = 'bp_admin';
const SESSION_DAYS = 7;
const LINK_MINUTES = 15;
const SPOTIFY_SCOPES = 'user-read-currently-playing user-read-recently-played playlist-modify-public playlist-modify-private playlist-read-private';
const INDEXNOW_KEY = '0eb91cc63ddcccc7a89868656a58cafd';

const cookieOf = (request, name) => {
  const m = (request.headers.get('Cookie') || '').match(new RegExp('(?:^|;\\s*)' + name + '=([^;]+)'));
  return m ? m[1] : null;
};

async function epoch(env) {
  return (await getSetting(env, 'admin_epoch')) || '1';
}

async function makeSession(env) {
  const exp = Date.now() + SESSION_DAYS * 86_400_000;
  const nonce = randomToken(12);
  const sig = await hmac(env.ADMIN_SESSION_KEY, `${exp}.${nonce}.${await epoch(env)}`);
  return `${exp}.${nonce}.${sig}`;
}

async function session(env, request) {
  if (!env.ADMIN_SESSION_KEY) return null;
  const raw = cookieOf(request, COOKIE);
  if (!raw) return null;
  const [exp, nonce, sig] = raw.split('.');
  if (!exp || !nonce || !sig || Number(exp) < Date.now()) return null;
  const want = await hmac(env.ADMIN_SESSION_KEY, `${exp}.${nonce}.${await epoch(env)}`);
  return same(sig, want) ? { exp: Number(exp) } : null;
}

const sessionCookie = (value, maxAge) =>
  `${COOKIE}=${value}; Path=/api/admin; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Lax`;

function page(title, inner, status = 200) {
  return new Response(`<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>${esc(title)} | burak.pm</title>
<link rel="stylesheet" href="/styles.css"></head><body class="lost-page"><main class="doc admin-gate"><p class="doc__kicker">burak.pm yönetim</p><h1>${esc(title)}</h1>${inner}</main></body></html>`,
  { status, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' } });
}

/* ------------------------------------------------------------ sign in */

async function login(env, request) {
  if (!env.ADMIN_SESSION_KEY || !env.DB) return json({ ok: false, error: 'unavailable' }, 503);
  const d = await readJson(request, 4000);
  if (!d || !(await verifyTurnstile(env, String(d.token || ''), request, 'admin'))) return json({ ok: false, error: 'captcha' }, 400);
  const now = Date.now();
  // Three links an hour per visitor and ten overall, so a stranger cannot lock the owner out.
  const who = await visitorKey(env, request, 'admin-login');
  const recent = await env.DB.prepare('SELECT COUNT(*) AS total, SUM(CASE WHEN who = ?2 THEN 1 ELSE 0 END) AS mine FROM admin_links WHERE created_at > ?1')
    .bind(now - 3600_000, who).first();
  if (recent && (recent.total >= 10 || (who && recent.mine >= 3))) return json({ ok: false, error: 'rate' }, 429);
  const token = randomToken(32);
  await env.DB.prepare('INSERT INTO admin_links (h, created_at, expires_at, who) VALUES (?1, ?2, ?3, ?4)')
    .bind(await sha256(token), now, now + LINK_MINUTES * 60_000, who).run();
  const link = `${SITE}/api/admin/verify?t=${token}`;
  const ip = request.headers.get('CF-Connecting-IP') || '?';
  const where = request.cf ? [request.cf.city, request.cf.country].filter(Boolean).join(', ') : '';
  const sent = await sendMail(env, {
    subject: 'burak.pm yönetim paneli giriş bağlantısı',
    text: `Yönetim paneline giriş için bağlantı (${LINK_MINUTES} dakika geçerli, tek kullanımlık):\n\n${link}\n\nİstek: ${where || 'bilinmiyor'} (${ip}). Bunu sen istemediysen bu maili yok say.`,
    html: card({
      kicker: 'burak.pm yönetim paneli',
      title: 'Giriş bağlantın',
      meta: `${LINK_MINUTES} dakika geçerli, tek kullanımlık.`,
      button: { href: link, label: 'Panele giriş yap' },
      foot: `İstek: ${where || 'bilinmiyor'} (${ip}). Bunu sen istemediysen bu maili yok say.`
    })
  });
  return sent ? json({ ok: true }) : json({ ok: false, error: 'send' }, 502);
}

async function verifyPage(env, request) {
  const t = new URL(request.url).searchParams.get('t') || '';
  if (!/^[A-Za-z0-9_-]{43}$/.test(t)) return page('Bağlantı geçersiz', '<p>Bu bağlantı hatalı görünüyor. <a href="/admin">Yeni bağlantı iste</a>.</p>', 400);
  return page('Girişi onayla', `<p>Yönetim paneline bu cihazdan giriş yapmak için aşağıdaki düğmeye bas.</p>
<form method="post" action="/api/admin/verify"><input type="hidden" name="t" value="${esc(t)}"><button class="btn btn--solid" type="submit">Giriş yap</button></form>`);
}

async function verifyPost(env, request) {
  if (badOrigin(request)) return page('Giriş reddedildi', '<p>Bu istek başka bir siteden geldi.</p>', 403);
  if (!env.ADMIN_SESSION_KEY) return page('Panel kapalı', '<p>Yönetim anahtarı tanımlı değil.</p>', 503);
  const form = await request.formData().catch(() => null);
  const t = form ? String(form.get('t') || '') : '';
  const now = Date.now();
  const r = await env.DB.prepare('UPDATE admin_links SET used_at = ?1 WHERE h = ?2 AND used_at IS NULL AND expires_at > ?1')
    .bind(now, await sha256(t)).run();
  if (!r.meta.changes) return page('Bağlantının süresi dolmuş', '<p>Bu bağlantı kullanılmış ya da süresi geçmiş. <a href="/admin">Yeni bağlantı iste</a>.</p>', 400);
  return new Response(null, { status: 303, headers: { Location: '/admin', 'Set-Cookie': sessionCookie(await makeSession(env), SESSION_DAYS * 86_400), 'Cache-Control': 'no-store' } });
}

/* ------------------------------------------------------------ data */

async function overview(env, ctx) {
  ctx.waitUntil(maintain(env).catch(() => {}));
  const [health, counts, visits, spotifyUser, playlistUrl, lastMaintain, lastIndexnow, fromPanel] = await Promise.all([
    runChecks(env),
    env.DB.prepare(`SELECT
      (SELECT COUNT(*) FROM messages) AS messages,
      (SELECT COUNT(*) FROM messages WHERE read_at IS NULL) AS unread,
      (SELECT COUNT(*) FROM songs WHERE status = 'pending') AS pending,
      (SELECT COUNT(*) FROM songs WHERE status = 'approved') AS approved`).first(),
    env.DB.prepare('SELECT country, count, last_seen FROM visits ORDER BY count DESC').all(),
    getSetting(env, 'spotify_user'),
    getSetting(env, 'playlist_url'),
    getSetting(env, 'last_maintain'),
    getSetting(env, 'last_indexnow'),
    getSetting(env, 'spotify_refresh')
  ]);
  let user = null;
  try { user = spotifyUser ? JSON.parse(spotifyUser) : null; } catch { user = null; }
  return json({
    ok: true,
    health,
    counts,
    visits: visits.results,
    spotify: { connected: !!(await refreshToken(env)), panelToken: !!fromPanel, user, playlist: playlistUrl },
    lastMaintain: Number(lastMaintain) || null,
    lastIndexnow: lastIndexnow ? JSON.parse(lastIndexnow) : null
  });
}

async function messages(env) {
  const { results } = await env.DB.prepare(
    'SELECT id, created_at, reason, name, email, body, lang, country, notified, read_at FROM messages ORDER BY created_at DESC LIMIT 200'
  ).all();
  return json({ ok: true, items: results });
}

async function songs(env, url) {
  const status = ['pending', 'approved', 'rejected'].includes(url.searchParams.get('status')) ? url.searchParams.get('status') : 'pending';
  const { results } = await env.DB.prepare(
    'SELECT id, created_at, track_id, title, artist, album, art, url, name, note, lang, country, status, decided_at FROM songs WHERE status = ?1 ORDER BY created_at DESC LIMIT 200'
  ).bind(status).all();
  return json({ ok: true, items: results });
}

async function playlistId(env, token) {
  const existing = await getSetting(env, 'playlist_id');
  if (existing) return existing;
  const r = await api(token, '/me/playlists', {
    method: 'POST',
    body: JSON.stringify({ name: 'burak.pm ziyaretçi önerileri', description: 'burak.pm ziyaretçilerinin önerdiği ve Burak Çevik’in sevdiği şarkılar. Sen de öner: burak.pm', public: true })
  });
  let res = r;
  if (res.status === 404 || res.status === 405) {
    const me = await api(token, '/me');
    if (me.ok) {
      const u = await me.json();
      res = await api(token, `/users/${encodeURIComponent(u.id)}/playlists`, { method: 'POST', body: JSON.stringify({ name: 'burak.pm ziyaretçi önerileri', public: true }) });
    }
  }
  if (!res.ok) throw new Error('playlist create ' + res.status);
  const p = await res.json();
  await setSetting(env, 'playlist_id', p.id);
  await setSetting(env, 'playlist_url', p.external_urls && p.external_urls.spotify || `https://open.spotify.com/playlist/${p.id}`);
  return p.id;
}

async function decideSong(env, id, action) {
  const song = await env.DB.prepare('SELECT * FROM songs WHERE id = ?1').bind(id).first();
  if (!song) return json({ ok: false, error: 'not_found' }, 404);
  if (action === 'delete') {
    await env.DB.prepare('DELETE FROM songs WHERE id = ?1').bind(id).run();
  } else if (action === 'reject') {
    await env.DB.prepare("UPDATE songs SET status = 'rejected', decided_at = ?2 WHERE id = ?1").bind(id, Date.now()).run();
  } else {
    let token;
    try { token = await userToken(env); } catch { return json({ ok: false, error: 'spotify_not_connected' }, 409); }
    try {
      const pid = await playlistId(env, token);
      const body = JSON.stringify({ uris: [`spotify:track:${song.track_id}`] });
      let r = await api(token, `/playlists/${pid}/items`, { method: 'POST', body });
      if (r.status === 404 || r.status === 405) r = await api(token, `/playlists/${pid}/tracks`, { method: 'POST', body });
      if (r.status === 403) return json({ ok: false, error: 'spotify_scope' }, 409);
      if (!r.ok) return json({ ok: false, error: 'spotify_' + r.status }, 502);
    } catch (e) {
      return json({ ok: false, error: 'spotify_error', detail: String(e.message || e).slice(0, 120) }, 502);
    }
    await env.DB.prepare("UPDATE songs SET status = 'approved', decided_at = ?2 WHERE id = ?1").bind(id, Date.now()).run();
  }
  await caches.default.delete(new Request(SITE + '/__cache/songs')).catch(() => {});
  return json({ ok: true });
}

async function indexNow(env) {
  const res = await env.ASSETS.fetch(new Request(SITE + '/sitemap.xml'));
  const xml = await res.text();
  const urlList = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]).slice(0, 10_000);
  const r = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ host: 'burak.pm', key: INDEXNOW_KEY, keyLocation: `${SITE}/${INDEXNOW_KEY}.txt`, urlList })
  });
  const result = { at: Date.now(), status: r.status, urls: urlList.length };
  await setSetting(env, 'last_indexnow', JSON.stringify(result));
  return json({ ok: r.status === 200 || r.status === 202, ...result });
}

/* ------------------------------------------------------------ Spotify connect */

function spotifyConnect(env) {
  if (!env.SPOTIFY_CLIENT_ID || !env.SPOTIFY_CLIENT_SECRET) return page('Spotify ayarlı değil', '<p>Spotify istemci bilgileri tanımlı değil.</p>', 503);
  const state = randomToken(18);
  const auth = new URL('https://accounts.spotify.com/authorize');
  auth.search = new URLSearchParams({
    client_id: env.SPOTIFY_CLIENT_ID, response_type: 'code', redirect_uri: `${SITE}/api/admin/spotify/callback`,
    scope: SPOTIFY_SCOPES, state, show_dialog: 'true'
  });
  return new Response(null, { status: 302, headers: {
    Location: auth.toString(),
    'Set-Cookie': `bp_sp_state=${state}; Path=/api/admin/spotify; Max-Age=600; HttpOnly; Secure; SameSite=Lax`,
    'Cache-Control': 'no-store'
  } });
}

async function spotifyCallback(env, request) {
  const url = new URL(request.url);
  const clear = 'bp_sp_state=; Path=/api/admin/spotify; Max-Age=0; HttpOnly; Secure; SameSite=Lax';
  const state = url.searchParams.get('state') || '';
  const expected = cookieOf(request, 'bp_sp_state') || '';
  if (!expected || !same(state, expected)) return page('Spotify bağlanamadı', '<p>Güvenlik kontrolü tutmadı. <a href="/admin#settings">Panele dön</a> ve tekrar dene.</p>', 400);
  const code = url.searchParams.get('code');
  if (!code) return page('Spotify bağlanmadı', '<p>Onay verilmedi. <a href="/admin#settings">Panele dön</a>.</p>', 400);
  try {
    const d = await exchangeCode(env, code, `${SITE}/api/admin/spotify/callback`);
    if (!d.refresh_token) throw new Error('no refresh token');
    await setSecret(env, 'spotify_refresh', d.refresh_token);
    await setSetting(env, 'spotify_scopes', d.scope || '');
    forgetUserToken();
    const me = await api(d.access_token, '/me');
    if (me.ok) {
      const u = await me.json();
      await setSetting(env, 'spotify_user', JSON.stringify({ id: u.id, name: u.display_name || u.id }));
    }
  } catch (e) {
    return page('Spotify bağlanamadı', `<p>Spotify bir hata döndürdü. <a href="/admin#settings">Panele dön</a>.</p>`, 502);
  }
  return new Response(null, { status: 303, headers: { Location: '/admin#settings', 'Set-Cookie': clear, 'Cache-Control': 'no-store' } });
}

/* ------------------------------------------------------------ router */

export async function onRequest(ctx) {
  const { request, env } = ctx;
  const url = new URL(request.url);
  const route = url.pathname.replace(/^\/api\/admin\/?/, '').replace(/\/$/, '');
  const method = request.method;

  if (!env.DB) return json({ ok: false, error: 'unavailable' }, 503);

  // Open routes.
  if (route === 'login' && method === 'POST') { if (badOrigin(request)) return json({ ok: false }, 403); return login(env, request); }
  if (route === 'verify' && method === 'GET') return verifyPage(env, request);
  if (route === 'verify' && method === 'POST') return verifyPost(env, request);

  const s = await session(env, request);
  if (!s) {
    if (method === 'GET' && route.startsWith('spotify/')) return new Response(null, { status: 302, headers: { Location: '/admin' } });
    return json({ ok: false, error: 'auth' }, 401);
  }

  if (method === 'GET') {
    if (route === 'me') return json({ ok: true, exp: s.exp });
    if (route === 'overview') return overview(env, ctx);
    if (route === 'messages') return messages(env);
    if (route === 'songs') return songs(env, url);
    if (route === 'spotify/connect') return spotifyConnect(env);
    if (route === 'spotify/callback') return spotifyCallback(env, request);
    return json({ ok: false, error: 'not_found' }, 404);
  }

  if (method !== 'POST') return json({ ok: false, error: 'method' }, 405);
  if (badOrigin(request) || !isJson(request)) return json({ ok: false, error: 'origin' }, 403);
  const d = (await readJson(request, 4000)) || {};
  const id = Number.isInteger(d.id) ? d.id : null;

  switch (route) {
    // There is a single admin, so signing out always ends every session.
    case 'logout':
    case 'logout-all':
      await setSetting(env, 'admin_epoch', String(Number(await epoch(env)) + 1));
      return json({ ok: true }, 200, 'no-store', { 'Set-Cookie': sessionCookie('', 0) });
    case 'messages/read':
      if (id === null) break;
      await env.DB.prepare('UPDATE messages SET read_at = COALESCE(read_at, ?2) WHERE id = ?1').bind(id, Date.now()).run();
      return json({ ok: true });
    case 'messages/delete':
      if (id === null) break;
      await env.DB.prepare('DELETE FROM messages WHERE id = ?1').bind(id).run();
      return json({ ok: true });
    case 'songs/approve': if (id === null) break; return decideSong(env, id, 'approve');
    case 'songs/reject': if (id === null) break; return decideSong(env, id, 'reject');
    case 'songs/delete': if (id === null) break; return decideSong(env, id, 'delete');
    case 'maintenance':
      return json({ ok: true, result: await maintain(env, true) });
    case 'indexnow':
      return indexNow(env);
    case 'spotify/disconnect':
      await delSetting(env, 'spotify_refresh'); await delSetting(env, 'spotify_user'); forgetUserToken();
      return json({ ok: true });
    case 'playlist/reset':
      await delSetting(env, 'playlist_id'); await delSetting(env, 'playlist_url');
      await caches.default.delete(new Request(SITE + '/__cache/songs')).catch(() => {});
      return json({ ok: true });
    default:
      return json({ ok: false, error: 'not_found' }, 404);
  }
  return json({ ok: false, error: 'bad_request' }, 400);
}
