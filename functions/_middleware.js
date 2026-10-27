// One canonical address: duplicate hosts move to burak.pm, and old links like /?lang=tr move to the clean language URLs.
const DUPLICATE_HOSTS = new Set(['www.burak.pm', 'burakpm.pages.dev']);

export async function onRequest({ request, next }) {
  const url = new URL(request.url);
  if (DUPLICATE_HOSTS.has(url.hostname)) {
    return Response.redirect('https://burak.pm' + url.pathname + url.search, 301);
  }
  if (url.pathname === '/' && url.searchParams.has('lang')) {
    const lang = url.searchParams.get('lang');
    url.searchParams.delete('lang');
    url.pathname = lang === 'tr' ? '/tr' : '/';
    return Response.redirect(url.toString(), 301);
  }
  return next();
}
