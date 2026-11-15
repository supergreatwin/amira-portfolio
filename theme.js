/* Shared accessible theme control for English and Arabic pages. */
(() => {
  const root = document.documentElement;
  const actions = document.querySelector('.topbar .nav-actions');
  if (!actions || actions.querySelector('.theme-toggle')) return;
  const arabic = root.lang.toLowerCase().startsWith('ar');
  const key = 'amira-portfolio-theme';
  const system = window.matchMedia('(prefers-color-scheme: dark)');
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'theme-toggle';
  button.innerHTML = [
    '<svg class="theme-icon theme-moon" viewBox="0 0 24 24" aria-hidden="true"><path d="M20.4 15.8A8.5 8.5 0 0 1 8.2 3.6 8.5 8.5 0 1 0 20.4 15.8Z"/></svg>',
    '<svg class="theme-icon theme-sun" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42M17.65 6.35l1.42-1.42"/></svg>'
  ].join('');
  const menu = actions.querySelector('.menu-toggle');
  actions.insertBefore(button, menu || null);
  const themeColor = document.querySelector('meta[name="theme-color"]');
  const readChoice = () => { try { return localStorage.getItem(key); } catch (_) { return null; } };
  function setTheme(theme, persist = false) {
    root.dataset.theme = theme;
    const dark = theme === 'dark';
    const label = dark
      ? (arabic ? 'تفعيل الوضع الفاتح' : 'Switch to light mode')
      : (arabic ? 'تفعيل الوضع الداكن' : 'Switch to dark mode');
    button.setAttribute('aria-label', label);
    button.setAttribute('title', label);
    button.setAttribute('aria-pressed', String(dark));
    if (themeColor) themeColor.setAttribute('content', dark ? '#1b1919' : '#f8f4ec');
    if (persist) { try { localStorage.setItem(key, theme); } catch (_) {} }
  }
  setTheme(root.dataset.theme === 'dark' ? 'dark' : 'light');
  button.addEventListener('click', () =>
    setTheme(root.dataset.theme === 'dark' ? 'light' : 'dark', true));
  system.addEventListener('change', event => {
    if (readChoice() !== 'dark' && readChoice() !== 'light')
      setTheme(event.matches ? 'dark' : 'light');
  });
})();
