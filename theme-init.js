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

/* Do not paint a superseded design before the server-selected mode is known.
   Applies only to homepage variants and self-clears if the network fails. */
(()=>{
 const supported=/^(?:\/|\/index\.html|\/responsive(?:\.html)?|\/classic(?:\.html)?|\/ar\/|\/ar\/index\.html|\/ar\/current(?:\.html)?|\/ar\/responsive(?:\.html)?)$/;
 if(!['amiraabdelfadil.com','www.amiraabdelfadil.com'].includes(location.hostname)||
    !supported.test(location.pathname)||new URLSearchParams(location.search).has('design-preview'))return;
 const style=document.createElement('style');
 style.textContent='html.amira-design-routing body{visibility:hidden!important}';
 document.head.append(style);
 document.documentElement.classList.add('amira-design-routing');
 window.setTimeout(()=>document.documentElement.classList.remove('amira-design-routing'),1800);
})();
