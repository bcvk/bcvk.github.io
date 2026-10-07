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
