// Build for Cloudflare Pages: copies site/ to dist/ and generates the pages that should
// exist as real HTML for search engines and link previews.
//   dist/tr.html                     Turkish home page, fully translated at build time
//   dist/projects.html               project list (EN) and dist/tr/projeler.html (TR)
//   dist/projects/<slug>.html        one page per project (EN) and dist/tr/projeler/<slug>.html (TR)
//   dist/sitemap.xml, dist/llms.txt
// Asset links get a content hash (?v=...) so the one year cache in _headers is safe.
// No dependencies: run with `node scripts/build.mjs`.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import crypto from 'node:crypto';
import { execSync } from 'node:child_process';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const SRC = path.join(ROOT, 'site');
const OUT = path.join(ROOT, 'dist');
const SITE = 'https://burak.pm';
const ME = `${SITE}/#burak`;

/* ------------------------------------------------------------------ setup */
fs.rmSync(OUT, { recursive: true, force: true });
fs.cpSync(SRC, OUT, { recursive: true });

const sandbox = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(SRC, 'content.js'), 'utf8'), sandbox);
const { T, P } = sandbox.window.BP;
const project = (i, lang) => Object.assign({}, P.en[i], lang === 'tr' ? P.tr[i] : {});
const projects = (lang) => P.en.map((_, i) => project(i, lang));
const projectPath = (p, lang) => (lang === 'tr' ? `/tr/projeler/${p.slugTr}` : `/projects/${p.slug}`);
const listPath = (lang) => (lang === 'tr' ? '/tr/projeler' : '/projects');
const homePath = (lang) => (lang === 'tr' ? '/tr' : '/');
const t = (lang, k) => (T[lang][k] !== undefined ? T[lang][k] : T.en[k]);

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const ldJson = (obj) => JSON.stringify(obj).replace(/</g, '\\u003c');
const write = (rel, text) => { const f = path.join(OUT, rel); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, text); };
const exists = (rel) => fs.existsSync(path.join(OUT, rel));

