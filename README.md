# burak.pm

Burak Cevik's personal site. Plain HTML, CSS and JavaScript, no build step.

Files
  index.html      page markup (English by default, Turkish via the language toggle)
  styles.css      all styles, light and dark themes
  app.js          copy for both languages, the live queue, projects, command menu
  boot.js         sets theme and language before the first paint
  _headers        security and cache headers for Cloudflare Pages
  assets/         photo, fonts, icons, social image

Deploy on Cloudflare Pages: connect this repo, framework preset None,
build command empty, output directory "/". Every push to main goes live.

Previous design is kept under the git tag v1-biko.

Spotify "listening now" card
  functions/api/now-playing.js reads the current or last played track.
  Set these as encrypted variables in the Cloudflare Pages project:
    SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SPOTIFY_REFRESH_TOKEN
  To get the refresh token once: add SPOTIFY_SETUP=on, redeploy,
  open https://burak.pm/api/spotify-setup, copy the token, then remove SPOTIFY_SETUP.
  The card stays hidden until the API answers, so the site works without it.

Art in assets/art was generated with Higgsfield (GPT Image 2.5, Seedance 2.5).
