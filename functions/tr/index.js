// Serves the Turkish version of the home page at /tr.
// Same HTML as "/", rewritten on the edge so search engines and link previews see Turkish.
const META = {
  title: 'Burak Çevik | Müşteri deneyimi operasyonu ve otomasyon',
  description: 'Burak Çevik çok dilli müşteri destek ekiplerini yönetiyor ve tekrarlayan işleri insanların üzerinden alan otomasyonlar kuruyor. Ankara merkezli, uzaktan çalışıyor.',
  ogTitle: 'Burak Çevik',
  ogDescription: 'İnsanları doğru cevaba ulaştırırım. Çok dilli destek operasyonu, ekip liderliği ve otomasyon.',
  url: 'https://burak.pm/tr',
  image: 'https://burak.pm/assets/og-tr.png'
};

const set = (attr, value) => ({ element(e) { e.setAttribute(attr, value); } });

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  if (url.pathname !== '/tr') return Response.redirect(new URL('/tr' + url.search, url).toString(), 301);
  const page = await env.ASSETS.fetch(new URL('/', url));
  const out = new HTMLRewriter()
    .on('html', set('lang', 'tr'))
    .on('title', { element(e) { e.setInnerContent(META.title); } })
    .on('meta[name="description"]', set('content', META.description))
    .on('link[rel="canonical"]', set('href', META.url))
    .on('meta[property="og:url"]', set('content', META.url))
    .on('meta[property="og:title"]', set('content', META.ogTitle))
    .on('meta[property="og:description"]', set('content', META.ogDescription))
    .on('meta[property="og:image"]', set('content', META.image))
    .on('meta[property="og:locale"]', set('content', 'tr_TR'))
    .transform(page);
  const headers = new Headers(out.headers);
  headers.set('Cache-Control', 'public, max-age=0, must-revalidate');
  headers.set('Content-Language', 'tr');
  return new Response(out.body, { status: page.status, headers });
}
