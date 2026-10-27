// Public health check: one yes or no, cached for ten minutes.
// The detailed breakdown lives in the admin panel.
import { json, cached } from '../_lib/http.js';
import { runChecks } from '../_lib/checks.js';

export async function onRequestGet(ctx) {
  return cached(ctx, '/__cache/health', 600, async () => {
    const { ok } = await runChecks(ctx.env);
    return json({ ok }, ok ? 200 : 503);
  }, { any: true });
}