function lastmod(...files) {
  try {
    const d = execSync(`git log -1 --format=%cs -- ${files.map((f) => JSON.stringify(f)).join(' ')}`, { cwd: ROOT, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
  } catch (e) { /* not a git checkout */ }
  return new Date().toISOString().slice(0, 10);
}

/* --------------------------------------------------------- cache busting */
const hashes = {};
for (const f of fs.readdirSync(SRC)) {
  if (/\.(js|css)$/.test(f)) hashes[f] = crypto.createHash('sha256').update(fs.readFileSync(path.join(SRC, f))).digest('hex').slice(0, 10);
}
const stamp = (html) => html.replace(/(["'])\/([a-z0-9]+\.(?:js|css))\?v=[^"']*\1/g, (m, q, f) => (hashes[f] ? `${q}/${f}?v=${hashes[f]}${q}` : m));

/* --------------------------------------------------------- shared bits */
const PERSON = {
  '@type': 'Person', '@id': ME, name: 'Burak Çevik', alternateName: ['Burak Cevik', 'bcvk'],
  givenName: 'Burak', familyName: 'Çevik', url: `${SITE}/`, image: `${SITE}/assets/burak.jpg`,
  jobTitle: 'Assistant Project Manager', worksFor: { '@type': 'Organization', name: 'ModSquad', url: 'https://modsquad.com' },
  sameAs: ['https://www.linkedin.com/in/bcvk', 'https://github.com/bcvk', 'https://usetamga.com']
};

const ogImage = (p, lang) => {
  const rel = `/assets/og/${p.id}-${lang}.png`;
  return exists(rel) ? SITE + rel : `${SITE}/assets/${lang === 'tr' ? 'og-tr' : 'og'}.png`;
};

function head({ lang, title, description, canonical, alternates, image, type = 'website', ld }) {
  const alt = alternates ? `
<link rel="alternate" hreflang="en" href="${SITE}${alternates.en}">
<link rel="alternate" hreflang="tr" href="${SITE}${alternates.tr}">
<link rel="alternate" hreflang="x-default" href="${SITE}${alternates.en}">` : '';
  return `<!doctype html>
<html lang="${lang}" data-theme="light" data-lang-fixed>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta name="author" content="Burak Çevik">
<meta name="robots" content="index, follow, max-image-preview:large">
<link rel="canonical" href="${SITE}${canonical}">${alt}
<meta name="theme-color" content="#E9ECF2" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#10131F" media="(prefers-color-scheme: dark)">
<meta property="og:type" content="${type}">
<meta property="og:site_name" content="Burak Çevik">
<meta property="og:url" content="${SITE}${canonical}">
<meta property="og:locale" content="${lang === 'tr' ? 'tr_TR' : 'en_US'}">
<meta property="og:locale:alternate" content="${lang === 'tr' ? 'en_US' : 'tr_TR'}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:image" content="${image}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/assets/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
<link rel="preload" href="/assets/fonts/bricolage-grotesque-latin-standard-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/assets/fonts/schibsted-grotesk-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/styles.css?v=1">
<script src="/boot.js?v=1"></script>
<script type="application/ld+json">${ldJson({ '@context': 'https://schema.org', '@graph': ld })}</script>
</head>`;
}

const ICON_SUN = '<svg class="i-sun" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.4M12 19.1v2.4M2.5 12h2.4M19.1 12h2.4M5.3 5.3l1.7 1.7M17 17l1.7 1.7M5.3 18.7 7 17M17 7l1.7-1.7"/></svg>';
const ICON_MOON = '<svg class="i-moon" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.6A8.2 8.2 0 0 1 9.4 4a8.2 8.2 0 1 0 10.6 10.6Z"/></svg>';

function topbar(lang, other) {
  const L = lang === 'tr';
  return `<header class="topbar">
  <a class="brand" href="${homePath(lang)}" aria-label="${L ? 'burak.pm ana sayfa' : 'burak.pm home'}"><span class="brand__mark" aria-hidden="true">b</span><span class="brand__name">burak<b>.pm</b></span></a>
  <nav class="nav" aria-label="${L ? 'Sayfalar' : 'Pages'}">
    <a href="${listPath(lang)}">${esc(t(lang, 'nav.projects'))}</a>
    <a href="${homePath(lang)}#now">${esc(t(lang, 'nav.now'))}</a>
    <a href="${homePath(lang)}#contact">${esc(t(lang, 'nav.contact'))}</a>
  </nav>
  <div class="tools">
    <a class="tool" href="${other}" hreflang="${L ? 'en' : 'tr'}" lang="${L ? 'en' : 'tr'}" data-lang-link="${L ? 'en' : 'tr'}" aria-label="${L ? 'Switch to English' : 'Türkçeye geç'}">${L ? 'EN' : 'TR'}</a>
    <button class="tool" type="button" data-action="theme" aria-label="${L ? 'Temayı değiştir' : 'Switch theme'}">${ICON_SUN}${ICON_MOON}</button>
  </div>
</header>`;
}

function footer(lang) {
  return `<footer class="footer">
  <p>${lang === 'tr' ? '© 2026 Burak Çevik. Ankara’da tasarlanıp kodlandı.' : '© 2026 Burak Çevik. Designed and built in Ankara.'}</p>
  <p class="footer__links"><a href="${homePath(lang)}">burak.pm</a><a href="${lang === 'tr' ? '/privacy?lang=tr' : '/privacy'}">${esc(t(lang, 'footer.privacy'))}</a></p>
</footer>
<script src="/page.js?v=1" defer></script>
</body>
</html>
`;
}

const media = (p, cls = '') => p.video
  ? `<video class="${cls}" muted loop playsinline preload="metadata" poster="/assets/art/${p.id}-poster.jpg" aria-label="${esc(p.title)}"><source src="/assets/art/${p.id}.webm" type="video/webm"><source src="/assets/art/${p.id}.mp4" type="video/mp4"></video>`
  : `<img class="${cls}" src="/assets/art/${p.id}.webp" alt="${esc(p.title)}: ${esc(p.blurb)}" width="1053" height="540" decoding="async">`;

function grid(list, lang) {
  return `<ul class="pgrid">${list.map((p) => `
  <li><a href="${projectPath(p, lang)}"><img src="/assets/art/${p.id}.webp" alt="" loading="lazy" decoding="async"><span><b>${esc(p.title)}</b><span>${esc(p.blurb)}</span></span></a></li>`).join('')}
</ul>`;
}

/* --------------------------------------------------------- project pages */
function projectPage(i, lang) {
  const L = lang === 'tr';
  const p = project(i, lang);
  const other = projectPath(project(i, L ? 'en' : 'tr'), L ? 'en' : 'tr');
  const url = projectPath(p, lang);
  const title = `${p.title} | Burak Çevik`;
  const description = p.blurb;
  const crumbsName = t(lang, 'nav.projects');
  const ld = [
    { ...PERSON },
    {
      '@type': p.id === 'tamga' ? 'SoftwareApplication' : 'CreativeWork',
      '@id': `${SITE}${url}#work`, name: p.title, headline: p.title, description: p.blurb,
      abstract: p.lede, url: `${SITE}${url}`, inLanguage: lang, image: ogImage(p, lang),
      keywords: p.tags.join(', '), author: { '@id': ME }, creator: { '@id': ME },
      isPartOf: { '@id': `${SITE}/#site` },
      ...(p.id === 'tamga' ? { applicationCategory: 'BusinessApplication', operatingSystem: 'Web', sameAs: p.link } : {})
    },
    { '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Burak Çevik', item: `${SITE}${homePath(lang)}` },
      { '@type': 'ListItem', position: 2, name: crumbsName, item: `${SITE}${listPath(lang)}` },
      { '@type': 'ListItem', position: 3, name: p.title, item: `${SITE}${url}` }
    ] }
  ];
  const others = projects(lang).filter((x) => x.id !== p.id);
  return head({ lang, title, description, canonical: url, alternates: { en: projectPath(project(i, 'en'), 'en'), tr: projectPath(project(i, 'tr'), 'tr') }, image: ogImage(p, lang), type: 'article', ld }) + `
<body class="pp-page">
<a class="skip" href="#main">${esc(t(lang, 'skip'))}</a>
${topbar(lang, other)}
<nav class="crumbs" aria-label="${L ? 'Konum' : 'Breadcrumb'}"><ol>
  <li><a href="${homePath(lang)}">Burak Çevik</a></li>
  <li><a href="${listPath(lang)}">${esc(crumbsName)}</a></li>
  <li aria-current="page">${esc(p.title)}</li>
</ol></nav>
<main id="main">
  <article class="pp${p.tone ? ' pp--' + p.tone : ''}">
    <div class="pp__text">
      ${p.noai ? `<p class="pp__kicker"><span class="noai">${esc(t(lang, 'card.noai'))}</span></p>` : ''}
      <h1>${esc(p.title)}</h1>
      <p class="pp__lede">${esc(p.lede)}</p>
      <div class="pp__case">
        <h2>${esc(t(lang, 'sheet.problem'))}</h2>
        <p>${esc(p.problem)}</p>
        <h2>${esc(t(lang, 'sheet.built'))}</h2>
        <ul class="sheet__points">${p.points.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
        <h2>${esc(t(lang, 'sheet.result'))}</h2>
        <p>${esc(p.result)}</p>
      </div>
      <ul class="tags pp__tags">${p.tags.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
      <div class="pp__foot">
        ${p.link ? `<a class="btn btn--solid" href="${esc(p.link)}" target="_blank" rel="noopener">${esc(t(lang, 'card.visit'))}</a>` : ''}
        <a class="btn ${p.link ? 'btn--ghost' : 'btn--solid'}" href="${homePath(lang)}#contact">${esc(t(lang, 'hero.cta2'))}</a>
        <a class="btn btn--ghost" href="${listPath(lang)}">${esc(t(lang, 'projects.all'))}</a>
      </div>
    </div>
    <figure class="pp__art" aria-hidden="${p.video ? 'false' : 'true'}">${media(p)}</figure>
  </article>
  <section class="pp-more" aria-labelledby="more-title">
    <h2 id="more-title">${L ? 'Diğer projeler' : 'More things I have built'}</h2>
    ${grid(others, lang)}
  </section>
</main>
${footer(lang)}`;
}

function listPage(lang) {
  const L = lang === 'tr';
  const url = listPath(lang);
  const title = L ? 'Projeler | Burak Çevik' : "Projects | Burak Çevik";
  const description = L
    ? 'Burak Çevik’in kurduğu araçlar: destek ekipleri için paneller, geri bildirim platformları, yapay zekâ destekli koçluk formları, donanım prototipleri ve Tamga.'
    : 'Tools Burak Çevik has built: dashboards and feedback platforms for support teams, AI assisted coaching forms, hardware prototypes and Tamga.';
  const list = projects(lang);
  const ld = [
    { ...PERSON },
    { '@type': 'CollectionPage', '@id': `${SITE}${url}#page`, url: `${SITE}${url}`, name: title, description, inLanguage: lang, about: { '@id': ME },
      mainEntity: { '@type': 'ItemList', itemListElement: list.map((p, n) => ({ '@type': 'ListItem', position: n + 1, url: `${SITE}${projectPath(p, lang)}`, name: p.title })) } },
    { '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Burak Çevik', item: `${SITE}${homePath(lang)}` },
      { '@type': 'ListItem', position: 2, name: t(lang, 'nav.projects'), item: `${SITE}${url}` }
    ] }
  ];
  return head({ lang, title, description, canonical: url, alternates: { en: listPath('en'), tr: listPath('tr') }, image: `${SITE}/assets/${L ? 'og-tr' : 'og'}.png`, ld }) + `
<body class="pi-page">
<a class="skip" href="#main">${esc(t(lang, 'skip'))}</a>
${topbar(lang, listPath(L ? 'en' : 'tr'))}
<nav class="crumbs" aria-label="${L ? 'Konum' : 'Breadcrumb'}"><ol>
  <li><a href="${homePath(lang)}">Burak Çevik</a></li>
  <li aria-current="page">${esc(t(lang, 'nav.projects'))}</li>
</ol></nav>
<main id="main" class="pi">
  <h1>${esc(t(lang, 'projects.title'))}</h1>
  <p>${esc(t(lang, 'projects.lede'))}</p>
  ${grid(list, lang)}
</main>
${footer(lang)}`;
}

/* --------------------------------------------------------- home pages */
function cards(lang) {
  return projects(lang).map((p, i) => `<a class="card card--${p.size}${p.tone ? ' card--' + p.tone : ''}" href="${projectPath(p, lang)}" data-cats="${p.cats.join(' ')}" style="--d:${i}">
        <span class="card__spot"></span>
        <span class="card__art" aria-hidden="true"><img src="/assets/art/${p.id}.webp" alt="" loading="lazy" decoding="async"></span>
        <span class="card__text"><h3>${esc(p.title)}</h3><p>${esc(p.blurb)}</p>
        <span class="card__foot"><span class="card__more">${esc(t(lang, 'card.more'))}</span>${p.noai ? `<span class="noai">${esc(t(lang, 'card.noai'))}</span>` : ''}</span></span></a>`).join('\n      ');
}

function fillHome(html, lang) {
  const steps = t(lang, 'path.steps');
  html = html.replace('<div class="bento" data-projects></div>', `<div class="bento" data-projects>\n      ${cards(lang)}\n    </div>`);
  html = html.replace('<p class="path__when" data-path-when></p>', `<p class="path__when" data-path-when>${esc(steps[2][0])}</p>`);
  html = html.replace('<p class="path__text" data-path-text></p>', `<p class="path__text" data-path-text>${esc(steps[2][1])}</p>`);
  return html;
}

const HOME_TR = {
  title: 'Burak Çevik | Müşteri deneyimi operasyonu ve otomasyon',
  description: 'Burak Çevik çok dilli müşteri destek ekiplerini yönetiyor ve tekrarlayan işleri insanların üzerinden alan otomasyonlar kuruyor. Ankara merkezli, uzaktan çalışıyor.',
  ogDescription: 'İnsanları doğru cevaba ulaştırırım. Çok dilli destek operasyonu, ekip liderliği ve otomasyon.',
  person: 'ModSquad’da çok dilli müşteri destek ekiplerini yöneten ve otomasyon kuran müşteri deneyimi operasyonu yöneticisi. Ankara, Türkiye.'
};

function setAttr(html, selectorRe, value) {
  const before = html;
  html = html.replace(selectorRe, (m, a, b) => `${a}${esc(value)}${b}`);
  if (html === before) throw new Error('build: pattern not found ' + selectorRe);
  return html;
}

function turkishHome(enHtml) {
  let html = enHtml;
  html = html.replace('<html lang="en"', '<html lang="tr" data-lang-fixed');
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${esc(HOME_TR.title)}</title>`);
  html = setAttr(html, /(<meta name="description" content=")[^"]*(")/, HOME_TR.description);
  html = setAttr(html, /(<link rel="canonical" href=")[^"]*(")/, `${SITE}/tr`);
  html = setAttr(html, /(<meta property="og:url" content=")[^"]*(")/, `${SITE}/tr`);
  html = setAttr(html, /(<meta property="og:locale" content=")[^"]*(")/, 'tr_TR');
  html = setAttr(html, /(<meta property="og:locale:alternate" content=")[^"]*(")/, 'en_US');
  html = setAttr(html, /(<meta property="og:description" content=")[^"]*(")/, HOME_TR.ogDescription);
  html = setAttr(html, /(<meta property="og:image" content=")[^"]*(")/, `${SITE}/assets/og-tr.png`);
  // Structured data in Turkish.
  html = html.replace(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/, (m, j) => {
    const data = JSON.parse(j);
    for (const node of data['@graph']) {
      if (node['@type'] === 'Person') node.description = HOME_TR.person;
      if (node['@type'] === 'ProfilePage') { node['@id'] = `${SITE}/tr#page`; node.url = `${SITE}/tr`; node.inLanguage = 'tr'; }
    }
    return `<script type="application/ld+json">${ldJson(data)}</script>`;
  });
  // Every plain text element marked with data-i18n gets its Turkish copy.
  html = html.replace(/<([a-z0-9]+)(\s[^>]*?\bdata-i18n="([^"]+)"[^>]*)>([^<]*)<\/\1>/g, (m, tag, attrs, key, inner) => {
    if (/\bdata-dual\b/.test(attrs)) return m;
    const v = T.tr[key];
    return typeof v === 'string' ? `<${tag}${attrs}>${esc(v)}</${tag}>` : m;
  });
  html = html.replace('<span data-lang-label>TR</span>', '<span data-lang-label>EN</span>');
  html = html.replace(/href="\/privacy"/g, 'href="/privacy?lang=tr"');
  html = html.replace(/<div class="bento" data-projects>[\s\S]*?\n    <\/div>/, `<div class="bento" data-projects>\n      ${cards('tr')}\n    </div>`);
  const steps = T.tr['path.steps'];
  html = html.replace(/(<p class="path__when" data-path-when>)[^<]*(<\/p>)/, `$1${esc(steps[2][0])}$2`);
  html = html.replace(/(<p class="path__text" data-path-text>)[^<]*(<\/p>)/, `$1${esc(steps[2][1])}$2`);
  return html;
}

