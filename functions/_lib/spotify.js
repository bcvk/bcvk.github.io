// Spotify access.
//   userToken: Burak's own account. The refresh token comes from the admin panel's
//     "Connect Spotify" (sealed in D1) or, as before, from SPOTIFY_REFRESH_TOKEN.
//   appToken: app only token (client credentials) used for public search.
import { getSecret } from './store.js';

const API = 'https://api.spotify.com/v1';
let userCache = { token: null, until: 0 };
let appCache = { token: null, until: 0 };

const basic = (env) => 'Basic ' + btoa(`${env.SPOTIFY_CLIENT_ID}:${env.SPOTIFY_CLIENT_SECRET}`);

async function tokenRequest(env, params) {
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { Authorization: basic(env), 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(params)
  });
  if (!res.ok) throw new Error('spotify token ' + res.status);
  return res.json();
}

export async function refreshToken(env) {
  return (await getSecret(env, 'spotify_refresh').catch(() => null)) || env.SPOTIFY_REFRESH_TOKEN || null;
}

export async function userToken(env) {
  if (userCache.token && Date.now() < userCache.until) return userCache.token;
  const rt = await refreshToken(env);
  if (!rt || !env.SPOTIFY_CLIENT_SECRET) throw new Error('spotify not connected');
  const d = await tokenRequest(env, { grant_type: 'refresh_token', refresh_token: rt });
  userCache = { token: d.access_token, until: Date.now() + (d.expires_in - 60) * 1000 };
  return userCache.token;
}

export function forgetUserToken() { userCache = { token: null, until: 0 }; }

export async function appToken(env) {
  if (appCache.token && Date.now() < appCache.until) return appCache.token;
  if (!env.SPOTIFY_CLIENT_SECRET) throw new Error('spotify not configured');
  const d = await tokenRequest(env, { grant_type: 'client_credentials' });
  appCache = { token: d.access_token, until: Date.now() + (d.expires_in - 60) * 1000 };
  return appCache.token;
}

export async function api(token, path, init = {}) {
  return fetch(API + path, { ...init, headers: { Authorization: 'Bearer ' + token, ...(init.body ? { 'Content-Type': 'application/json' } : {}), ...(init.headers || {}) } });
}

export const TRACK_ID = /^[A-Za-z0-9]{22}$/;

export function pickTrack(track) {
  const img = track.album && track.album.images || [];
  return {
    id: track.id,
    title: String(track.name || '').slice(0, 200),
    artist: (track.artists || []).map((a) => a.name).join(', ').slice(0, 200),
    album: String(track.album && track.album.name || '').slice(0, 200),
    art: (img.find((i) => i.width && i.width <= 300) || img[0] || {}).url || null,
    url: track.external_urls && track.external_urls.spotify || `https://open.spotify.com/track/${track.id}`,
    duration_ms: track.duration_ms
  };
}

export function exchangeCode(env, code, redirect) {
  return tokenRequest(env, { grant_type: 'authorization_code', code, redirect_uri: redirect });
}
