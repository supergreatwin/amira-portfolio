import test from 'node:test';
import assert from 'node:assert/strict';
import {applySocialPreview} from '../social-preview.mjs';

const publicPage='<html><head><title>About &amp; work</title><meta name="description" content="Films &amp; photographs"><link rel="canonical" href="https://amiraabdelfadil.com/about"><meta property="og:image" content="https://amiraabdelfadil.com/assets/mamina-02.jpg"></head></html>';
test('Public previews gain complete metadata while preserving original images and entities',()=>{
 const html=applySocialPreview(publicPage,'about.html',false);
 assert.match(html,/<meta property="og:title" content="About &amp; work">/);
 assert.match(html,/<meta name="twitter:image" content="https:\/\/amiraabdelfadil.com\/assets\/mamina-02.jpg">/);
 assert.equal((html.match(/property="og:image"/g)||[]).length,1);
 assert.doesNotMatch(html,/&amp;amp;/);
 assert.equal(applySocialPreview(html,'about.html',false),html);
});
test('Arabic legal pages use localized previews and an original portrait fallback',()=>{
 const page=publicPage.replace(/<meta property="og:image"[^>]*>/,'');
 const html=applySocialPreview(page,'privacy.html',true);
 assert.match(html,/property="og:locale" content="ar_EG"/);
 assert.match(html,/assets\/amira-portrait.jpg/);
 assert.match(html,/أميرة عبد الفضيل تحمل كاميرا/);
});
test('Private pages and uncanonicalized dynamic shells receive no public preview',()=>{
 const privatePage=publicPage.replace('</head>','<meta name="robots" content="noindex,nofollow"></head>');
 assert.equal(applySocialPreview(privatePage,'editorial.html',false),privatePage);
 const shell=publicPage.replace(/<link rel="canonical"[^>]*>/,'');
 assert.equal(applySocialPreview(shell,'film.html',false),shell);
});
test('Curated bilingual page images and preview copy remain authoritative',()=>{
 for(const ar of [false,true]){
  const html=applySocialPreview(publicPage,'writing.html',ar);
  assert.match(html,/assets\/days-with-amira\/memory-10.jpg/);
  assert.match(html,new RegExp(ar?'الكتابة':'Writing'));
  assert.doesNotMatch(html,/mamina-02/);
 }
});
