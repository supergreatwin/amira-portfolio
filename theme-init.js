/* Apply the selected palette before the first paint, avoiding a theme flash. */
(() => {
  let selected;
  try { selected = localStorage.getItem('amira-portfolio-theme'); } catch (_) {}
  const systemDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const theme = selected === 'light' || selected === 'dark'
    ? selected : (systemDark ? 'dark' : 'light');
  document.documentElement.dataset.theme = theme;
})();
