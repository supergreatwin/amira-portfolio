import {cms,$,node,signedMedia,duration,onlyHttps} from './cms-core.js';

const params=new URLSearchParams(location.search);
const slug=params.get('slug')||'';
const kind=document.body.dataset.cmsKind;
const ar=/^\/ar(?:\/|$)/.test(location.pathname);
const status=$('cms-page-status');
const state={media:[],index:0,opener:null};
const dialog=$('cms-image-dialog');
const stage=$('cms-image-stage');
const caption=$('cms-image-caption');
const safeImage=async path=>{
  if(!path)return null;
  if(path.startsWith('assets/'))return new URL(path,'https://amiraabdelfadil.com/').href;
  return await signedMedia(path,55);
};
const empty=(message)=>{status.textContent=message||'This work is not currently available.';};
const text=(id,value)=>{const el=$(id);if(el)el.textContent=value||'';};
function updateTitle(title,description){
  document.title=title+' | Amira Abdelfadil';
  let meta=document.querySelector('meta[name=description]');
  if(!meta){meta=document.createElement('meta');meta.name='description';document.head.append(meta);}
  meta.content=String(description||'Film and photography by Amira Abdelfadil.').slice(0,160);
  const canonical=document.createElement('link');canonical.rel='canonical';
  const path=ar?'/ar/':'/';
  canonical.href='https://amiraabdelfadil.com'+path+(kind==='film'?'film':'collection')+'?slug='+encodeURIComponent(slug);
  document.head.append(canonical);
}
function openViewer(index,opener){
  if(!state.media.length)return;
  state.index=(index+state.media.length)%state.media.length;
  state.opener=opener||document.activeElement;
  displayFrame();
  if(!dialog.open)dialog.showModal();
  $('cms-close').focus();
}
function displayFrame(){
  stage.replaceChildren();
  const frame=state.media[state.index];if(!frame)return;
  const el=frame.type==='video'?node('video'):new Image();
  el.src=frame.url;
  if(frame.type==='video'){el.controls=true;el.preload='metadata';el.playsInline=true;}
  else{el.alt=frame.alt||frame.caption||'Photograph by Amira Abdelfadil';el.draggable=false;}
  stage.append(el);
  caption.textContent=(state.index+1)+' / '+state.media.length+(frame.caption?' — '+frame.caption:'');
  $('cms-prev').hidden=state.media.length<2;
  $('cms-next').hidden=state.media.length<2;
}
function step(amount){state.index=(state.index+amount+state.media.length)%state.media.length;displayFrame();}
$('cms-prev').onclick=()=>step(-1);$('cms-next').onclick=()=>step(1);$('cms-close').onclick=()=>dialog.close();
dialog.addEventListener('close',()=>{stage.replaceChildren();state.opener?.focus?.({preventScroll:true});});
dialog.addEventListener('keydown',e=>{
  if(e.key==='ArrowLeft'){e.preventDefault();step(-1);}
  if(e.key==='ArrowRight'){e.preventDefault();step(1);}
});
dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close();});
let finger=null;
stage.addEventListener('touchstart',e=>{if(e.touches.length===1)finger={x:e.touches[0].clientX,y:e.touches[0].clientY};},{passive:true});
stage.addEventListener('touchend',e=>{
  if(!finger||!e.changedTouches.length)return;
  const dx=e.changedTouches[0].clientX-finger.x,dy=e.changedTouches[0].clientY-finger.y;
  if(Math.abs(dx)>60&&Math.abs(dx)>Math.abs(dy)*1.5)step(dx<0?1:-1);
  finger=null;
},{passive:true});
function stillCard(frame,index,collection=false){
  const button=node('button','cms-still cms-photo-trigger');button.type='button';
  button.setAttribute('aria-label','View '+(frame.alt||frame.caption||'frame')+' full screen');
  if(frame.type==='video'){
    const video=node('video');video.src=frame.url;video.preload='metadata';video.muted=true;video.playsInline=true;button.append(video);
  }else{
    const img=new Image();img.src=frame.url;img.alt=frame.alt||frame.caption||'Photograph by Amira Abdelfadil';
    img.loading='lazy';img.decoding='async';button.append(img);
  }
  if(frame.caption){const label=node('figcaption','',frame.caption);button.append(label);}
  button.onclick=()=>openViewer(index,button);
  return button;
}
async function loadMedia(table,id){
  const column=table==='film'?'film_id':'collection_id';
  const {data,error}=await cms.from('cms_media').select('id,media_kind,storage_path,caption,alt_text,sort_order')
    .eq(column,id).order('sort_order').order('created_at');
  if(error)throw error;
  const resolved=[];
  for(const item of data||[]){
    try{
      const url=await safeImage(item.storage_path);
      if(url)resolved.push({url,type:item.media_kind,caption:item.caption||'',alt:item.alt_text||''});
    }catch(err){console.warn('A published media item is unavailable',err.message);}
  }
  state.media=resolved;
  const container=$('cms-image-grid');
  container.replaceChildren();
  resolved.forEach((frame,i)=>container.append(stillCard(frame,i,table==='gallery')));
  if(!resolved.length)container.append(node('p','cms-empty',ar?'لم تُضَف صور بعد.':'Additional images will appear here when published.'));
}
async function loadFilm(){
  const {data:film,error}=await cms.from('cms_films').select('*')
    .eq('slug',slug).eq('status','published').lte('published_at',new Date().toISOString()).maybeSingle();
  if(error)throw error;
  if(!film){empty(ar?'الفيلم غير متاح حاليًا.':'Film not available.');return;}
  const title=(ar&&film.title_ar)||film.title_en;
  const synopsis=(ar&&film.synopsis_ar)||film.synopsis_en;
  text('cms-title',title);text('cms-synopsis',synopsis);
  text('cms-role',film.role);text('cms-production',film.production);
  text('cms-year',film.year?String(film.year):'—');
  text('cms-runtime',duration(film.runtime_seconds)||'—');
  text('cms-hero-label',[film.film_type,film.year,duration(film.runtime_seconds)].filter(Boolean).join(' · '));
  updateTitle(title,synopsis);
  const hero=await safeImage(film.hero_path||film.poster_path),poster=await safeImage(film.poster_path||film.hero_path);
  if(hero){$('cms-hero-image').src=hero;$('cms-hero-image').alt=title+' — documentary frame';}
  if(poster){$('cms-poster').src=poster;$('cms-poster').alt=title+' poster';}
  if(film.trailer_url&&onlyHttps(film.trailer_url)){
    const link=$('cms-trailer');link.hidden=false;link.href=film.trailer_url;
  }
  $('cms-article-content').hidden=false;status.hidden=true;
  await loadMedia('film',film.id);
  if(hero&&state.media.length){
    $('cms-hero-image').style.cursor='zoom-in';
    $('cms-hero-image').onclick=()=>openViewer(0,$('cms-hero-image'));
  }
}
async function loadGallery(){
  const {data:gallery,error}=await cms.from('cms_collections').select('*')
    .eq('slug',slug).eq('status','published').lte('published_at',new Date().toISOString()).maybeSingle();
  if(error)throw error;
  if(!gallery){empty(ar?'المجموعة غير متاحة حاليًا.':'Collection not available.');return;}
  const title=(ar&&gallery.title_ar)||gallery.title_en;
  const description=(ar&&gallery.description_ar)||gallery.description_en;
  text('cms-title',title);text('cms-synopsis',description);
  updateTitle(title,description);
  status.hidden=true;
  await loadMedia('gallery',gallery.id);
}
async function main(){
  if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)){empty('This page needs a valid work identifier.');return;}
  if(kind==='film')await loadFilm();else await loadGallery();
}
void main().catch(e=>{console.warn(e);empty('This content could not be loaded. Please check again.');});
