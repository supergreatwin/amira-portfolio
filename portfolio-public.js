import {cms,node,onlyHttps} from './cms-core.js';
const ar=document.documentElement.lang==='ar';
const page=document.querySelector('#page-awards')?'awards':document.querySelector('#page-screenings')?'screenings':document.querySelector('#page-endorsements')?'endorsements':null;
const pick=(r,k)=>(ar&&r[k+'_ar'])||r[k+'_en']||'';
const format=d=>new Intl.DateTimeFormat(ar?'ar-EG':'en-GB',{dateStyle:'long',timeZone:'UTC'}).format(new Date(d+'T00:00:00Z'));
const dateLabel=r=>r.event_date?format(r.event_date)+(r.end_date?' — '+format(r.end_date):''):r.event_year?(r.event_month?new Intl.DateTimeFormat(ar?'ar-EG':'en-GB',{month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(Date.UTC(r.event_year,r.event_month-1,1))):new Intl.NumberFormat(ar?'ar-EG':'en-GB',{useGrouping:false}).format(r.event_year)):(ar?'التاريخ قيد التأكيد':'Date TBC — pending confirmation');
const locale=ar?'ar-EG':'en-GB';
const number=n=>new Intl.NumberFormat(locale,{useGrouping:false}).format(n);
const monthName=(m)=>new Intl.DateTimeFormat(locale,{month:'short',timeZone:'UTC'}).format(new Date(Date.UTC(2000,m-1,1))).toLocaleUpperCase(locale);
function archiveDateParts(r){
 if(!r.event_date)return {year:number(r.event_year),detail:r.event_month?monthName(r.event_month):''};
 const [y,m,d]=r.event_date.split('-').map(Number);
 let detail=number(d)+' '+monthName(m);
 if(r.end_date){const [ey,em,ed]=r.end_date.split('-').map(Number);detail=y===ey&&m===em?number(d)+'–'+number(ed)+' '+monthName(m):detail+' — '+number(ed)+' '+monthName(em)+(ey!==y?' '+number(ey):'');}
 return {year:number(y),detail};
}
function dateNode(r,cls){
 const known=r.event_date||r.event_year;
 const el=node(known?'time':'div',cls+(!known?' date-tbc date-pending':''));
 if(!known){el.textContent=dateLabel(r);return el;}
 el.dateTime=r.event_date||String(r.event_year)+(r.event_month?'-'+String(r.event_month).padStart(2,'0'):'');
 if(cls==='portfolio-date'){el.textContent=dateLabel(r);return el;}
 const {year,detail}=archiveDateParts(r);el.append(document.createTextNode(year));
 if(detail){const span=node('span','');const bdi=node('bdi','',detail);bdi.dir=ar?'rtl':'ltr';span.append(bdi);el.append(span);}
 return el;
}
function source(r){if(!r.source_url||!onlyHttps(r.source_url))return null;const a=node('a','',ar?'المصدر ↗':'Source ↗');a.href=r.source_url;a.target='_blank';a.rel='noopener noreferrer';return a;}
function override(r){const a=document.querySelector('[data-portfolio-key="'+CSS.escape(r.legacy_key)+'"]');if(!a)return;const old=a.querySelector('.archive-date,.award-year');if(old)old.replaceWith(dateNode(r,page==='awards'?'award-year':'archive-date'));else{const tag=a.querySelector(':scope > .archive-tag');if(tag){const key=r.legacy_key; if(key==='endorsements-3'||key==='endorsements-5'||key==='endorsements-6')tag.textContent=tag.textContent.split('·')[key==='endorsements-6'?1:0].trim();if(key==='endorsements-4')tag.textContent=tag.textContent.split('·').at(-1).trim();tag.after(dateNode(r,'portfolio-date'));}else a.prepend(dateNode(r,'portfolio-date'));}}
function append(r){if(page==='awards'&&r.kind!=='award'||page==='endorsements'&&r.kind!=='endorsement'||page==='screenings'&&!['exhibition','screening','selection'].includes(r.kind))return;
 const title=pick(r,'title'),body=pick(r,'body'),label=pick(r,'label'),attribution=pick(r,'attribution'),a=node('article',page==='awards'?'award-feature':page==='screenings'?'archive-entry':'recognition-entry testimonial-entry');a.dataset.portfolioId=r.id;
 if(page==='endorsements'){a.append(node('p','archive-tag',label||(ar?'شهادة مهنية':'Professional testimonial')),dateNode(r,'portfolio-date'),node('h3','',title));const q=node('blockquote','testimonial-quote');for(const p of body.split(/\n+/).filter(Boolean))q.append(node('p','',p));a.append(q,node('div','testimonial-attribution',attribution));const link=source(r);if(link)a.append(link);document.querySelector('#professional-testimonials')?.append(a);return;}
 const info=node('div',page==='awards'?'award-info':'archive-info');info.append(node('p','archive-tag',label),node('h2','',title));for(const p of body.split(/\n+/).filter(Boolean))info.append(node('p','',p));if(attribution)info.append(node('p','fact-note',attribution));const link=source(r);if(link)info.append(link);a.append(dateNode(r,page==='awards'?'award-year':'archive-date'),info);
 const list=document.querySelector('.archive-list');if(!list)return;if(page==='awards'){list.append(a);return;}const headers=[...list.querySelectorAll(':scope > .archive-group-title')],index=['exhibition','screening','selection'].indexOf(r.kind);const next=headers[index+1];if(next)list.insertBefore(a,next);else list.append(a);}
// Compare recorded dates without inventing missing months or days.
function chronologyKey(value){
 const parts=String(value||'').split('-');
 if(!/^\d{4}$/.test(parts[0]))return '9999-99-99';
 return [parts[0],parts[1]||'00',parts[2]||'00'].join('-');
}
function sortArchive(){
 if(page!=='awards'&&page!=='screenings')return;
 const list=document.querySelector('.archive-list');if(!list)return;
 const groups=[];let entries=[];
 for(const child of list.children){
  if(child.matches('.archive-group-title')){if(entries.length)groups.push(entries);entries=[];}
  if(child.matches('article.award-feature,article.archive-entry'))entries.push(child);
 }
 if(entries.length)groups.push(entries);
 const dateKey=article=>{const el=article.querySelector('.archive-date,.award-year');return chronologyKey(el?.getAttribute('datetime')||el?.dataset.chronology);};
 for(const group of groups){
  const anchor=group[group.length-1].nextSibling;
  const sorted=[...group].sort((a,b)=>dateKey(a).localeCompare(dateKey(b)));
  for(const article of sorted)list.insertBefore(article,anchor);
 }
}
sortArchive();
if(page){const {data,error}=await cms.from('cms_portfolio_entries').select('id,kind,legacy_key,title_en,title_ar,label_en,label_ar,body_en,body_ar,attribution_en,attribution_ar,source_url,event_date,end_date,event_year,event_month,sort_order').eq('status','published').order('sort_order').order('event_date',{ascending:false,nullsFirst:false});if(error)console.warn('Portfolio updates unavailable',error.message);else for(const r of data||[]){if(r.kind==='date_override')override(r);else append(r);}sortArchive();}
