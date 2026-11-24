import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {films} from '../content.mjs';
import vm from 'node:vm';
const read=f=>readFileSync(new URL('../'+f,import.meta.url),'utf8');
test('Handover preserves separate 20 presentation records, three exhibitions and five awards in both languages',()=>{
 for(const locale of ['','ar/']){
  const screenings=read('dist/'+locale+'screenings.html');
  assert.equal((screenings.match(/class="archive-entry"/g)||[]).length,20);
  assert.equal((screenings.match(/class="archive-group-title"/g)||[]).length,3);
  const exhibitions=screenings.split('class="archive-group-title"')[1];
  assert.equal((exhibitions.match(/class="archive-entry"/g)||[]).length,3);
  assert.equal((read('dist/'+locale+'awards.html').match(/class="award-feature"/g)||[]).length,5);
  assert.match(screenings,/artfacts\.net\/artist\/amira-abdel-fadil/);
  assert.match(read('dist/'+locale+'about.html'),/artfacts\.net\/artist\/amira-abdel-fadil/);
 }
 const awards=read('dist/awards.html');
 assert.ok(awards.includes('TULUM ENVIRONMENTAL FILM FESTIVAL'));
 for(const text of ['Best Cinematography','Best Environment and Climate Short Film','Best Featurette','Best Environmental Short Film','Best Idea for a Film','David Všetička','Rama Abdi','Hazar Yazji','Karim El-Mubarak','Date TBC — pending confirmation'])assert.ok(awards.includes(text),text);
});
test('Homepage retains films and real popups, exposes Beyond the Frame, and removes only requested home sections',()=>{
 for(const locale of ['','ar/']){
  const home=read('dist/'+locale+'index.html');
  const page=home.split('id="page-home"')[1].split('</section></section>')[0];
  assert.match(home,/class="content home-feature home-beyond"/);
  assert.doesNotMatch(home,/class="content section-block about-section"|home-art|home-writing|collab-preview|collaborations-section/);
  assert.match(home,/href="beyond-the-frame.html"/);
  assert.match(home,/data-education-announcement/);
  assert.match(home,/id="filmDialog"/);
  for(const film of films)assert.ok(home.includes('popup-'+film.id));
  for(const name of ['about','collaborations','days-with-amira','art','writing'])assert.match(read('dist/'+locale+name+'.html'),/<main\b/);
 }
});
test('Film content stays intact while still enlargement and film-specific recognition are removed',()=>{
 for(const locale of ['','ar/'])for(const film of films){
  const html=read('dist/'+locale+'film-'+film.id+'.html');
  assert.doesNotMatch(html,/data-original|expand-icon|id="filmImageViewer"|film-testimonial-ref|film-festival-history/);
  for(const [name] of film.stills)assert.ok(html.includes(name));
  if(!locale)assert.ok(html.includes(film.synopsis));
  if(film.trailer)assert.ok(html.includes(film.trailer.youtubeId));
 }
});
test('Full approved testimonials and recommendation are preserved without personal contacts',()=>{
 const reference=read('design/approved-final-handover-reference.html');
 const expected=[...reference.matchAll(/<blockquote class="testimonial-quote">([\s\S]*?)<\/blockquote>/g)].map(x=>x[1]);
 const html=read('dist/endorsements.html');
 assert.equal(expected.length,3);
 for(const quote of expected)assert.ok(html.includes(quote));
 assert.match(html,/I wish her continued success in her professional career\./);
 assert.match(html,/Garikai Nhongo/);
 for(const locale of ['','ar/']){
  const page=read('dist/'+locale+'endorsements.html');
  assert.doesNotMatch(page,/mailto:|tel:|[\w.+-]+@[\w.-]+\.[a-z]{2,}/i);
  const letter=page.match(/<details class="recommendation-letter">([\s\S]*?)<\/details>/)[1];
  assert.doesNotMatch(letter,/href="[^"]+\.(pdf|docx?)"/i);
 }
});
test('Both upcoming collaboration descriptions use the owner-supplied wording',()=>{
 const html=read('dist/collaborations.html');
 assert.ok(html.includes('A collaborative documentary project in collaboration with Unicef "Children of The World"'));
 assert.ok(html.includes('Working on a storytelling workshop across different mediums'));
});
test('Archive records have no prototype film actions without a production handler',()=>{
 for(const locale of ['','ar/'])for(const page of ['screenings','awards']){
  const html=read('dist/'+locale+page+'.html');
  assert.doesNotMatch(html,/data-film=|data-page=|data-form=/);
 }
});
test('CMS movie images are noninteractive while photography collections retain their viewer',()=>{
 const source=read('cms-display.js');
 const opened=[];
 const context=vm.createContext({Image:class {},node:(tag,className,text)=>({tag,className,text,children:[],attributes:{},append(...children){this.children.push(...children);},setAttribute(key,value){this.attributes[key]=value;}}),openViewer:index=>opened.push(index)});
 vm.runInContext(source.slice(source.indexOf('function stillCard('),source.indexOf('async function loadMedia(')),context);
 const frame={type:'image',url:'https://example.test/original.jpg',caption:'Original film still',alt:'Original scene'};
 const still=context.stillCard(frame,0,false);
 assert.equal(still.tag,'figure');assert.equal(still.onclick,undefined);assert.equal(still.children[0].src,frame.url);assert.equal(still.children[1].text,frame.caption);
 const photo=context.stillCard(frame,1,true);assert.equal(photo.tag,'button');photo.onclick();assert.deepEqual(opened,[1]);
 const video=context.stillCard({...frame,type:'video'},2,false);assert.equal(video.tag,'button');video.onclick();assert.deepEqual(opened,[1,2]);
 for(const locale of ['','ar/'])assert.doesNotMatch(read('dist/'+locale+'film.html'),/Select a frame for full-screen viewing|اضغط لعرض الصورة كاملة/);
});
test('Public pages use the global header without repeated home and section-return navigation',()=>{
 for(const locale of ['','ar/'])for(const name of ['index','films','film-mamina','italy','collaborate','pitch','contact']){
  const html=read('dist/'+locale+name+'.html');
  const menu=html.match(/<nav class="nav-popover"[\s\S]*?<\/nav>/)[0];
  assert.doesNotMatch(menu,/>Home<|>الرئيسية</);
  assert.match(html,/<a\b(?=[^>]*href="index.html")(?=[^>]*aria-label=)(?=[^>]*class="brand")[^>]*>/);
  assert.doesNotMatch(html,/class="[^"]*\b(?:film-page-back|back-link|studio-back)\b/);
 }
});
test('Every documentary highlights Films and switches language to the same documentary',()=>{
 for(const locale of ['','ar/'])for(const film of films){
  const file='film-'+film.id+'.html';const html=read('dist/'+locale+file);
  const header=html.match(/<header\b[\s\S]*?<\/header>/)[0];
  const links=[...header.matchAll(/<a\b([^>]*)>/g)].map(x=>x[1]);
  assert.ok(links.some(a=>a.includes('href="films.html"')&&a.includes('aria-current="location"')));
  assert.ok(links.filter(a=>a.includes('href="art.html"')).every(a=>!a.includes('aria-current')));
  assert.ok(links.some(a=>a.includes('class="header-aux"')&&a.includes('href="'+(locale?'../':'ar/')+file+'"')));
 }
});
