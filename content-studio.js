import {cms,$,isEditor,slugify,onlyHttps,assetPath,mediaType,node,signedMedia,uploadMedia,parseDuration,duration,exactPublished,BUCKET} from './cms-core.js';
const state={user:null,film:null,films:[],gallery:null,galleries:[],section:null,sections:[],busy:false};
const msg=(s,err=false)=>{$('cms-status').textContent=s||'';$('cms-status').style.color=err?'#a12e36':'var(--plum)';};
const value=id=>$(id).value.trim();
const set=(id,v)=>{$(id).value=v??'';};
const fields=(pairs,row)=>{for(const [id,key] of pairs)set(id,row?.[key]);};
const filmFields=[['cf-title','title_en'],['cf-title-ar','title_ar'],['cf-slug','slug'],['cf-type','film_type'],
['cf-year','year'],['cf-role','role'],['cf-production','production'],['cf-synopsis','synopsis_en'],
['cf-synopsis-ar','synopsis_ar'],['cf-trailer','trailer_url'],['cf-order','sort_order'],['cf-status','status']];
const galleryFields=[['cg-title','title_en'],['cg-ar','title_ar'],['cg-slug','slug'],['cg-kind','kind'],
['cg-description','description_en'],['cg-description-ar','description_ar'],['cg-status','status'],['cg-order','sort_order']];
const sectionFields=[['cs-heading','heading_en'],['cs-heading-ar','heading_ar'],['cs-body','body_en'],['cs-body-ar','body_ar'],
['cs-button','button_label'],['cs-href','button_href']];
const sectionLabels={
 homepage_hero:'Homepage · Hero',homepage_intro:'Homepage · Introduction',about_intro:'About · Introduction',
 writing_intro:'Writing · Introduction',art_intro:'Photography · Introduction',
 contact_intro:'Contact · Introduction',homepage_feature:'Homepage · Featured'
};
const filmForm=$('cms-film-form'),galleryForm=$('cms-gallery-form'),sectionForm=$('cms-section-form');
const tabs=Array.from(document.querySelectorAll('[data-cms-tab]'));
function switchTab(tab){tabs.forEach(b=>b.classList.toggle('active',b.dataset.cmsTab===tab));
  document.querySelectorAll('[data-cms-pane]').forEach(x=>x.hidden=x.dataset.cmsPane!==tab);}
