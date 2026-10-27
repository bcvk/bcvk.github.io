// Key value settings in D1, plus the housekeeping job that keeps the privacy promises.
import { seal, open } from './crypto.js';

export async function getSetting(env, k) {
  const r = await env.DB.prepare('SELECT v FROM settings WHERE k = ?1').bind(k).first();
  return r ? r.v : null;
}

export async function setSetting(env, k, v) {
  await env.DB.prepare('INSERT INTO settings (k, v, updated_at) VALUES (?1, ?2, ?3) ON CONFLICT(k) DO UPDATE SET v = ?2, updated_at = ?3')
    .bind(k, String(v), Date.now()).run();
}

export async function delSetting(env, k) {
  await env.DB.prepare('DELETE FROM settings WHERE k = ?1').bind(k).run();
}

// Secrets kept in D1 (the Spotify token from the admin panel) are sealed with SETTINGS_KEY.
export async function getSecret(env, k) {
  if (!env.SETTINGS_KEY) return null;
  return open(env.SETTINGS_KEY, await getSetting(env, k));
}

export async function setSecret(env, k, v) {
  if (!env.SETTINGS_KEY) throw new Error('SETTINGS_KEY missing');
  await setSetting(env, k, await seal(env.SETTINGS_KEY, v));
}

const DAY = 86_400_000;

// Retention, run at most every six hours from normal traffic or on demand from the admin panel:
//   messages are deleted after 12 months,
//   rate limit codes on messages and songs are cleared after 24 hours,
//   yesterday's "already counted" visit codes are deleted,
//   declined songs are deleted after 30 days, old login links after a day,
//   names and notes on decided songs are erased after 30 days.
export async function maintain(env, force = false) {
  const now = Date.now();
  if (!force) {
    const last = Number(await getSetting(env, 'last_maintain').catch(() => 0)) || 0;
    if (now - last < 6 * 3600_000) return null;
  }
  const today = new Date(now).toISOString().slice(0, 10);
  const res = await env.DB.batch([
    env.DB.prepare('DELETE FROM messages WHERE created_at < ?1').bind(now - 365 * DAY),
    env.DB.prepare('UPDATE messages SET ip_hash = NULL WHERE ip_hash IS NOT NULL AND created_at < ?1').bind(now - DAY),
    env.DB.prepare('UPDATE songs SET ip_hash = NULL WHERE ip_hash IS NOT NULL AND created_at < ?1').bind(now - DAY),
    env.DB.prepare("DELETE FROM songs WHERE status = 'rejected' AND decided_at < ?1").bind(now - 30 * DAY),
    env.DB.prepare('DELETE FROM visit_seen WHERE day < ?1').bind(today),
    env.DB.prepare('DELETE FROM admin_links WHERE expires_at < ?1').bind(now - DAY),
    env.DB.prepare("UPDATE songs SET name = NULL, note = NULL WHERE (name IS NOT NULL OR note IS NOT NULL) AND status != 'pending' AND decided_at < ?1").bind(now - 30 * DAY)
  ]);
  await setSetting(env, 'last_maintain', now);
  const n = (i) => (res[i] && res[i].meta ? res[i].meta.changes : 0);
  return { at: now, messagesDeleted: n(0), messageCodesCleared: n(1), songCodesCleared: n(2), songsDeleted: n(3), visitCodesDeleted: n(4), linksDeleted: n(5), songNotesCleared: n(6) };
}