const enHome = fillHome(fs.readFileSync(path.join(SRC, 'index.html'), 'utf8'), 'en');
write('index.html', stamp(enHome));
write('tr.html', stamp(turkishHome(enHome)));

for (let i = 0; i < P.en.length; i++) {
  for (const lang of ['en', 'tr']) write(projectPath(project(i, lang), lang).slice(1) + '.html', stamp(projectPage(i, lang)));
}
write('projects.html', stamp(listPage('en')));
write('tr/projeler.html', stamp(listPage('tr')));

for (const f of ['privacy.html', '404.html', 'admin.html']) write(f, stamp(fs.readFileSync(path.join(SRC, f), 'utf8')));

/* --------------------------------------------------------- sitemap */
const homeDate = lastmod('site/index.html', 'site/content.js', 'site/app.js');
const contentDate = lastmod('site/content.js', 'scripts/build.mjs');
const pairs = [
  { en: '/', tr: '/tr', date: homeDate, priority: '1.0' },
  { en: listPath('en'), tr: listPath('tr'), date: contentDate, priority: '0.8' },
  ...P.en.map((_, i) => ({ en: projectPath(project(i, 'en'), 'en'), tr: projectPath(project(i, 'tr'), 'tr'), date: contentDate, priority: '0.7' }))
];
const alt = (pr) => `
    <xhtml:link rel="alternate" hreflang="en" href="${SITE}${pr.en}"/>
    <xhtml:link rel="alternate" hreflang="tr" href="${SITE}${pr.tr}"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${SITE}${pr.en}"/>`;
