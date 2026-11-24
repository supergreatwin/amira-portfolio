import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync,readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {films} from '../content.mjs';
import {photographyCollections} from '../photos.mjs';
const read=f=>readFileSync(new URL('../'+f,import.meta.url),'utf8');
const exists=f=>existsSync(new URL('../'+f,import.meta.url));
test('Every original gallery photo remains reachable in both published locales',()=>{
 for(const c of photographyCollections){
  for(const locale of ['','ar/']){
   const html=read('dist/'+locale+c.id+'.html');
   for(let i=1;i<=c.captions.length;i++){
    const path=`assets/photography/${c.id}/${String(i).padStart(2,'0')}.jpg`;
    assert.ok(html.includes(path),locale+c.id+' misses '+path);assert.ok(exists('dist/'+path));
   }
  }
 }
});
test('Full bilingual film pages retain all source stills, metadata and trailers',()=>{
 for(const film of films)for(const locale of ['','ar/']){
  const html=read(`dist/${locale}film-${film.id}.html`);
  for(const [asset] of film.stills)assert.ok(html.includes(asset));
  assert.ok(html.includes(film.id+'-poster.jpg'));assert.ok(html.includes('film-meta'));
  if(film.trailer)assert.ok(html.includes('data-trailer="'+film.trailer.youtubeId+'"'));
 }
});
test('No video is fetched or embedded outside the approved on-demand film page',()=>{
 for(const locale of ['','ar/']){
  const days=read('dist/'+locale+'days-with-amira.html');
  for(const file of ['feature','opening','future','conversation','river'])assert.ok(days.includes(`portrait-${file}.mp4`));
  assert.match(days,/<video[^>]*preload="none"/);assert.doesNotMatch(days,/<video[^>]*src=/);
  for(const page of ['index','writing','beyond-the-frame'])assert.doesNotMatch(read('dist/'+locale+page+'.html'),/portrait-\w+\.mp4|<video/);
 }
});
test('One classic header, real legal controls, no obsolete public design switches',()=>{
 for(const locale of ['','ar/'])for(const page of ['index','films','art','writing','notes','collaborations','screenings','awards','endorsements','days-with-amira','beyond-the-frame']){
  const html=read('dist/'+locale+page+'.html');assert.equal((html.match(/<header\b/g)||[]).length,1);
  assert.ok(html.includes('id="siteMenu"'));assert.ok(html.includes('data-privacy-settings'));
  assert.doesNotMatch(html,/photo-mosaic|site-design-router\.js|demo-toolbar/);
 }
 for(const file of ['editorial.html','ar/editorial.html','content-studio.html'])assert.doesNotMatch(read('dist/'+file),/data-site-design-control|homepage-layout-editor\.js/);
});

test('Notebook announcement is restored on both published homepages only',()=>{
 for(const locale of ['','ar/']){
  const html=read('dist/'+locale+'index.html');
  assert.equal((html.match(/data-education-announcement\b/g)||[]).length,1);
  assert.match(html,/education-announcement\.css\?v=/);
  assert.match(html,/education-announcement\.js\?v=/);
  assert.match(html,/Notebook/);
  assert.match(html,/data-education-signup/);
  assert.match(html,/aria-controls="education-signup"/);
  assert.match(html,/data-field-notes-form/);
  assert.match(html,/field-notes-native\.js\?v=/);
  assert.doesNotMatch(html.match(/<aside class="education-announcement"[\s\S]*?<\/aside>/)[0],/Field Notes/);
  assert.match(read('dist/'+locale+'notes.html'),/data-field-notes-form/);
  for(const page of ['films','art','writing','notes','beyond-the-frame'])assert.doesNotMatch(read('dist/'+locale+page+'.html'),/data-education-announcement|education-announcement\.js/);
 }
 assert.ok(exists('dist/education-announcement.css'));assert.ok(exists('dist/education-announcement.js'));
});
