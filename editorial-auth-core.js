// Kept independent of the Supabase client so recovery routing happens before
// any persistent CMS session is created or any dashboard module can run.
export function recoveryTarget(href) {
  const url = new URL(href);
  const hash = new URLSearchParams(url.hash.slice(1));
  const recovery = hash.get('type') === 'recovery' || url.searchParams.get('type') === 'recovery';
  const failedLink = /\/editorial(?:\.html)?$/.test(url.pathname) &&
    (hash.has('error') || url.searchParams.has('error'));
  if (!recovery && !failedLink) return null;
  const target = new URL(url.pathname.includes('/ar/') ? 'ar/reset-password.html' : 'reset-password.html',
    new URL(url.pathname.includes('/ar/') ? '../' : './', url));
  target.search = url.search;
  target.hash = url.hash;
  return target.href;
}

export function recoveryTokens(href) {
  const url = new URL(href);
  const hash = new URLSearchParams(url.hash.slice(1));
  if (hash.get('type') !== 'recovery' || hash.has('error')) return null;
  const access_token = hash.get('access_token');
  const refresh_token = hash.get('refresh_token');
  return access_token && refresh_token ? { access_token, refresh_token } : null;
}

export function passwordProblem(password, confirmation) {
  if (password.length < 12) return 'short';
  if (password !== confirmation) return 'mismatch';
  return null;
}
