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

// Visitor key for rate limits and de-duplication: HMAC of the IP, never the IP itself.
export async function visitorKey(env, request, scope) {
  const ip = request.headers.get('CF-Connecting-IP') || '';
  if (!ip || !env.IP_HASH_KEY) return null;
  return (await hmac(env.IP_HASH_KEY, scope + '|' + ip)).slice(0, 40);
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