const urls = pairs.flatMap((pr) => ['en', 'tr'].map((l) => `  <url>
    <loc>${SITE}${pr[l]}</loc>
    <lastmod>${pr.date}</lastmod>
    <priority>${l === 'en' ? pr.priority : (Number(pr.priority) - 0.1).toFixed(1)}</priority>${alt(pr)}
  </url>`));
urls.push(`  <url>
    <loc>${SITE}/privacy</loc>
    <lastmod>${lastmod('site/privacy.html')}</lastmod>
    <priority>0.3</priority>
  </url>`);
write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join('\n')}
</urlset>
`);

/* --------------------------------------------------------- llms.txt */
write('llms.txt', `# Burak Çevik

> Burak Çevik (also written Burak Cevik) leads multilingual customer support teams as an Assistant Project Manager at ModSquad and builds the automations that take repetitive work off his team. Based in Ankara, Türkiye, working remotely. He speaks Turkish (native), English (C2) and Spanish, studies international trade and logistics at Hitit University and is building Tamga, an AI product for cross border trade. His rule: internal and customer data never goes into AI tools.

## Pages

- [Home (English)](${SITE}/): who he is, what he does, his path and current focus
- [Ana sayfa (Türkçe)](${SITE}/tr): the same in Turkish
- [Projects](${SITE}/projects): everything he has built, with a page per project
- [Projeler](${SITE}/tr/projeler): the project list in Turkish
- [Privacy](${SITE}/privacy): what the site collects and how long it keeps it

## Projects

${projects('en').map((p) => `- [${p.title}](${SITE}${projectPath(p, 'en')}): ${p.blurb}`).join('\n')}

## Elsewhere

- LinkedIn: https://www.linkedin.com/in/bcvk
- GitHub: https://github.com/bcvk
- Tamga: https://usetamga.com
- Contact: hello@burak.pm
`);

const count = fs.readdirSync(OUT, { recursive: true }).filter((f) => f.endsWith('.html')).length;
console.log(`built ${count} html files into dist/`);
