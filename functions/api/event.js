// Anonymous tally: how often each section is seen and each main button is pressed, per day.
// The page sends the names it collected in one small request when it is hidden or closed.
// Only names from the fixed list below are counted, so the table cannot grow beyond
// (days x names x 2 languages). Nothing about the visitor is stored.
// The numbers are for the owner's eyes only and can be inflated by a determined script;
// the zone rate limit caps each IP, and no decision depends on them being exact.
import { json, badOrigin, readJson, isJson } from '../_lib/http.js';

const VIEWS = ['work', 'path', 'projects', 'now', 'visits', 'contact'];
const CLICKS = ['cta-work', 'cta-contact', 'project-dash', 'project-chip', 'project-minik', 'project-tamga', 'tune', 'tune-send', 'booking', 'linkedin', 'github', 'contact-send'];
export const EVENT_NAMES = new Set(['load', ...VIEWS.map((v) => 'view-' + v), ...CLICKS.map((c) => 'click-' + c)]);

export async function onRequestPost({ request, env }) {
  if (!env.DB) return json({ ok: false }, 503);
  // Browsers always send Origin on a POST; requiring it here keeps plain scripts out.
  if (!request.headers.get('Origin') || badOrigin(request) || !isJson(request)) return json({ ok: false, error: 'origin' }, 403);
  const d = await readJson(request, 2000);
  if (!d || !Array.isArray(d.e)) return json({ ok: false, error: 'bad_request' }, 400);
  const names = [...new Set(d.e.filter((n) => typeof n === 'string' && EVENT_NAMES.has(n)))].slice(0, 20);
  if (!names.length) return json({ ok: true });
  const lang = d.l === 'tr' ? 'tr' : 'en';
  const day = new Date().toISOString().slice(0, 10);
  try {
    await env.DB.batch(names.map((n) => env.DB.prepare(
      'INSERT INTO events (day, name, lang, count) VALUES (?1, ?2, ?3, 1) ON CONFLICT(day, name, lang) DO UPDATE SET count = count + 1'
    ).bind(day, n, lang)));
  } catch (e) { /* counting is best effort */ }
  return json({ ok: true });
}
