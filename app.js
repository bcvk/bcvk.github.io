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
      'hero.lede': "I lead multilingual customer support teams and build the automations that keep repetitive work off their plates. Right now I'm an Assistant Project Manager at ModSquad, working remotely from Ankara.",
      'hero.cta1': "See what I've built", 'hero.cta2': 'Write to me',
      'board.title': 'Live queue',
      'board.hint': 'Messages arrive in many languages over chat, mail and social. Each one is routed by topic and the team works through them in order. Tap one to help.',
      'board.pause': 'Pause', 'board.play': 'Resume',
      'board.lanes': ['Account and login', 'Billing and payments', 'Technical issues', 'General questions'],
      'board.router': 'Routing', 'board.incoming': 'Incoming',
      'board.done': 'Resolved', 'board.scale': 'Simulation: one second equals one minute.',
      'traffic.calm': 'Calm', 'traffic.normal': 'Normal', 'traffic.busy': 'Peak',
      'kpi.you': 'Resolved by you', 'kpi.team': 'Resolved by the team', 'kpi.frt': 'Average wait', 'kpi.sla': 'Within SLA', 'kpi.csat': 'Satisfaction', 'kpi.waiting': 'Waiting now',
      'unit.min': 'min', 'mix.title': 'Language mix', 'mix.langs': 'languages so far', 'mix.other': 'Other',
      'legend.p1': 'Urgent', 'legend.p2': 'High', 'legend.p3': 'Normal',
      'ch.chat': 'Chat', 'ch.mail': 'Mail', 'ch.social': 'Social',
      'tip.wait': 'Waiting', 'tip.target': 'target', 'tip.breach': 'Past its SLA, someone grab this one', 'tip.ok': 'Within its SLA', 'tip.click': 'Click to resolve',
      'fact.years': 'years in customer experience, from the front line to project management',
      'fact.team': 'people on my multilingual team, led by Turkish and English and spanning many other language queues',
      'fact.langs': 'languages I work in: Turkish, English and Spanish',
      'fact.tools': "tools I designed and built so the team spends time on people, not spreadsheets",
      'work.title': 'What I do',
      'work.a.title': 'I help teams do their best work',
      'work.a.body': 'I lead a multilingual support team. My job is to set clear goals, keep quality high, coach people one to one and make sure every customer gets a good answer, whichever language they write in.',
      'work.b.title': 'I hand repetitive work to machines',
      'work.b.body': 'If a task repeats every week, I try to automate it. I build dashboards, feedback platforms and AI assisted coaching flows with Google Apps Script and the Claude API, so the team gets answers faster and I get time back for people. One rule I never bend: internal and customer data stays out of AI tools. The systems that touch it run on plain logic inside the company workspace.',
      'work.c.title': "I build things to see what's possible",
      'work.c.body': "Outside work I prototype hardware with ESP32 boards and I'm building Tamga, an AI product for people who do business across borders.",
      'tag.kpi': 'KPI management', 'tag.qa': 'Quality frameworks', 'tag.coaching': 'Coaching', 'tag.wfm': 'Scheduling',
      'tag.hw': 'Hardware', 'tag.product': 'Product', 'tag.trade': 'Trade and logistics',
      'path.title': 'Path',
      'path.lede': 'Five years at one company, one step at a time. Pick a step to read about it.',
      'path.s1.role': 'Customer Success Specialist', 'path.s2.role': 'Team Lead', 'path.s3.role': 'Assistant Project Manager', 'path.s4.role': 'Next',
      'path.steps': [
        ['Where it started', 'I began on the front line at ModSquad, answering customers myself. It taught me what a good answer feels like from the other side, and how much a clear process helps the person giving it.'],
        ['Leading the queue', 'As a Team Lead I moved from answering tickets to helping others answer them: coaching, quality reviews, shift coverage and being the person people ping when something is on fire.'],
        ['2025 until today', 'Now I manage a multilingual team of about twenty advisors on a major consumer software account. I own the KPIs, the coaching rhythm and the tooling, and I build most of that tooling myself.'],
        ['What comes next', "I'm studying international trade and logistics at Hitit University and building Tamga on the side. The goal is to bring the same people first, automation minded approach to teams that move goods across borders."]
      ],
      'projects.title': "Things I've built",
      'projects.lede': "Most of these live inside the company, so here's what they do rather than screenshots. Open any of them for the details.",
      'filter.all': 'All', 'filter.auto': 'Automation', 'filter.ai': 'AI', 'filter.product': 'Product', 'filter.hw': 'Hardware',
      'np.now': 'Listening now on Spotify', 'np.last': 'Last played', 'np.ago': ['just now', '{n} min ago', '{n} h ago', '{n} days ago'],
      'card.more': 'Read more', 'card.noai': 'No AI on internal data', 'card.visit': 'Visit the site',
      'now.title': 'These days',
      'now.1.t': 'Studying international trade and logistics', 'now.1.d': 'For years I have helped people on the other side of the world through a screen. Now I want to understand how goods and deals make that same journey, so I study it at Hitit University alongside work.',
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
      'footer.made': 'Designed and built in Ankara.',
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
      'hero.lede': 'Çok dilli müşteri destek ekiplerini yönetiyor, tekrarlayan işleri onların üzerinden alan otomasyonlar kuruyorum. Şu an ModSquad’da Assistant Project Manager olarak Ankara’dan uzaktan çalışıyorum.',
      'hero.cta1': 'Neler yaptığıma bak', 'hero.cta2': 'Bana yaz',
      'board.title': 'Canlı kuyruk',
      'board.hint': 'Mesajlar pek çok dilde sohbet, mail ve sosyal medyadan gelir. Her biri konusuna göre doğru kuyruğa yönlenir, ekip sırayla çözer. Birine dokunarak sen de yardım et.',
      'board.pause': 'Durdur', 'board.play': 'Devam et',
      'board.lanes': ['Hesap ve giriş', 'Ödeme ve fatura', 'Teknik sorunlar', 'Genel sorular'],
      'board.router': 'Yönlendirme', 'board.incoming': 'Gelen',
      'board.done': 'Çözüldü', 'board.scale': 'Simülasyonda bir saniye bir dakikaya denk.',
      'traffic.calm': 'Sakin', 'traffic.normal': 'Normal', 'traffic.busy': 'Yoğun',
      'kpi.you': 'Senin çözdüğün', 'kpi.team': 'Ekibin çözdüğü', 'kpi.frt': 'Ortalama bekleme', 'kpi.sla': 'SLA içinde', 'kpi.csat': 'Memnuniyet', 'kpi.waiting': 'Şu an bekleyen',
      'unit.min': 'dk', 'mix.title': 'Dil dağılımı', 'mix.langs': 'farklı dil görüldü', 'mix.other': 'Diğer',
      'legend.p1': 'Acil', 'legend.p2': 'Yüksek', 'legend.p3': 'Normal',
      'ch.chat': 'Sohbet', 'ch.mail': 'Mail', 'ch.social': 'Sosyal medya',
      'tip.wait': 'Bekleme', 'tip.target': 'hedef', 'tip.breach': 'SLA aşıldı, biri bunu hemen alsın', 'tip.ok': 'SLA içinde', 'tip.click': 'Çözmek için tıkla',
      'fact.years': 'yıl müşteri deneyimi, ön saftan proje yönetimine',
      'fact.team': 'kişilik çok dilli ekip, Türkçe ve İngilizce başta olmak üzere pek çok farklı dil kuyruğunda',
      'fact.langs': 'dilde çalışıyorum: Türkçe, İngilizce ve İspanyolca',
      'fact.tools': 'araç tasarlayıp kurdum, ekip vaktini tablolara değil insanlara ayırsın diye',
      'work.title': 'Ne yapıyorum',
      'work.a.title': 'Ekiplerin en iyi işini çıkarmasına yardım ederim',
      'work.a.body': 'Çok dilli bir destek ekibine liderlik ediyorum. İşim net hedefler koymak, kaliteyi yüksek tutmak, insanlara birebir koçluk yapmak ve müşteri hangi dilde yazarsa yazsın iyi bir cevap almasını sağlamak.',
      'work.b.title': 'Tekrarlayan işi makineye bırakırım',
      'work.b.body': 'Bir iş her hafta tekrarlanıyorsa otomatikleştirmeye çalışırım. Google Apps Script ve Claude API ile paneller, geri bildirim platformları ve yapay zekâ destekli koçluk akışları kuruyorum. Ekip cevaba daha hızlı ulaşıyor, bana da insanlara ayıracak zaman kalıyor. Hiç esnetmediğim bir kuralım var: şirket içi ve müşteri verisi yapay zekâ araçlarına girmez. O veriye dokunan sistemler şirketin kendi ortamında, sade bir mantıkla çalışır.',
      'work.c.title': 'Neyin mümkün olduğunu görmek için bir şeyler yaparım',
      'work.c.body': 'İş dışında ESP32 kartlarıyla donanım prototipleri yapıyor, yurt dışıyla iş yapanlar için bir yapay zekâ ürünü olan Tamga’yı geliştiriyorum.',
      'tag.kpi': 'KPI yönetimi', 'tag.qa': 'Kalite çerçeveleri', 'tag.coaching': 'Koçluk', 'tag.wfm': 'Vardiya planlama',
      'tag.hw': 'Donanım', 'tag.product': 'Ürün', 'tag.trade': 'Ticaret ve lojistik',
      'path.title': 'Yol',
      'path.lede': 'Aynı şirkette beş yıl, adım adım. Okumak için bir adım seç.',
      'path.s1.role': 'Customer Success Specialist', 'path.s2.role': 'Team Lead', 'path.s3.role': 'Assistant Project Manager', 'path.s4.role': 'Sırada',
      'path.steps': [
        ['Başladığım yer', 'ModSquad’da ön safta, müşterilere bizzat cevap vererek başladım. İyi bir cevabın karşı taraftan nasıl hissettirdiğini ve net bir sürecin cevabı veren kişiye ne kadar yardım ettiğini burada öğrendim.'],
        ['Kuyruğu yönetmek', 'Team Lead olunca ticket cevaplamaktan başkalarının cevaplamasına yardım etmeye geçtim: koçluk, kalite incelemeleri, vardiya boşlukları ve bir şey alev aldığında ilk aranan kişi olmak.'],
        ['2025’ten bugüne', 'Şimdi büyük bir tüketici yazılımı hesabında yaklaşık yirmi kişilik çok dilli bir ekibi yönetiyorum. KPI’lar, koçluk ritmi ve araçlar bende; o araçların çoğunu da kendim kuruyorum.'],
        ['Sırada ne var', 'Hitit Üniversitesi’nde uluslararası ticaret ve lojistik okuyor, bir yandan Tamga’yı geliştiriyorum. Amacım, aynı insan odaklı ve otomasyon kafalı yaklaşımı sınır ötesi mal taşıyan ekiplere taşımak.']
      ],
      'projects.title': 'Kurduğum şeyler',
      'projects.lede': 'Bunların çoğu şirketin içinde yaşıyor, o yüzden ekran görüntüsü yerine ne işe yaradıklarını anlatıyorum. Ayrıntılar için birini aç.',
      'filter.all': 'Hepsi', 'filter.auto': 'Otomasyon', 'filter.ai': 'Yapay zekâ', 'filter.product': 'Ürün', 'filter.hw': 'Donanım',
      'np.now': 'Şu an Spotify\u2019da dinliyorum', 'np.last': 'En son dinlediğim', 'np.ago': ['az önce', '{n} dk önce', '{n} saat önce', '{n} gün önce'],
      'card.more': 'Devamını oku', 'card.noai': 'İç veride yapay zekâ yok', 'card.visit': 'Siteye git',
      'now.title': 'Şu sıralar',
      'now.1.t': 'Uluslararası ticaret ve lojistik okuyorum', 'now.1.d': 'Yıllardır dünyanın öbür ucundaki insanlara bir ekranın arkasından yardım ediyorum. Şimdi malların ve anlaşmaların aynı yolculuğu nasıl yaptığını anlamak istiyorum; bu yüzden işimin yanında Hitit Üniversitesi’nde okuyorum.',
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
      'footer.made': 'Ankara’da tasarlanıp kodlandı.',
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
      { id: 'dash', noai: true, size: 'xl', tone: '', cats: ['auto'], glyph: 'dash', spark: true,
        title: 'Team 360 dashboard',
        blurb: 'One place for the whole team: performance, quality and coaching data pulled from more than thirteen spreadsheets and calendars.',
        lede: 'Before this, answering "how is the team doing?" meant opening a dozen files. Now it is one dashboard.',
        points: ['Reads from 13+ source spreadsheets and Google Calendars', 'Built as 17 Apps Script files over six phases', 'Flags overdue coaching reviews and missed feedback automatically', 'Plain Apps Script logic: no AI ever touches this data'],
        tags: ['Google Sheets', 'Apps Script', 'No AI'] },
      { id: 'lib', noai: true, size: 'md', tone: 'blue', cats: ['auto', 'product'], glyph: 'lib',
        title: 'Feedback library',
        blurb: 'A private web app where every advisor sees their own quality feedback and coaching notes.',
        lede: 'It started as a weekly brief and grew into a small platform the whole team uses.',
        points: ['Personal metrics, quality tracking and grouping in one view', 'A buddy board that pairs advisors to learn from each other', 'Celebrations, in app notifications and email verification', 'A read only view for project managers', 'Built without AI, so advisor data stays inside the company workspace'],
        tags: ['Apps Script', 'Web app', 'No AI'] },
      { id: 'coach', size: 'sm', tone: '', cats: ['ai', 'auto'], glyph: 'coach',
        title: 'AI coaching forms',
        blurb: 'Monthly coaching prep written with the Claude API, from strengths to SMART goal ideas.',
        lede: 'AI helps with structure and wording, nothing more. It works from the skill areas I choose and never sees names, customer conversations or performance data. I review and finish every form myself.',
        points: ['Drafts pre work: strengths and skills worth focusing on', 'Suggests SMART goals across practice, research and peer learning', 'Builds a four week follow up plan', 'No personal or customer data is ever sent to the model'],
        tags: ['Claude API', 'Coaching'] },
      { id: 'cal', noai: true, size: 'sm', tone: '', cats: ['auto'], glyph: 'cal',
        title: 'Availability and alerts',
        blurb: 'Shows the team when they can reach me, with an emergency button and a Telegram bot.',
        lede: 'A small system that answers "is Burak around?" without anyone having to ask.',
        points: ['Calendar driven view of meetings, point of contact shifts and classes', 'Emergency button that reaches me right away', 'Telegram bot with a one tap Handled button', 'Monthly emergency report and PDF export'],
        tags: ['Apps Script', 'Telegram', 'No AI'] },
      { id: 'chip', size: 'sm', tone: '', cats: ['hw'], glyph: 'chip',
        title: 'Çipik',
        blurb: 'A voice to sticker printer for kids: say what you want, and a little thermal printer draws it.',
        lede: 'A hardware side project for fun and for learning.',
        points: ['ESP32 board with 16 MB flash and 8 MB PSRAM', 'Small color TFT screen for a friendly face', 'Thermal printer for instant stickers'],
        tags: ['ESP32', 'Hardware', 'Prototype'] },
      { id: 'tamga', video: true, size: 'full', tone: 'saffron', cats: ['product', 'ai'], glyph: 'tamga', link: 'https://usetamga.com',
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
        points: ['13+ kaynak tablodan ve Google Takvim’den okuyor', 'Altı aşamada, 17 Apps Script dosyasıyla kuruldu', 'Geciken koçluk incelemelerini ve eksik geri bildirimi kendisi işaretliyor', 'Sade Apps Script mantığıyla çalışıyor, bu veriye hiçbir yapay zekâ dokunmuyor'],
        tags: ['Google Sheets', 'Apps Script', 'Yapay zekâ yok'] },
      { title: 'Geri bildirim kütüphanesi',
        blurb: 'Her danışmanın kendi kalite geri bildirimini ve koçluk notlarını gördüğü özel bir web uygulaması.',
        lede: 'Haftalık bir özet olarak başladı, bütün ekibin kullandığı küçük bir platforma dönüştü.',
        points: ['Kişisel metrikler, kalite takibi ve gruplama tek ekranda', 'Danışmanları birbirinden öğrenmeleri için eşleştiren buddy panosu', 'Kutlamalar, uygulama içi bildirimler ve mail doğrulama', 'Proje yöneticileri için salt okunur görünüm', 'Yapay zekâ kullanılmadan kuruldu, danışman verisi şirket ortamından çıkmıyor'],
        tags: ['Apps Script', 'Web uygulaması', 'Yapay zekâ yok'] },
      { title: 'Yapay zekâ destekli koçluk formları',
        blurb: 'Claude API ile hazırlanan aylık koçluk ön çalışması, güçlü yönlerden SMART hedef önerilerine kadar.',
        lede: 'Yapay zekâ sadece yapı ve ifade konusunda yardım ediyor. Benim seçtiğim beceri alanlarıyla çalışıyor; isimleri, müşteri konuşmalarını ya da performans verisini hiç görmüyor. Her formu ben gözden geçirip tamamlıyorum.',
        points: ['Ön çalışmayı hazırlar: güçlü yönler ve odaklanmaya değer beceriler', 'Pratik, araştırma ve akran öğrenmesi başlıklarında SMART hedefler önerir', 'Dört haftalık takip planı çıkarır', 'Modele hiçbir kişisel ya da müşteri verisi gönderilmez'],
        tags: ['Claude API', 'Koçluk'] },
      { title: 'Müsaitlik ve uyarılar',
        blurb: 'Ekibe bana ne zaman ulaşabileceklerini gösteriyor; acil durum butonu ve Telegram botu da var.',
        lede: '"Burak müsait mi?" sorusunu kimse sormadan cevaplayan küçük bir sistem.',
        points: ['Toplantıları, irtibat vardiyalarını ve dersleri takvimden gösterir', 'Bana hemen ulaşan bir acil durum butonu', 'Tek dokunuşla Halledildi butonu olan Telegram botu', 'Aylık acil durum raporu ve PDF çıktısı'],
        tags: ['Apps Script', 'Telegram', 'Yapay zekâ yok'] },
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
    if (typeof renderNp === 'function') renderNp();
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
    const v = ['BEGIN:VCARD', 'VERSION:3.0', 'N:Cevik;Burak;;;', 'FN:Burak Cevik', 'ORG:ModSquad', 'TITLE:Assistant Project Manager',
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
      b.innerHTML = `<span class="card__spot"></span>
        ${p.metric ? `<span class="card__metric" aria-hidden="true">${p.metric}</span>` : ''}
        <span class="card__art" aria-hidden="true">${p.video
          ? `<video class="card__video" muted loop playsinline preload="none" poster="/assets/art/${p.id}-poster.jpg"><source src="/assets/art/${p.id}.webm" type="video/webm"><source src="/assets/art/${p.id}.mp4" type="video/mp4"></video>`
          : `<img src="/assets/art/${p.id}.webp" alt="" loading="lazy" decoding="async">`}</span>
        <span class="card__text"><h3>${p.title}</h3><p>${p.blurb}</p>
        <span class="card__foot"><span class="card__more">${t('card.more')}</span>${p.noai ? `<span class="noai">${t('card.noai')}</span>` : ''}</span></span>`;
      b.addEventListener('click', () => openSheet(i));
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
  function openSheet(i) {
    const p = project(i, lang);
    $('[data-sheet-glyph]').innerHTML = `<img src="/assets/art/${p.id}.webp" alt="">`;
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
