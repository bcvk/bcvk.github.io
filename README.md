# burak.pm

[Burak Çevik](https://burak.pm)'s personal site, live at [burak.pm](https://burak.pm).
Plain HTML, CSS and JavaScript with a tiny build step and Cloudflare Pages Functions.

## Layout

    site/             the static site (copied to dist/ by the build)
      index.html      home page markup (English; the Turkish /tr page is generated)
      content.js      all copy for both languages and the project data
      app.js          home page behaviour: live queue, projects, songs, contact, command menu
      admin.html/.js  private admin panel at /admin
      page.js         theme toggle for the generated project pages
      _headers        security and cache headers; _routes.json limits where Functions run
    functions/        Pages Functions (/api/*), shared code in functions/_lib
    migrations/       D1 schema, applied in order
    scripts/build.mjs builds dist/: /tr, /projects, one page per project, sitemap.xml, llms.txt
    scripts/og.py     link preview images for project pages (run after copy changes)

## Build and deploy

Cloudflare Pages builds every push to main with `node scripts/build.mjs` and serves `dist/`.
Local: `node scripts/build.mjs && npx wrangler pages dev dist` (put test secrets in .dev.vars).

## Secrets (encrypted variables in the Pages project)

    SPOTIFY_CLIENT_SECRET, SPOTIFY_REFRESH_TOKEN (optional once connected from the admin panel)
    TURNSTILE_SECRET, RESEND_API_KEY
    IP_HASH_KEY        keys the visitor codes used for rate limits (never store raw IPs)
    SETTINGS_KEY       seals secrets stored in D1 (the Spotify token from the admin panel)
    ADMIN_SESSION_KEY  signs admin sessions

## Admin panel

https://burak.pm/admin mails a one time sign in link to NOTIFY_EMAIL. From there: messages,
song suggestions (approve adds them to a Spotify playlist), visits, health, IndexNow and
maintenance. Spotify must list https://burak.pm/api/admin/spotify/callback as a redirect URI.

Art in site/assets/art was generated with Higgsfield (GPT Image 2.5, Seedance 2.5).
