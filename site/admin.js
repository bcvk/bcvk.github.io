/* burak.pm admin panel. Talks only to /api/admin/*. Everything is built with textContent. */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const root = document.documentElement;

  function h(tag, attrs, ...kids) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v == null || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'text') el.textContent = v;
      else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? '' : v);
    }
    kids.flat().forEach((c) => { if (c != null && c !== false) el.append(c.nodeType ? c : document.createTextNode(String(c))); });
    return el;
  }

  let toastTimer;
  function toast(msg) {
    const el = $('[data-toast]'); el.textContent = msg; el.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('show'), 2600);
  }

  const fmt = new Intl.DateTimeFormat('tr-TR', { timeZone: 'Europe/Istanbul', dateStyle: 'medium', timeStyle: 'short' });
  const when = (ms) => (ms ? fmt.format(new Date(ms)) : 'hiç');
  const region = (cc) => { try { return new Intl.DisplayNames(['tr'], { type: 'region' }).of(cc); } catch (e) { return cc; } };

  async function get(path) {
    const r = await fetch('/api/admin/' + path, { headers: { Accept: 'application/json' }, credentials: 'same-origin' });
    if (r.status === 401) { show('login'); throw new Error('auth'); }
    return r.json();
  }
  async function post(path, body = {}) {
    const r = await fetch('/api/admin/' + path, { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(body) });
    if (r.status === 401) { show('login'); throw new Error('auth'); }
    return r.json().catch(() => ({ ok: false }));
  }

  /* -------------------------------------------------------------- theme */
  $('[data-theme-toggle]').addEventListener('click', () => {
    const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('bp-theme', next); } catch (e) { /* ignore */ }
  });

  /* -------------------------------------------------------------- views */
  function show(view) { $$('[data-view]').forEach((v) => { v.hidden = v.dataset.view !== view; }); if (view === 'login') initLogin(); }

  let ts = { widget: null, loading: null, sitekey: null };
  async function initLogin() {
    if (ts.loading) return;
    ts.loading = (async () => {
      const cfg = await fetch('/api/contact').then((r) => r.json()).catch(() => ({}));
      if (!cfg.turnstile) { $('[data-login-msg]').textContent = 'Spam kontrolü yapılandırılmamış.'; return; }
      ts.sitekey = cfg.turnstile;
      await new Promise((resolve, reject) => {
        window.onTs = resolve;
        const sc = document.createElement('script');
        sc.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=onTs';
        sc.async = true; sc.onerror = reject; document.head.appendChild(sc);
      });
      const box = $('[data-ts]'); box.hidden = false;
      ts.widget = window.turnstile.render(box, { sitekey: ts.sitekey, action: 'admin', language: 'tr', theme: root.dataset.theme === 'dark' ? 'dark' : 'light', appearance: 'interaction-only' });
    })();
  }
  $('[data-login]').addEventListener('click', async (e) => {
    const msg = $('[data-login-msg]');
    const token = window.turnstile && ts.widget != null ? window.turnstile.getResponse(ts.widget) : '';
    if (!token) { msg.textContent = 'Spam kontrolü bitmedi, bir saniye sonra tekrar dene.'; return; }
    const btn = e.currentTarget; btn.setAttribute('aria-busy', 'true');
    const r = await fetch('/api/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token }) }).then((x) => x.json()).catch(() => ({}));
    btn.removeAttribute('aria-busy');
    window.turnstile.reset(ts.widget);
    msg.textContent = r.ok ? 'Bağlantıyı gönderdim. Mailini kontrol et; bağlantı 15 dakika geçerli.'
      : r.error === 'rate' ? 'Son bir saatte üç bağlantı istendi. Biraz sonra tekrar dene.'
      : r.error === 'captcha' ? 'Spam kontrolü geçmedi. Tekrar dene.' : 'Mail gönderilemedi. Ayarları kontrol et.';
  });

  /* -------------------------------------------------------------- tabs */
  const loaders = {};
  function openTab(name) {
    if (!loaders[name]) name = 'overview';
    $$('[data-tab]').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.tab === name)));
    $$('[data-panel]').forEach((p) => { p.hidden = p.dataset.panel !== name; });
    if (location.hash !== '#' + name) history.replaceState(null, '', '#' + name);
    loaders[name]($(`[data-panel="${name}"]`)).catch((e) => { if (e.message !== 'auth') toast('Yüklenemedi: ' + e.message); });
  }
  $$('[data-tab]').forEach((b) => b.addEventListener('click', () => openTab(b.dataset.tab)));
  addEventListener('hashchange', () => openTab(location.hash.slice(1)));

  function badges(counts) {
    $('[data-badge="messages"]').textContent = counts && counts.unread ? `(${counts.unread})` : '';
    $('[data-badge="songs"]').textContent = counts && counts.pending ? `(${counts.pending})` : '';
  }

  /* -------------------------------------------------------------- overview */
  const CHECK_NAMES = { database: 'Veritabanı', spotify: 'Spotify (dinlediğim)', spotifySearch: 'Spotify arama', email: 'Mail gönderimi', spamCheck: 'Spam kontrolü', privacyKeys: 'Gizlilik anahtarları', delivery: 'Mesaj teslimi' };
  loaders.overview = async (panel) => {
    const d = await get('overview');
    badges(d.counts);
    const total = d.visits.reduce((a, v) => a + v.count, 0);
    panel.replaceChildren(
      h('div', { class: 'admin__grid' },
        h('div', { class: 'acard' }, h('h2', { text: 'Durum' }),
          h('p', { class: d.health.ok ? 'ok' : 'bad', text: d.health.ok ? 'Her şey çalışıyor' : 'Dikkat gereken bir şey var' }),
          h('ul', { class: 'checks' }, Object.entries(d.health.checks).map(([k, v]) => h('li', {}, h('span', { text: CHECK_NAMES[k] || k }), h('span', { class: v ? 'ok' : 'bad', text: v ? 'tamam' : 'sorun' })))),
          d.health.unsent ? h('p', { class: 'bad', text: `${d.health.unsent} mesaj maile ulaşmadı, Mesajlar sekmesinde duruyor.` }) : null),
        h('div', { class: 'acard' }, h('h2', { text: 'Mesajlar' }), h('span', { class: 'big', text: d.counts.messages }), h('p', { text: `${d.counts.unread} okunmamış` }),
          h('button', { class: 'btn btn--ghost', type: 'button', text: 'Mesajlara git', onclick: () => openTab('messages') })),
        h('div', { class: 'acard' }, h('h2', { text: 'Şarkı önerileri' }), h('span', { class: 'big', text: d.counts.pending }), h('p', { text: `bekliyor, ${d.counts.approved} tanesi listede` }),
          h('button', { class: 'btn btn--ghost', type: 'button', text: 'Önerilere git', onclick: () => openTab('songs') })),
        h('div', { class: 'acard' }, h('h2', { text: 'Ziyaretler' }), h('span', { class: 'big', text: total.toLocaleString('tr-TR') }), h('p', { text: `${d.visits.length} ülkeden` })),
        h('div', { class: 'acard' }, h('h2', { text: 'Spotify' }),
          h('p', { text: d.spotify.connected ? `Bağlı${d.spotify.user ? ': ' + d.spotify.user.name : ''}` : 'Bağlı değil' }),
          h('p', { text: d.spotify.panelToken ? 'Çalma listesi yetkisi var.' : 'Öneri eklemek için Ayarlar sekmesinden yeniden bağla.' })),
        h('div', { class: 'acard' }, h('h2', { text: 'Bakım' }),
          h('p', { text: `Son temizlik: ${when(d.lastMaintain)}` }),
          h('p', { text: `Arama motorlarına son bildirim: ${d.lastIndexnow ? when(d.lastIndexnow.at) + ' (' + d.lastIndexnow.urls + ' adres)' : 'hiç'}` })))
    );
  };

  /* -------------------------------------------------------------- messages */
  const REASON = { collab: 'Birlikte çalışmak', role: 'Pozisyon ya da fırsat', automation: 'Otomasyon fikri', hello: 'Merhaba', call: 'Görüşme' };
  loaders.messages = async (panel) => {
    const d = await get('messages');
    const unread = d.items.filter((m) => !m.read_at).length;
    $('[data-badge="messages"]').textContent = unread ? `(${unread})` : '';
    if (!d.items.length) { panel.replaceChildren(h('p', { text: 'Henüz mesaj yok.' })); return; }
    panel.replaceChildren(h('ul', { class: 'alist' }, d.items.map((m) => {
      const li = h('li', { class: 'aitem' + (m.read_at ? '' : ' is-unread') },
        h('div', { class: 'aitem__meta' },
          h('b', { text: m.name }), h('span', { text: m.email }), h('span', { text: REASON[m.reason] || m.reason || '' }),
          m.country ? h('span', { text: region(m.country) }) : null, h('span', { text: when(m.created_at) }),
          m.notified ? null : h('span', { class: 'bad', text: 'maile gitmedi' })),
        h('p', { class: 'aitem__body', text: m.body }),
        h('div', { class: 'aitem__actions' },
          h('a', { class: 'btn btn--solid', href: `mailto:${m.email}?subject=${encodeURIComponent('Re: burak.pm')}`, text: 'Yanıtla' }),
          m.read_at ? null : h('button', { class: 'btn btn--ghost', type: 'button', text: 'Okundu', onclick: async () => { await post('messages/read', { id: m.id }); loaders.messages(panel); } }),
          h('button', { class: 'btn btn--ghost btn--danger', type: 'button', text: 'Sil', onclick: async () => {
            if (!confirm(`${m.name} adlı kişinin mesajı kalıcı olarak silinsin mi?`)) return;
            const r = await post('messages/delete', { id: m.id }); toast(r.ok ? 'Silindi' : 'Silinemedi'); loaders.messages(panel);
          } })));
      return li;
    })));
  };

  /* -------------------------------------------------------------- songs */
  let songStatus = 'pending';
  const STATUS = { pending: 'Bekleyen', approved: 'Listeye eklenen', rejected: 'Reddedilen' };
  loaders.songs = async (panel) => {
    const d = await get('songs?status=' + songStatus);
    const filter = h('div', { class: 'admin__tabs' }, Object.entries(STATUS).map(([k, v]) =>
      h('button', { class: 'chip', type: 'button', 'aria-pressed': String(k === songStatus), text: v, onclick: () => { songStatus = k; loaders.songs(panel); } })));
    const art = (s) => { const span = h('span', { class: 'song__art' }); if (s.art && /^https:\/\/i\.scdn\.co\//.test(s.art)) span.append(h('img', { src: s.art, alt: '', width: 48, height: 48 })); return span; };
    const act = (label, path, s, cls = 'btn btn--ghost') => h('button', { class: cls, type: 'button', text: label, onclick: async (e) => {
      const btn = e.currentTarget; btn.setAttribute('aria-busy', 'true');
      const r = await post(path, { id: s.id }); btn.removeAttribute('aria-busy');
      if (r.ok) toast('Tamam'); else toast(r.error === 'spotify_not_connected' || r.error === 'spotify_scope' ? 'Önce Ayarlar sekmesinden Spotify’ı bağla.' : 'Olmadı: ' + (r.error || 'hata'));
      loaders.songs(panel);
    } });
    panel.replaceChildren(filter, d.items.length ? h('ul', { class: 'alist' }, d.items.map((s) => h('li', { class: 'aitem' },
      h('a', { class: 'song', href: s.url, target: '_blank', rel: 'noopener' }, art(s), h('span', { class: 'song__text' }, h('b', { text: s.title }), h('small', { text: s.artist + (s.album ? ' · ' + s.album : '') }))),
      h('div', { class: 'aitem__meta' }, h('span', { text: when(s.created_at) }), s.name ? h('span', { text: 'Öneren: ' + s.name }) : null, s.country ? h('span', { text: region(s.country) }) : null),
      s.note ? h('p', { class: 'aitem__body', text: s.note }) : null,
      h('div', { class: 'aitem__actions' },
        s.status !== 'approved' ? act('Çalma listesine ekle', 'songs/approve', s, 'btn btn--solid') : null,
        s.status === 'pending' ? act('Reddet', 'songs/reject', s) : null,
        act('Sil', 'songs/delete', s, 'btn btn--ghost btn--danger'))))) : h('p', { text: 'Bu listede şarkı yok.' }));
  };

  /* -------------------------------------------------------------- visits */
  loaders.visits = async (panel) => {
    const d = await get('overview');
    const total = d.visits.reduce((a, v) => a + v.count, 0);
    panel.replaceChildren(h('div', { class: 'acard' },
      h('h2', { text: `${total.toLocaleString('tr-TR')} ziyaret, ${d.visits.length} ülke` }),
      h('table', { class: 'vtable' }, h('thead', {}, h('tr', {}, h('th', { text: 'Ülke' }), h('th', { text: 'Son ziyaret' }), h('th', { text: 'Ziyaret' }))),
        h('tbody', {}, d.visits.map((v) => h('tr', {}, h('td', { text: region(v.country) }), h('td', { text: when(v.last_seen) }), h('td', { text: v.count.toLocaleString('tr-TR') })))))));
  };

  /* -------------------------------------------------------------- settings */
  loaders.settings = async (panel) => {
    const d = await get('overview');
    const run = (label, path, done, cls = 'btn btn--ghost', ask) => h('button', { class: cls, type: 'button', text: label, onclick: async (e) => {
      if (ask && !confirm(ask)) return;
      const btn = e.currentTarget; btn.setAttribute('aria-busy', 'true');
      const r = await post(path); btn.removeAttribute('aria-busy');
      toast(r.ok ? done(r) : 'Olmadı: ' + (r.error || r.status || 'hata'));
      if (path.startsWith('logout')) { show('login'); return; }
      loaders.settings(panel);
    } });
    panel.replaceChildren(h('div', { class: 'admin__grid' },
      h('div', { class: 'acard' }, h('h2', { text: 'Spotify' }),
        h('p', { text: d.spotify.connected ? `Bağlı${d.spotify.user ? ': ' + d.spotify.user.name : ' (eski anahtarla)'}` : 'Bağlı değil' }),
        h('p', { text: 'Şarkı önerilerini çalma listesine eklemek için hesabını bu panelden bağla. Spotify geliştirici panelinde yönlendirme adresi olarak https://burak.pm/api/admin/spotify/callback kayıtlı olmalı.' }),
        h('div', { class: 'aitem__actions' },
          h('a', { class: 'btn btn--solid', href: '/api/admin/spotify/connect', text: d.spotify.panelToken ? 'Yeniden bağla' : 'Spotify’ı bağla' }),
          d.spotify.panelToken ? run('Bağlantıyı kaldır', 'spotify/disconnect', () => 'Kaldırıldı', 'btn btn--ghost btn--danger', 'Spotify bağlantısı kaldırılsın mı?') : null)),
      h('div', { class: 'acard' }, h('h2', { text: 'Çalma listesi' }),
        d.spotify.playlist ? h('a', { class: 'link', href: d.spotify.playlist, target: '_blank', rel: 'noopener', text: 'Listeyi Spotify’da aç' }) : h('p', { text: 'İlk öneriyi onayladığında otomatik oluşturulur.' }),
        d.spotify.playlist ? run('Yeni liste başlat', 'playlist/reset', () => 'Bir sonraki onayda yeni liste açılacak', 'btn btn--ghost', 'Bir sonraki onayda yeni bir çalma listesi oluşturulsun mu?') : null),
      h('div', { class: 'acard' }, h('h2', { text: 'Arama motorları' }),
        h('p', { text: 'Site haritasındaki bütün sayfaları Bing, Yandex, Seznam, Naver ve Yep’e IndexNow ile bildirir. İçerik değiştiğinde kullan.' }),
        run('Şimdi bildir', 'indexnow', (r) => `${r.urls} adres bildirildi`, 'btn btn--solid')),
      h('div', { class: 'acard' }, h('h2', { text: 'Bakım' }),
        h('p', { text: '12 aydan eski mesajları, 24 saati geçen hız sınırı kodlarını ve eski giriş bağlantılarını temizler. Normalde kendiliğinden çalışır.' }),
        run('Şimdi temizle', 'maintenance', () => 'Temizlendi')),
      h('div', { class: 'acard' }, h('h2', { text: 'Oturum' }),
        h('p', { text: 'Oturum 7 gün açık kalır. Çıkış yapınca bütün cihazlardaki oturumlar kapanır.' }),
        h('div', { class: 'aitem__actions' },
          run('Çıkış yap', 'logout', () => 'Çıkış yapıldı')))));
  };

  /* -------------------------------------------------------------- start */
  fetch('/api/admin/me', { credentials: 'same-origin' }).then((r) => {
    if (!r.ok) { show('login'); return; }
    show('app'); openTab(location.hash.slice(1) || 'overview');
  }).catch(() => show('login'));
})();
