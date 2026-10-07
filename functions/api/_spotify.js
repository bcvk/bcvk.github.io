// Shared Spotify helpers for Cloudflare Pages Functions.
// Needs SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET and SPOTIFY_REFRESH_TOKEN as encrypted env vars.
let cached = { token: null, until: 0 };

export async function accessToken(env) {
  if (cached.token && Date.now() < cached.until) return cached.token;
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization: 'Basic ' + btoa(`${env.SPOTIFY_CLIENT_ID}:${env.SPOTIFY_CLIENT_SECRET}`),
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: env.SPOTIFY_REFRESH_TOKEN })
  });
  if (!res.ok) throw new Error('token ' + res.status);
  const data = await res.json();
  cached = { token: data.access_token, until: Date.now() + (data.expires_in - 60) * 1000 };
  return cached.token;
}

export const json = (body, status = 200, maxAge = 15) => new Response(JSON.stringify(body), {
  status,
  headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': `public, max-age=${maxAge}, s-maxage=${maxAge}` }
});
