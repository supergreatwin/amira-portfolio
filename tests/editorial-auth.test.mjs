import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const source = path => readFileSync(new URL(path, root), 'utf8');
const { recoveryTarget, recoveryTokens, passwordProblem } = await import(
  'data:text/javascript;base64,' + Buffer.from(source('editorial-auth-core.js')).toString('base64'));
const tick = async () => { for (let i = 0; i < 5; i++) await new Promise(setImmediate); };
const tokenUrl = 'https://example.test/editorial.html#type=recovery&access_token=test-access&refresh_token=test-refresh';

function harness(path, options = {}) {
  const elements = new Map();
  class Element {
    constructor(id = '') {
      this.id = id; this.hidden = false; this.value = ''; this.textContent = '';
      this.style = {}; this.dataset = {}; this.listeners = {}; this.children = [];
      this.disabled = false; this.required = false;
    }
    addEventListener(name, callback) { this.listeners[name] = callback; }
    querySelector() { return get(this.id + '-submit'); }
    reportValidity() { return true; }
    reset() { for (const el of elements.values()) el.value = ''; }
    focus() {}
    append(...children) { this.children.push(...children); }
    replaceChildren() { this.children = []; }
    click() { return this.fire('click'); }
    fire(name) { return this.listeners[name]?.({ preventDefault() {}, target: this }); }
  }
  function get(id) { if (!elements.has(id)) elements.set(id, new Element(id)); return elements.get(id); }
  const calls = { setSession: [], updateUser: [], signOut: [], send: [], verify: [], queries: [] };
  let currentUser = options.user ?? null;
  let listener;
  const auth = {
    getUser: options.getUser || (async () => ({ data: { user: currentUser }, error: null })),
    setSession: async tokens => {
      calls.setSession.push(tokens);
      return options.sessionResult || { data: { session: { user: { id: 'recovering-user' } } }, error: null };
    },
    updateUser: async value => { calls.updateUser.push(value); return options.update?.(value) || { error: null }; },
    signOut: async value => { calls.signOut.push(value); currentUser = null; return { error: null }; },
    signInWithOtp: async value => { calls.send.push(value); return options.sendResult || { error: null }; },
    verifyOtp: async value => {
      calls.verify.push(value);
      currentUser = options.verifiedUser || null;
      return options.verifyResult || { error: null };
    },
    signInWithPassword: async () => ({ error: null }),
    onAuthStateChange: callback => { listener = callback; }
  };
  const db = {
    auth,
    from: name => {
      calls.queries.push(name);
      const query = { select: () => query, order: () => query, limit: async () => ({ data: [], error: null }) };
      return query;
    }
  };
  const storage = new Map();
  const clientOptions = [];
  const location = { href: options.url || tokenUrl, pathname: '/reset-password.html', replace: value => { calls.redirect = value; } };
  const context = vm.createContext({
    console, URL, URLSearchParams, setTimeout, setInterval() {},
    document: { body: { dataset: { locale: options.ar ? 'ar' : 'en' } },
      getElementById: get, querySelectorAll: () => [], createElement: () => new Element() },
    localStorage: { getItem: key => storage.get(key) || null, setItem: (key, value) => storage.set(key, value) },
    window: { location, history: { replaceState: (...args) => { calls.history = args; } } },
    db, recoveryTarget, recoveryTokens, passwordProblem,
    createClient: (...args) => { clientOptions.push(args[2]); return db; }
  });
  vm.runInContext(source(path).replace(/^import .*;\n/gm, '').replace(/^export .*;\n/gm, ''), context);
  return { get, calls, storage, clientOptions, emit: event => listener(event),
    refresh: () => vm.runInContext('refreshAuth()', context) };
}

test('Legacy EN/AR recovery links preserve credentials only on same-origin reset route', () => {
  assert.equal(recoveryTarget(tokenUrl), tokenUrl.replace('editorial.html', 'reset-password.html'));
  assert.equal(recoveryTarget(tokenUrl.replace('/editorial', '/ar/editorial')),
    tokenUrl.replace('/editorial', '/ar/reset-password'));
  assert.equal(new URL(recoveryTarget(tokenUrl + '&next=https://evil.test')).origin, 'https://example.test');
  assert.equal(recoveryTarget('https://example.test/editorial.html'), null);
  assert.equal(recoveryTokens('https://example.test/reset-password.html#type=magiclink&access_token=a&refresh_token=b'), null);
  assert.equal(recoveryTokens('https://example.test/reset-password.html#type=recovery&access_token=a'), null);
  assert.ok(recoveryTarget('https://example.test/editorial.html#error=access_denied&error_code=otp_expired'));
});

