# Amira Abdelfadil · Film & Art

A static portfolio with five film pages, a visual-work archive, biography, writing, and contact through Amira’s official social profiles.

## Preview and publish

Open `index.html` directly, or run `python3 -m http.server 8286` in the repository root. GitHub Pages serves the root of `main` with `.nojekyll`. The generated HTML is checked in, so Pages does not need Node.js or a custom workflow. Assets and navigation use relative URLs. Sitemap and social preview URLs use the site address in `content.mjs`.

Cloudflare Pages builds from `main` with the command below and serves `dist/`. The build copies the original media and applies the settings for that Cloudflare host.

```sh
node build.mjs --check && PORTFOLIO_SITE_URL=https://amira-portfolio-ds4.pages.dev/ node pages.mjs
```

## Update content

- Edit film metadata, synopses, credits, stills, social links, or writing in `content.mjs`. Runtimes use whole seconds and appear only when verified. Label poster crops as poster details.
- Edit `index.html`, `home.css`, and `home.js` for the original homepage layout and film popups. Run `node build.mjs` to update the standalone pages and SEO files. Run `node build.mjs --check` to validate required files and published documentary metadata without rejecting hand-curated markup.
- Keep original images under `assets/`. Place same-aspect-ratio full-size and 480px-wide WebP derivatives in `assets/optimized/` using the original basename, for example `mamina-02.webp` and `mamina-02-480.webp`. JPG remains the fallback and original-size lightbox image.
- English is the published locale. Arabic text uses explicit language and direction attributes. The locale definition holds document direction, navigation, and social metadata locale for future approved translations. Add translated page content and language links only when the complete copy has been reviewed.

The homepage uses the cream, beige, and espresso design with plum accents. Its film popups link to the corresponding standalone film pages.

## Production and mirrors

`https://amiraabdelfadil.pages.dev/` is the production URL for search and analytics. The two Cloudflare projects keep their existing `PORTFOLIO_SITE_URL` values. The older Pages host redirects public HTML routes to production. GitHub Pages keeps the relative site paths and serves cross-domain canonicals pointing to the corresponding production pages. The Google verification file is copied verbatim.

The production build uses Amira’s GA4 stream after a visitor allows analytics. Visitors can open Analytics settings in the footer to change their choice. The site measures page views, outbound link domains, and email or phone link clicks. Preview builds and mirrors do not load the Google tag.
