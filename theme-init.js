/* Redirect the retired GitHub Pages mirror to Amira's canonical domain.
   Keep this in the shared startup script: both homepages and the
   standalone English/Arabic pages load it in <head>. Cloudflare Pages
   and the official custom domain are unaffected. */
(() => {
  if (window.location.hostname !== 'supergreatwin.github.io' ||
      !window.location.pathname.startsWith('/amira-portfolio/')) return;

  const relative = window.location.pathname.slice('/amira-portfolio/'.length);
  const canonicalPath = relative
    .replace(/(^|\/)index\.html$/i, '$1')
    .replace(/\.html$/i, '');

  const target = new URL(canonicalPath, 'https://amiraabdelfadil.com/');
  target.search = window.location.search;
  target.hash = window.location.hash;
  window.location.replace(target.href);
})();

/* Apply the selected palette before the first paint, avoiding a theme flash. */
(() => {
  let selected;
  try { selected = localStorage.getItem('amira-portfolio-theme'); } catch (_) {}
  const systemDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const theme = selected === 'light' || selected === 'dark'
    ? selected : (systemDark ? 'dark' : 'light');
  document.documentElement.dataset.theme = theme;
})();
