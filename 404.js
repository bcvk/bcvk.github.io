(() => {
  'use strict';
  const $ = (s) => document.querySelector(s);
  const root = document.documentElement;
  const store = { get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* ignore */ } } };
  const T = {
    en: { title: 'This message landed in the wrong queue.', lede: 'The page you were looking for has moved or never existed. Let me route you somewhere useful.',
      home: 'Back to the homepage', projects: 'Projects', now: "What I'm doing now", contact: 'Write to me',
      game: "While you're here, clear the queue", rules: 'Tickets keep coming in. Click each one before its timer runs out. You have 30 seconds.',
      score: 'Resolved', missed: 'Missed', time: 'Time', best: 'Best', start: 'Start', again: 'Play again',
      end: 'You resolved {s} tickets.', record: 'New personal best: {s} tickets!', doc: 'Page not found | burak.pm',
      msgs: ['Where is my order?', "I can't log in", 'Charged twice?', 'App keeps freezing', 'Change my plan', 'Thanks!', 'Password reset', 'Refund please'] },
    tr: { title: 'Bu mesaj yanlış kuyruğa düştü.', lede: 'Aradığın sayfa taşınmış ya da hiç var olmamış. Seni işe yarar bir yere yönlendireyim.',
      home: 'Ana sayfaya dön', projects: 'Projeler', now: 'Şu sıralar', contact: 'Bana yaz',
      game: 'Madem buradasın, kuyruğu temizle', rules: 'Mesajlar art arda geliyor. Süresi dolmadan her birine tıkla. 30 saniyen var.',
      score: 'Çözülen', missed: 'Kaçan', time: 'Süre', best: 'Rekor', start: 'Başla', again: 'Tekrar oyna',
      end: '{s} mesaj çözdün.', record: 'Yeni rekor: {s} mesaj!', doc: 'Sayfa bulunamadı | burak.pm',
      msgs: ['Siparişim nerede?', 'Giriş yapamıyorum', 'İki kez ücret?', 'Uygulama donuyor', 'Plan değişikliği', 'Teşekkürler!', 'Şifre sıfırlama', 'İade istiyorum'] }
  };
  let lang = root.getAttribute('lang') === 'tr' ? 'tr' : 'en';
  const t = (k) => T[lang][k];
  function applyLang() {
    root.setAttribute('lang', lang); document.title = t('doc');
    document.querySelectorAll('[data-t]').forEach((el) => { el.textContent = t(el.dataset.t); });
    $('[data-lost-lang-label]').textContent = lang === 'tr' ? 'EN' : 'TR';
    if (!game.running && game.played) $('[data-g-start]').textContent = t('again');
  }
  $('[data-lost-lang]').addEventListener('click', () => { lang = lang === 'tr' ? 'en' : 'tr'; store.set('bp-lang', lang); applyLang(); });

  /* clear the queue */
  const cv = $('.game__canvas'), cx = cv.getContext('2d');
  const css = (n) => getComputedStyle(root).getPropertyValue(n).trim();
  const game = { running: false, played: false, items: [], score: 0, missed: 0, left: 30, best: +(store.get('bp-best') || 0), spawn: 0, last: 0, bursts: [] };
  $('[data-g-best]').textContent = game.best;
  let W = 0, H = 0;
  function size() {
    const r = cv.getBoundingClientRect(), d = Math.min(devicePixelRatio || 1, 2);
    W = r.width; H = r.height; cv.width = W * d; cv.height = H * d; cx.setTransform(d, 0, 0, d, 0, 0);
  }
  new ResizeObserver(size).observe(cv);
  function spawn() {
    const text = t('msgs')[(Math.random() * t('msgs').length) | 0];
    cx.font = '600 14px Schibsted, system-ui, sans-serif';
    const w = cx.measureText(text).width + 34, h = 34;
    const life = Math.max(1.6, 3.4 - (30 - game.left) * 0.06);
    game.items.push({ text, w, h, x: 10 + Math.random() * (W - w - 20), y: 12 + Math.random() * (H - h - 24), age: 0, life, a: 0, done: false });
  }
  function start() {
    game.running = true; game.played = true; game.items = []; game.score = 0; game.missed = 0; game.left = 30; game.spawn = 0; game.last = performance.now();
    $('[data-g-overlay]').hidden = true; upd(); requestAnimationFrame(loop);
  }
  function upd() {
    $('[data-g-score]').textContent = game.score; $('[data-g-missed]').textContent = game.missed;
    $('[data-g-time]').textContent = Math.ceil(game.left); $('[data-g-best]').textContent = game.best;
  }
  function end() {
    game.running = false;
    const rec = game.score > game.best;
    if (rec) { game.best = game.score; store.set('bp-best', String(game.best)); }
    $('[data-g-msg]').textContent = (rec ? t('record') : t('end')).replace('{s}', game.score);
    $('[data-g-start]').textContent = t('again');
    $('[data-g-overlay]').hidden = false; upd();
  }
  function rr(x, y, w, h, r) { cx.beginPath(); cx.moveTo(x + r, y); cx.arcTo(x + w, y, x + w, y + h, r); cx.arcTo(x + w, y + h, x, y + h, r); cx.arcTo(x, y + h, x, y, r); cx.arcTo(x, y, x + w, y, r); cx.closePath(); }
  function loop(now) {
    const dt = Math.min(0.05, (now - game.last) / 1000); game.last = now;
    if (game.running) {
      game.left -= dt; game.spawn -= dt;
      if (game.spawn <= 0) { spawn(); game.spawn = Math.max(0.35, 0.9 - (30 - game.left) * 0.018); }
      for (const it of game.items) {
        it.age += dt; it.a = Math.min(1, it.a + dt * 5);
        if (!it.done && it.age > it.life) { it.done = 'missed'; it.doneAt = it.age; game.missed++; upd(); }
      }
      game.items = game.items.filter((it) => !it.done || it.age - it.doneAt < 0.4);
      if (game.left <= 0) { game.left = 0; end(); }
      $('[data-g-time]').textContent = Math.ceil(game.left);
    }
    draw();
    for (const b of game.bursts) { b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt * 2; }
    game.bursts = game.bursts.filter((b) => b.life > 0);
    if (game.running || game.bursts.length) requestAnimationFrame(loop);
  }
  function draw() {
    cx.clearRect(0, 0, W, H);
    const ink = css('--ink'), bubble = css('--bubble'), blue = css('--blue'), sky = css('--sky'), saffron = css('--saffron'), line = css('--line');
    for (const it of game.items) {
      const fade = it.done ? Math.max(0, 1 - (it.age - it.doneAt) / 0.4) : it.a;
      cx.globalAlpha = fade;
      cx.fillStyle = it.done === 'hit' ? saffron : it.done === 'missed' ? '#E0533D' : bubble;
      cx.shadowColor = 'rgba(20,24,48,.18)'; cx.shadowBlur = 8; cx.shadowOffsetY = 3;
      rr(it.x, it.y, it.w, it.h, 10); cx.fill(); cx.shadowColor = 'transparent';
      if (!it.done) {
        const k = 1 - it.age / it.life;
        cx.fillStyle = line; cx.fillRect(it.x + 10, it.y + it.h - 5, it.w - 20, 2);
        cx.fillStyle = k < 0.3 ? '#E0533D' : blue; cx.fillRect(it.x + 10, it.y + it.h - 5, (it.w - 20) * k, 2);
      }
      cx.fillStyle = it.done === 'missed' ? '#fff' : ink; cx.font = '600 14px Schibsted, system-ui, sans-serif'; cx.textBaseline = 'middle';
      cx.fillText(it.done === 'hit' ? '✓' : it.text, it.x + 17, it.y + it.h / 2 - 1);
    }
    for (const b of game.bursts) { cx.globalAlpha = b.life; cx.fillStyle = saffron; cx.beginPath(); cx.arc(b.x, b.y, 3, 0, 6.29); cx.fill(); }
    cx.globalAlpha = 1;
    if (!game.items.length && !game.running) { cx.fillStyle = sky; }
  }
  cv.addEventListener('pointerdown', (e) => {
    if (!game.running) return;
    const r = cv.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
    for (let i = game.items.length - 1; i >= 0; i--) {
      const it = game.items[i];
      if (!it.done && x > it.x - 6 && x < it.x + it.w + 6 && y > it.y - 6 && y < it.y + it.h + 6) {
        it.done = 'hit'; it.doneAt = it.age; game.score++; upd();
        for (let k = 0; k < 10; k++) { const a = k / 10 * 6.28; game.bursts.push({ x: it.x + it.w / 2, y: it.y + it.h / 2, vx: Math.cos(a) * 120, vy: Math.sin(a) * 120, life: 1 }); }
        return;
      }
    }
  });
  $('[data-g-start]').addEventListener('click', start);
  applyLang();
})();
