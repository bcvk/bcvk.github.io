// Runs only for "/" and /api/* (see site/_routes.json); static files never wake a Function.
// www.burak.pm is redirected by a Cloudflare Redirect Rule before it reaches Pages.
const DUPLICATE_HOSTS = new Set(['www.burak.pm', 'burakpm.pages.dev']);
const isDuplicate = (host) => DUPLICATE_HOSTS.has(host) || host.endsWith('.burakpm.pages.dev');

export async function onRequest({ request, next }) {
  const url = new URL(request.url);
  if (isDuplicate(url.hostname)) {
    return Response.redirect('https://burak.pm' + url.pathname + url.search, 301);
  }
  // Old links like /?lang=tr move to the clean language URLs.
  if (url.pathname === '/' && url.searchParams.has('lang')) {
    const lang = url.searchParams.get('lang');
    url.searchParams.delete('lang');
    url.pathname = lang === 'tr' ? '/tr' : '/';
    return Response.redirect(url.toString(), 301);
  }
  const res = await next();
  if (url.pathname.startsWith('/api/')) {
    // _headers does not apply to Function responses, so the essentials are set here.
    const out = new Response(res.body, res);
    out.headers.set('X-Robots-Tag', 'noindex');
    out.headers.set('X-Content-Type-Options', 'nosniff');
    out.headers.set('X-Frame-Options', 'DENY');
    out.headers.set('Referrer-Policy', 'no-referrer');
    out.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    if ((out.headers.get('Content-Type') || '').startsWith('text/html')) {
      out.headers.set('Content-Security-Policy', "default-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'; object-src 'none'");
    }
    return out;
  }
  return res;
}
