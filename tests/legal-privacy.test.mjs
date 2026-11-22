import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const source = name => readFileSync(join(root, name), 'utf8');
const deployed = name => readFileSync(join(root, 'dist', name), 'utf8');

test('All six bilingual legal policies are substantive and accessible', () => {
  for (const prefix of ['', 'ar/']) {
    const arabic = Boolean(prefix);
    for (const page of ['privacy', 'terms', 'cookies']) {
      const path = prefix + page + '.html';
      assert.ok(existsSync(join(root, path)), 'Missing ' + path);
      const html = source(path);
      assert.match(html, /<!doctype html>/i);
      assert.match(html, /<main\b[^>]*id="main"/);
      assert.match(html, /<h1>/);
      assert.match(html, /mailto:byamira01@gmail.com/);
      assert.match(html, /<link rel="canonical"/);
      assert.match(html, new RegExp('lang="' + (arabic ? 'ar' : 'en') + '"'));
      assert.ok(!/\[TODO\]|\[YOUR\s+/.test(html));
      assert.ok(html.length > 2800, 'Policy needs substantive content: ' + path);
    }
  }
});

test('Optional analytics is consent gated, not automatically loaded by the theme', () => {
  const privacy = source('privacy-controls.js');
  assert.match(privacy, /consentState\(false\)/);
  assert.match(privacy, /preference !== true/);
  assert.match(privacy, /Reject optional/);
  assert.match(privacy, /Accept analytics/);
  assert.match(privacy, /location\.reload\(\)/);
  assert.doesNotMatch(source('theme.js'), /script\.dataset\.containerId\s*=/);
  assert.doesNotMatch(source('pages.mjs'), /src="\/analytics\.js"/);
});

test('Cloudflare build includes privacy links, controls, and hardening headers', () => {
  for (const path of ['privacy.html','terms.html','cookies.html','ar/privacy.html','ar/terms.html','ar/cookies.html']) {
    assert.ok(existsSync(join(root, 'dist', path)), 'Missing deployed notice ' + path);
  }
  for (const path of ['index.html','ar/index.html','notes.html','ar/notes.html','the-process/index.html']) {
    const html = deployed(path);
    assert.match(html, /privacy-controls\.js/);
    assert.match(html, /legal\.css/);
    assert.match(html, /class="legal-links"/);
    assert.match(html, /data-privacy-settings/);
  }
  for (const path of ['pitch.html','collaborate.html','ar/pitch.html','ar/collaborate.html']) {
    const html = deployed(path);
    assert.ok(!html.includes('src="https://tally.so/widgets/embed.js"'), 'Tally must not auto-load: ' + path);
    assert.match(html, /data-tally-src=/);
  }
  assert.match(source('privacy-controls.js'), /Load Tally form/);
  const headers = deployed('_headers');
  assert.match(headers, /X-Content-Type-Options:\s*nosniff/);
  assert.match(headers, /Content-Security-Policy:\s*frame-ancestors/);
  assert.match(headers, /Cache-Control:\s*private, no-store/);
});
