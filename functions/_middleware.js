// Old links like /?lang=tr move to the clean language URLs.
export async function onRequest({ request, next }) {
  const url = new URL(request.url);
  if (url.pathname === '/' && url.searchParams.has('lang')) {
    const lang = url.searchParams.get('lang');
    url.searchParams.delete('lang');
    url.pathname = lang === 'tr' ? '/tr' : '/';
    return Response.redirect(url.toString(), 301);
  }
  return next();
}
