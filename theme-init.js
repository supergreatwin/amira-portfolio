
/* Apple's Home Screen web app is not consistently identified by CSS
   (display-mode:standalone) on recent iOS/WebKit versions. Detect with
   navigator.standalone before first paint, without changing Safari tabs. */
(() => {
  const appleMobile = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (!appleMobile) return;
  const standalone = navigator.standalone === true ||
    (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches);
  if (standalone) document.documentElement.classList.add('amira-ios-homeapp');
})();

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
