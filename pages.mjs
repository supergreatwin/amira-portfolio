import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { site } from './content.mjs';

const root = fileURLToPath(new URL('./', import.meta.url));
const dist = join(root, 'dist');
const production = new URL(process.env.PORTFOLIO_SITE_URL);
if (production.protocol !== 'https:' || production.href !== `${production.origin}/`) {
  throw new Error('PORTFOLIO_SITE_URL must be an HTTPS site origin with no path');
}

const isPrimary = production.href === site.url;
// Custom domains and Pages origins can share the same Cloudflare deployment.
const searchCanonical = 'https://amiraabdelfadil.com/';
const measurementId = 'G-B9BKV0JKJ8';
const verificationFile = /^google[a-z0-9]+\.html$/i;

await rm(dist, { recursive: true, force: true });
await mkdir(dist);
await cp(join(root, 'assets'), join(dist, 'assets'), { recursive: true });

for (const directory of ['', 'ar']) {
  const files = await readdir(join(root, directory));
  for (const file of files.filter(name => /\.(?:html|css|js)$/.test(name) || ['robots.txt', 'sitemap.xml'].includes(name))) {
    const path = join(directory, file);
    const source = await readFile(join(root, path), 'utf8');
    const output = join(dist, path);
    await mkdir(dirname(output), { recursive: true });
    const isDocument = file.endsWith('.html') && !verificationFile.test(file);
    // No host-agnostic redirects: they would also affect custom-domain aliases.
    const html = isDocument && isPrimary && process.env.CF_PAGES_BRANCH === 'main'
      ? source.replace(/<\/head>/i, `<script defer src="/analytics.js" data-measurement-id="${measurementId}"></script>\n</head>`)
      : source;
    // Apply the branded canonical domain to public HTML and discovery files.
    const seoOutput = isDocument || ['robots.txt', 'sitemap.xml'].includes(file)
      ? html.replaceAll(site.url, searchCanonical)
      : html;
    await writeFile(output, seoOutput);
  }
}

// Keep the Cloudflare Pages preview origin crawlable only on the official
// custom domain. Cloudflare host-specific headers leave the custom domain alone.
await writeFile(join(dist, '_headers'),
  'https://amira-portfolio-ds4.pages.dev/*\\n  X-Robots-Tag: noindex\\n'.replaceAll('\\n', '\n'));

await writeFile(join(dist, '404.html'), `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Page not found | Amira Abdelfadil</title>
<link rel="stylesheet" href="/style.css">
</head>
<body>
<main class="shell section inner-page">
  <h1>Page not found</h1>
  <p><a href="/">Back to Amira’s portfolio</a></p>
  <p lang="ar" dir="rtl"><a href="/ar/">العودة إلى أعمال أميرة</a></p>
</main>
</body>
</html>
`);
