// Runs before first paint so theme and language never flash.
(function () {
  var root = document.documentElement;
  function read(key) { try { return localStorage.getItem(key); } catch (e) { return null; } }
  var theme = read('bp-theme');
  if (theme !== 'light' && theme !== 'dark') {
    theme = window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  root.setAttribute('data-theme', theme);
  var q = new URLSearchParams(location.search).get('lang');
  var lang = q === 'tr' || q === 'en' ? q : read('bp-lang');
  if (lang !== 'tr' && lang !== 'en') {
    lang = /^tr\b/i.test(navigator.language || '') ? 'tr' : 'en';
  }
  root.setAttribute('lang', lang);
  root.classList.add('js');
})();
