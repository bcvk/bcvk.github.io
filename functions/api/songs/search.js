// Spotify search for the "suggest a song" box. Uses an app only token, so it never
// touches Burak's account. Results are cached per query for a day.
import { json, cached } from '../../_lib/http.js';
import { appToken, api, pickTrack } from '../../_lib/spotify.js';

// Uncached searches are rationed per isolate so unique query floods cannot drain the
// Spotify app limit that now playing and song approval share. The zone rate limit rule
// caps each IP on top of this.
const budget = { left: 40, reset: 0 };
function spend() {
  const now = Date.now();
  if (now > budget.reset) { budget.left = 40; budget.reset = now + 60_000; }
  return budget.left-- > 0;
}

export async function onRequestGet(ctx) {
  const { request, env } = ctx;
  const url = new URL(request.url);
  const q = (url.searchParams.get('q') || '').normalize('NFC').replace(/[\u0000-\u001F\u007F]/g, '').replace(/\s+/g, ' ').trim().slice(0, 80);
  if (q.length < 2) return json({ ok: true, items: [] });
  const market = /^[A-Z]{2}$/.test(String(request.cf && request.cf.country)) ? request.cf.country : 'TR';
  const key = `/__cache/song-search/${market}/${encodeURIComponent(q.toLocaleLowerCase('tr'))}`;
  return cached(ctx, key, 86_400, async () => {
    if (!spend()) return json({ ok: false, error: 'busy' }, 429);
    try {
      const token = await appToken(env);
      const r = await api(token, `/search?type=track&limit=8&market=${market}&q=${encodeURIComponent(q)}`);
      if (!r.ok) return json({ ok: false, error: 'search' }, 502);
      const d = await r.json();
      const items = ((d.tracks && d.tracks.items) || []).filter(Boolean).map(pickTrack);
      return json({ ok: true, items });
    } catch (e) {
      return json({ ok: false, error: 'search' }, 502);
    }
  });
}
