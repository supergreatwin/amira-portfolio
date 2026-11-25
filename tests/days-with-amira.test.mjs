import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { validateDiary, renderDiary, publicationRows, storagePaths, stripWebpMetadata } from '../days-with-amira-model.mjs';
const diary = JSON.parse(readFileSync(new URL('../assets/days-with-amira/diary.json', import.meta.url)));
test('Both languages include every selected original exactly once and retain the approved opening', () => {
  validateDiary(diary);
  assert.equal(diary.opening, 'memory-28');
  assert.equal(diary.photos.length, 29);
  for (const locale of ['en', 'ar']) {
    const html = renderDiary(diary, locale);
    assert.equal((html.match(/<figure/g) || []).length, 29);
    for (const photo of diary.photos) {
      assert.ok(html.includes(photo.alt[locale]));
      assert.ok(existsSync(new URL('../' + photo.src, import.meta.url)));
      for (const variant of photo.variants) assert.ok(existsSync(new URL('../' + variant.path, import.meta.url)));
    }
    assert.equal((html.match(/loading="lazy"/g) || []).length, 28);
    assert.equal((html.match(/fetchpriority="high"/g) || []).length, 1);
    assert.doesNotMatch(html, /data-lightbox|data-original|<button|<dialog|<video/);
  }
});
test('Editorial text is escaped and remote, script and traversal image paths are rejected', () => {
  const copy = structuredClone(diary); copy.title.en = '<img src=x onerror=alert(1)>';
  assert.ok(renderDiary(copy).includes('&lt;img src=x onerror=alert(1)&gt;'));
  for (const src of ['https://example.com/tracker.jpg', 'javascript:alert(1)', 'assets/days-with-amira/../../private.jpg']) {
    copy.photos[0].src = src; assert.throws(() => validateDiary(copy));
  }
});
test('Publication atomically enables referenced assets and disables removed ones', () => {
  const copy = structuredClone(diary), uuid = '11111111-1111-4111-8111-111111111111';
  const active = `sections/days-with-amira/${uuid}/480.webp`, removed = `sections/days-with-amira/${uuid}/960.webp`;
  copy.photos[0].src = active; copy.photos[0].variants = [{ path: active, width: 480 }];
  assert.deepEqual(storagePaths(copy), [active]);
  const rows = publicationRows(copy, [removed]);
  assert.equal(rows.find(r => r.image_path === active).enabled, true);
  assert.equal(rows.find(r => r.image_path === removed).enabled, false);
  assert.deepEqual(Object.keys(rows[0]).sort(), Object.keys(rows[1]).sort());
  assert.throws(() => renderDiary(copy));
});
test('Corrupt editorial documents cannot replace the built-in diary', () => {
  for (const change of [d => d.opening = 'missing', d => d.photos[0].chapter = 'missing', d => d.chapters.push(d.chapters[0]), d => d.photos.push(d.photos[0]), d => d.photos[0].variants.reverse()]) {
    const copy = structuredClone(diary); change(copy); assert.throws(() => validateDiary(copy));
  }
});
test('Prepared uploads lose ICC, EXIF and XMP chunks without changing the encoded image', () => {
  const chunk = (name, bytes) => { const header = Buffer.alloc(8); header.write(name); header.writeUInt32LE(bytes.length, 4); return Buffer.concat([header, bytes, Buffer.alloc(bytes.length % 2)]); };
  const pixels = chunk('VP8 ', Buffer.from('unchanged encoded pixels'));
  const body = Buffer.concat([Buffer.from('WEBP'), chunk('VP8X', Buffer.from([0x2c, 0, 0, 0, 0, 0, 0, 0, 0, 0])), chunk('ICCP', Buffer.from('profile')), chunk('EXIF', Buffer.from('private location')), chunk('XMP ', Buffer.from('private metadata')), pixels]);
  const header = Buffer.alloc(8); header.write('RIFF'); header.writeUInt32LE(body.length, 4);
  const clean = Buffer.from(stripWebpMetadata(Buffer.concat([header, body])));
  assert.ok(clean.includes(pixels)); assert.equal(clean[20], 0);
  assert.doesNotMatch(clean.toString(), /ICCP|EXIF|XMP |private/);
  assert.throws(() => stripWebpMetadata(Buffer.from('invalid')));
});
