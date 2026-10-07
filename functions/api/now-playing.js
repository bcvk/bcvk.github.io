import { accessToken, json } from './_spotify.js';

const pick = (track) => ({
  title: track.name,
  artist: track.artists.map((a) => a.name).join(', '),
  album: track.album.name,
  art: (track.album.images.find((i) => i.width <= 300) || track.album.images[0] || {}).url || null,
  url: track.external_urls.spotify,
  duration_ms: track.duration_ms
});

export async function onRequestGet({ env }) {
  if (!env.SPOTIFY_REFRESH_TOKEN) return json({ ok: false, reason: 'not_configured' }, 200, 300);
  try {
    const token = await accessToken(env);
    const auth = { headers: { Authorization: 'Bearer ' + token } };
    const now = await fetch('https://api.spotify.com/v1/me/player/currently-playing?additional_types=track,episode', auth);
    if (now.status === 200) {
      const d = await now.json();
      if (d && d.item && d.item.type === 'track' && d.is_playing) {
        return json({ ok: true, playing: true, progress_ms: d.progress_ms, fetched_at: Date.now(), ...pick(d.item) }, 200, 10);
      }
    }
    const recent = await fetch('https://api.spotify.com/v1/me/player/recently-played?limit=1', auth);
    if (recent.ok) {
      const r = await recent.json();
      const last = r.items && r.items[0];
      if (last) return json({ ok: true, playing: false, played_at: last.played_at, ...pick(last.track) }, 200, 30);
    }
    return json({ ok: false, reason: 'nothing' }, 200, 30);
  } catch (e) {
    return json({ ok: false, reason: 'error' }, 200, 30);
  }
}
