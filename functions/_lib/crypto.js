// Keyed hashing, random tokens and small symmetric encryption for stored secrets.
const enc = new TextEncoder();
const keys = new Map();

const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
const b64url = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64url = (s) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4)), (c) => c.charCodeAt(0));

async function hmacKey(secret) {
  if (!keys.has(secret)) {
    keys.set(secret, crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']));
  }
  return keys.get(secret);
}

// HMAC SHA256, hex. Without the secret the value cannot be reversed or recomputed.
export async function hmac(secret, text) {
  const sig = await crypto.subtle.sign('HMAC', await hmacKey(secret), enc.encode(text));
  return hex(sig);
}

export async function sha256(text) {
  return hex(await crypto.subtle.digest('SHA-256', enc.encode(text)));
}

export function randomToken(bytes = 32) {
  return b64url(crypto.getRandomValues(new Uint8Array(bytes)));
}

// Constant time comparison for two strings of hex or base64url.
export function same(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

// One IPv6 customer usually owns a whole /64 and can pick a new address for every request,
// so IPv6 visitors are identified by their /64 prefix. IPv4 addresses are used as they are.
export function ipUnit(ip) {
  if (!ip.includes(':')) return ip;
  const v4 = ip.match(/(\d{1,3}(?:\.\d{1,3}){3})$/);
  if (v4) return v4[1]; // IPv4 mapped address
  const [head, tail] = ip.toLowerCase().split('::');
  const h = head ? head.split(':') : [];
  const t = tail ? tail.split(':') : [];
  const groups = tail === undefined ? h : [...h, ...Array(Math.max(0, 8 - h.length - t.length)).fill('0'), ...t];
  if (groups.length !== 8) return ip;
  return groups.slice(0, 4).map((g) => (parseInt(g, 16) || 0).toString(16)).join(':') + '::/64';
}

// Visitor key for rate limits and de-duplication: HMAC of the IP, never the IP itself.
export async function visitorKey(env, request, scope) {
  const ip = request.headers.get('CF-Connecting-IP') || '';
  if (!ip || !env.IP_HASH_KEY) return null;
  return (await hmac(env.IP_HASH_KEY, scope + '|' + ipUnit(ip))).slice(0, 40);
}

async function aesKey(secret) {
  const raw = await crypto.subtle.digest('SHA-256', enc.encode('burak.pm settings|' + secret));
  return crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['encrypt', 'decrypt']);
}

export async function seal(secret, text) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await aesKey(secret), enc.encode(text));
  return b64url(iv) + '.' + b64url(ct);
}

export async function open(secret, sealed) {
  const [iv, ct] = String(sealed || '').split('.');
  if (!iv || !ct) return null;
  try {
    const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64url(iv) }, await aesKey(secret), unb64url(ct));
    return new TextDecoder().decode(pt);
  } catch {
    return null;
  }
}
