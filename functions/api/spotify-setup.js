// One time helper to get a refresh token. It only works until SPOTIFY_REFRESH_TOKEN is set.
// 1. Add SPOTIFY_CLIENT_SECRET as an encrypted variable (the client ID lives in wrangler.toml).
// 2. Open https://burak.pm/api/spotify-setup and approve.
// 3. Save the token it shows as SPOTIFY_REFRESH_TOKEN. From then on this page returns 404.
export async function onRequestGet({ request, env }) {
  if (env.SPOTIFY_REFRESH_TOKEN || !env.SPOTIFY_CLIENT_SECRET) return new Response('Not found', { status: 404 });
  const url = new URL(request.url);
  const redirect = `${url.origin}/api/spotify-setup`;
  const code = url.searchParams.get('code');
  if (!code) {
    const auth = new URL('https://accounts.spotify.com/authorize');
    auth.search = new URLSearchParams({
      client_id: env.SPOTIFY_CLIENT_ID, response_type: 'code', redirect_uri: redirect,
      scope: 'user-read-currently-playing user-read-recently-played'
    });
    return Response.redirect(auth.toString(), 302);
  }
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization: 'Basic ' + btoa(`${env.SPOTIFY_CLIENT_ID}:${env.SPOTIFY_CLIENT_SECRET}`),
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({ grant_type: 'authorization_code', code, redirect_uri: redirect })
  });
  const data = await res.json();
  const body = data.refresh_token
    ? `Refresh token. Save it in Cloudflare Pages as the encrypted variable SPOTIFY_REFRESH_TOKEN, then redeploy:\n\n${data.refresh_token}`
    : `Spotify returned an error:\n\n${JSON.stringify(data, null, 2)}`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' } });
}
