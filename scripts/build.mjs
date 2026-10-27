// Build step for Cloudflare Pages: copies the static site into dist/.
// No bundling and no dependencies; Pages Functions stay in /functions at the repo root.
import { cp, mkdir, readdir, rm } from 'node:fs/promises';

const SKIP = new Set(['.git', '.github', '.gitignore', '.wrangler', 'dist', 'scripts', 'functions', 'node_modules', 'README.md', 'wrangler.toml']);

await rm('dist', { recursive: true, force: true });
await mkdir('dist');
for (const name of await readdir('.')) {
  if (!SKIP.has(name)) await cp(name, `dist/${name}`, { recursive: true });
}
console.log('Copied site to dist/');
