// Runs before first paint so theme and language never flash.
(function () {
  var root = document.documentElement;
  function read(key) { try { return localStorage.getItem(key); } catch (e) { return null; } }
  var theme = read('bp-theme');
  if (theme !== 'light' && theme !== 'dark') {
    theme = window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  root.setAttribute('data-theme', theme);
  // /tr always means Turkish; otherwise ?lang, then the saved choice, then the browser.
  var q = /^\/tr\/?$/.test(location.pathname) ? 'tr' : new URLSearchParams(location.search).get('lang');
  var lang = q === 'tr' || q === 'en' ? q : read('bp-lang');
  if (lang !== 'tr' && lang !== 'en') {
    lang = /^tr\b/i.test(navigator.language || '') ? 'tr' : 'en';
  }
  root.setAttribute('lang', lang);
  // Turkish letters (ş, ğ, İ) live in the latin-ext font files, so fetch them early for Turkish.
  if (lang === 'tr') {
    ['bricolage-grotesque-latin-ext-standard-normal', 'schibsted-grotesk-latin-ext-wght-normal'].forEach(function (f) {
      var l = document.createElement('link');
      l.rel = 'preload'; l.as = 'font'; l.type = 'font/woff2'; l.crossOrigin = 'anonymous';
      l.href = '/assets/fonts/' + f + '.woff2';
      document.head.appendChild(l);
    });
  }
  root.classList.add('js');
})();
