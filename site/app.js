/* burak.pm app script. No dependencies. */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* private mode */ } }
  };
  const EMAIL = 'hello@burak.pm';

  /* Copy and project data live in content.js (also read by the build). */
  const { T, P } = window.BP;
  const project = (i, lang) => Object.assign({}, P.en[i], lang === 'tr' ? P.tr[i] : {});
  // Every project also has its own page: /projects/<slug> and /tr/projeler/<slugTr>.
  const projectUrl = (p, l) => (l === 'tr' ? '/tr/projeler/' + p.slugTr : '/projects/' + p.slug);

  /* ------------------------------------------------------------- language */
  let lang = root.getAttribute('lang') === 'tr' ? 'tr' : 'en';
  const t = (k) => (T[lang][k] !== undefined ? T[lang][k] : T.en[k]);

  function applyLang() {
    root.setAttribute('lang', lang);
    document.title = t('title');
    $$('[data-i18n]').forEach((el) => {
      const v = t(el.dataset.i18n);
      if (typeof v !== 'string') return;
      if (el.hasAttribute('data-split')) splitTitle(el, v); else el.textContent = v;
    });
    $('[data-lang-label]').textContent = lang === 'tr' ? 'EN' : 'TR';
    $('[data-action="lang"]').setAttribute('aria-label', lang === 'tr' ? 'Switch to English' : 'Türkçeye geç');
    $('[data-palette-input]').placeholder = t('palette.ph');
    renderProjects();
    renderStep(activeStep, false);
    syncPauseLabel();
    if (queue) queue.relabel();
    if (typeof renderNp === 'function') renderNp();
    if (typeof renderWx === 'function') { renderWx(); renderMap(); }
    if (window.__onLang) window.__onLang();
  }

  function splitTitle(el, text) {
    el.setAttribute('aria-label', text);
    el.innerHTML = '';
    text.split(' ').forEach((w, i, arr) => {
      const s = document.createElement('span');
      s.className = 'w'; s.setAttribute('aria-hidden', 'true');
      s.style.setProperty('--i', i);
      s.textContent = w;
      el.appendChild(s);
      if (i < arr.length - 1) el.appendChild(document.createTextNode(' '));
    });
  }

  function setLang(next) {
    lang = next; store.set('bp-lang', lang); applyLang();
    // Keep the address in step with the language on the home page (/ and /tr).
    if (/^\/(tr\/?)?$/.test(location.pathname) && history.replaceState) {
      history.replaceState(null, '', (lang === 'tr' ? '/tr' : '/') + location.hash);
    }
    const url = new URL(location.href);
    if (url.searchParams.has('lang')) { url.searchParams.delete('lang'); history.replaceState(null, '', url); }
  }

  /* ---------------------------------------------------------------- theme */
  function setTheme(next) {
    root.setAttribute('data-theme', next);
    store.set('bp-theme', next);
    if (queue) queue.readColors();
  }
  const toggleTheme = () => {
    const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    if (document.startViewTransition && !reduced.matches) document.startViewTransition(() => setTheme(next));
    else setTheme(next);
  };

  /* ---------------------------------------------------------------- toast */
  let toastTimer;
  function toast(msg) {
    const el = $('[data-toast]');
    el.textContent = msg; el.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('show'), 2200);
  }

  async function copyEmail() {
    try { await navigator.clipboard.writeText(EMAIL); }
    catch (e) {
      const ta = document.createElement('textarea'); ta.value = EMAIL; document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); } catch (er) { /* ignore */ }
      ta.remove();
    }
    toast(t('toast.copied'));
  }

  function downloadVcard() {
    const v = ['BEGIN:VCARD', 'VERSION:3.0', 'N:Çevik;Burak;;;', 'FN:Burak Çevik', 'ORG:ModSquad', 'TITLE:Assistant Project Manager',
      'EMAIL;TYPE=INTERNET:' + EMAIL, 'URL:https://burak.pm', 'ADR;TYPE=WORK:;;;Ankara;;;Türkiye', 'END:VCARD'].join('\r\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([v], { type: 'text/vcard;charset=utf-8' }));
    a.download = 'burak-cevik.vcf'; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    toast(t('toast.vcard'));
  }

  /* ---------------------------------------------------------------- clock */
  const clockFmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Istanbul', hour: '2-digit', minute: '2-digit', hour12: false });
  function tick() {
    const s = clockFmt.format(new Date());
    $('[data-clock]').textContent = s;
    const h = parseInt(s, 10);
    $('.clock').classList.toggle('is-night', h < 7 || h >= 19);
  }

  /* ---------------------------------------------------------- live queue */
  // l: language, i: topic lane, c: channel, p: priority, s: original, en/tr: translations
  const MESSAGES = [
    { l: 'tr', i: 0, c: 'chat', p: 1, s: 'Hesabım kilitlendi', en: 'My account is locked', tr: '' },
    { l: 'tr', i: 0, c: 'mail', p: 2, s: 'Şifremi sıfırlayamıyorum', en: "I can't reset my password", tr: '' },
    { l: 'tr', i: 1, c: 'chat', p: 1, s: 'Faturamda iki kez ücret var', en: 'I was charged twice on my bill', tr: '' },
    { l: 'tr', i: 1, c: 'social', p: 2, s: 'Aboneliğimi iptal etmek istiyorum', en: 'I want to cancel my subscription', tr: '' },
    { l: 'tr', i: 2, c: 'chat', p: 2, s: 'Uygulama sürekli kapanıyor', en: 'The app keeps crashing', tr: '' },
    { l: 'tr', i: 2, c: 'mail', p: 3, s: 'İndirmeler tamamlanmıyor', en: "Downloads won't finish", tr: '' },
    { l: 'tr', i: 3, c: 'chat', p: 3, s: 'Planımı nasıl değiştirebilirim?', en: 'How can I change my plan?', tr: '' },
    { l: 'tr', i: 3, c: 'social', p: 3, s: 'Çok teşekkürler, çözüldü!', en: "Thanks a lot, it's solved!", tr: '' },
    { l: 'en', i: 0, c: 'chat', p: 1, s: "I can't log in", en: '', tr: 'Giriş yapamıyorum' },
    { l: 'en', i: 0, c: 'mail', p: 1, s: 'Someone else is using my account', en: '', tr: 'Hesabımı başka biri kullanıyor' },
    { l: 'en', i: 1, c: 'chat', p: 2, s: 'Was I charged twice?', en: '', tr: 'İki kez mi ücret alındı?' },
    { l: 'en', i: 1, c: 'mail', p: 2, s: 'My card keeps getting declined', en: '', tr: 'Kartım sürekli reddediliyor' },
    { l: 'en', i: 2, c: 'chat', p: 2, s: 'The app is really slow today', en: '', tr: 'Uygulama bugün çok yavaş' },
    { l: 'en', i: 3, c: 'social', p: 3, s: 'Can I share my plan with family?', en: '', tr: 'Planımı ailemle paylaşabilir miyim?' },
    { l: 'en', i: 3, c: 'chat', p: 3, s: 'Thanks, that worked!', en: '', tr: 'Teşekkürler, işe yaradı!' },
    { l: 'id', i: 0, c: 'chat', p: 1, s: 'Akun saya terkunci', en: 'My account is locked', tr: 'Hesabım kilitlendi' },
    { l: 'id', i: 1, c: 'mail', p: 2, s: 'Pembayaran saya gagal', en: 'My payment failed', tr: 'Ödemem başarısız oldu' },
    { l: 'id', i: 2, c: 'social', p: 2, s: 'Data saya hilang semua', en: 'All my data is gone', tr: 'Bütün verilerim kayboldu' },
    { l: 'es', i: 1, c: 'chat', p: 1, s: '¿Por qué me cobraron dos veces?', en: 'Why was I charged twice?', tr: 'Neden iki kez ücret alındı?' },
    { l: 'es', i: 0, c: 'mail', p: 2, s: 'No puedo iniciar sesión', en: "I can't sign in", tr: 'Oturum açamıyorum' },
    { l: 'de', i: 2, c: 'chat', p: 2, s: 'Die App stürzt ständig ab', en: 'The app keeps crashing', tr: 'Uygulama sürekli çöküyor' },
    { l: 'de', i: 1, c: 'mail', p: 3, s: 'Ich möchte mein Abo kündigen', en: 'I want to cancel my subscription', tr: 'Aboneliğimi iptal etmek istiyorum' },
    { l: 'fr', i: 0, c: 'chat', p: 2, s: "Je n'arrive pas à me connecter", en: "I can't log in", tr: 'Giriş yapamıyorum' },
    { l: 'fr', i: 3, c: 'social', p: 3, s: 'Merci beaucoup !', en: 'Thank you very much!', tr: 'Çok teşekkürler!' },
    { l: 'pt', i: 1, c: 'chat', p: 2, s: 'Meu pagamento não foi aprovado', en: "My payment wasn't approved", tr: 'Ödemem onaylanmadı' },
    { l: 'pt', i: 3, c: 'mail', p: 3, s: 'Como mudo meu plano?', en: 'How do I change my plan?', tr: 'Planımı nasıl değiştiririm?' },
    { l: 'it', i: 2, c: 'chat', p: 3, s: 'Non riesco a scaricare i file', en: "I can't download my files", tr: 'Dosyalarımı indiremiyorum' },
    { l: 'nl', i: 0, c: 'mail', p: 2, s: 'Mijn wachtwoord werkt niet', en: "My password doesn't work", tr: 'Şifrem çalışmıyor' },
    { l: 'pl', i: 1, c: 'chat', p: 1, s: 'Zostałem obciążony dwa razy', en: 'I was charged twice', tr: 'İki kez ücretlendirildim' },
    { l: 'ru', i: 2, c: 'chat', p: 2, s: 'Приложение не открывается', en: "The app won't open", tr: 'Uygulama açılmıyor' },
    { l: 'ar', i: 0, c: 'chat', p: 1, s: 'لا أستطيع تسجيل الدخول', en: "I can't log in", tr: 'Giriş yapamıyorum' },
    { l: 'ja', i: 3, c: 'mail', p: 3, s: 'プランを変更したいです', en: "I'd like to change my plan", tr: 'Planımı değiştirmek istiyorum' },
    { l: 'ko', i: 1, c: 'chat', p: 1, s: '결제가 두 번 됐어요', en: 'I was charged twice', tr: 'İki kez ödeme alındı' },
    { l: 'sv', i: 3, c: 'social', p: 3, s: 'Tack för hjälpen!', en: 'Thanks for the help!', tr: 'Yardımın için teşekkürler!' },
    { l: 'hi', i: 0, c: 'chat', p: 2, s: 'मैं लॉग इन नहीं कर पा रहा हूँ', en: "I can't log in", tr: 'Giriş yapamıyorum' },
    { l: 'vi', i: 1, c: 'mail', p: 2, s: 'Tôi bị trừ tiền hai lần', en: 'I was charged twice', tr: 'İki kez ücret alındı' },
    { l: 'th', i: 3, c: 'social', p: 3, s: 'ขอบคุณมากครับ', en: 'Thank you very much', tr: 'Çok teşekkürler' },
    { l: 'uk', i: 2, c: 'chat', p: 2, s: 'Застосунок не запускається', en: "The app won't start", tr: 'Uygulama başlamıyor' },
    { l: 'el', i: 1, c: 'chat', p: 1, s: 'Η πληρωμή μου απέτυχε', en: 'My payment failed', tr: 'Ödemem başarısız oldu' },
    { l: 'he', i: 0, c: 'mail', p: 2, s: 'שכחתי את הסיסמה שלי', en: 'I forgot my password', tr: 'Şifremi unuttum' },
    { l: 'cs', i: 3, c: 'chat', p: 3, s: 'Jak změním tarif?', en: 'How do I change my plan?', tr: 'Planımı nasıl değiştiririm?' },
    { l: 'ro', i: 2, c: 'social', p: 2, s: 'Aplicația se blochează mereu', en: 'The app keeps freezing', tr: 'Uygulama sürekli donuyor' },
    { l: 'hu', i: 1, c: 'mail', p: 3, s: 'Szeretném lemondani az előfizetést', en: 'I want to cancel my subscription', tr: 'Aboneliğimi iptal etmek istiyorum' },
    { l: 'fi', i: 0, c: 'chat', p: 2, s: 'En pääse kirjautumaan', en: "I can't log in", tr: 'Giriş yapamıyorum' },
    { l: 'da', i: 3, c: 'social', p: 3, s: 'Tusind tak for hjælpen!', en: 'Thanks so much for the help!', tr: 'Yardımın için çok teşekkürler!' },
    { l: 'ms', i: 2, c: 'chat', p: 2, s: 'Aplikasi tidak boleh dibuka', en: "The app won't open", tr: 'Uygulama açılmıyor' },
    { l: 'zh', i: 2, c: 'chat', p: 2, s: '应用总是卡顿', en: 'The app keeps freezing', tr: 'Uygulama sürekli donuyor' }
  ];
  // Turkish and English carry most of the volume, the rest share what's left
  const LANG_WEIGHT = { tr: 30, en: 30 };
  const BY_LANG = MESSAGES.reduce((m, x) => ((m[x.l] = m[x.l] || []).push(x), m), {});
  const LANGS = Object.keys(BY_LANG);
  const pickMessage = () => {
    const w = LANGS.map((l) => LANG_WEIGHT[l] || 40 / (LANGS.length - 2));
    let r = Math.random() * w.reduce((a, b) => a + b, 0), k = 0;
    while ((r -= w[k]) > 0) k++;
    const pool = BY_LANG[LANGS[Math.min(k, LANGS.length - 1)]];
    return pool[(Math.random() * pool.length) | 0];
  };
  const SLA = { 1: 15, 2: 30, 3: 60 };              // simulated minutes
  const TRAFFIC = { calm: [2.4, 3.6], normal: [1.25, 1.9], busy: [0.45, 0.8] };
  const PR_COLOR = { 1: '#E0533D' };
  const MIX_COLORS = ['--ink', '--blue', '--saffron', '#2FB88A', '#9B7BE0', '--sky', '#8A8FA8'];
  let langNames;
  const langName = (code) => { try { return langNames.of(code); } catch (e) { return code.toUpperCase(); } };

  class Queue {
    constructor(canvas) {
      this.c = canvas; this.x = canvas.getContext('2d');
      this.items = []; this.bursts = []; this.mouse = { x: -999, y: -999 };
      this.stats = { you: 0, team: 0, waitSum: 0, done: 0, inSla: 0, csat: 0 };
      this.seen = {}; this.spawnT = 0; this.paused = false; this.visible = true; this.traffic = 'normal';
      this.agents = [0, 1, 2, 3].map(() => ({ busy: null, until: 0, start: 0, pulse: 0 }));
      this.last = performance.now(); this.hover = null; this.clock = 0;
      this.tip = $('[data-tip]');
      this.readColors(); this.resize();
      new ResizeObserver(() => this.resize()).observe(canvas);
      canvas.addEventListener('pointermove', (e) => { const r = canvas.getBoundingClientRect(); this.mouse.x = e.clientX - r.left; this.mouse.y = e.clientY - r.top; this.mouseType = e.pointerType; });
      canvas.addEventListener('pointerleave', () => { this.mouse.x = this.mouse.y = -999; this.showTip(null); });
      canvas.addEventListener('pointerdown', (e) => {
        const r = canvas.getBoundingClientRect();
        const hit = this.hit(e.clientX - r.left, e.clientY - r.top, e.pointerType === 'touch' ? 14 : 3);
        if (hit) this.resolve(hit, 'you');
      });
      new IntersectionObserver(([en]) => { this.visible = en.isIntersecting; }, { threshold: 0 }).observe(canvas);
      const seed = this.w < 480 ? 4 : 7;
      for (let i = 0; i < seed; i++) this.spawn(-60 + this.w * 0.62 * (i / seed), true);
      this.loop = this.loop.bind(this); requestAnimationFrame(this.loop);
      this.mixTimer = setInterval(() => this.renderMix(), 1500);
    }
    readColors() {
      const cs = getComputedStyle(root);
      const v = (n) => cs.getPropertyValue(n).trim();
      this.col = { ink: v('--ink'), ink2: v('--ink-2'), line: v('--line'), bubble: v('--bubble'), blue: v('--blue'), blueInk: v('--blue-ink'), sky: v('--sky'), saffron: v('--saffron'), sink: v('--saffron-ink'), paper: v('--paper-2'), dark: root.getAttribute('data-theme') === 'dark' };
      this.renderMix();
    }
    relabel() { this.lanes = t('board.lanes'); langNames = new Intl.DisplayNames([lang], { type: 'language' }); this.renderMix(); }
    resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const r = this.c.getBoundingClientRect();
      this.w = r.width; this.h = r.height;
      this.c.width = Math.round(r.width * dpr); this.c.height = Math.round(r.height * dpr);
      this.x.setTransform(dpr, 0, 0, dpr, 0, 0);
      this.relabel();
      this.compact = this.w < 520;
      this.split = this.w * (this.compact ? 0.3 : 0.3);
      this.font = this.compact ? 12 : 13.5;
      this.maxText = this.compact ? 84 : 128;
      this.agentX = this.w - (this.compact ? 26 : 34);
      for (const it of this.items) this.measure(it);
    }
    laneTop() { return 34; }
    laneH() { return (this.h - this.laneTop() - 12) / 4; }
    laneY(i) { return this.laneTop() + this.laneH() * i + this.laneH() / 2 + 6; }
    measure(it) {
      const c = this.x; c.font = `500 ${this.font}px Schibsted, system-ui, sans-serif`;
      let txt = it.m.s;
      if (c.measureText(txt).width > this.maxText) {
        while (txt.length > 1 && c.measureText(txt + '…').width > this.maxText) txt = txt.slice(0, -1);
        txt = txt.trimEnd() + '…';
      }
      it.txt = txt; it.h = this.compact ? 28 : 32;
      it.w = Math.ceil(c.measureText(txt).width) + (this.compact ? 50 : 62);
    }
    spawn(x0, warm) {
      const m = pickMessage();
      const it = { m, x: x0 !== undefined ? x0 : -220, y: 0, vy: 0, lane: null, state: 'open', a: warm ? 1 : 0, s: 1,
        born: this.clock - (warm ? Math.random() * 6 : 0), wob: Math.random() * 6.28, speed: 34 + Math.random() * 16 };
      this.measure(it);
      if (x0 === undefined) it.x = -it.w - 6;
      // pick the freest row in the incoming zone
      let best = this.laneTop() + 20, bestGap = -1;
      for (let k = 0; k < 10; k++) {
        const rows = Math.max(3, Math.floor((this.h - this.laneTop() - 20) / (it.h + 10))); const cand = this.laneTop() + 10 + it.h / 2 + ((Math.random() * rows) | 0) * (it.h + 10);
        const near = this.items.filter((o) => o.lane === null && o.state === 'open' && Math.abs(o.x - it.x) < o.w + it.w);
        const gap = near.length ? Math.min(...near.map((o) => Math.abs(o.y - cand))) : 999;
        if (gap > bestGap) { bestGap = gap; best = cand; }
      }
      it.y = best;
      if (bestGap < it.h && x0 === undefined) { const row = this.items.filter((o) => o.lane === null && Math.abs(o.y - best) < it.h); if (row.length) it.x = Math.min(it.x, Math.min(...row.map((o) => o.x)) - it.w - 8); }
      this.seen[m.l] = (this.seen[m.l] || 0) + 1;
      this.items.push(it);
    }
    wait(it) { return (it.doneAt !== undefined ? it.doneAt : this.clock) - it.born; }
    hit(px, py, pad) {
      for (let i = this.items.length - 1; i >= 0; i--) {
        const it = this.items[i];
        if (it.state !== 'open') continue;
        if (px > it.x - pad && px < it.x + it.w + pad && py > it.y - it.h / 2 - pad && py < it.y + it.h / 2 + pad) return it;
      }
      return null;
    }
    resolve(it, who) {
      if (it.state !== 'open') return;
      it.state = who === 'you' ? 'done' : 'team'; it.doneAt = this.clock; it.doneReal = performance.now();
      this.agents.forEach((a) => { if (a.busy === it) a.busy = null; });
      const w = this.wait(it), sla = SLA[it.m.p];
      const st = this.stats;
      st[who]++; st.done++; st.waitSum += w;
      if (w <= sla) st.inSla++;
      st.csat += w <= sla * 0.5 ? 5 : w <= sla ? 4.6 : w <= sla * 1.5 ? 3.6 : 2.4;
      stat(who, st[who], true);
      stat('frt', (st.waitSum / st.done).toFixed(1));
      stat('sla', Math.round((st.inSla / st.done) * 100));
      stat('csat', (st.csat / st.done).toFixed(1));
      if (who === 'you') {
        for (let i = 0; i < 16; i++) {
          const a = (Math.PI * 2 * i) / 16;
          this.bursts.push({ x: it.x + it.w / 2, y: it.y, vx: Math.cos(a) * (60 + Math.random() * 90), vy: Math.sin(a) * (60 + Math.random() * 90), life: 1 });
        }
      }
      if (this.hover === it) this.showTip(null);
    }
    toggle(force) { this.paused = force !== undefined ? force : !this.paused; return this.paused; }
    setTraffic(k) { this.traffic = k; this.spawnT = Math.min(this.spawnT, 0.3); }
    loop(now) {
      const dt = Math.min(0.05, (now - this.last) / 1000); this.last = now;
      if (this.visible && !document.hidden) { if (!this.paused) this.update(dt, now); this.draw(now); }
      requestAnimationFrame(this.loop);
    }
    update(dt, now) {
      const slow = reduced.matches ? 0.4 : 1;
      this.clock += dt * slow;
      this.spawnT -= dt * slow;
      const open = this.items.filter((i) => i.state === 'open');
      const cap = this.compact ? 12 : 22;
      if (this.spawnT <= 0 && open.length < cap) { this.spawn(); const [a, b] = TRAFFIC[this.traffic]; this.spawnT = a + Math.random() * (b - a); }

      // agents pick the head of their lane and work it for a few minutes
      this.agents.forEach((ag, li) => {
        if (ag.busy && this.clock >= ag.until) { const it = ag.busy; ag.busy = null; ag.pulse = 1; this.resolve(it, 'team'); }
        ag.pulse = Math.max(0, ag.pulse - dt * 2);
      });
      // lane queues: order by arrival at the router, head sits next to its agent
      this.tails = [];
      for (let li = 0; li < 4; li++) {
        const lane = open.filter((it) => it.lane === li).sort((a, b) => a.routedAt - b.routedAt);
        let edge = this.agentX - 22;
        this.tails[li] = () => edge;
        lane.forEach((it, k) => {
          it.targetX = edge - it.w;
          edge = it.targetX - 8;
          this.tails[li] = ((e) => () => e)(edge);
          if (k === 0) {
            const ag = this.agents[li];
            if (!ag.busy && it.x >= it.targetX - 2) { ag.busy = it; ag.start = this.clock; ag.until = this.clock + 2.2 + Math.random() * 2.6 * (it.m.p === 3 ? 1.3 : 1); }
          }
        });
      }
      this.hover = this.hit(this.mouse.x, this.mouse.y, 3);
      for (const it of this.items) {
        if (it.state === 'open') {
          const near = it === this.hover;
          it.a = Math.min(1, it.a + dt * 3);
          it.s += ((near ? 1.05 : 1) - it.s) * Math.min(1, dt * 10);
          if (it.lane === null) {
            it.x += it.speed * dt * slow * (near ? 0.12 : 1);
            // queue behind whoever is ahead on the same row instead of overlapping
            for (const o of this.items) {
              if (o === it || o.state !== 'open' || o.lane !== null || o.x <= it.x) continue;
              if (Math.abs(o.y - it.y) < it.h + 4 && it.x + it.w + 8 > o.x) it.x = Math.min(it.x, o.x - it.w - 8);
            }
            if (it.x + it.w * 0.5 >= this.split) {
              const room = this.tails[it.m.i]() - it.w > this.split + 14;
              if (room) { it.lane = it.m.i; it.routedAt = this.clock; this.tails[it.m.i] = ((e) => () => e)(this.tails[it.m.i]() - it.w - 8); }
              else it.x = this.split - it.w * 0.5 - 2;
            }
          } else {
            const tx = it.targetX !== undefined ? it.targetX : it.x;
            const dx = tx - it.x;
            it.x += Math.sign(dx) * Math.min(Math.abs(dx), (dx > 0 ? 70 : 140) * dt * slow) * (near ? 0.15 : 1);
            const ty = this.laneY(it.lane);
            it.vy += (ty - it.y) * dt * 6; it.vy *= 0.82; it.y += it.vy * slow;
          }
        } else {
          const k = (now - it.doneReal) / (it.state === 'done' ? 900 : 650);
          if (it.state === 'done') { it.s = 1 + Math.sin(Math.min(k, 1) * Math.PI) * 0.08; it.y -= dt * 16; }
          else { it.x += dt * 60; it.s = Math.max(0.2, 1 - k * 0.8); }
          if (k > 0.5) it.a = Math.max(0, 1 - (k - 0.5) / 0.5);
          if (k >= 1) it.state = 'gone';
        }
      }
      this.items = this.items.filter((i) => i.state !== 'gone');
      for (const b of this.bursts) { b.x += b.vx * dt; b.y += b.vy * dt; b.vx *= 0.93; b.vy *= 0.93; b.life -= dt * 1.6; }
      this.bursts = this.bursts.filter((b) => b.life > 0);
      stat('waiting', open.length);
      this.c.style.cursor = this.hover ? 'pointer' : 'default';
      if (this.mouseType !== 'touch') this.showTip(this.hover);
    }
    showTip(it) {
      const tip = this.tip; if (!tip) return;
      if (!it) { if (!tip.hidden) { tip.hidden = true; this.tipFor = null; } return; }
      if (this.tipFor !== it) {
        this.tipFor = it;
        const m = it.m, tr = lang === 'tr' ? m.tr : m.en;
        const prio = t('legend.p' + m.p);
        tip.innerHTML = `<div class="tip__top"><span class="tip__chip">${esc(langName(m.l))}</span><span class="tip__chip">${esc(t('ch.' + m.c))}</span><span class="tip__chip">${esc(prio)}</span><span class="tip__chip">${esc(this.lanes[m.i])}</span></div>
          <p class="tip__msg" dir="auto">${esc(m.s)}</p>${tr ? `<p class="tip__tr">${esc(tr)}</p>` : ''}<p class="tip__sla" data-tip-sla></p>`;
        tip.hidden = false;
      }
      const w = this.wait(it), sla = SLA[it.m.p];
      const slaEl = tip.querySelector('[data-tip-sla]');
      const line = `${t('tip.wait')} ${w.toFixed(0)} ${t('unit.min')}, ${t('tip.target')} ${sla} ${t('unit.min')}. ${w > sla ? t('tip.breach') : t('tip.click')}`;
      if (slaEl.textContent !== line) slaEl.textContent = line;
      const tw = tip.offsetWidth, th = tip.offsetHeight;
      let left = it.x + it.w / 2 - tw / 2, top = it.y - it.h / 2 - th - 10;
      if (top < 6) top = it.y + it.h / 2 + 10;
      left = Math.max(8, Math.min(this.w - tw - 8, left));
      tip.style.transform = `translate(${left}px, ${top}px)`;
    }
    renderMix() {
      const bar = $('[data-mix]'), leg = $('[data-mix-legend]'); if (!bar || !this.col) return;
      const total = Object.values(this.seen).reduce((a, b) => a + b, 0) || 1;
      const sorted = Object.entries(this.seen).sort((a, b) => b[1] - a[1]);
      const top = sorted.slice(0, 5), rest = sorted.slice(5).reduce((a, [, n]) => a + n, 0);
      const parts = top.map(([l, n]) => [langName(l), n]);
      if (rest) parts.push([t('mix.other'), rest]);
      const color = (i) => { const c = MIX_COLORS[i]; return c.startsWith('--') ? `var(${c})` : c; };
      bar.innerHTML = parts.map(([, n], i) => `<i style="flex:${n} 1 0;background:${color(i)}"></i>`).join('');
      leg.innerHTML = parts.map(([name, n], i) => `<li><i style="background:${color(i)}"></i>${esc(name)} ${Math.round((n / total) * 100)}%</li>`).join('');
      stat('langs', sorted.length);
    }
    rr(x, y, w, h, r) {
      const c = this.x; c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
      c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
    }
    channel(kind, x, y, color) {
      const c = this.x; c.save(); c.strokeStyle = color; c.lineWidth = 1.4; c.lineJoin = 'round'; c.lineCap = 'round';
      c.beginPath();
      if (kind === 'chat') { this.rr(x - 5.5, y - 4.5, 11, 8, 2.5); c.stroke(); c.beginPath(); c.moveTo(x - 2, y + 3.5); c.lineTo(x - 4, y + 6); c.lineTo(x + 0.5, y + 3.5); c.stroke(); }
      else if (kind === 'mail') { c.rect(x - 5.5, y - 4, 11, 8); c.stroke(); c.beginPath(); c.moveTo(x - 5.5, y - 4); c.lineTo(x, y + 0.5); c.lineTo(x + 5.5, y - 4); c.stroke(); }
      else { c.arc(x, y, 5, 0, 6.29); c.stroke(); c.beginPath(); c.arc(x, y, 1.8, 0, 6.29); c.stroke(); c.beginPath(); c.moveTo(x + 1.8, y - 1); c.lineTo(x + 1.8, y + 1.5); c.quadraticCurveTo(x + 2, y + 3, x + 3.6, y + 2.2); c.stroke(); }
      c.restore();
    }
    draw(now) {
      const c = this.x, C = this.col; c.clearRect(0, 0, this.w, this.h);
      const split = this.split, top = this.laneTop(), lh = this.laneH();
      // zone headers
      c.font = `600 11.5px Schibsted, system-ui, sans-serif`; c.textBaseline = 'middle'; c.fillStyle = C.ink2;
      c.textAlign = 'left'; c.fillText(t('board.incoming'), 18, 16);
      c.textAlign = 'center'; c.fillText(t('board.router'), split, 16);
      // lanes
      for (let l = 0; l < 4; l++) {
        const y0 = top + lh * l + 4, cy = this.laneY(l);
        c.fillStyle = C.sky; c.globalAlpha = C.dark ? 0.22 : 0.2; this.rr(split + 10, y0, this.w - split - 18, lh - 6, 14); c.fill(); c.globalAlpha = 1;
        c.fillStyle = C.ink2; c.textAlign = 'left'; c.font = `600 11px Schibsted, system-ui, sans-serif`;
        c.fillText(this.lanes[l], split + 22, y0 + 11);
        // connector from router to lane
        c.strokeStyle = C.blue; c.globalAlpha = 0.35; c.lineWidth = 1.2; c.beginPath();
        c.moveTo(split, top + 4 + (this.h - top - 16) * ((l + 0.5) / 4)); c.lineTo(split + 10, cy); c.stroke(); c.globalAlpha = 1;
        // agent seat
        const ag = this.agents[l], ax = this.agentX, r = this.compact ? 10 : 12;
        c.fillStyle = C.paper; c.strokeStyle = C.line; c.lineWidth = 1.5; c.beginPath(); c.arc(ax, cy, r, 0, 6.29); c.fill(); c.stroke();
        if (ag.busy) {
          const k = Math.min(1, (this.clock - ag.start) / Math.max(0.1, ag.until - ag.start));
          c.strokeStyle = C.blue; c.lineWidth = 3; c.beginPath(); c.arc(ax, cy, r, -Math.PI / 2, -Math.PI / 2 + k * 6.283); c.stroke();
        }
        if (ag.pulse > 0) { c.strokeStyle = C.blue; c.globalAlpha = ag.pulse; c.lineWidth = 2; c.beginPath(); c.arc(ax, cy, r + (1 - ag.pulse) * 12, 0, 6.29); c.stroke(); c.globalAlpha = 1; }
        // a tiny headset person
        c.strokeStyle = C.ink; c.fillStyle = C.ink; c.lineWidth = 1.4;
        c.beginPath(); c.arc(ax, cy - 2.5, 2.8, 0, 6.29); c.fill();
        c.beginPath(); c.arc(ax, cy + 6.5, 5, Math.PI * 1.15, Math.PI * 1.85); c.stroke();
        c.beginPath(); c.arc(ax, cy - 2.5, 5, Math.PI * 1.05, Math.PI * 1.95); c.stroke();
      }
      // router spine
      c.strokeStyle = C.blue; c.globalAlpha = 0.55; c.lineWidth = 2;
      c.beginPath(); c.moveTo(split, top); c.lineTo(split, this.h - 12); c.stroke(); c.globalAlpha = 1;
      // tickets
      for (const it of this.items) {
        c.save(); c.globalAlpha = it.a;
        const cx = it.x + it.w / 2; c.translate(cx, it.y); c.scale(it.s, it.s); c.translate(-cx, -it.y);
        const x = it.x, y = it.y - it.h / 2, done = it.state === 'done', team = it.state === 'team', hov = it === this.hover;
        const w = this.wait(it), sla = SLA[it.m.p], late = w > sla;
        c.shadowColor = C.dark ? 'rgba(0,0,0,.45)' : 'rgba(20,24,48,.16)'; c.shadowBlur = hov ? 18 : 7; c.shadowOffsetY = hov ? 6 : 2;
        c.fillStyle = done ? C.saffron : team ? C.blue : C.bubble; this.rr(x, y, it.w, it.h, 10); c.fill();
        c.shadowColor = 'transparent';
        if (!done && !team) {
          // priority strip
          c.fillStyle = it.m.p === 1 ? PR_COLOR[1] : it.m.p === 2 ? C.blue : C.ink2;
          c.globalAlpha = it.a * (it.m.p === 3 ? 0.45 : 1); this.rr(x + 3, y + 5, 3, it.h - 10, 1.5); c.fill(); c.globalAlpha = it.a;
          // SLA bar
          const k = Math.min(1, w / sla);
          c.fillStyle = C.line; c.fillRect(x + 12, y + it.h - 4, it.w - 24, 2);
          c.fillStyle = late ? PR_COLOR[1] : k > 0.7 ? C.saffron : C.blue; c.fillRect(x + 12, y + it.h - 4, (it.w - 24) * k, 2);
          if (late) { c.strokeStyle = PR_COLOR[1]; c.lineWidth = 1.5; c.globalAlpha = it.a * (0.5 + 0.5 * Math.sin(now / 180)); this.rr(x, y, it.w, it.h, 10); c.stroke(); c.globalAlpha = it.a; }
          if (hov) { c.strokeStyle = C.blue; c.lineWidth = 2; this.rr(x, y, it.w, it.h, 10); c.stroke(); }
        }
        const ink = done ? C.sink : team ? C.blueInk : C.ink;
        // language pill
        const px = x + 11, ph = 16, pw = 22, py = it.y - ph / 2 - 1;
        c.fillStyle = done || team ? 'rgba(255,255,255,.22)' : C.sky; this.rr(px, py, pw, ph, 5); c.fill();
        c.fillStyle = ink; c.font = `700 9.5px Schibsted, system-ui, sans-serif`; c.textAlign = 'center';
        c.fillText(it.m.l.toUpperCase(), px + pw / 2, it.y - 0.5);
        this.channel(it.m.c, px + pw + 11, it.y - 1, ink);
        c.textAlign = 'left'; c.font = `500 ${this.font}px Schibsted, system-ui, sans-serif`; c.fillStyle = ink;
        c.fillText(done || team ? '✓ ' + t('board.done') : it.txt, px + pw + 22, it.y - 0.5);
        c.restore();
      }
      for (const b of this.bursts) { c.globalAlpha = Math.max(0, b.life); c.fillStyle = C.saffron; c.beginPath(); c.arc(b.x, b.y, 3 * b.life + 1, 0, 6.29); c.fill(); }
      c.globalAlpha = 1;
    }
  }
  const esc = (s) => String(s).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  function stat(name, val, bump) {
    const el = $(`[data-stat="${name}"]`); if (!el) return;
    const v = String(val);
    if (el.textContent !== v) { el.textContent = v; if (bump) { el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); } }
  }
  let queue = null;
  function syncPauseLabel() {
    const b = $('[data-action="queue-pause"]'); if (!b) return;
    const p = queue && queue.paused;
    b.setAttribute('aria-pressed', String(!!p));
    b.querySelector('span').textContent = t(p ? 'board.play' : 'board.pause');
    $('.board').classList.toggle('is-paused', !!p);
  }
  const toggleQueue = () => { if (!queue) return; queue.toggle(); syncPauseLabel(); };

  /* ---------------------------------------------------------------- path */
  let activeStep = 2;
  function renderStep(i, animate = true) {
    activeStep = i;
    const steps = $$('.step');
    steps.forEach((s, k) => { s.setAttribute('aria-selected', String(k === i)); s.tabIndex = k === i ? 0 : -1; s.classList.toggle('is-done', k < i); });
    const data = t('path.steps')[i];
    const panel = $('.path__panel');
    $('[data-path-when]').textContent = data[0]; $('[data-path-text]').textContent = data[1];
    if (animate) { panel.classList.remove('swap'); void panel.offsetWidth; panel.classList.add('swap'); }
    const rail = $('.path__rail span');
    if (rail) rail.style.setProperty('--p', (i / (steps.length - 1)) * 100 + '%');
  }

  /* ------------------------------------------------------------- projects */
  let filter = 'all';
  function renderProjects() {
    const wrap = $('[data-projects]');
    wrap.innerHTML = '';
    P.en.forEach((_, i) => {
      const p = project(i, lang);
      const b = document.createElement('a');
      b.href = projectUrl(p, lang);
      b.className = `card card--${p.size}${p.tone ? ' card--' + p.tone : ''}`;
      b.dataset.cats = p.cats.join(' ');
      b.style.setProperty('--d', i);
      b.style.viewTransitionName = 'card-' + p.id;
      b.innerHTML = `<span class="card__spot"></span>
        ${p.metric ? `<span class="card__metric" aria-hidden="true">${p.metric}</span>` : ''}
        <span class="card__art" aria-hidden="true">${p.video
          ? `<video class="card__video" muted loop playsinline preload="none" poster="/assets/art/${p.id}-poster.jpg"><source src="/assets/art/${p.id}.webm" type="video/webm"><source src="/assets/art/${p.id}.mp4" type="video/mp4"></video>`
          : `<img src="/assets/art/${p.id}.webp" alt="" loading="lazy" decoding="async">`}</span>
        <span class="card__text"><h3>${p.title}</h3><p>${p.blurb}</p>
        <span class="card__foot"><span class="card__more">${t('card.more')}</span>${p.noai ? `<span class="noai">${t('card.noai')}</span>` : ''}</span></span>`;
      // A plain click opens the quick view; new tab, middle click and crawlers follow the link.
      b.addEventListener('click', (e) => { if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0 || !sheet.showModal) return; e.preventDefault(); openSheet(i); });
      b.addEventListener('pointermove', (e) => { const r = b.getBoundingClientRect(); b.style.setProperty('--mx', e.clientX - r.left + 'px'); b.style.setProperty('--my', e.clientY - r.top + 'px'); });
      wrap.appendChild(b);
    });
    applyFilter(filter, false);
    $$('.card__video', wrap).forEach((v) => {
      if (reduced.matches) return;
      new IntersectionObserver(([en]) => { if (en.isIntersecting) { const p = v.play(); if (p && p.catch) p.catch(() => {}); } else v.pause(); }, { threshold: 0.25 }).observe(v);
    });
    if (wrap.classList.contains('in')) animateSpark();
  }
  function applyFilter(f, animate = true) {
    filter = f;
    $$('[data-filter]').forEach((c) => c.setAttribute('aria-pressed', String(c.dataset.filter === f)));
    const run = () => $$('.card').forEach((c) => { c.hidden = !(f === 'all' || c.dataset.cats.split(' ').includes(f)); });
    if (animate && document.startViewTransition && !reduced.matches) document.startViewTransition(run); else run();
  }
  function animateSpark() {
    const bars = $$('.spark i'); if (!bars.length) return;
    const vals = [38, 52, 47, 61, 58, 66, 63, 72, 70, 78, 74, 83, 86, 91];
    bars.forEach((b, i) => { setTimeout(() => { b.style.height = vals[i] + '%'; if (i >= 11) b.classList.add('hi'); }, i * 45); });
  }

  const sheet = $('[data-project-sheet]');
  let sheetId = null;
  function openSheet(i, fromHash) {
    const p = project(i, lang);
    sheetId = p.id;
    $('[data-sheet-glyph]').innerHTML = `<img src="/assets/art/${p.id}.webp" alt="">`;
    $('[data-sheet-title]').textContent = p.title;
    $('[data-sheet-lede]').textContent = p.lede;
    $('[data-sheet-problem]').textContent = p.problem;
    $('[data-sheet-result]').textContent = p.result;
    $('[data-sheet-points]').innerHTML = p.points.map((x) => `<li>${x}</li>`).join('');
    $('[data-sheet-tags]').innerHTML = p.tags.map((x) => `<li>${x}</li>`).join('');
    const link = $('[data-sheet-link]');
    if (p.link) { link.hidden = false; link.href = p.link; link.textContent = t('card.visit'); } else link.hidden = true;
    const full = $('[data-sheet-page]'); full.href = projectUrl(p, lang); full.textContent = t('sheet.page');
    if (!fromHash) history.replaceState(null, '', location.pathname + location.search + '#' + p.id);
    if (!sheet.open) sheet.showModal();
  }
  sheet.addEventListener('click', (e) => { if (e.target === sheet || e.target.closest('[data-close]')) sheet.close(); });
  sheet.addEventListener('close', () => {
    sheetId = null;
    if (P.en.some((x) => '#' + x.id === location.hash)) history.replaceState(null, '', location.pathname + location.search);
  });
  $('[data-sheet-copy]').addEventListener('click', () => {
    if (!sheetId) return;
    const p = P.en.find((x) => x.id === sheetId);
    const url = 'https://burak.pm' + projectUrl(p, lang);
    const done = () => toast(t('toast.link'));
    if (navigator.clipboard) navigator.clipboard.writeText(url).then(done, done); else done();
  });
  function sheetFromHash() {
    const i = P.en.findIndex((x) => '#' + x.id === location.hash);
    if (i >= 0) openSheet(i, true);
  }
  addEventListener('hashchange', sheetFromHash);
  sheetFromHash();

  /* --------------------------------------------------------- lanes (work) */

  /* ------------------------------------------------------- greetings card */
  let greetI = 0;
  setInterval(() => {
    if (reduced.matches) return;
    const el = $('[data-greet]'); const list = t('greet');
    el.classList.add('out');
    setTimeout(() => { greetI = (greetI + 1) % list.length; el.textContent = list[greetI]; el.classList.remove('out'); }, 350);
  }, 2600);


  /* --------------------------------------------------------- now playing */
  const np = { data: null, el: $('[data-np]') };
  const mmss = (ms) => { const s = Math.max(0, Math.floor(ms / 1000)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
  function ago(iso) {
    const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000), a = t('np.ago');
    if (m < 2) return a[0];
    if (m < 60) return a[1].replace('{n}', m);
    if (m < 1440) return a[2].replace('{n}', Math.round(m / 60));
    return a[3].replace('{n}', Math.round(m / 1440));
  }
  function renderNp() {
    const d = np.data, el = np.el; if (!el || !d) return;
    el.hidden = false; el.href = d.url;
    el.classList.toggle('is-playing', !!d.playing);
    const art = $('[data-np-art]'); if (d.art && art.src !== d.art) art.src = d.art;
    $('[data-np-title]').textContent = d.title;
    $('[data-np-artist]').textContent = d.artist;
    if (d.playing) {
      const pos = Math.min(d.duration_ms, d.progress_ms + (Date.now() - d.localAt));
      $('[data-np-status]').textContent = t('np.now');
      $('[data-np-bar]').style.width = (pos / d.duration_ms) * 100 + '%';
      $('[data-np-time]').textContent = mmss(pos) + ' / ' + mmss(d.duration_ms);
      if (pos >= d.duration_ms) loadNp();
    } else {
      $('[data-np-status]').textContent = t('np.last') + ', ' + ago(d.played_at);
    }
    el.setAttribute('aria-label', `${$('[data-np-status]').textContent}: ${d.title}, ${d.artist}`);
  }
  async function loadNp() {
    if (document.hidden) return;
    try {
      const r = await fetch('/api/now-playing', { headers: { Accept: 'application/json' } });
      if (!r.ok || !(r.headers.get('content-type') || '').includes('json')) return;
      const d = await r.json();
      if (!d.ok) return;
      d.localAt = Date.now(); np.data = d; renderNp();
    } catch (e) { /* the card simply stays hidden */ }
  }
  loadNp(); setInterval(loadNp, 30000); setInterval(renderNp, 1000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) loadNp(); });



  /* ------------------------------------------------------ suggest a song */
  // Visitors search Spotify (through /api/songs/search), pick a track and send it.
  // Nothing from the API is written as HTML: rows are built with textContent.
  const tune = { picked: null, widget: null, timer: 0, seq: 0 };
  const tuneSheet = $('[data-tune-sheet]'), tuneForm = $('[data-tune-form]');
  const tq = (k) => $(`[data-tune-${k}]`);

  function songRow(s, onPick) {
    const li = document.createElement('li');
    const el = document.createElement(onPick ? 'button' : 'a');
    el.className = 'song';
    if (onPick) { el.type = 'button'; el.setAttribute('role', 'option'); el.addEventListener('click', () => onPick(s)); }
    else { el.href = s.url; el.target = '_blank'; el.rel = 'noopener'; }
    const art = document.createElement('span'); art.className = 'song__art';
    if (s.art && /^https:\/\/i\.scdn\.co\//.test(s.art)) { const img = new Image(48, 48); img.alt = ''; img.loading = 'lazy'; img.decoding = 'async'; img.src = s.art; art.appendChild(img); }
    const text = document.createElement('span'); text.className = 'song__text';
    const ti = document.createElement('b'); ti.textContent = s.title;
    const ar = document.createElement('small'); ar.textContent = s.artist;
    text.append(ti, ar);
    el.append(art, text);
    if (onPick) { const c = document.createElement('span'); c.className = 'song__pick'; c.textContent = t('tune.pick'); el.appendChild(c); }
    li.appendChild(el);
    return li;
  }

  async function loadSongs() {
    try {
      const r = await fetch('/api/songs', { headers: { Accept: 'application/json' } });
      const d = await r.json();
      if (!d.ok) return;
      const pl = tq('playlist');
      if (d.playlist && /^https:\/\/open\.spotify\.com\//.test(d.playlist)) { pl.href = d.playlist; pl.hidden = false; }
      const list = tq('list'); list.textContent = '';
      (d.recent || []).slice(0, 4).forEach((s) => list.appendChild(songRow(s)));
      tq('recent').hidden = !list.children.length;
    } catch (e) { /* the box works without the list */ }
  }

  function tuneStep(name) {
    $$('[data-tune-step]').forEach((el) => { el.hidden = el.dataset.tuneStep !== name; });
  }
  function tuneErr(key) { const e = tq('error'); e.textContent = key ? t(key) : ''; e.hidden = !key; }
  function tuneReset() {
    tune.picked = null; tuneForm.reset(); tuneErr(null);
    tq('results').textContent = ''; tq('status').textContent = '';
    tq('done').hidden = true; tuneForm.hidden = false; tuneStep('search');
  }
  function openTune() {
    if (!tuneSheet.showModal) return;
    if (!tq('done').hidden) tuneReset();
    tuneSheet.showModal();
    setTimeout(() => (tune.picked ? tuneForm.name : tq('q')).focus(), 60);
    if (contactCfg.sitekey) loadTurnstile().catch(() => {});
  }
  tuneSheet.addEventListener('click', (e) => { if (e.target === tuneSheet || e.target.closest('[data-close]')) tuneSheet.close(); });

  async function tuneSearch(q) {
    const seq = ++tune.seq, status = tq('status'), list = tq('results');
    if (q.length < 2) { list.textContent = ''; status.textContent = ''; return; }
    status.textContent = t('tune.searching');
    try {
      const r = await fetch('/api/songs/search?q=' + encodeURIComponent(q), { headers: { Accept: 'application/json' } });
      const d = await r.json();
      if (seq !== tune.seq) return;
      list.textContent = '';
      if (!d.ok) { status.textContent = t('tune.errSend'); return; }
      status.textContent = d.items.length ? '' : t('tune.none');
      d.items.forEach((s) => list.appendChild(songRow(s, tunePick)));
    } catch (e) { if (seq === tune.seq) status.textContent = t('tune.errSend'); }
  }
  tq('q').addEventListener('input', (e) => {
    clearTimeout(tune.timer);
    const q = e.target.value.trim();
    tune.timer = setTimeout(() => tuneSearch(q), 320);
  });
  tq('q').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); clearTimeout(tune.timer); tuneSearch(e.target.value.trim()); } });

  function tunePick(s) {
    tune.picked = s;
    const box = tq('picked'); box.textContent = '';
    const row = songRow(s).firstElementChild; box.appendChild(row);
    const change = document.createElement('button'); change.type = 'button'; change.className = 'link'; change.textContent = t('tune.change');
    change.addEventListener('click', () => { tune.picked = null; tuneStep('search'); tq('q').focus(); });
    box.appendChild(change);
    tuneErr(null); tuneStep('details');
    tuneForm.name.focus();
    if (contactCfg.sitekey) {
      loadTurnstile().then(() => {
        if (tune.widget == null) tune.widget = renderTurnstile(tq('turnstile'), 'song');
      }).catch(() => {});
    }
  }

  tuneForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!tune.picked) { tuneErr('tune.errPick'); return; }
    if (!contactCfg.sitekey) { tuneErr('tune.errSend'); return; }
    const token = window.turnstile && tune.widget != null ? window.turnstile.getResponse(tune.widget) : '';
    if (!token) { tuneErr('tune.errCaptcha'); return; }
    const btn = tq('send'); btn.setAttribute('aria-busy', 'true'); tuneErr(null);
    try {
      const r = await fetch('/api/songs', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ track: tune.picked.id, name: tuneForm.name.value, note: tuneForm.note.value, website: tuneForm.website.value, token, lang })
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || !d.ok) {
        tuneErr(d.error === 'rate' ? 'tune.errRate' : d.error === 'captcha' ? 'tune.errCaptcha' : 'tune.errSend');
      } else {
        tq('done-title').textContent = t(d.already ? 'tune.already' : 'tune.done');
        tuneForm.hidden = true; tq('done').hidden = false; tq('done').focus();
      }
    } catch (err) {
      tuneErr('tune.errSend');
    } finally {
      btn.removeAttribute('aria-busy');
      if (window.turnstile && tune.widget != null) window.turnstile.reset(tune.widget);
    }
  });
  tq('again').addEventListener('click', () => { tuneReset(); tq('q').focus(); });

  /* -------------------------------------------------------------- weather */
  const WX_ICON = {
    sun: '<svg viewBox="0 0 24 24"><g class="sun"><circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4"/></g></svg>',
    moon: '<svg viewBox="0 0 24 24"><path d="M19 14.5A7.5 7.5 0 0 1 9.5 5a7.5 7.5 0 1 0 9.5 9.5Z"/></svg>',
    part: '<svg viewBox="0 0 24 24"><g class="sun"><path d="M8 3v1.5M3.5 8H5M4.8 4.8l1 1M11.2 4.8l-1 1"/><path d="M5.6 10.4A3.2 3.2 0 0 1 10.9 7"/></g><path d="M7 19h10a3.5 3.5 0 0 0 0-7 5 5 0 0 0-9.6 1.4A2.8 2.8 0 0 0 7 19Z"/></svg>',
    cloud: '<svg viewBox="0 0 24 24"><path d="M6.5 18.5h11a4 4 0 0 0 0-8 5.5 5.5 0 0 0-10.6 1.6 3.2 3.2 0 0 0-.4 6.4Z"/></svg>',
    fog: '<svg viewBox="0 0 24 24"><path d="M4 9h16M6 13h12M4 17h16"/></svg>',
    rain: '<svg viewBox="0 0 24 24"><path d="M6.5 14.5h11a4 4 0 0 0 0-8 5.5 5.5 0 0 0-10.6 1.6 3.2 3.2 0 0 0-.4 6.4Z"/><path class="drop" d="M8 17.5l-1 2.5M12 17.5l-1 2.5M16 17.5l-1 2.5"/></svg>',
    snow: '<svg viewBox="0 0 24 24"><path d="M6.5 14.5h11a4 4 0 0 0 0-8 5.5 5.5 0 0 0-10.6 1.6 3.2 3.2 0 0 0-.4 6.4Z"/><path d="M8 18.5h.01M12 20h.01M16 18.5h.01"/></svg>',
    storm: '<svg viewBox="0 0 24 24"><path d="M6.5 14.5h11a4 4 0 0 0 0-8 5.5 5.5 0 0 0-10.6 1.6 3.2 3.2 0 0 0-.4 6.4Z"/><path class="sun" d="m12.5 14.5-2 3.5h3l-2 3.5"/></svg>'
  };
  const wx = { data: null };
  const wxKind = (code, day) => code <= 1 ? (day ? 'sun' : 'moon') : code === 2 ? (day ? 'part' : 'cloud') : code === 3 ? 'cloud' : code < 50 ? 'fog' : code < 70 || (code >= 80 && code < 85) ? 'rain' : code < 90 ? 'snow' : 'storm';
  function renderWx() {
    const d = wx.data, el = $('[data-wx]'); if (!d || !el) return;
    const temp = Math.round(d.temperature_2m), desc = (t('wx')[d.weather_code] || '');
    $('[data-wx-icon]').innerHTML = WX_ICON[wxKind(d.weather_code, d.is_day)];
    $('[data-wx-temp]').textContent = temp + '°';
    el.title = t('wx.title').replace('{d}', desc).replace('{t}', temp);
    el.setAttribute('aria-label', el.title);
    el.hidden = false;
  }
  async function loadWx() {
    try {
      const r = await fetch('https://api.open-meteo.com/v1/forecast?latitude=39.93&longitude=32.86&current=temperature_2m,weather_code,is_day&timezone=Europe%2FIstanbul');
      if (!r.ok) return;
      const j = await r.json(); wx.data = j.current; renderWx();
    } catch (e) { /* the weather simply stays hidden */ }
  }
  loadWx(); setInterval(loadWx, 15 * 60 * 1000);

  /* ----------------------------------------------------------- visitor map */
  const vm = { data: null, ready: false };
  const regionName = (cc) => { try { return new Intl.DisplayNames([lang], { type: 'region' }).of(cc); } catch (e) { return cc; } };
  // The visit is counted right away, the heavy map file only loads when the section gets close.
  const visitReq = fetch('/api/visits', { method: 'POST', headers: { Accept: 'application/json' } }).catch(() => null);
  async function loadMap() {
    const box = $('[data-map]'); if (!box) return;
    try { box.innerHTML = await (await fetch('/assets/world.svg')).text(); } catch (e) { return; }
    const svg = box.querySelector('svg');
    const ns = 'http://www.w3.org/2000/svg';
    const home = document.createElementNS(ns, 'g'); home.setAttribute('class', 'map__home');
    home.innerHTML = '<circle class="ring" cx="558.2" cy="121.8" r="7"/><circle cx="558.2" cy="121.8" r="4.5"/><text x="568" y="117" data-home-label></text>';
    svg.appendChild(home);
    vm.ready = true;
    const tip = $('[data-map-tip]');
    svg.addEventListener('pointermove', (e) => {
      const p = e.target.closest('path[data-cc]');
      if (!p) { tip.hidden = true; return; }
      const n = +(p.dataset.n || 0);
      tip.innerHTML = `${esc(regionName(p.dataset.cc))}<small>${n ? n + ' ' + t(n === 1 ? 'visits.one' : 'visits.many') : t('visits.none')}</small>`;
      tip.hidden = false;
      const r = $('.map').getBoundingClientRect();
      const x = Math.min(r.width - tip.offsetWidth - 8, Math.max(8, e.clientX - r.left + 14));
      tip.style.transform = `translate(${x}px, ${e.clientY - r.top - tip.offsetHeight - 12}px)`;
    });
    svg.addEventListener('pointerleave', () => { tip.hidden = true; });
    renderMap();
    try {
      const r = await visitReq;
      if (!r || !r.ok || !(r.headers.get('content-type') || '').includes('json')) return;
      const d = await r.json(); if (!d.ok) return;
      vm.data = d; renderMap();
      setInterval(async () => {
        if (document.hidden) return;
        try { const g = await (await fetch('/api/visits')).json(); if (g.ok) { vm.data = g; renderMap(); } } catch (e) { /* keep last */ }
      }, 60000);
    } catch (e) { /* counter not available here, the map still shows home */ }
  }
  function renderMap() {
    if (!vm.ready) return;
    const label = $('[data-home-label]'); if (label) label.textContent = t('visits.home');
    const d = vm.data;
    if (!d) return;
    const max = Math.max(1, ...d.countries.map((c) => c.count));
    const counts = Object.fromEntries(d.countries.map((c) => [c.country, c.count]));
    $$('[data-map] path[data-cc]').forEach((p) => {
      const n = counts[p.dataset.cc] || 0;
      if (n) { p.dataset.n = n; const k = 0.22 + 0.78 * Math.sqrt(n / max); p.style.fill = `color-mix(in srgb, var(--blue) ${Math.round(k * 100)}%, var(--paper-2))`; }
      else { delete p.dataset.n; p.style.fill = ''; }
      p.classList.toggle('is-you', p.dataset.cc === d.you);
    });
    $('[data-visit-stats]').hidden = false; $('[data-visit-scale]').hidden = false;
    $('[data-visit-total]').textContent = d.total.toLocaleString(lang);
    $('[data-visit-countries]').textContent = d.countries.length;
    const you = $('[data-visit-you]');
    if (d.you) { you.textContent = t('visits.you').replace('{c}', regionName(d.you)); you.hidden = false; } else you.hidden = true;
    $('[data-visit-top]').innerHTML = d.countries.slice(0, 5).map((c) =>
      `<li><b>${esc(regionName(c.country))}</b><span>${c.count.toLocaleString(lang)} ${t(c.count === 1 ? 'visits.one' : 'visits.many')}</span><i style="width:${Math.max(6, (c.count / max) * 100)}%"></i></li>`).join('');
  }
  const lazyWhenNear = (el, fn, margin = '600px') => {
    if (!el) return;
    if (!('IntersectionObserver' in window)) { fn(); return; }
    const o = new IntersectionObserver((en) => { if (en.some((x) => x.isIntersecting)) { o.disconnect(); fn(); } }, { rootMargin: margin });
    o.observe(el);
  };
  lazyWhenNear($('#visits'), loadMap);
  lazyWhenNear($('#now'), loadSongs);

  /* --------------------------------------------------------- facts count */
  function countUp(el) {
    const end = +el.dataset.count, pre = el.dataset.prefix || '', suf = el.dataset.suffix || '';
    if (reduced.matches) { el.textContent = pre + end + suf; return; }
    const t0 = performance.now(), dur = 1100;
    const step = (now) => { const k = Math.min(1, (now - t0) / dur); const e = 1 - Math.pow(1 - k, 3); el.textContent = pre + Math.round(end * e) + suf; if (k < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      const el = en.target; el.classList.add('in'); io.unobserve(el);
      if (el.classList.contains('facts')) $$('[data-count]', el).forEach(countUp);
      if (el.matches('[data-projects]')) animateSpark();
    });
  }, { threshold: 0.15 });
  $$('.facts, [data-projects]').forEach((el) => io.observe(el));
  $$('.fact').forEach((f, i) => f.style.setProperty('--d', i));

  /* -------------------------------------------- scroll: bar, nav, header */
  const bar = $('.progress span'), topbar = $('.topbar');
  const navLinks = $$('.nav a');
  const sections = navLinks.map((a) => $(a.getAttribute('href')));
  let ticking = false;
  function onScroll() {
    ticking = false;
    const y = scrollY, max = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    topbar.classList.toggle('is-stuck', y > 8);
    let current = -1;
    sections.forEach((s, i) => { if (s && s.getBoundingClientRect().top < innerHeight * 0.4) current = i; });
    navLinks.forEach((a, i) => a.classList.toggle('is-active', i === current));
  }
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });

  /* ------------------------------------------------------------ composer */
  // Two modes. With the contact API configured, messages are sent from the page
  // (Turnstile protected). Without it, the form falls back to opening a mail app.
  const composer = $('[data-composer]'), composerErr = $('[data-composer-error]');
  const sendBtn = $('[data-composer-send]'), doneBox = $('[data-composer-done]');
  const contactCfg = { api: false, sitekey: null, widget: null };

  function composerMode() {
    const api = contactCfg.api;
    $$('[data-api-only]').forEach((el) => { el.hidden = !api; });
    composer.email.required = api;
    sendBtn.firstElementChild.textContent = t(api ? 'contact.sendApi' : 'contact.send');
    $('[data-i18n="contact.lede"]').textContent = t(api ? 'contact.ledeApi' : 'contact.lede');
  }
  window.__onLang = () => { if (contactCfg.api) composerMode(); };
  function showErr(key) { composerErr.textContent = t(key); composerErr.hidden = false; }

  // Turnstile is loaded once, on demand, and shared by the contact form and the song box.
  let tsPromise = null;
  function loadTurnstile() {
    if (window.turnstile) return Promise.resolve(window.turnstile);
    if (!tsPromise) {
      tsPromise = new Promise((resolve, reject) => {
        window.onTurnstileReady = () => resolve(window.turnstile);
        const sc = document.createElement('script');
        sc.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=onTurnstileReady';
        sc.async = true; sc.defer = true; sc.onerror = reject;
        document.head.appendChild(sc);
      });
    }
    return tsPromise;
  }
  function renderTurnstile(box, action) {
    box.hidden = false;
    return window.turnstile.render(box, {
      sitekey: contactCfg.sitekey, action,
      theme: document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light',
      language: document.documentElement.lang === 'tr' ? 'tr' : 'en',
      appearance: 'interaction-only',
      'refresh-expired': 'auto'
    });
  }
  function mountTurnstile() {
    const box = $('[data-turnstile]');
    if (!window.turnstile || !box || contactCfg.widget != null) return;
    contactCfg.widget = renderTurnstile(box, 'contact');
  }

  fetch('/api/contact').then((r) => (r.ok ? r.json() : null)).then((cfg) => {
    if (!cfg || !cfg.ok) return;
    if (cfg.booking && /^https:\/\//.test(cfg.booking)) {
      const b = $('[data-booking]'); b.href = cfg.booking; b.hidden = false;
      $('[data-book-out]').href = cfg.booking;
      if (cfg.bookingEmbed && /^https:\/\/calendar\.google\.com\//.test(cfg.bookingEmbed)) {
        const dlg = $('[data-book]'), frame = $('[data-book-frame]');
        b.addEventListener('click', (e) => {
          if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1 || !dlg.showModal) return;
          e.preventDefault();
          // Google Calendar follows the hl parameter, so the booking UI matches the site language.
          const want = cfg.bookingEmbed + (cfg.bookingEmbed.includes('?') ? '&' : '?') + 'hl=' + (document.documentElement.lang === 'tr' ? 'tr' : 'en');
          if (frame.getAttribute('src') !== want) frame.setAttribute('src', want);
          dlg.showModal();
        });
        dlg.addEventListener('click', (e) => { if (e.target === dlg || e.target.closest('[data-close]')) dlg.close(); });
      }
    }
    if (cfg.turnstile) {
      contactCfg.api = true; contactCfg.sitekey = cfg.turnstile;
      composerMode();
      const loadTs = () => { loadTurnstile().then(mountTurnstile).catch(() => {}); };
      // Only fetch the spam check when someone is near the form or starts typing.
      composer.addEventListener('focusin', loadTs, { once: true });
      if ('IntersectionObserver' in window) {
        const o = new IntersectionObserver((en) => { if (en.some((x) => x.isIntersecting)) { o.disconnect(); loadTs(); } }, { rootMargin: '400px' });
        o.observe(composer);
      } else loadTs();
    }
  }).catch(() => {});

  composer.addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = composer;
    const name = f.name.value.trim(), msg = f.msg.value.trim(), reason = f.reason.value, email = f.email.value.trim();
    if (!name || !msg) { showErr('contact.err'); (name ? f.msg : f.name).focus(); return; }
    composerErr.hidden = true;

    if (!contactCfg.api) {
      const subject = `${t('subject.' + reason)} | ${name}`;
      location.href = `mailto:${EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(msg + '\n\n' + name)}`;
      toast(t('contact.opened'));
      return;
    }
    if (!f.email.checkValidity() || !email) { showErr('contact.errEmail'); f.email.focus(); return; }
    const token = window.turnstile && contactCfg.widget != null ? window.turnstile.getResponse(contactCfg.widget) : '';
    if (!token) { showErr('contact.errCaptcha'); return; }

    sendBtn.setAttribute('aria-busy', 'true');
    try {
      const r = await fetch('/api/contact', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, msg, reason, token, website: f.website.value, lang: document.documentElement.lang })
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || !d.ok) {
        showErr(d.error === 'rate' ? 'contact.errRate' : d.error === 'captcha' ? 'contact.errCaptcha' : d.error === 'invalid' ? 'contact.errEmail' : 'contact.errSend');
        if (window.turnstile) window.turnstile.reset(contactCfg.widget);
        return;
      }
      f.reset(); f.hidden = true; doneBox.hidden = false; doneBox.focus();
      if (window.turnstile) window.turnstile.reset(contactCfg.widget);
    } catch {
      showErr('contact.errSend');
    } finally {
      sendBtn.removeAttribute('aria-busy');
    }
  });
  $('[data-composer-again]').addEventListener('click', () => { doneBox.hidden = true; composer.hidden = false; composer.name.focus(); });

  /* --------------------------------------------------------------- biko */
  let bikoBusy = false;
  function biko() {
    if (bikoBusy) return; bikoBusy = true;
    const el = $('[data-biko]'); const lines = t('biko');
    $('[data-biko-say]').textContent = lines[(Math.random() * lines.length) | 0];
    el.classList.remove('walk'); void el.offsetWidth; el.classList.add('walk');
    setTimeout(() => { el.classList.remove('walk'); bikoBusy = false; }, 7200);
  }

  /* ------------------------------------------------------------ palette */
  const pal = $('[data-palette]'), palIn = $('[data-palette-input]'), palList = $('[data-palette-list]');
  let palItems = [], palSel = 0;
  function commands() {
    const go = [['#work', 'nav.work'], ['#path', 'nav.path'], ['#projects', 'nav.projects'], ['#now', 'nav.now'], ['#visits', 'nav.visits'], ['#contact', 'nav.contact']]
      .map(([h, k]) => ({ label: t(k), hint: t('cmd.go'), run: () => $(h).scrollIntoView({ behavior: reduced.matches ? 'auto' : 'smooth' }) }));
    const projects = P.en.map((_, i) => ({ label: project(i, lang).title, hint: t('nav.projects'), run: () => openSheet(i) }));
    return [
      ...go,
      { label: t('cmd.theme'), hint: 'T', run: () => { toggleTheme(); toast(t('toast.theme')); } },
      { label: t('cmd.lang'), hint: 'L', run: () => setLang(lang === 'tr' ? 'en' : 'tr') },
      { label: t('cmd.copy'), hint: EMAIL, run: copyEmail },
      { label: t('cmd.vcard'), hint: '.vcf', run: downloadVcard },
      { label: t('cmd.pause'), hint: 'P', run: toggleQueue },
      { label: t('cmd.tune'), hint: 'Spotify', run: openTune },
      ...projects,
      { label: 'LinkedIn', hint: 'linkedin.com/in/bcvk', run: () => window.open('https://linkedin.com/in/bcvk', '_blank', 'noopener') },
      { label: 'GitHub', hint: 'github.com/bcvk', run: () => window.open('https://github.com/bcvk', '_blank', 'noopener') },
      { label: t('cmd.biko'), hint: '🐐', run: biko },
      { label: t('cmd.top'), hint: '', run: () => scrollTo({ top: 0, behavior: reduced.matches ? 'auto' : 'smooth' }) }
    ];
  }
  const norm = (s) => s.toLocaleLowerCase(lang).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ı/g, 'i');
  function renderPalette() {
    const q = norm(palIn.value.trim());
    palItems = commands().filter((c) => !q || norm(c.label + ' ' + c.hint).includes(q));
    palSel = Math.min(palSel, Math.max(0, palItems.length - 1));
    if (!palItems.length) { palList.innerHTML = `<li class="empty">${t('palette.none')}</li>`; return; }
    palList.innerHTML = palItems.map((c, i) => `<li role="option" id="cmd-${i}" aria-selected="${i === palSel}" data-i="${i}"><span>${c.label}</span><small>${c.hint}</small></li>`).join('');
    palIn.setAttribute('aria-activedescendant', 'cmd-' + palSel);
    const sel = palList.children[palSel]; if (sel && sel.scrollIntoView) sel.scrollIntoView({ block: 'nearest' });
  }
  function openPalette() { if (pal.open) return; palIn.value = ''; palSel = 0; renderPalette(); pal.showModal(); palIn.focus(); }
  function runPalette(i) { const c = palItems[i]; if (!c) return; pal.close(); setTimeout(c.run, 30); }
  palIn.addEventListener('input', () => { palSel = 0; renderPalette(); });
  palIn.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); palSel = (palSel + 1) % Math.max(1, palItems.length); renderPalette(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); palSel = (palSel - 1 + palItems.length) % Math.max(1, palItems.length); renderPalette(); }
    else if (e.key === 'Enter') { e.preventDefault(); runPalette(palSel); }
  });
  palList.addEventListener('click', (e) => { const li = e.target.closest('[data-i]'); if (li) runPalette(+li.dataset.i); });
  pal.addEventListener('click', (e) => { if (e.target === pal) pal.close(); });

  /* ------------------------------------------------------------ keyboard */
  let typed = '';
  addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); pal.open ? pal.close() : openPalette(); return; }
    const tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === '/') { e.preventDefault(); openPalette(); return; }
    if (e.key.length === 1) {
      typed = (typed + e.key.toLowerCase()).slice(-4);
      if (typed === 'biko') { biko(); typed = ''; }
    }
  });

  /* ---------------------------------------------------------- path keys */
  $$('.step').forEach((s, i, all) => {
    s.addEventListener('click', () => renderStep(i));
    s.addEventListener('keydown', (e) => {
      let n = null;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') n = (i + 1) % all.length;
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') n = (i - 1 + all.length) % all.length;
      if (n !== null) { e.preventDefault(); renderStep(n); all[n].focus(); }
    });
  });

  /* --------------------------------------------------------------- wire */
  document.addEventListener('click', (e) => {
    const a = e.target.closest('[data-action]'); if (!a) return;
    const act = a.dataset.action;
    if (act === 'lang') setLang(lang === 'tr' ? 'en' : 'tr');
    else if (act === 'theme') toggleTheme();
    else if (act === 'palette') openPalette();
    else if (act === 'copy-email') copyEmail();
    else if (act === 'vcard') downloadVcard();
    else if (act === 'queue-pause') toggleQueue();
    else if (act === 'tune') openTune();
  });
  $$('[data-filter]').forEach((c) => c.addEventListener('click', () => applyFilter(c.dataset.filter)));
  $$('[data-traffic]').forEach((b) => b.addEventListener('click', () => {
    $$('[data-traffic]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    if (queue) queue.setTraffic(b.dataset.traffic);
  }));
  const mac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
  $$('[data-modkey]').forEach((k) => { k.textContent = mac ? '⌘' : 'Ctrl'; });
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => { if (!store.get('bp-theme')) setTheme(e.matches ? 'dark' : 'light'); });

  applyLang();
  tick(); setInterval(tick, 15000);
  onScroll();
  const start = () => {
    queue = new Queue($('.board__canvas'));
    syncPauseLabel();
    requestAnimationFrame(() => $('.hero').classList.add('is-ready'));
  };
  if (document.fonts && document.fonts.ready) Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 900))]).then(start); else start();
})();
