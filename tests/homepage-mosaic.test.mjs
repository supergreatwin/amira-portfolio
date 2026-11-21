import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { detectLetterboxMargins } from '../homepage-photo-guard.mjs';

const w=160,h=160;
function image(top=0,bottom=0){
 const pixels=new Uint8ClampedArray(w*h*4);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const i=(y*w+x)*4;
  const padded=y<top||y>=h-bottom;
  pixels[i]=padded?0:115;
  pixels[i+1]=padded?0:154;
  pixels[i+2]=padded?0:182;
  pixels[i+3]=255;
 }
 return pixels;
}
assert.equal(detectLetterboxMargins(image(),w,h).hasLetterbox,false);
assert.equal(detectLetterboxMargins(image(12,12),w,h).hasLetterbox,true);
assert.equal(detectLetterboxMargins(image(12,0),w,h).hasLetterbox,false);
assert.equal(detectLetterboxMargins(image(0,12),w,h).hasLetterbox,false);

const css=readFileSync('dist/homepage-mosaic-integrity.css','utf8');
assert.match(css,/object-fit:cover!important/);
assert.match(css,/img\[src\*="Pasted-21-11-2026-at-02\.35\.51\.png"\]/);
assert.match(css,/transform:scale\(1\.27\)/);
assert.match(css,/display-mode:standalone/);
assert.match(css,/--amira-standalone-top:max\(52px/);
assert.match(css,/visibility:visible!important/);
const popup=readFileSync('dist/education-announcement.css','utf8');
assert.match(popup,/max-height:min\(52dvh,410px\)/);
assert.match(popup,/education-announcement__masthead/);
assert.ok(existsSync('dist/homepage-photo-guard.mjs'));
for(const [path,prefix] of [
 ['dist/index.html',''],['dist/responsive.html',''],
 ['dist/ar/current.html','../'],['dist/ar/responsive.html','../']
]){
 const html=readFileSync(path,'utf8');
 assert.match(html,/viewport-fit=cover/,path);
 assert.ok(html.includes('education-announcement.css?v=20261121compact'),path);
 assert.match(html,/apple-mobile-web-app-capable/,path);
 assert.match(html,/apple-mobile-web-app-status-bar-style" content="black-translucent"/,path);
 assert.ok(html.includes('href="'+prefix+'homepage-mosaic-integrity.css?v=20261121safenav2"'),path);
 for(let slot=1;slot<=4;slot++)assert.ok(html.includes('data-slot="'+slot+'"'),path+' missing tile '+slot);
 assert.equal((html.match(/data-slot="[1-4]"/g)||[]).length,4,path);
}
for(const path of ['dist/homepage-editor.js','dist/homepage-layout-editor.js']){
 const js=readFileSync(path,'utf8');
 assert.match(js,/from '.\/homepage-photo-guard\.mjs'/,path);
 assert.match(js,/await validateHomepagePhoto\(/,path);
}
console.log('PASS: 4-tile mosaic geometry, upload safeguards, bilingual iOS safe areas');