test('CMS redirects recovery before creating any persistent client', () => {
  let created = false, target;
  const context = vm.createContext({ recoveryTarget,
    window: { addEventListener() {}, location: { href: tokenUrl, replace(value) { target = value; } } },
    document: { documentElement: { hidden: false } },
    createClient() { created = true; } });
  const code = source('cms-core.js').replace(/^import .*;\n/gm, '').replace(/export /g, '');
  assert.throws(() => vm.runInContext(code, context), /dedicated reset/);
  assert.equal(created, false);
  assert.equal(target, tokenUrl.replace('editorial.html', 'reset-password.html'));
});

test('A recovery fragment added to an already open CMS tab also routes away', () => {
  let callback, target;
  const location = { href: 'https://example.test/editorial.html', replace(value) { target = value; } };
  const context = vm.createContext({ recoveryTarget,
    window: { addEventListener(name, fn) { if (name === 'hashchange') callback = fn; }, location },
    document: { documentElement: { hidden: false } }, createClient: () => ({}) });
  vm.runInContext(source('cms-core.js').replace(/^import .*;\n/gm, '').replace(/export /g, ''), context);
  location.href = tokenUrl; callback();
  assert.equal(target, tokenUrl.replace('editorial.html', 'reset-password.html'));
  assert.equal(context.document.documentElement.hidden, true);
});

test('Recovery validates its own session and never persists or imports a dashboard client', async () => {
  const h = harness('password-recovery.js'); await tick();
  assert.equal(h.calls.setSession.length, 1);
  assert.equal(h.clientOptions[0].auth.persistSession, false);
  assert.equal(h.clientOptions[0].auth.autoRefreshToken, false);
  assert.equal(h.clientOptions[0].auth.detectSessionInUrl, false);
  assert.equal(h.calls.history[2], '/reset-password.html');
  assert.equal(h.calls.updateUser.length, 0);
  assert.equal(h.get('ed-recover-form').hidden, false);
  assert.equal(h.calls.queries.length, 0);
});

for (const [name, options] of [
  ['missing credentials', { url: 'https://example.test/reset-password.html' }],
  ['expired credentials', { sessionResult: { data: { session: null }, error: { message: 'expired' } } }]
]) test('Recovery fails closed with ' + name, async () => {
  const h = harness('password-recovery.js', options); await tick();
  assert.equal(h.get('ed-recover-form').hidden, true);
  await h.get('ed-recover-form').fire('submit');
  assert.equal(h.calls.updateUser.length, 0);
  assert.match(h.get('ed-message').textContent, /invalid, expired or already used/);
});

test('Password confirmation and minimum length block updates', async () => {
  const h = harness('password-recovery.js'); await tick();
  h.get('ed-new-password').value = 'short'; h.get('ed-confirm-password').value = 'short';
  await h.get('ed-recover-form').fire('submit');
  assert.equal(h.calls.updateUser.length, 0);
  h.get('ed-new-password').value = 'A-long-example-password';
  h.get('ed-confirm-password').value = 'A-different-long-password';
  await h.get('ed-recover-form').fire('submit');
  assert.equal(h.calls.updateUser.length, 0);
  assert.match(h.get('ed-message').textContent, /do not match/);
});

test('Only confirmed successful password updates end recovery; no dashboard session is created', async () => {
  const h = harness('password-recovery.js'); await tick();
  h.get('ed-new-password').value = h.get('ed-confirm-password').value = 'A-long-example-password';
  await h.get('ed-recover-form').fire('submit');
  assert.equal(h.calls.updateUser.length, 1);
  assert.equal(h.get('ed-recover-form').hidden, true);
  assert.equal(h.get('ed-new-password').value, '');
  assert.equal(h.calls.signOut[0].scope, 'local');
  assert.equal(h.calls.queries.length, 0);
  assert.match(h.get('ed-message').textContent, /sign in with your new password/);
});

test('Network failure leaves recovery available and duplicate submits do not race', async () => {
  let reject;
  const pending = new Promise((_, r) => { reject = r; });
  const h = harness('password-recovery.js', { update: () => pending }); await tick();
  h.get('ed-new-password').value = h.get('ed-confirm-password').value = 'A-long-example-password';
  const first = h.get('ed-recover-form').fire('submit');
  await h.get('ed-recover-form').fire('submit');
  assert.equal(h.calls.updateUser.length, 1);
  reject(new Error('offline')); await first;
  assert.equal(h.get('ed-recover-form').hidden, false);
  assert.equal(h.get('ed-recover-form-submit').disabled, false);
  assert.equal(h.calls.signOut.length, 0);
});

