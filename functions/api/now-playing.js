// What Burak is listening to on Spotify. Cached at the edge for 15 seconds so a flood of
// visitors still means only a handful of Spotify calls.
import { json, cached } from '../_lib/http.js';
import { userToken, api, pickTrack, refreshToken } from '../_lib/spotify.js';

async function load(env) {
  if (!(await refreshToken(env))) return json({ ok: false, reason: 'not_configured' });
  try {
    const token = await userToken(env);
    const now = await api(token, '/me/player/currently-playing?additional_types=track');
    if (now.status === 200) {
      const d = await now.json();
      if (d && d.item && d.item.type === 'track' && d.is_playing) {
        return json({ ok: true, playing: true, progress_ms: d.progress_ms, fetched_at: Date.now(), ...pickTrack(d.item) });
      }
    }
    const recent = await api(token, '/me/player/recently-played?limit=1');
    if (recent.ok) {
      const r = await recent.json();
      const last = r.items && r.items[0];
      if (last) return json({ ok: true, playing: false, played_at: last.played_at, ...pickTrack(last.track) });
    }
    return json({ ok: false, reason: 'nothing' });
  } catch (e) {
    return json({ ok: false, reason: 'error' });
  }
}

export async function onRequestGet(ctx) {
  return cached(ctx, '/__cache/now-playing', 15, () => load(ctx.env));
}
