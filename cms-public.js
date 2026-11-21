import { cms, node, signedMedia } from './cms-core.js';

const isArabic = /^\/ar(?:\/|$)/.test(location.pathname);
const isHome = /(?:\/|\/(?:index|classic)\.html|\/classic)$/.test(location.pathname);
const filmHref = slug => (isArabic ? '/ar/film.html?slug=' : '/film.html?slug=') + encodeURIComponent(slug);
const galleryHref = slug => (isArabic ? '/ar/collection.html?slug=' : '/collection.html?slug=') + encodeURIComponent(slug);
const CMS_ORIGIN = 'https://amiraabdelfadil.com/';
function filmLength(s) {
  if(s===null||s===undefined)return '';
  const n=Math.max(0,Number(s));return String(Math.floor(n/60)).padStart(2,'0')+':'+String(n%60).padStart(2,'0');
}
async function imageFor(path) {
  if(!path)return null;
  if(path.startsWith('assets/'))return new URL(path,CMS_ORIGIN).href;
  return signedMedia(path,55);
}
function setHeading(el,content){
  if(!el||!content)return;const words=content.trim().split(/\s+/);
  el.replaceChildren(document.createTextNode(words.slice(0,-1).join(' ')+(words.length>1?' ':'')));
  const em=node('em','',words.at(-1));el.append(em);
}
function addFilmCard(f,image,index){
  const minimal=!!document.querySelector('.photo-mosaic');
  const card=node('article','film-card');
  card.dataset.cmsFilm=f.slug;
  const link=node('a',minimal?'':'film-link');
  link.href=filmHref(f.slug);
  link.setAttribute('aria-label',((isArabic&&f.title_ar)||f.title_en)+' — view film');
  const wrap=node('div',minimal?'film-poster':'film-image'),img=new Image();
  img.src=image;img.alt=((isArabic&&f.title_ar)||f.title_en)+' poster';img.loading='lazy';img.decoding='async';
  if(minimal)wrap.append(img);
  else{
    const n=node('span','film-no eyebrow',String(index).padStart(2,'0'));
    n.setAttribute('aria-hidden','true');wrap.append(img,n);
  }
  const caption=node('div',minimal?'film-line':'film-caption'),info=node('div');
  const descriptor=[f.film_type,f.year,filmLength(f.runtime_seconds)].filter(Boolean).join(' · ');
  if(minimal){
    caption.append(node('strong','',(isArabic&&f.title_ar)||f.title_en),node('small','',[f.year,filmLength(f.runtime_seconds)].filter(Boolean).join(' · ')));
  }else{
    info.append(node('p','eyebrow',descriptor),node('h3','',(isArabic&&f.title_ar)||f.title_en));
    caption.append(info,node('span','icon-circle','↗'));
  }
  link.append(wrap,caption);card.append(link);return card;
}
async function films(){
  // Preserve the explicitly selected two homepage features.
  if(document.querySelector('.photo-mosaic'))return;
  const grid=document.querySelector('.film-grid');if(!grid)return;
  const {data,error}=await cms.from('cms_films').select('slug,title_en,title_ar,film_type,year,runtime_seconds,poster_path,status,published_at,sort_order').eq('status','published')
    .lte('published_at',new Date().toISOString()).order('sort_order').order('created_at');
  if(error)throw error;
  let index=grid.querySelectorAll('.film-card').length+1;
  for(const f of data||[]){
    let image;
    try{image=await imageFor(f.poster_path);}catch(err){console.warn('Film image unavailable',f.slug,err.message);continue;}
    if(!image)continue;
    const staticLink=Array.from(grid.querySelectorAll('[data-project]')).find(x=>x.dataset.project===f.slug);
    if(staticLink)staticLink.closest('.film-card')?.setAttribute('hidden','');
    const existing=grid.querySelector('[data-cms-film="'+CSS.escape(f.slug)+'"]');
    existing?.remove();
    grid.append(addFilmCard(f,image,index++));
  }
}
async function galleries(){
  const grid=document.querySelector('.photography-collections');if(!grid)return;
  const {data,error}=await cms.from('cms_collections').select('slug,title_en,title_ar,cover_path,kind,status,published_at')
    .eq('status','published').lte('published_at',new Date().toISOString()).order('sort_order').order('created_at');
  if(error)throw error;
  for(const row of data||[]){
    let image;
    try{image=await imageFor(row.cover_path);}catch(err){console.warn(err.message);continue;}
    if(!image)continue;
    const link=node('a','photography-collection cms-card-collection');
    link.href=galleryHref(row.slug);
    const picture=node('picture'),img=new Image();img.src=image;img.alt=(isArabic&&row.title_ar)||row.title_en;img.loading='lazy';
    picture.append(img);link.append(picture,node('span','',(isArabic&&row.title_ar)||row.title_en+' ↗'));
    grid.append(link);
  }
}
async function sections(){
  const {data,error}=await cms.from('cms_sections').select('key,heading_en,heading_ar,body_en,body_ar,image_path,button_label,button_href').eq('enabled',true);
  if(error)throw error;
  for(const s of data||[]){
    const h=(isArabic&&s.heading_ar)||s.heading_en;
    const body=(isArabic&&s.body_ar)||s.body_en;
    let heading=null,description=null,photo=null;
    switch(s.key){
      case 'homepage_hero':
        if(!isHome)continue;
        heading=document.querySelector('#hero-title')||document.querySelector('.hero-copy h1');
        description=document.querySelector('.hero-intro')||document.querySelector('.hero-deck');
        photo=document.querySelector('.hero-visual img')||document.querySelector('.photo-mosaic figure:first-child img');break;
      case 'homepage_intro':
        if(!isHome)continue;
        description=document.querySelector('.hero-intro')||document.querySelector('.hero-deck');break;
      case 'about_intro':
        if(isHome){
          heading=document.querySelector('#about h2');
          description=document.querySelector('#about .prose p');
        }else if(location.pathname.includes('/about')){
          heading=document.querySelector('main h1');
          description=document.querySelector('.about-page .prose p');
        }break;
      case 'writing_intro':
        if(isHome){heading=document.querySelector('#writing h2');description=document.querySelector('#writing p:not(.eyebrow)');}
        else if(location.pathname.includes('/writing')){heading=document.querySelector('main h1');description=document.querySelector('.section-intro');}
        break;
      case 'art_intro':
        if(!location.pathname.includes('/art'))continue;
        heading=document.querySelector('main h1');description=document.querySelector('.section-intro');break;
      case 'contact_intro':
        if(isHome){heading=document.querySelector('#contact h2');}
        else if(location.pathname.includes('/contact')){heading=document.querySelector('main h1');description=document.querySelector('.section-intro');}
        break;
      case 'homepage_feature':
        if(!isHome)continue;
        heading=document.querySelector('#field-notes h2')||document.querySelector('.selected .section-head h2');
        description=document.querySelector('.notes-home-copy p');break;
    }
    if(heading&&h)setHeading(heading,h);
    if(description&&body)description.textContent=body;
    if(photo&&s.image_path){
      try{
        const src=await imageFor(s.image_path);
        if(src){
          photo.closest('picture')?.querySelectorAll('source').forEach(source=>source.remove());
          photo.src=src;photo.alt=h||'Photograph selected by Amira Abdelfadil';photo.removeAttribute('srcset');
        }
      }catch(err){console.warn('Editorial section image unavailable',err.message);}
    }
  }
}
void Promise.allSettled([films(),galleries(),sections()]).then(results=>{
  for(const r of results)if(r.status==='rejected')console.warn('Portfolio content unavailable:',r.reason?.message||r.reason);
});
