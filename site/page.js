// Small helper for static pages (project pages, project list): theme toggle and a sticky top bar.
(() => {
  'use strict';
  const root = document.documentElement;
  const btn = document.querySelector('[data-action="theme"]');
  if (btn) btn.addEventListener('click', () => {
    const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    const apply = () => root.setAttribute('data-theme', next);
    if (document.startViewTransition && !matchMedia('(prefers-reduced-motion: reduce)').matches) document.startViewTransition(apply); else apply();
    try { localStorage.setItem('bp-theme', next); } catch (e) { /* private mode */ }
  });
  // The language link remembers the choice, like the toggle on the home page.
  document.querySelectorAll('[data-lang-link]').forEach((a) => a.addEventListener('click', () => {
    try { localStorage.setItem('bp-lang', a.dataset.langLink); } catch (e) { /* private mode */ }
  }));
  // Project videos play only while visible and never for reduced motion.
  const v = document.querySelector('.pp__art video');
  if (v && !matchMedia('(prefers-reduced-motion: reduce)').matches && 'IntersectionObserver' in window) {
    new IntersectionObserver(([en]) => { if (en.isIntersecting) { const p = v.play(); if (p && p.catch) p.catch(() => {}); } else v.pause(); }, { threshold: 0.25 }).observe(v);
  }
})();
