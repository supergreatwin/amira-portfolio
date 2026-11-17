# Amira Abdelfadil · Film & Art

A static portfolio with five film pages, a visual-work archive, biography, writing, and contact through Amira’s official social profiles.

## Preview and publish

Open `index.html` directly, or run `python3 -m http.server 8286` in the repository root. GitHub Pages serves the root of `main` with `.nojekyll`. The generated HTML is checked in, so Pages does not need Node.js or a custom workflow. Assets and navigation use relative URLs. Sitemap and social preview URLs use the site address in `content.mjs`.

Cloudflare Pages builds from `main` with the command below and serves `dist/`. The build copies the original media and rewrites metadata to the production Pages URL.

```sh
node build.mjs --check && PORTFOLIO_SITE_URL=https://amira-portfolio-ds4.pages.dev/ node pages.mjs
```

## Update content

- Edit film metadata, synopses, credits, stills, social links, or writing in `content.mjs`. Runtimes use whole seconds and appear only when verified. Label poster crops as poster details.
- Edit `index.html`, `home.css`, and `home.js` for the original homepage layout and film popups. Run `node build.mjs` to update the standalone pages and SEO files. Run `node build.mjs --check` to check that they match their source.
- Keep original images under `assets/`. Place same-aspect-ratio full-size and 480px-wide WebP derivatives in `assets/optimized/` using the original basename, for example `mamina-02.webp` and `mamina-02-480.webp`. JPG remains the fallback and original-size lightbox image.
- English is the published locale. Arabic text uses explicit language and direction attributes. The locale definition holds document direction, navigation, and social metadata locale for future approved translations. Add translated page content and language links only when the complete copy has been reviewed.

The homepage uses the cream, beige, and espresso design with plum accents. Its film popups link to the corresponding standalone film pages.

## Optional second Cloudflare Pages deployment

To launch the same source under a **new, separate** Pages project while keeping `amira-portfolio-ds4.pages.dev` unchanged, create a new Cloudflare Pages project (Git integration) using:

- Project name: `amiraabdelfadil` (subject to Cloudflare availability)
- Git repository: `supergreatwin/amira-portfolio`
- Production branch: `main`
- Framework preset: None
- Root directory: `/`
- Build command: `node build.mjs --check && PORTFOLIO_SITE_URL=https://amiraabdelfadil.pages.dev/ node pages.mjs`
- Build output directory: `dist`

The `PORTFOLIO_SITE_URL` parameter rewrites GitHub Pages canonical and sitemap URLs to the new Cloudflare origin in the generated output. It does not alter the checked-in GitHub Pages source or the existing Cloudflare project's independent build settings. After deployment, validate the films, photos, English/Arabic pages, robots.txt, sitemap.xml, existing Google ownership file and Google Tag Manager. Do not delete the older Pages project until any desired redirects and Google Search Console migration are configured.
