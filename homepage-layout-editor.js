import {cms, isEditor} from './cms-core.js';

const STORAGE='homepage-photos';
const $=id=>document.getElementById(id);
const defaults=[
  {slot:1,image_url:'/assets/homepage/photo-1.webp',object_position:'50% 52%'},
  {slot:2,image_url:'/assets/homepage/photo-2.webp',object_position:'56% 50%'},
  {slot:3,image_url:'/assets/homepage/photo-3.webp',object_position:'50% 37%'},
  {slot:4,image_url:'/assets/homepage/photo-4.webp',object_position:'50% 48%'}
];
const permitted=/^\/assets\/homepage\/photo-[1-4]\.webp$|^https:\/\/tfarhghukyogaowjqykn\.supabase\.co\/storage\/v1\/object\/public\/homepage-photos\/[A-Za-z0-9._/-]+$/;
const state={items:defaults.map(x=>({...x,file:null,preview:null})),count:4,layout:'grid',busy:false,ready:false};
const positions=s=>{const m=/^(100|[1-9]?\d)% (100|[1-9]?\d)%$/.exec(s||'');return m?[Number(m[1]),Number(m[2])]:[50,50];};
const note=(text,error=false)=>{const el=$('homepage-message');el.textContent=text;el.classList.toggle('is-error',error);};
const revoke=photo=>{if(photo?.preview){URL.revokeObjectURL(photo.preview);photo.preview=null;}};
const show=(item)=>item.preview||item.image_url;
const caption=(n)=>'Image '+(n+1)+' of '+state.count;
function renderPreview(){
  const area=$('homepage-preview');
  area.replaceChildren();
  area.dataset.photoLayout=state.layout;
  area.dataset.photoCount=String(state.count);
  area.style.setProperty('--mosaic-count',String(state.count));
  for(let i=0;i<state.count;i++){
    const slot=state.items[i];
    const figure=document.createElement('figure');
    const img=new Image();img.src=show(slot);img.alt='Homepage image '+(i+1);
    img.loading='lazy';img.style.objectPosition=slot.object_position||'50% 50%';
    figure.append(img);area.append(figure);
  }
}
function renderControls(){
  const area=$('homepage-photo-controls');area.replaceChildren();
  for(let i=0;i<state.items.length;i++){
    const photo=state.items[i],fieldset=document.createElement('fieldset');
    fieldset.className='cms-home-photo';
    if(i>=state.count)fieldset.hidden=true;
    const label=document.createElement('legend');label.textContent=caption(i);
    const row=document.createElement('div');row.className='cms-home-photo-row';
    const picture=new Image();picture.src=show(photo);picture.alt='Homepage image '+(i+1)+' preview';
    picture.loading='lazy';picture.className='cms-home-thumb';picture.style.objectPosition=photo.object_position;
    picture.onclick=()=>{const modal=$('cms-fullscreen');$('cms-fullscreen-image').src=picture.src;if(!modal.open)modal.showModal();};
    const tools=document.createElement('div');tools.className='cms-home-photo-tools';
    const labelFile=document.createElement('label');labelFile.textContent='Replace this image';
    const file=document.createElement('input');file.type='file';file.accept='image/jpeg,image/png,image/webp';
    file.setAttribute('aria-label','Replace photo '+(i+1));
    file.onchange=()=>{
      const f=file.files?.[0];if(!f)return;
      if(!['image/jpeg','image/png','image/webp'].includes(f.type)||f.size>6*1024*1024){
        file.value='';note('Use a JPG, PNG or WebP image up to 6 MB.',true);return;
      }
      revoke(photo);photo.file=f;photo.preview=URL.createObjectURL(f);
      renderPreview();renderControls();note('Photo '+(i+1)+' selected. Save to update the live homepage.');
    };
    labelFile.append(file);
    const pos=positions(photo.object_position);
    const xField=document.createElement('label');xField.textContent='Horizontal focus · '+pos[0]+'%';
    const x=document.createElement('input');x.type='range';x.min='0';x.max='100';x.value=String(pos[0]);
    const yField=document.createElement('label');yField.textContent='Vertical focus · '+pos[1]+'%';
    const y=document.createElement('input');y.type='range';y.min='0';y.max='100';y.value=String(pos[1]);
    const change=()=>{photo.object_position=x.value+'% '+y.value+'%';xField.firstChild.textContent='Horizontal focus · '+x.value+'%';yField.firstChild.textContent='Vertical focus · '+y.value+'%';picture.style.objectPosition=photo.object_position;renderPreview();};
    x.oninput=change;y.oninput=change;xField.append(x);yField.append(y);
    const buttons=document.createElement('div');buttons.className='cms-home-order';
    for(const [title,delta] of [['Move earlier',-1],['Move later',1]]){
      const b=document.createElement('button');b.type='button';b.textContent=title;b.className='ed-button ghost';b.disabled=i+delta<0||i+delta>=state.count;
      b.onclick=()=>{const other=state.items[i+delta];state.items[i+delta]=state.items[i];state.items[i]=other;renderPreview();renderControls();};
      buttons.append(b);
    }
    tools.append(labelFile,xField,yField,buttons);row.append(picture,tools);fieldset.append(label,row);area.append(fieldset);
  }
}
function render(){
  $('homepage-photo-count').value=String(state.count);
  $('homepage-photo-layout').value=state.layout;
  renderPreview();renderControls();
}
async function load(){
  const {data:{user},error:authError}=await cms.auth.getUser();
  if(authError||!isEditor(user))return;
  const [{data:layout,error:lError},{data:photos,error:pError}]=await Promise.all([
    cms.from('homepage_photo_layout').select('image_count,layout').eq('id',true).single(),
    cms.from('homepage_photos').select('slot,image_url,object_position').order('slot')
  ]);
  if(lError||pError)throw lError||pError;
  state.items.forEach(revoke);
  state.items=defaults.map(d=>{
    const row=photos?.find(x=>x.slot===d.slot)||d;
    return {...d,image_url:permitted.test(row.image_url)?row.image_url:d.image_url,object_position:row.object_position||d.object_position,file:null,preview:null};
  });
  state.count=Number(layout?.image_count)||4;
  state.layout=['grid','horizontal','vertical'].includes(layout?.layout)?layout.layout:'grid';
  state.ready=true;
  render();
  note('Showing saved homepage settings. Changes are previews until you press Save.');
}
$('homepage-photo-count').onchange=e=>{state.count=Number(e.target.value);renderPreview();renderControls();};
$('homepage-photo-layout').onchange=e=>{state.layout=e.target.value;renderPreview();};
$('homepage-restore').onclick=()=>void load().catch(err=>note(err.message,true));
$('homepage-fullscreen-preview').onclick=()=>{
  const preview=$('homepage-preview').cloneNode(true);
  const viewer=$('homepage-preview-dialog');
  viewer.replaceChildren();
  preview.id='homepage-large-preview';preview.className='cms-home-live-preview';
  const close=document.createElement('button');close.textContent='Close ✕';close.type='button';close.className='cms-home-close';close.onclick=()=>viewer.close();
  viewer.append(close,preview);
  viewer.showModal();
};
$('homepage-preview-dialog').onclick=e=>{if(e.target===$('homepage-preview-dialog'))e.target.close();};
$('homepage-layout-form').onsubmit=async e=>{
  e.preventDefault();
  if(state.busy||!state.ready)return;
  const button=$('homepage-save');button.disabled=true;state.busy=true;
  const uploaded=[];
  try{
    const {data:{user}}=await cms.auth.getUser();
    if(!isEditor(user))throw Error('Editor access is required.');
    // Upload only selected files. Existing public photographs stay in place until Save.
    for(let i=0;i<state.items.length;i++){
      const item=state.items[i];if(!item.file)continue;
      const f=item.file;
      const safe=String(f.name).replace(/[^a-zA-Z0-9_.-]/g,'-').slice(-80);
      const path='editorial/'+crypto.randomUUID()+'-'+safe;
      note('Uploading photo '+(i+1)+'...');
      const {error}=await cms.storage.from(STORAGE).upload(path,f,{contentType:f.type,upsert:false});
      if(error)throw error;
      uploaded.push(path);
      const {data}=cms.storage.from(STORAGE).getPublicUrl(path);
      if(!permitted.test(data.publicUrl))throw Error('Uploaded photo URL failed validation.');
      item.image_url=data.publicUrl;
    }
    note('Saving image order and layout…');
    const payload=state.items.map((item,i)=>({
      slot:i+1,image_url:item.image_url,object_position:item.object_position,updated_at:new Date().toISOString()
    }));
    const {error:photosError}=await cms.from('homepage_photos').upsert(payload,{onConflict:'slot'});
    if(photosError)throw photosError;
    const {error:layoutError}=await cms.from('homepage_photo_layout').update({
      image_count:state.count,layout:state.layout,updated_at:new Date().toISOString()
    }).eq('id',true);
    if(layoutError)throw layoutError;
    state.items.forEach(item=>{revoke(item);item.file=null;});
    await load();
    note('Saved. The homepage will use '+state.count+' photo'+(state.count===1?'':'s')+' in '+state.layout+' layout.');
  }catch(err){
    // An incomplete save is reported; do not claim the live homepage was updated.
    note('Could not complete save: '+(err?.message||String(err))+'. Refresh to verify before retrying.',true);
  }finally{button.disabled=false;state.busy=false;}
};
document.addEventListener('click',e=>{
  const tab=e.target.closest('[data-cms-tab="homepage"]');
  if(tab&&!state.ready)void load().catch(err=>note(err.message,true));
});
