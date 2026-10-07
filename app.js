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

  /* ------------------------------------------------------------------ copy */
  const T = {
    en: {
      skip: 'Skip to content',
      'nav.work': 'What I do', 'nav.path': 'Path', 'nav.projects': 'Projects', 'nav.now': 'Now', 'nav.contact': 'Contact',
      'hero.hello': "Hi, I'm Burak.",
      'hero.title': 'I get people to the right answer.',
      'hero.lede': "I lead multilingual customer support teams and build the automations that keep repetitive work off their plates. Right now I'm an Associate Project Manager at ModSquad, working remotely from Ankara.",
      'hero.cta1': "See what I've built", 'hero.cta2': 'Write to me',
      'board.title': 'Live queue',
      'board.hint': 'Messages arrive in three languages and find their lane. Tap one to resolve it.',
      'board.pause': 'Pause', 'board.play': 'Resume',
      'board.resolved': 'resolved by you', 'board.waiting': 'waiting', 'board.fastest': 'fastest pickup',
      'board.lanes': ['Turkish', 'Indonesian', 'English'],
      'board.done': 'Resolved',
      'fact.years': 'years in customer experience, from the front line to project management',
      'fact.team': 'people on my multilingual team, across Turkish and Indonesian queues',
      'fact.langs': 'languages I work in: Turkish, English and Spanish',
      'fact.tools': "tools I designed and built so the team spends time on people, not spreadsheets",
      'work.title': 'What I do',
      'work.a.title': 'I help teams do their best work',
      'work.a.body': 'Day to day I run a team of about twenty advisors handling Turkish and Indonesian support, with English as a shared skill. That means KPI tracking, quality frameworks, monthly coaching, scheduling and a lot of one to one conversations.',
      'work.b.title': 'I hand repetitive work to machines',
      'work.b.body': 'If a task repeats every week, I try to automate it. I build dashboards, feedback platforms and AI assisted coaching flows with Google Apps Script and the Claude API, so the team gets answers faster and I get time back for people.',
      'work.c.title': "I build things to see what's possible",
      'work.c.body': "Outside work I prototype hardware with ESP32 boards and I'm building Tamga, an AI product for people who do business across borders. Studying international trade and logistics feeds straight into it.",
      'tag.kpi': 'KPI management', 'tag.qa': 'Quality frameworks', 'tag.coaching': 'Coaching', 'tag.wfm': 'Scheduling',
      'tag.hw': 'Hardware', 'tag.product': 'Product', 'tag.trade': 'Trade and logistics',
      'path.title': 'Path',
      'path.lede': 'Five years at one company, one step at a time. Pick a step to read about it.',
      'path.s1.role': 'Customer Success Specialist', 'path.s2.role': 'Team Lead', 'path.s3.role': 'Associate Project Manager', 'path.s4.role': 'Next',
      'path.steps': [
        ['Where it started', 'I began on the front line at ModSquad, answering customers myself. It taught me what a good answer feels like from the other side, and how much a clear process helps the person giving it.'],
        ['Leading the queue', 'As a Team Lead I moved from answering tickets to helping others answer them: coaching, quality reviews, shift coverage and being the person people ping when something is on fire.'],
        ['2025 until today', 'Now I manage a multilingual team of about twenty advisors on a major consumer software account. I own the KPIs, the coaching rhythm and the tooling, and I build most of that tooling myself.'],
        ['What comes next', "I'm studying international trade and logistics at Hitit University and building Tamga on the side. The goal is to bring the same people first, automation minded approach to teams that move goods across borders."]
      ],
      'projects.title': "Things I've built",
      'projects.lede': "Most of these live inside the company, so here's what they do rather than screenshots. Open any of them for the details.",
      'filter.all': 'All', 'filter.auto': 'Automation', 'filter.ai': 'AI', 'filter.product': 'Product', 'filter.hw': 'Hardware',
      'card.more': 'Read more', 'card.visit': 'Visit the site',
      'now.title': 'These days',
      'now.1.t': 'Studying international trade and logistics', 'now.1.d': 'I started at Hitit University in 2026, alongside work.',
      'now.2.t': 'Building Tamga', 'now.2.d': 'An AI product that lets you follow every step of a cross border deal in one place.',
      'now.3.t': 'Getting better at Spanish', 'now.3.d': 'Working proficiency today, fluency is the goal.',
      'now.4.t': 'Tinkering with an ESP32', 'now.4.d': 'A little sticker printer that listens to kids and prints what they ask for.',
      'tools.title': 'What I work with', 'tools.ops': 'Operations', 'tools.ops.d': 'KPI management, quality assurance, coaching, scheduling, reporting',
      'tools.cx': 'Support platforms', 'tools.build': 'Building', 'tools.lang': 'Languages', 'tools.lang.d': 'Turkish (native), English (C2), Spanish (working)',
      'contact.title': "Let's talk.",
      'contact.lede': 'Into support operations, automation, AI or building something together? Pick a reason, write a line, and your mail app opens with everything filled in.',
      'contact.copy': 'Copy address', 'contact.vcard': 'Add me to contacts',
      'contact.reason': "What's it about?", 'reason.collab': 'Working together', 'reason.role': 'A role or opportunity', 'reason.automation': 'An automation idea', 'reason.hello': 'Just saying hi',
      'contact.name': 'Your name', 'contact.msg': 'Message', 'contact.send': 'Open in my mail app',
      'contact.err': 'Add your name and a short message, then try again.',
      'contact.opened': 'Your mail app should be open now',
      'subject.collab': 'Working together', 'subject.role': 'A role or opportunity', 'subject.automation': 'An automation idea', 'subject.hello': 'Hello from burak.pm',
      'footer.made': 'Designed and built in Ankara. Hosted on Cloudflare Pages.',
      'footer.keys': 'Press', 'footer.keys2': 'to jump anywhere, or type the name of a certain goat.',
      'palette.move': 'to move', 'palette.pick': 'to choose', 'palette.close': 'to close', 'palette.ph': 'Type a command or a section',
      'palette.none': 'Nothing matches that yet',
      'cmd.go': 'Go to', 'cmd.theme': 'Switch to the other theme', 'cmd.lang': 'Türkçeye geç', 'cmd.copy': 'Copy my email address',
      'cmd.vcard': 'Download my contact card', 'cmd.biko': 'Call Biko', 'cmd.top': 'Back to the top', 'cmd.pause': 'Pause or resume the queue',
      'toast.copied': 'Address copied', 'toast.theme': 'Theme switched', 'toast.vcard': 'Contact card downloaded',
      'biko': ['Hi! I used to run this place.', 'Still checking the alignment.', 'Baa. Nice queue.'],
      greet: ['Merhaba', 'Hello', 'Hola', 'Halo'],
      title: 'Burak Cevik | Customer experience operations and automation'
    },
    tr: {
      skip: 'İçeriğe geç',
      'nav.work': 'Ne yapıyorum', 'nav.path': 'Yol', 'nav.projects': 'Projeler', 'nav.now': 'Şu sıralar', 'nav.contact': 'İletişim',
      'hero.hello': 'Merhaba, ben Burak.',
      'hero.title': 'İnsanları doğru cevaba ulaştırırım.',
      'hero.lede': 'Çok dilli müşteri destek ekiplerini yönetiyor, tekrarlayan işleri onların üzerinden alan otomasyonlar kuruyorum. Şu an ModSquad’da Associate Project Manager olarak Ankara’dan uzaktan çalışıyorum.',
      'hero.cta1': 'Neler yaptığıma bak', 'hero.cta2': 'Bana yaz',
      'board.title': 'Canlı kuyruk',
      'board.hint': 'Mesajlar üç dilde gelir ve kendi şeridini bulur. Birine dokun, çözülsün.',
      'board.pause': 'Durdur', 'board.play': 'Devam et',
      'board.resolved': 'senin çözdüğün', 'board.waiting': 'bekleyen', 'board.fastest': 'en hızlı yanıt',
      'board.lanes': ['Türkçe', 'Endonezce', 'İngilizce'],
      'board.done': 'Çözüldü',
      'fact.years': 'yıl müşteri deneyimi, ön saftan proje yönetimine',
      'fact.team': 'kişilik çok dilli ekip, Türkçe ve Endonezce kuyruklarda',
      'fact.langs': 'dilde çalışıyorum: Türkçe, İngilizce ve İspanyolca',
      'fact.tools': 'araç tasarlayıp kurdum, ekip vaktini tablolara değil insanlara ayırsın diye',
      'work.title': 'Ne yapıyorum',
      'work.a.title': 'Ekiplerin en iyi işini çıkarmasına yardım ederim',
      'work.a.body': 'Günlük işim, Türkçe ve Endonezce desteği yürüten, İngilizceyi ortak beceri olarak kullanan yaklaşık yirmi kişilik bir ekibi yönetmek. Bu da KPI takibi, kalite çerçeveleri, aylık koçluk, vardiya planı ve bolca birebir görüşme demek.',
      'work.b.title': 'Tekrarlayan işi makineye bırakırım',
      'work.b.body': 'Bir iş her hafta tekrarlanıyorsa otomatikleştirmeye çalışırım. Google Apps Script ve Claude API ile paneller, geri bildirim platformları ve yapay zekâ destekli koçluk akışları kuruyorum. Ekip cevaba daha hızlı ulaşıyor, bana da insanlara ayıracak zaman kalıyor.',
      'work.c.title': 'Neyin mümkün olduğunu görmek için bir şeyler yaparım',
      'work.c.body': 'İş dışında ESP32 kartlarıyla donanım prototipleri yapıyor, yurt dışıyla iş yapanlar için bir yapay zekâ ürünü olan Tamga’yı geliştiriyorum. Uluslararası ticaret ve lojistik okumam da doğrudan buna besleniyor.',
      'tag.kpi': 'KPI yönetimi', 'tag.qa': 'Kalite çerçeveleri', 'tag.coaching': 'Koçluk', 'tag.wfm': 'Vardiya planlama',
      'tag.hw': 'Donanım', 'tag.product': 'Ürün', 'tag.trade': 'Ticaret ve lojistik',
      'path.title': 'Yol',
      'path.lede': 'Aynı şirkette beş yıl, adım adım. Okumak için bir adım seç.',
      'path.s1.role': 'Customer Success Specialist', 'path.s2.role': 'Team Lead', 'path.s3.role': 'Associate Project Manager', 'path.s4.role': 'Sırada',
      'path.steps': [
        ['Başladığım yer', 'ModSquad’da ön safta, müşterilere bizzat cevap vererek başladım. İyi bir cevabın karşı taraftan nasıl hissettirdiğini ve net bir sürecin cevabı veren kişiye ne kadar yardım ettiğini burada öğrendim.'],
        ['Kuyruğu yönetmek', 'Team Lead olunca ticket cevaplamaktan başkalarının cevaplamasına yardım etmeye geçtim: koçluk, kalite incelemeleri, vardiya boşlukları ve bir şey alev aldığında ilk aranan kişi olmak.'],
        ['2025’ten bugüne', 'Şimdi büyük bir tüketici yazılımı hesabında yaklaşık yirmi kişilik çok dilli bir ekibi yönetiyorum. KPI’lar, koçluk ritmi ve araçlar bende; o araçların çoğunu da kendim kuruyorum.'],
        ['Sırada ne var', 'Hitit Üniversitesi’nde uluslararası ticaret ve lojistik okuyor, bir yandan Tamga’yı geliştiriyorum. Amacım, aynı insan odaklı ve otomasyon kafalı yaklaşımı sınır ötesi mal taşıyan ekiplere taşımak.']
      ],
      'projects.title': 'Kurduğum şeyler',
      'projects.lede': 'Bunların çoğu şirketin içinde yaşıyor, o yüzden ekran görüntüsü yerine ne işe yaradıklarını anlatıyorum. Ayrıntılar için birini aç.',
      'filter.all': 'Hepsi', 'filter.auto': 'Otomasyon', 'filter.ai': 'Yapay zekâ', 'filter.product': 'Ürün', 'filter.hw': 'Donanım',
      'card.more': 'Devamını oku', 'card.visit': 'Siteye git',
      'now.title': 'Şu sıralar',
      'now.1.t': 'Uluslararası ticaret ve lojistik okuyorum', 'now.1.d': '2026’da Hitit Üniversitesi’nde başladım, işle birlikte yürütüyorum.',
      'now.2.t': 'Tamga’yı geliştiriyorum', 'now.2.d': 'Sınır ötesi bir anlaşmanın her adımını tek yerden takip etmeyi sağlayan bir yapay zekâ ürünü.',
      'now.3.t': 'İspanyolcamı ilerletiyorum', 'now.3.d': 'Bugün iş görecek seviyede, hedef akıcılık.',
      'now.4.t': 'Bir ESP32 ile uğraşıyorum', 'now.4.d': 'Çocukları dinleyip istediklerini sticker olarak basan küçük bir yazıcı.',
      'tools.title': 'Neyle çalışıyorum', 'tools.ops': 'Operasyon', 'tools.ops.d': 'KPI yönetimi, kalite güvence, koçluk, vardiya planlama, raporlama',
      'tools.cx': 'Destek platformları', 'tools.build': 'Geliştirme', 'tools.lang': 'Diller', 'tools.lang.d': 'Türkçe (ana dil), İngilizce (C2), İspanyolca (iş seviyesi)',
      'contact.title': 'Konuşalım.',
      'contact.lede': 'Destek operasyonu, otomasyon, yapay zekâ ya da birlikte bir şey kurmak mı aklında? Bir konu seç, bir satır yaz; mail uygulaman her şey doldurulmuş şekilde açılsın.',
      'contact.copy': 'Adresi kopyala', 'contact.vcard': 'Beni rehbere ekle',
      'contact.reason': 'Konu ne?', 'reason.collab': 'Birlikte çalışmak', 'reason.role': 'Bir pozisyon ya da fırsat', 'reason.automation': 'Bir otomasyon fikri', 'reason.hello': 'Sadece merhaba',
      'contact.name': 'Adın', 'contact.msg': 'Mesajın', 'contact.send': 'Mail uygulamamda aç',
      'contact.err': 'Adını ve kısa bir mesaj yaz, sonra tekrar dene.',
      'contact.opened': 'Mail uygulaman şimdi açılmış olmalı',
      'subject.collab': 'Birlikte çalışmak', 'subject.role': 'Bir pozisyon ya da fırsat', 'subject.automation': 'Bir otomasyon fikri', 'subject.hello': 'burak.pm üzerinden merhaba',
      'footer.made': 'Ankara’da tasarlanıp kodlandı. Cloudflare Pages üzerinde yayında.',
      'footer.keys': 'Her yere atlamak için', 'footer.keys2': 'tuşlarına bas ya da tanıdık bir keçinin adını yaz.',
      'palette.move': 'gezin', 'palette.pick': 'seç', 'palette.close': 'kapat', 'palette.ph': 'Bir komut ya da bölüm yaz',
      'palette.none': 'Buna uyan bir şey yok',
      'cmd.go': 'Git', 'cmd.theme': 'Diğer temaya geç', 'cmd.lang': 'Switch to English', 'cmd.copy': 'Mail adresimi kopyala',
      'cmd.vcard': 'Kartvizitimi indir', 'cmd.biko': 'Biko’yu çağır', 'cmd.top': 'En üste dön', 'cmd.pause': 'Kuyruğu durdur ya da başlat',
      'toast.copied': 'Adres kopyalandı', 'toast.theme': 'Tema değişti', 'toast.vcard': 'Kartvizit indirildi',
      'biko': ['Selam! Burayı eskiden ben işletiyordum.', 'Hâlâ hizalamaları kontrol ediyorum.', 'Mee. Güzel kuyruk.'],
      greet: ['Merhaba', 'Hello', 'Hola', 'Halo'],
      title: 'Burak Cevik | Müşteri deneyimi operasyonu ve otomasyon'
    }
  };

  /* --------------------------------------------------------------- glyphs */
  const G = {
    dash: '<svg viewBox="0 0 52 52"><rect x="4" y="6" width="44" height="40" rx="6"/><path d="M4 16h44M14 38V28M22 38V24M30 38V30M38 38V22"/></svg>',
    lib: '<svg viewBox="0 0 52 52"><path d="M8 10h10v34H8zM20 10h10v34H20zM33 12l9 2-6 31-9-2z"/><path d="M11 17h4M23 17h4"/></svg>',
    coach: '<svg viewBox="0 0 52 52"><path d="M8 12h28a4 4 0 0 1 4 4v14a4 4 0 0 1-4 4H22l-8 7v-7H8a4 4 0 0 1-4-4V16a4 4 0 0 1 4-4z"/><path d="M44 8l1.6 3.4L49 13l-3.4 1.6L44 18l-1.6-3.4L39 13l3.4-1.6zM14 21h16M14 26h10"/></svg>',
    cal: '<svg viewBox="0 0 52 52"><rect x="6" y="10" width="40" height="36" rx="6"/><path d="M6 20h40M16 6v8M36 6v8"/><circle cx="34" cy="34" r="6"/><path d="M34 31v3l2 2"/></svg>',
    tamga: '<svg viewBox="0 0 52 52"><circle cx="26" cy="26" r="20"/><path d="M6 26h40M26 6c-7 6-7 34 0 40M26 6c7 6 7 34 0 40"/><path d="M17 18l9 8 9-8"/></svg>',
    chip: '<svg viewBox="0 0 52 52"><rect x="12" y="8" width="28" height="22" rx="4"/><path d="M16 30v8h20v-8M20 38v6h12v-6"/><circle cx="21" cy="18" r="2.5"/><circle cx="31" cy="18" r="2.5"/><path d="M21 24q5 3 10 0"/></svg>'
  };

  const P = {
    en: [
      { id: 'dash', size: 'xl', tone: '', cats: ['auto'], metric: '13+', glyph: 'dash', spark: true,
        title: 'Team 360 dashboard',
        blurb: 'One place for the whole team: performance, quality and coaching data pulled from more than thirteen spreadsheets and calendars.',
        lede: 'Before this, answering "how is the team doing?" meant opening a dozen files. Now it is one dashboard.',
        points: ['Reads from 13+ source spreadsheets and Google Calendars', 'Built as 17 Apps Script files over six phases', 'Flags overdue coaching reviews and missed feedback automatically', 'Checks bonus eligibility against queue specific KPI targets'],
        tags: ['Google Sheets', 'Apps Script', 'KPI logic'] },
      { id: 'lib', size: 'md', tone: 'blue', cats: ['auto', 'product'], metric: 'v5', glyph: 'lib',
        title: 'Feedback library',
        blurb: 'A private web app where every advisor sees their own quality feedback and coaching notes.',
        lede: 'It started as a weekly brief and grew into a small platform the whole team uses.',
        points: ['Personal metrics, quality tracking and grouping in one view', 'A buddy board that pairs advisors to learn from each other', 'Celebrations, in app notifications and email verification', 'A read only view for project managers'],
        tags: ['Apps Script', 'Web app', 'Five versions'] },
      { id: 'coach', size: 'sm', tone: '', cats: ['ai', 'auto'], glyph: 'coach',
        title: 'AI coaching forms',
        blurb: 'Monthly coaching prep written with the Claude API, from strengths to SMART goal ideas.',
        lede: 'I give it the month’s data, it drafts the whole coaching form, and I review it before the session.',
        points: ['Drafts pre work: strengths and skills worth focusing on', 'Suggests SMART goals across practice, research and peer learning', 'Builds a four week follow up plan', 'Keeps raw KPI data as internal context only'],
        tags: ['Claude API', 'Coaching'] },
      { id: 'cal', size: 'sm', tone: '', cats: ['auto'], glyph: 'cal',
        title: 'Availability and alerts',
        blurb: 'Shows the team when they can reach me, with an emergency button and a Telegram bot.',
        lede: 'A small system that answers "is Burak around?" without anyone having to ask.',
        points: ['Calendar driven view of meetings, point of contact shifts and classes', 'Emergency button that reaches me right away', 'Telegram bot with a one tap Handled button', 'Monthly emergency report and PDF export'],
        tags: ['Apps Script', 'Calendar', 'Telegram'] },
      { id: 'chip', size: 'sm', tone: '', cats: ['hw'], glyph: 'chip',
        title: 'Çipik',
        blurb: 'A voice to sticker printer for kids: say what you want, and a little thermal printer draws it.',
        lede: 'A hardware side project for fun and for learning.',
        points: ['ESP32 board with 16 MB flash and 8 MB PSRAM', 'Small color TFT screen for a friendly face', 'Thermal printer for instant stickers'],
        tags: ['ESP32', 'Hardware', 'Prototype'] },
      { id: 'tamga', size: 'full', tone: 'saffron', cats: ['product', 'ai'], glyph: 'tamga', link: 'https://usetamga.com',
        title: 'Tamga',
        blurb: 'An AI product for anyone doing business abroad, so every step of a deal can be followed in one place.',
        lede: 'My own product, growing alongside my trade and logistics studies.',
        points: ['Tracks every process of a cross border deal end to end', 'Planned in Turkish, English, Spanish, French, Russian, Arabic and Portuguese', 'Built for logistics and export teams who live in their inbox'],
        tags: ['Product', 'AI', 'Trade'] }
    ],
    tr: [
      { title: 'Ekip 360 paneli',
        blurb: 'Bütün ekip için tek bir yer: performans, kalite ve koçluk verisi on üçten fazla tablo ve takvimden çekiliyor.',
        lede: 'Eskiden "ekip nasıl gidiyor?" sorusuna cevap vermek bir düzine dosya açmak demekti. Artık tek bir panel.',
        points: ['13+ kaynak tablodan ve Google Takvim’den okuyor', 'Altı aşamada, 17 Apps Script dosyasıyla kuruldu', 'Geciken koçluk incelemelerini ve eksik geri bildirimi kendisi işaretliyor', 'Prim uygunluğunu kuyruğa özel KPI hedeflerine göre kontrol ediyor'],
        tags: ['Google Sheets', 'Apps Script', 'KPI mantığı'] },
      { title: 'Geri bildirim kütüphanesi',
        blurb: 'Her danışmanın kendi kalite geri bildirimini ve koçluk notlarını gördüğü özel bir web uygulaması.',
        lede: 'Haftalık bir özet olarak başladı, bütün ekibin kullandığı küçük bir platforma dönüştü.',
        points: ['Kişisel metrikler, kalite takibi ve gruplama tek ekranda', 'Danışmanları birbirinden öğrenmeleri için eşleştiren buddy panosu', 'Kutlamalar, uygulama içi bildirimler ve mail doğrulama', 'Proje yöneticileri için salt okunur görünüm'],
        tags: ['Apps Script', 'Web uygulaması', 'Beş sürüm'] },
      { title: 'Yapay zekâ destekli koçluk formları',
        blurb: 'Claude API ile hazırlanan aylık koçluk ön çalışması, güçlü yönlerden SMART hedef önerilerine kadar.',
        lede: 'Ayın verisini veriyorum, koçluk formunun tamamını taslak olarak hazırlıyor, ben de görüşmeden önce gözden geçiriyorum.',
        points: ['Ön çalışmayı hazırlar: güçlü yönler ve odaklanmaya değer beceriler', 'Pratik, araştırma ve akran öğrenmesi başlıklarında SMART hedefler önerir', 'Dört haftalık takip planı çıkarır', 'Ham KPI verisini sadece iç bağlam olarak kullanır'],
        tags: ['Claude API', 'Koçluk'] },
      { title: 'Müsaitlik ve uyarılar',
        blurb: 'Ekibe bana ne zaman ulaşabileceklerini gösteriyor; acil durum butonu ve Telegram botu da var.',
        lede: '"Burak müsait mi?" sorusunu kimse sormadan cevaplayan küçük bir sistem.',
        points: ['Toplantıları, irtibat vardiyalarını ve dersleri takvimden gösterir', 'Bana hemen ulaşan bir acil durum butonu', 'Tek dokunuşla Halledildi butonu olan Telegram botu', 'Aylık acil durum raporu ve PDF çıktısı'],
        tags: ['Apps Script', 'Takvim', 'Telegram'] },
      { title: 'Çipik',
        blurb: 'Çocuklar için sesle çalışan sticker yazıcısı: ne istediğini söyle, küçük bir termal yazıcı çizsin.',
        lede: 'Eğlence ve öğrenme için yaptığım bir donanım projesi.',
        points: ['16 MB flash ve 8 MB PSRAM’li ESP32 kart', 'Sevimli bir yüz için küçük renkli TFT ekran', 'Anında sticker için termal yazıcı'],
        tags: ['ESP32', 'Donanım', 'Prototip'] },
      { title: 'Tamga',
        blurb: 'Yurt dışıyla iş yapan herkes için, bir anlaşmanın her adımını tek yerden takip etmeyi sağlayan bir yapay zekâ ürünü.',
        lede: 'Ticaret ve lojistik eğitimimle birlikte büyüyen kendi ürünüm.',
        points: ['Sınır ötesi bir anlaşmanın bütün süreçlerini baştan sona takip eder', 'Türkçe, İngilizce, İspanyolca, Fransızca, Rusça, Arapça ve Portekizce planlanıyor', 'Gelen kutusunda yaşayan lojistik ve ihracat ekipleri için'],
        tags: ['Ürün', 'Yapay zekâ', 'Ticaret'] }
    ]
  };
  const project = (i, lang) => Object.assign({}, P.en[i], lang === 'tr' ? P.tr[i] : {});

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
    const v = ['BEGIN:VCARD', 'VERSION:3.0', 'N:Cevik;Burak;;;', 'FN:Burak Cevik', 'ORG:ModSquad', 'TITLE:Associate Project Manager',
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
  const MESSAGES = [
    { l: 0, s: 'Merhaba, siparişim nerede?' }, { l: 0, s: 'Şifremi sıfırlayamıyorum' }, { l: 0, s: 'Aboneliğimi iptal etmek istiyorum' },
    { l: 0, s: 'Faturamda bir hata var' }, { l: 0, s: 'Çok teşekkürler!' }, { l: 0, s: 'Hesabım kilitlendi' },
    { l: 1, s: 'Halo, akun saya terkunci' }, { l: 1, s: 'Bagaimana cara ganti paket?' }, { l: 1, s: 'Pembayaran saya gagal' },
    { l: 1, s: 'Terima kasih banyak!' }, { l: 1, s: 'Lagu saya hilang semua' },
    { l: 2, s: "Hi, I can't log in" }, { l: 2, s: 'Was I charged twice?' }, { l: 2, s: 'How do I change my plan?' },
    { l: 2, s: 'Thanks, that worked!' }, { l: 2, s: 'My download keeps failing' }
  ];
  const LANG_CODE = ['TR', 'ID', 'EN'];

  class Queue {
    constructor(canvas) {
      this.c = canvas; this.x = canvas.getContext('2d');
      this.items = []; this.bursts = []; this.mouse = { x: -999, y: -999 };
      this.resolved = 0; this.fastest = Infinity; this.spawnT = 0; this.paused = false; this.visible = true;
      this.last = performance.now(); this.hover = null;
      this.readColors(); this.resize();
      new ResizeObserver(() => this.resize()).observe(canvas);
      canvas.addEventListener('pointermove', (e) => { const r = canvas.getBoundingClientRect(); this.mouse.x = e.clientX - r.left; this.mouse.y = e.clientY - r.top; });
      canvas.addEventListener('pointerleave', () => { this.mouse.x = this.mouse.y = -999; });
      canvas.addEventListener('pointerdown', (e) => {
        const r = canvas.getBoundingClientRect(); const px = e.clientX - r.left; const py = e.clientY - r.top;
        const hit = this.hit(px, py, e.pointerType === 'touch' ? 14 : 4);
        if (hit) this.resolve(hit);
      });
      new IntersectionObserver(([en]) => { this.visible = en.isIntersecting; }, { threshold: 0 }).observe(canvas);
      for (let i = 0; i < (this.w < 480 ? 3 : 5); i++) this.spawn(this.w * (0.08 + i * 0.16));
      this.loop = this.loop.bind(this); requestAnimationFrame(this.loop);
    }
    readColors() {
      const cs = getComputedStyle(root);
      const v = (n) => cs.getPropertyValue(n).trim();
      this.col = { ink: v('--ink'), ink2: v('--ink-2'), line: v('--line'), bubble: v('--bubble'), blue: v('--blue'), sky: v('--sky'), saffron: v('--saffron'), sink: v('--saffron-ink'), paper: v('--paper-2') };
    }
    relabel() { this.lanes = t('board.lanes'); }
    resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const r = this.c.getBoundingClientRect();
      this.w = r.width; this.h = r.height; this.dpr = dpr;
      this.c.width = Math.round(r.width * dpr); this.c.height = Math.round(r.height * dpr);
      this.x.setTransform(dpr, 0, 0, dpr, 0, 0);
      this.relabel();
      this.split = this.w < 520 ? 0.34 : 0.42;
      this.font = (this.w < 480 ? 13 : 14.5);
    }
    laneY(l) { const top = 26, bottom = this.h - 26; /* bands */ const step = (bottom - top) / 3; return top + step * l + step / 2; }
    spawn(x0) {
      const m = MESSAGES[(Math.random() * MESSAGES.length) | 0];
      this.x.font = `500 ${this.font}px Schibsted, system-ui, sans-serif`;
      const tw = this.x.measureText(m.s).width;
      const w = tw + 54, h = this.font * 2.35;
      const split = this.w * this.split;
      let y = 0, bestGap = -1;
      for (let k = 0; k < 8; k++) {
        const cand = 34 + Math.random() * (this.h - 68);
        const near = this.items.filter((o) => o.state === 'open' && o.x < split + 40 && Math.abs(o.x - (x0 !== undefined ? x0 : -w)) < o.w + w);
        const gap = near.length ? Math.min(...near.map((o) => Math.abs(o.y - cand))) : 999;
        if (gap > bestGap) { bestGap = gap; y = cand; }
      }
      const it = { m, w, h, x: x0 !== undefined ? x0 : -w - 10, y, vy: 0,
        speed: 22 + Math.random() * 18, born: performance.now(), state: 'open', a: 0, s: 1, wob: Math.random() * 6.28 };
      this.items.push(it);
    }
    hit(px, py, pad) {
      for (let i = this.items.length - 1; i >= 0; i--) {
        const it = this.items[i];
        if (it.state !== 'open') continue;
        if (px > it.x - pad && px < it.x + it.w + pad && py > it.y - it.h / 2 - pad && py < it.y + it.h / 2 + pad) return it;
      }
      return null;
    }
    resolve(it) {
      it.state = 'done'; it.doneAt = performance.now();
      const secs = (it.doneAt - it.born) / 1000;
      this.resolved++;
      if (secs < this.fastest) this.fastest = secs;
      stat('resolved', this.resolved, true);
      const best = $('.board__best'); best.hidden = false; stat('fastest', this.fastest.toFixed(1));
      for (let i = 0; i < 14; i++) {
        const a = (Math.PI * 2 * i) / 14;
        this.bursts.push({ x: it.x + it.w / 2, y: it.y, vx: Math.cos(a) * (60 + Math.random() * 80), vy: Math.sin(a) * (60 + Math.random() * 80), life: 1 });
      }
    }
    toggle(force) { this.paused = force !== undefined ? force : !this.paused; return this.paused; }
    loop(now) {
      const dt = Math.min(0.05, (now - this.last) / 1000); this.last = now;
      if (this.visible && !document.hidden) { if (!this.paused) this.update(dt, now); this.draw(now); }
      requestAnimationFrame(this.loop);
    }
    update(dt, now) {
      const slow = reduced.matches ? 0.35 : 1;
      this.spawnT -= dt;
      const max = this.w < 480 ? 6 : 9;
      const open = this.items.filter((i) => i.state === 'open').length;
      if (this.spawnT <= 0 && open < max) { this.spawn(); this.spawnT = 1.1 + Math.random() * 1.2; }
      const split = this.w * this.split;
      this.hover = this.hit(this.mouse.x, this.mouse.y, 4);
      for (const it of this.items) {
        if (it.state === 'open') {
          const near = it === this.hover;
          it.a = Math.min(1, it.a + dt * 3);
          it.s += ((near ? 1.06 : 1) - it.s) * Math.min(1, dt * 10);
          it.x += it.speed * dt * slow * (near ? 0.15 : 1);
          const cx = it.x + it.w / 2;
          let ty = it.y;
          if (cx > split) ty = this.laneY(it.m.l);
          else ty = it.y + Math.sin(now / 900 + it.wob) * 0.15;
          it.vy += (ty - it.y) * dt * 3.2; it.vy *= 0.9; it.y += it.vy * slow;
          if (cx > split - 40) {
            let ahead = null;
            for (const o of this.items) {
              if (o === it || o.state !== 'open' || o.m.l !== it.m.l || o.x <= it.x) continue;
              if (!ahead || o.x < ahead.x) ahead = o;
            }
            if (ahead && it.x + it.w + 12 > ahead.x && ahead.x + ahead.w / 2 > split) it.x = ahead.x - it.w - 12;
          }
          if (it.x > this.w + 20) it.state = 'gone';
        } else if (it.state === 'done') {
          const k = (now - it.doneAt) / 900;
          it.s = 1 + Math.sin(Math.min(k, 1) * Math.PI) * 0.08;
          if (k > 0.55) it.a = Math.max(0, 1 - (k - 0.55) / 0.45);
          it.y -= dt * 18;
          if (k >= 1) it.state = 'gone';
        }
      }
      this.items = this.items.filter((i) => i.state !== 'gone');
      for (const b of this.bursts) { b.x += b.vx * dt; b.y += b.vy * dt; b.vx *= 0.93; b.vy *= 0.93; b.life -= dt * 1.6; }
      this.bursts = this.bursts.filter((b) => b.life > 0);
      stat('waiting', this.items.filter((i) => i.state === 'open').length);
      this.c.style.cursor = this.hover ? 'pointer' : 'default';
    }
    rr(x, y, w, h, r) {
      const c = this.x; c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
      c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
    }
    draw(now) {
      const c = this.x, C = this.col; c.clearRect(0, 0, this.w, this.h);
      const split = this.w * this.split;
      // lanes on the routed side: a soft band each, label sits in the band's top edge
      const bandH = (this.h - 52) / 3;
      c.font = `600 12px Schibsted, system-ui, sans-serif`; c.textBaseline = 'middle';
      for (let l = 0; l < 3; l++) {
        const y = this.laneY(l), top = y - bandH / 2 + 4;
        c.fillStyle = C.sky; c.globalAlpha = 0.16; this.rr(split + 8, top, this.w - split - 16, bandH - 8, 14); c.fill(); c.globalAlpha = 1;
        c.strokeStyle = C.line; c.lineWidth = 1; c.setLineDash([4, 6]);
        c.beginPath(); c.moveTo(split + 8, y); c.lineTo(this.w - 8, y); c.stroke(); c.setLineDash([]);
        c.fillStyle = C.ink2; c.textAlign = 'right'; c.fillText(this.lanes[l], this.w - 20, top + 14);
      }
      // the router line
      c.strokeStyle = C.blue; c.globalAlpha = 0.5; c.lineWidth = 2;
      c.beginPath(); c.moveTo(split, 16); c.lineTo(split, this.h - 16); c.stroke(); c.globalAlpha = 1;
      for (let l = 0; l < 3; l++) { c.fillStyle = C.blue; c.beginPath(); c.arc(split, this.laneY(l), 3.5, 0, 6.29); c.fill(); }
      // bubbles
      for (const it of this.items) {
        c.save(); c.globalAlpha = it.a;
        const cx = it.x + it.w / 2; c.translate(cx, it.y); c.scale(it.s, it.s); c.translate(-cx, -it.y);
        const x = it.x, y = it.y - it.h / 2, done = it.state === 'done', hov = it === this.hover;
        c.shadowColor = 'rgba(20,24,48,.18)'; c.shadowBlur = hov ? 18 : 8; c.shadowOffsetY = hov ? 6 : 3;
        c.fillStyle = done ? C.saffron : C.bubble; this.rr(x, y, it.w, it.h, it.h / 2.2); c.fill();
        c.shadowColor = 'transparent';
        if (hov && !done) { c.strokeStyle = C.blue; c.lineWidth = 2; c.stroke(); }
        // language pill
        const px = x + 10, ph = 18, pw = 24, py = it.y - ph / 2;
        c.fillStyle = done ? 'rgba(0,0,0,.12)' : C.sky; this.rr(px, py, pw, ph, 6); c.fill();
        c.fillStyle = done ? C.sink : C.ink; c.font = `700 10px Schibsted, system-ui, sans-serif`; c.textAlign = 'center';
        c.fillText(LANG_CODE[it.m.l], px + pw / 2, it.y + 0.5);
        c.textAlign = 'left'; c.font = `500 ${this.font}px Schibsted, system-ui, sans-serif`;
        c.fillStyle = done ? C.sink : C.ink;
        c.fillText(done ? '✓ ' + t('board.done') : it.m.s, x + 42, it.y + 0.5);
        c.restore();
      }
      for (const b of this.bursts) { c.globalAlpha = Math.max(0, b.life); c.fillStyle = C.saffron; c.beginPath(); c.arc(b.x, b.y, 3 * b.life + 1, 0, 6.29); c.fill(); }
      c.globalAlpha = 1;
    }
  }
  function stat(name, val, bump) {
    const el = $(`[data-stat="${name}"]`); if (!el) return;
    if (el.textContent !== String(val)) { el.textContent = val; if (bump) { el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); } }
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
    if (rail) rail.style.width = (i / (steps.length - 1)) * 100 + '%';
  }

  /* ------------------------------------------------------------- projects */
  let filter = 'all';
  function renderProjects() {
    const wrap = $('[data-projects]');
    wrap.innerHTML = '';
    P.en.forEach((_, i) => {
      const p = project(i, lang);
      const b = document.createElement('button');
      b.type = 'button';
      b.className = `card card--${p.size}${p.tone ? ' card--' + p.tone : ''}`;
      b.dataset.cats = p.cats.join(' ');
      b.style.setProperty('--d', i);
      b.style.viewTransitionName = 'card-' + p.id;
      b.setAttribute('aria-haspopup', 'dialog');
      b.innerHTML = `<span class="card__spot"></span>${p.metric ? `<span class="card__metric" aria-hidden="true">${p.metric}</span>` : ''}
        <span class="card__glyph" aria-hidden="true">${G[p.glyph]}</span>
        ${p.spark ? '<span class="spark" aria-hidden="true">' + '<i></i>'.repeat(14) + '</span>' : ''}
        <h3>${p.title}</h3><p>${p.blurb}</p><span class="card__more">${t('card.more')}</span>`;
      b.addEventListener('click', () => openSheet(i));
      b.addEventListener('pointermove', (e) => { const r = b.getBoundingClientRect(); b.style.setProperty('--mx', e.clientX - r.left + 'px'); b.style.setProperty('--my', e.clientY - r.top + 'px'); });
      wrap.appendChild(b);
    });
    applyFilter(filter, false);
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
  function openSheet(i) {
    const p = project(i, lang);
    $('[data-sheet-glyph]').innerHTML = G[p.glyph];
    $('[data-sheet-title]').textContent = p.title;
    $('[data-sheet-lede]').textContent = p.lede;
    $('[data-sheet-points]').innerHTML = p.points.map((x) => `<li>${x}</li>`).join('');
    $('[data-sheet-tags]').innerHTML = p.tags.map((x) => `<li>${x}</li>`).join('');
    const link = $('[data-sheet-link]');
    if (p.link) { link.hidden = false; link.href = p.link; link.textContent = t('card.visit'); } else link.hidden = true;
    sheet.showModal();
  }
  sheet.addEventListener('click', (e) => { if (e.target === sheet || e.target.closest('[data-close]')) sheet.close(); });

  /* --------------------------------------------------------- lanes (work) */
  $$('.lane__head').forEach((h) => h.addEventListener('click', () => {
    const open = h.getAttribute('aria-expanded') === 'true';
    h.setAttribute('aria-expanded', String(!open));
  }));

  /* ------------------------------------------------------- greetings card */
  let greetI = 0;
  setInterval(() => {
    if (reduced.matches) return;
    const el = $('[data-greet]'); const list = t('greet');
    el.classList.add('out');
    setTimeout(() => { greetI = (greetI + 1) % list.length; el.textContent = list[greetI]; el.classList.remove('out'); }, 350);
  }, 2600);

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
  $('[data-composer]').addEventListener('submit', (e) => {
    e.preventDefault();
    const f = e.currentTarget, err = $('[data-composer-error]');
    const name = f.name.value.trim(), msg = f.msg.value.trim(), reason = f.reason.value;
    if (!name || !msg) { err.textContent = t('contact.err'); err.hidden = false; (name ? f.msg : f.name).focus(); return; }
    err.hidden = true;
    const subject = `${t('subject.' + reason)} | ${name}`;
    location.href = `mailto:${EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(msg + '\n\n' + name)}`;
    toast(t('contact.opened'));
  });

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
    const go = [['#work', 'nav.work'], ['#path', 'nav.path'], ['#projects', 'nav.projects'], ['#now', 'nav.now'], ['#contact', 'nav.contact']]
      .map(([h, k]) => ({ label: t(k), hint: t('cmd.go'), run: () => $(h).scrollIntoView({ behavior: reduced.matches ? 'auto' : 'smooth' }) }));
    const projects = P.en.map((_, i) => ({ label: project(i, lang).title, hint: t('nav.projects'), run: () => openSheet(i) }));
    return [
      ...go,
      { label: t('cmd.theme'), hint: 'T', run: () => { toggleTheme(); toast(t('toast.theme')); } },
      { label: t('cmd.lang'), hint: 'L', run: () => setLang(lang === 'tr' ? 'en' : 'tr') },
      { label: t('cmd.copy'), hint: EMAIL, run: copyEmail },
      { label: t('cmd.vcard'), hint: '.vcf', run: downloadVcard },
      { label: t('cmd.pause'), hint: 'P', run: toggleQueue },
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
  });
  $$('[data-filter]').forEach((c) => c.addEventListener('click', () => applyFilter(c.dataset.filter)));
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