test('Email code requests normalize email, prohibit signup and enforce resend cooldown', async () => {
  const h = harness('editorial.js'); await tick();
  h.get('ed-code-email').value = '  Editor@Example.test  ';
  await h.get('ed-send-code').fire('click');
  await h.get('ed-send-code').fire('click');
  assert.equal(h.calls.send.length, 1);
  assert.equal(h.calls.send[0].email, 'editor@example.test');
  assert.equal(h.calls.send[0].options.shouldCreateUser, false);
  assert.equal(h.get('ed-code-field').hidden, false);
  assert.match(h.get('ed-message').textContent, /If this account is eligible/);
});

test('Unknown accounts see the same generic request result without signup', async () => {
  const h = harness('editorial.js', { sendResult: { error: { code: 'otp_disabled' } } }); await tick();
  h.get('ed-code-email').value = 'unknown@example.test';
  await h.get('ed-send-code').fire('click');
  assert.match(h.get('ed-message').textContent, /If this account is eligible/);
  assert.equal(h.get('ed-code-field').hidden, false);
});

for (const role of ['admin', 'editor', 'student', null]) {
  test('Verified code still requires protected editorial role: ' + role, async () => {
    const user = { id: 'user', email: 'test@example.test',
      app_metadata: { editorial_role: role }, user_metadata: { editorial_role: 'admin' } };
    const h = harness('editorial.js', { verifiedUser: user }); await tick();
    h.get('ed-code-email').value = user.email;
    await h.get('ed-send-code').fire('click');
    h.get('ed-code').value = '123456';
    await h.get('ed-code-form').fire('submit');
    assert.equal(h.calls.verify[0].type, 'email');
    const authorized = ['admin', 'editor'].includes(role);
    assert.equal(h.get('ed-dashboard').hidden, !authorized);
    assert.equal(h.calls.queries.includes('editorial_entries'), authorized);
    if (!authorized) assert.equal(h.calls.signOut[0].scope, 'local');
  });
}

test('Invalid/reused/expired code leaves dashboard inaccessible', async () => {
  const h = harness('editorial.js', { verifyResult: { error: { code: 'otp_expired' } } }); await tick();
  h.get('ed-code-email').value = 'test@example.test'; await h.get('ed-send-code').fire('click');
  h.get('ed-code').value = '123456'; await h.get('ed-code-form').fire('submit');
  assert.equal(h.get('ed-dashboard').hidden, true);
  assert.match(h.get('ed-message').textContent, /invalid, expired or already used/);
});

test('Changing code email invalidates the pending verification and token', async () => {
  const h = harness('editorial.js'); await tick();
  h.get('ed-code-email').value = 'first@example.test'; await h.get('ed-send-code').fire('click');
  h.get('ed-code').value = '123456'; h.get('ed-code-email').value = 'second@example.test';
  await h.get('ed-code-email').fire('input'); await h.get('ed-code-form').fire('submit');
  assert.equal(h.calls.verify.length, 0);
  assert.equal(h.get('ed-code').value, '');
});

test('A stale authorization response cannot restore dashboard after sign-out', async () => {
  let resolveFirst, count = 0;
  const h = harness('editorial.js', { getUser: () => ++count === 1
    ? new Promise(resolve => { resolveFirst = resolve; }) : Promise.resolve({ data: { user: null } }) });
  await h.refresh();
  resolveFirst({ data: { user: { id: 'user', email: 'test@example.test', app_metadata: { editorial_role: 'admin' } } } });
  await tick();
  assert.equal(h.get('ed-dashboard').hidden, true);
  assert.equal(h.calls.queries.length, 0);
});

test('Production bundle has bilingual isolated reset forms and no recovery-page analytics', () => {
  for (const prefix of ['', 'ar/']) {
    const html = source('dist/' + prefix + 'reset-password.html');
    assert.match(html, /id="ed-confirm-password"/);
    assert.match(html, /name="referrer" content="no-referrer"/);
    assert.doesNotMatch(html, /privacy-controls\.js|analytics\.js|cms-core\.js|id="ed-dashboard"/);
    assert.match(source('dist/' + prefix + 'editorial.html'), /id="ed-code-form"/);
    assert.ok(source('dist/_headers').includes('/' + prefix + 'reset-password.html\n'));
  }
  assert.match(source('cms-core.js'), /detectSessionInUrl:false/);
  assert.match(source('the-process/process-auth-core.js'), /storageKey:'amira-process-session-v1'/);
  assert.doesNotMatch(source('the-process/process-auth-core.js'), /editorial-auth-core/);
  assert.match(source('supabase/templates/editorial-email-code.html'), /\{\{ \.Token \}\}/);
});
