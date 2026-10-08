// Language toggle for simple document pages (privacy). Both languages ship in the HTML.
(() => {
  'use strict';
  const root = document.documentElement;
  const titles = { en: 'Privacy | burak.pm', tr: 'Gizlilik | burak.pm' };
  const label = document.querySelector('[data-doc-lang-label]');
  const home = document.querySelector('[data-doc-home]');
  function apply(lang) {
    root.setAttribute('lang', lang);
    document.title = titles[lang];
    label.textContent = lang === 'tr' ? 'EN' : 'TR';
    if (home) home.href = lang === 'tr' ? '/tr' : '/';
  }
  apply(root.getAttribute('lang') === 'tr' ? 'tr' : 'en');
  document.querySelector('[data-doc-lang]').addEventListener('click', () => {
    const next = root.getAttribute('lang') === 'tr' ? 'en' : 'tr';
    try { localStorage.setItem('bp-lang', next); } catch (e) { /* private mode */ }
    apply(next);
  });
})();
