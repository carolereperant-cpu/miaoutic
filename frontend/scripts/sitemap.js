// ============================================================
// scripts/sitemap.js
// Runs automatically after "npm run build" (postbuild script).
// Writes dist/sitemap.xml, the list of the public pages given to
// search engines, and adds its address to dist/robots.txt.
//
// A sitemap needs the full address of the site, known only once
// the site is online: set SITE_URL in frontend/.env.production
// (for example SITE_URL=https://miaoutic.fr). Without it, no
// sitemap is written and the build goes on.
// When the API answers (VITE_API_URL), the pages of the species
// and of the animals are added; otherwise (first deployment, API
// not started yet) only the fixed pages.
// ============================================================

import { appendFile, writeFile } from 'node:fs/promises';
import { loadEnv } from 'vite';
import { slugify } from '../src/utils/format.js';

const env = loadEnv('production', process.cwd(), '');
const siteUrl = (env.SITE_URL ?? '').replace(/\/$/, '');
// In production VITE_API_URL is relative ("/api"): the API of the
// version already online is then called on the public address
const apiUrl = new URL(env.VITE_API_URL || 'http://localhost:3000/api', siteUrl || 'http://localhost').href
  .replace(/\/$/, '');

const FIXED_PAGES = [
  { path: '/', priority: '1.0' },
  { path: '/animaux', priority: '0.9' },
  { path: '/inscription', priority: '0.5' },
  { path: '/mentions-legales', priority: '0.2' },
  { path: '/donnees-personnelles', priority: '0.2' },
  { path: '/accessibilite', priority: '0.2' },
  { path: '/cookies', priority: '0.2' },
];

/** GET on the API, with a time limit; null if it does not answer */
async function fetchJson(path) {
  try {
    const response = await fetch(`${apiUrl}${path}`, { signal: AbortSignal.timeout(5000) });
    return response.ok ? await response.json() : null;
  } catch {
    return null;
  }
}

if (!siteUrl) {
  console.log('sitemap : SITE_URL absent (frontend/.env.production), aucun sitemap généré.');
  process.exit(0);
}

const pages = [...FIXED_PAGES];
const [especes, animaux] = await Promise.all([fetchJson('/especes'), fetchJson('/animaux')]);
for (const espece of especes ?? []) {
  pages.push({ path: `/animaux/${slugify(espece.nom_espece)}`, priority: '0.8' });
}
for (const animal of animaux ?? []) {
  pages.push({ path: `/animal/${animal.id_animal}`, priority: '0.7' });
}

const today = new Date().toISOString().slice(0, 10);
const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map(({ path, priority }) => `  <url>
    <loc>${siteUrl}${path}</loc>
    <lastmod>${today}</lastmod>
    <priority>${priority}</priority>
  </url>`).join('\n')}
</urlset>
`;

await writeFile('dist/sitemap.xml', xml);
await appendFile('dist/robots.txt', `\nSitemap: ${siteUrl}/sitemap.xml\n`);
console.log(`sitemap : ${pages.length} pages dans dist/sitemap.xml${animaux ? '' : ' (API injoignable : pages fixes seulement)'}`);
