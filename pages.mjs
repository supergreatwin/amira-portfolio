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

const googleTagManager = `<script async src="https://www.googletagmanager.com/gtm.js?id=GTM-WRGP2P7L"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
</script>`;

function withGoogleTagManager(html) {
  if (html.includes('GTM-WRGP2P7L')) return html;
  if (!html.includes('</head>')) {
    throw new Error('Cannot inject Google Tag Manager: missing </head>');
  }
  return html.replace('</head>', `${googleTagManager}
</head>`);
}

await rm(dist, { recursive: true, force: true });
await mkdir(dist);
await cp(join(root, 'assets'), join(dist, 'assets'), { recursive: true });

for (const directory of ['', 'ar']) {
  const files = await readdir(join(root, directory));
  for (const file of files.filter(name => /\.(?:html|css|js)$/.test(name) || ['robots.txt', 'sitemap.xml'].includes(name))) {
    const path = join(directory, file);
    const source = await readFile(join(root, path), 'utf8');
    const content = source.replaceAll(site.url, production.href).replace(
      /https:\/\/[^/\s"<>]+\/(?:ar\/)?[a-z0-9-]+\.html(?=[#?"<>\s]|$)/g,
      url => url.startsWith(production.href) ? url.slice(0, -5) : url,
    );
    const output = join(dist, path);
    await mkdir(dirname(output), { recursive: true });
    await writeFile(output, file.endsWith('.html') ? withGoogleTagManager(content) : content);
  }
}

await writeFile(join(dist, '404.html'), withGoogleTagManager(`<!doctype html>
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
`));
