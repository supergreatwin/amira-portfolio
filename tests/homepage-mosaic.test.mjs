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
assert.match(css,/html\.amira-ios-homeapp \.home-topbar/);
const init=readFileSync('dist/theme-init.js','utf8');
assert.match(init,/navigator\.standalone === true/);
assert.match(init,/amira-ios-homeapp/);
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
 assert.ok(html.includes('theme-init.js?v=4'),path);
 assert.ok(html.includes('education-announcement.css?v=20261121compact'),path);
 assert.match(html,/apple-mobile-web-app-capable/,path);
 assert.match(html,/apple-mobile-web-app-status-bar-style" content="black-translucent"/,path);
 assert.ok(html.includes('href="'+prefix+'homepage-mosaic-integrity.css?v=20261121iosstandalone3"'),path);
 for(let slot=1;slot<=4;slot++)assert.ok(html.includes('data-slot="'+slot+'"'),path+' missing tile '+slot);
 assert.equal((html.match(/data-slot="[1-4]"/g)||[]).length,4,path);
 // Homepage content must remain exactly: photographic hero, selected films, About.
 // Both existing modal experiences remain available outside the main content.
 const main=html.match(/<main id="main">([\s\S]*?)<\/main>/)?.[1];
 assert.ok(main,path+' missing main');
 assert.equal((main.match(/<section\b/g)||[]).length,3,path+' unexpected homepage section');
 assert.match(main,/class="photo-hero"/,path);
 assert.match(main,/id="selected"/,path);
 assert.match(main,/id="about"/,path);
 assert.doesNotMatch(main,/id="(?:art|writing|notes)"/,path);
 assert.equal((main.match(/class="film-card"/g)||[]).length,2,path);
 assert.ok(html.includes('data-education-announcement'),path+' missing education popup');
 assert.ok(html.includes('id="rs-newsletter-dialog"'),path+' missing newsletter popup');
 assert.ok(html.includes('data-field-notes-form'),path+' missing native signup');
 assert.ok(html.includes('data-newsletter-open'),path+' no popup launcher');
 assert.ok(html.includes('home-minimal.js?v=20261121about'),path+' stale deep-link script');
 assert.ok(html.includes('responsive.js?v=1'),path+' missing modal controller');
 assert.doesNotMatch(html,/subscribe-forms\.beehiiv\.com/,path+' legacy third-party signup');
}
for(const path of ['dist/homepage-editor.js','dist/homepage-layout-editor.js']){
 const js=readFileSync(path,'utf8');
 assert.match(js,/from '.\/homepage-photo-guard\.mjs'/,path);
 assert.match(js,/await validateHomepagePhoto\(/,path);
}
console.log('PASS: Four-photo hero, two films, About and preserved bilingual popups across all layouts');