tabs.forEach(b=>b.onclick=()=>switchTab(b.dataset.cmsTab));
function displayRows(id,rows,active,formatter,choose){
  const el=$(id);el.replaceChildren();
  if(!rows.length)el.append(node('p','ed-muted','No entries yet. Create one to begin.'));
  for(const item of rows){
    const b=node('button');b.type='button';b.setAttribute('aria-current',String(item.id===active));
    const name=node('strong','',formatter(item));const status=node('span','',item.status||item.key);
    b.append(name,status);b.onclick=()=>choose(item);el.append(b);
  }
}
async function loadFilms(){
  const {data,error}=await cms.from('cms_films').select('*').order('sort_order').order('created_at',{ascending:false});
  if(error)throw error;state.films=data||[];
  displayRows('cms-film-list',state.films,state.film?.id,f=>f.title_en,f=>void selectFilm(f));
}
async function loadGalleries(){
  const {data,error}=await cms.from('cms_collections').select('*').order('sort_order').order('created_at',{ascending:false});
  if(error)throw error;state.galleries=data||[];
  displayRows('cms-gallery-list',state.galleries,state.gallery?.id,g=>g.title_en,g=>void selectGallery(g));
}
async function loadSections(){
  const {data,error}=await cms.from('cms_sections').select('*').order('key');if(error)throw error;
  state.sections=(data||[]).filter(s=>!s.key.startsWith('days_with_amira'));const area=$('cms-section-list');area.replaceChildren();
  for(const s of state.sections){
    const b=node('button');b.type='button';b.setAttribute('aria-current',String(s.key===state.section?.key));
    b.append(node('strong','',sectionLabels[s.key]||s.key),node('span','',s.enabled?'Live override enabled':'Original site unchanged'));
    b.onclick=()=>void selectSection(s);area.append(b);
  }
}
async function showPreview(id,path){
  const area=$(id);area.replaceChildren();if(!path)return;
  try{
    const src=await signedMedia(path,15);
    const b=node('button');b.type='button';b.style.cssText='border:0;background:transparent;padding:0;cursor:zoom-in';
    const image=new Image();image.src=src;image.alt='Preview of uploaded image';
    image.loading='lazy';b.append(image);b.onclick=()=>fullScreen(src);
    area.append(b);
  }catch(e){area.append(node('p','ed-muted','Preview unavailable: '+e.message));}
}
function fullScreen(src){
  const dialog=$('cms-fullscreen');$('cms-fullscreen-image').src=src;
  if(!dialog.open)dialog.showModal();
}
$('cms-close-preview').onclick=()=>$('cms-fullscreen').close();
$('cms-fullscreen').onclick=e=>{if(e.target===$('cms-fullscreen'))$('cms-fullscreen').close();};
async function selectFilm(f){
  state.film=f;fields(filmFields,f);set('cf-runtime',duration(f.runtime_seconds));
  $('cms-film-heading').textContent='Edit film · '+f.title_en;
  $('cms-preview-film').disabled=!exactPublished(f);
  await Promise.all([showPreview('cf-poster-preview',f.poster_path),showPreview('cf-hero-preview',f.hero_path),loadMedia('film')]);
  displayRows('cms-film-list',state.films,f.id,x=>x.title_en,x=>void selectFilm(x));
}
async function selectGallery(g){
  state.gallery=g;fields(galleryFields,g);$('cms-gallery-heading').textContent='Edit collection · '+g.title_en;
  $('cms-preview-gallery').disabled=!exactPublished(g);
  await Promise.all([showPreview('cg-cover-preview',g.cover_path),loadMedia('gallery')]);
  displayRows('cms-gallery-list',state.galleries,g.id,x=>x.title_en,x=>void selectGallery(x));
}
async function selectSection(s){
  state.section=s;fields(sectionFields,s);$('cs-enabled').checked=!!s.enabled;
  $('cms-section-heading').textContent=sectionLabels[s.key]||s.key;
  await showPreview('cs-image-preview',s.image_path);
  await loadSections();
}
function newFilm(){state.film=null;filmForm.reset();set('cf-type','Documentary');set('cf-role','Director');set('cf-order','100');set('cf-status','draft');
 $('cms-film-heading').textContent='Create film';$('cms-preview-film').disabled=true;
 for(const id of ['cf-poster-preview','cf-hero-preview','cf-media-list'])$(id).replaceChildren();
 document.querySelectorAll('#cms-film-list button').forEach(b=>b.removeAttribute('aria-current'));
 switchTab('films');$('cf-title').focus();
}
function newGallery(){state.gallery=null;galleryForm.reset();set('cg-kind','photography');set('cg-status','draft');set('cg-order','100');
 $('cms-gallery-heading').textContent='New collection';$('cms-preview-gallery').disabled=true;
 for(const id of ['cg-cover-preview','cg-media-list'])$(id).replaceChildren();
 document.querySelectorAll('#cms-gallery-list button').forEach(b=>b.removeAttribute('aria-current'));
 switchTab('galleries');$('cg-title').focus();
}
$('cms-new-film').onclick=newFilm;$('cms-new-gallery').onclick=newGallery;
$('cf-title').oninput=()=>{if(!state.film)set('cf-slug',slugify(value('cf-title')));};
$('cg-title').oninput=()=>{if(!state.gallery)set('cg-slug',slugify(value('cg-title')));};
const validatedStatus=(value,oldPublishedAt)=>value==='published'?(oldPublishedAt||new Date().toISOString()):oldPublishedAt||null;
filmForm.onsubmit=async e=>{
  e.preventDefault();
  const trailer=value('cf-trailer');if(trailer&&!onlyHttps(trailer)){msg('Trailer URL must use HTTPS.',true);return;}
  const seconds=parseDuration(value('cf-runtime'));
  if(value('cf-runtime')&&seconds===null){msg('Use MM:SS or HH:MM:SS for runtime.',true);return;}
  const status=value('cf-status');
  const payload={
    title_en:value('cf-title'),title_ar:value('cf-title-ar')||null,slug:value('cf-slug'),
    film_type:value('cf-type')||'Documentary',year:value('cf-year')?Number(value('cf-year')):null,
    runtime_seconds:seconds,role:value('cf-role')||'Director',production:value('cf-production'),
    synopsis_en:value('cf-synopsis'),synopsis_ar:value('cf-synopsis-ar'),
    trailer_url:trailer||null,sort_order:Number(value('cf-order'))||100,status,
    published_at:validatedStatus(status,state.film?.published_at)
  };
  if(status==='published'&&!state.film?.poster_path){msg('Upload an original poster before publishing.',true);return;}
  try{
    const q=state.film?cms.from('cms_films').update(payload).eq('id',state.film.id)
      :cms.from('cms_films').insert({...payload,created_by:state.user.id});
    const {data,error}=await q.select('*').single();if(error)throw error;
    state.film=data;await loadFilms();await selectFilm(data);
    msg(status==='published'?'Published to portfolio. The new film will appear on site.':'Film saved privately.');
  }catch(err){msg(err.message,true);}
};
galleryForm.onsubmit=async e=>{
  e.preventDefault();const status=value('cg-status');
  const payload={
    slug:value('cg-slug'),title_en:value('cg-title'),title_ar:value('cg-ar')||null,
    description_en:value('cg-description'),description_ar:value('cg-description-ar'),
    kind:value('cg-kind'),sort_order:Number(value('cg-order'))||100,status,
    published_at:validatedStatus(status,state.gallery?.published_at)
  };
  if(status==='published'&&!state.gallery?.cover_path){msg('Upload a cover before publishing the collection.',true);return;}
  try{
    const q=state.gallery?cms.from('cms_collections').update(payload).eq('id',state.gallery.id)
     :cms.from('cms_collections').insert({...payload,created_by:state.user.id});
    const {data,error}=await q.select('*').single();if(error)throw error;
    state.gallery=data;await loadGalleries();await selectGallery(data);
    msg(status==='published'?'Collection published to Photography & Art.':'Collection saved privately.');
  }catch(err){msg(err.message,true);}
};
sectionForm.onsubmit=async e=>{
  e.preventDefault();if(!state.section)return;
  const href=value('cs-href');
  if(href&&!href.startsWith('/')&&!onlyHttps(href)){msg('Button destination must be HTTPS or a root-relative path.',true);return;}
  const payload={
    heading_en:value('cs-heading'),heading_ar:value('cs-heading-ar'),
    body_en:value('cs-body'),body_ar:value('cs-body-ar'),
    button_label:value('cs-button')||null,button_href:href||null,
    enabled:$('cs-enabled').checked,updated_by:state.user.id,updated_at:new Date().toISOString()
  };
  try{const {data,error}=await cms.from('cms_sections').update(payload).eq('key',state.section.key).select('*').single();if(error)throw error;
    state.section=data;await loadSections();
    msg(data.enabled?'Page override is live.':'Saved privately. Original site remains unchanged.');
  }catch(err){msg(err.message,true);}
};
async function uploadAndAttach(file,group,record,field,kind){
  if(!record)throw Error('Save the film or collection before uploading.');
  if(!file)throw Error('Choose an original image first.');
  const path=assetPath(group,record.id,file);
  await uploadMedia(file,path);
  let saved=false;
  try{
    if(field){
      const table=group==='films'?'cms_films':group==='collections'?'cms_collections':'cms_sections';
      const criteria=table==='cms_sections'?'key':'id';
      const update={[field]:path};
      const {data,error}=await cms.from(table).update(update).eq(criteria,record.id||record.key).select('*').single();
      if(error)throw error;
      if(table==='cms_films')state.film=data;
      if(table==='cms_collections')state.gallery=data;
      if(table==='cms_sections')state.section=data;
    }else{
      const payload={
        film_id:group==='films'?record.id:null,
        collection_id:group==='collections'?record.id:null,
        storage_path:path,media_kind:mediaType(file),
        alt_text:value(kind==='film'?'cf-still-alt':'cg-alt'),
        caption:value(kind==='film'?'cf-still-caption':'cg-caption'),
        sort_order:Date.now()%2147483647
      };
      const {error}=await cms.from('cms_media').insert(payload);if(error)throw error;
    }
    saved=true;return path;
  }finally{
    if(!saved)await cms.storage.from(BUCKET).remove([path]).catch(()=>{});
  }
}
for(const b of document.querySelectorAll('[data-upload-kind]')){
  b.onclick=async()=>{
    const kind=b.dataset.uploadKind;
    const cfg={
      poster:['cf-poster-upload','films',state.film,'poster_path','cf-poster-preview'],
      hero:['cf-hero-upload','films',state.film,'hero_path','cf-hero-preview'],
      'gallery-cover':['cg-cover-upload','collections',state.gallery,'cover_path','cg-cover-preview'],
      section:['cs-image-upload','sections',state.section,'image_path','cs-image-preview']
    }[kind];
    if(!cfg)return;const [input,group,record,field,preview]=cfg;
    const file=$(input).files?.[0];b.disabled=true;
    try{
      const path=await uploadAndAttach(file,group,record,field,kind);
      await showPreview(preview,path);$(input).value='';
      msg('Media uploaded successfully. It is private until the associated content is published.');
    }catch(err){msg(err.message,true);}finally{b.disabled=false;}
  };
}
async function multiUpload(type){
  const film=type==='film',record=film?state.film:state.gallery,
    input=$(film?'cf-still-upload':'cg-media-upload');
  if(!record){msg('Save the film or collection before adding media.',true);return;}
  const files=Array.from(input.files||[]);if(!files.length){msg('Choose one or more images or clips.',true);return;}
  let count=0;for(const file of files){
    try{
      await uploadAndAttach(file,film?'films':'collections',record,null,type);count++;
      msg('Uploaded '+count+' / '+files.length+' media files.');
    }catch(err){msg('Uploaded '+count+' of '+files.length+'. '+err.message,true);break;}
  }
  input.value='';await loadMedia(type);
}
$('cf-upload-stills').onclick=()=>void multiUpload('film');
$('cg-upload-media').onclick=()=>void multiUpload('gallery');
async function loadMedia(type){
  const film=type==='film',record=film?state.film:state.gallery,
    area=$(film?'cf-media-list':'cg-media-list');area.replaceChildren();
  if(!record)return;
  const {data,error}=await cms.from('cms_media').select('*').eq(film?'film_id':'collection_id',record.id).order('sort_order').order('created_at');
  if(error){msg(error.message,true);return;}
  for(const item of data||[]){
    const card=node('div','cms-asset');
    try{
      const src=await signedMedia(item.storage_path,15);
      if(item.media_kind==='image'){
        const picture=new Image();picture.src=src;picture.alt=item.alt_text||item.caption||'Original artwork';picture.loading='lazy';picture.onclick=()=>fullScreen(src);card.append(picture);
      }else if(item.media_kind==='video'){
        const video=node('video');video.src=src;video.controls=true;video.preload='metadata';card.append(video);
      }else card.append(node('p','',item.media_kind));
    }catch(e){card.append(node('small','',e.message));}
    card.append(node('small','',item.caption||item.alt_text||'Untitled media'));
    const remove=node('button','','Remove');
    remove.type='button';remove.onclick=async()=>{
      if(!confirm('Remove this original file from the selected publication?'))return;
      const {error}=await cms.from('cms_media').delete().eq('id',item.id);
      if(error){msg(error.message,true);return;}
      const {error:storageError}=await cms.storage.from(BUCKET).remove([item.storage_path]);
      if(storageError)msg('Attachment removed, but file cleanup failed: '+storageError.message,true);
      else msg('Attachment removed.');
      await loadMedia(type);
    };
    card.append(remove);area.append(card);
  }
}
$('cms-preview-film').onclick=()=>{if(state.film&&exactPublished(state.film))window.open('film.html?slug='+encodeURIComponent(state.film.slug),'_blank','noopener,noreferrer');};
$('cms-preview-gallery').onclick=()=>{if(state.gallery&&exactPublished(state.gallery))window.open('collection.html?slug='+encodeURIComponent(state.gallery.slug),'_blank','noopener,noreferrer');};
$('cms-refresh').onclick=async()=>{try{await Promise.all([loadFilms(),loadGalleries(),loadSections()]);msg('Fresh website content loaded.');}catch(err){msg(err.message,true);}};
$('cms-signout').onclick=async()=>{await cms.auth.signOut();location.href='editorial.html';};
async function initialize(){
  const {data:{user},error}=await cms.auth.getUser();
  if(error||!isEditor(user)){msg('Please sign into Editorial Desk with an approved account.',true);return;}
  state.user=user;$('cms-locked').hidden=true;$('cms-main').hidden=false;$('cms-account').textContent=user.email;
  await Promise.all([loadFilms(),loadGalleries(),loadSections()]);
  newFilm();newGallery();switchTab('films');
  if(state.sections.length)await selectSection(state.sections[0]);
  msg('Content manager connected. Only published records are visible to site visitors.');
}
void initialize().catch(err=>msg(err.message,true));
