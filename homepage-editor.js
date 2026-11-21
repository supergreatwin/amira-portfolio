
import { db } from './editorial.js';
import { validateHomepagePhoto } from './homepage-photo-guard.mjs';
const grid=document.getElementById('ed-photo-grid');
if(grid){
 const isArabic=document.body.dataset.locale==='ar';
 const t=(en,ar)=>isArabic?ar:en;
 const base=isArabic?'../':'';
 const project='https://tfarhghukyogaowjqykn.supabase.co';
 const verified=/^\/assets\/homepage\/photo-[1-4]\.webp$|^https:\/\/tfarhghukyogaowjqykn\.supabase\.co\/storage\/v1\/object\/public\/homepage-photos\/[A-Za-z0-9._/-]+$/;
 const rows=new Map();
 const status=document.getElementById('ed-photo-message');
 const note=(message,isError=false)=>{status.textContent=message;status.style.color=isError?'#a02a2a':'';};
 const imgSrc=(url,slot)=>verified.test(url||'')?(url.startsWith('/')?url:url):base+'assets/homepage/photo-'+slot+'.webp';
 let loading=false;
 async function load(){
  if(loading)return;
  const {data:{user}}=await db.auth.getUser();
  if(!user||!['admin','editor'].includes(user.app_metadata?.editorial_role))return;
  loading=true;note(t('Loading homepage photographs…','جارٍ تحميل صور الرئيسية…'));
  try{
   const {data,error}=await db.from('homepage_photos').select('slot,image_url,object_position').order('slot');
   if(error)throw error;
   rows.clear(); for(const row of data||[])rows.set(Number(row.slot),row);
   grid.replaceChildren();
   for(let slot=1;slot<=4;slot++)renderSlot(slot);
   note(t('Select a photo in any square, then save. Changes appear on the homepage without a deployment.','اختاري صورة لكل مربع ثم احفظيها. ستظهر على الصفحة الرئيسية دون إعادة نشر الموقع.'));
  }catch(error){note(error.message||String(error),true)}
  finally{loading=false}
 }
 function renderSlot(slot){
  const row=rows.get(slot)||{};
  const card=document.createElement('div');card.className='ed-photo-card';
  const heading=document.createElement('h3');heading.textContent=t('Square ','المربع ')+slot;
  const image=document.createElement('img');image.alt=t('Current homepage photograph in square '+slot,'الصورة الحالية بالمربع '+slot);
  image.src=imgSrc(row.image_url,slot);
  image.style.objectPosition=row.object_position||'50% 50%';
  const label=document.createElement('label');label.textContent=t('Replace photograph','تغيير الصورة');
  const input=document.createElement('input');input.type='file';input.accept='image/jpeg,image/png,image/webp';input.setAttribute('aria-label',t('Select a new photograph for square '+slot,'اختيار صورة للمربع '+slot));
  const btn=document.createElement('button');btn.type='button';btn.className='ed-button';btn.textContent=t('Save photograph','حفظ الصورة');btn.disabled=true;
  const state=document.createElement('p');state.className='ed-photo-state';state.setAttribute('role','status');
  let preview=null;
  input.addEventListener('change',()=>{
    if(preview)URL.revokeObjectURL(preview);
    preview=null; const file=input.files?.[0];btn.disabled=!file;
    if(file){preview=URL.createObjectURL(file);image.src=preview;state.textContent=t('Preview only — click Save to publish.','معاينة فقط — اضغطي حفظ للنشر.')}
    else{image.src=imgSrc(row.image_url,slot);state.textContent=''}
  });
  btn.addEventListener('click',async()=>{
    const file=input.files?.[0];if(!file)return;
    if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>6291456){
      state.textContent=t('Use JPG, PNG or WebP, maximum 6 MB.','اختاري JPG أو PNG أو WebP بحجم لا يتجاوز ٦ ميجابايت.');return;
    }
    const ext={'image/jpeg':'jpg','image/png':'png','image/webp':'webp'}[file.type];
    const path='square-'+slot+'/'+crypto.randomUUID()+'.'+ext;
    btn.disabled=true;input.disabled=true;state.textContent=t('Uploading and publishing…','جارٍ رفع الصورة ونشرها…');
    try{
      await validateHomepagePhoto(file);
      const {error:uploadError}=await db.storage.from('homepage-photos').upload(path,file,{contentType:file.type,cacheControl:'3600',upsert:false});
      if(uploadError)throw uploadError;
      const {data:publicData}=db.storage.from('homepage-photos').getPublicUrl(path);
      const url=publicData.publicUrl;
      if(!url.startsWith(project+'/storage/v1/object/public/homepage-photos/'))throw Error('Unexpected public photo URL');
      const {data,error}=await db.from('homepage_photos').update({image_url:url,updated_at:new Date().toISOString()}).eq('slot',slot).select('slot').single();
      if(error||!data)throw error||Error('Could not save photo settings.');
      rows.set(slot,{...row,image_url:url});
      image.src=url;input.value='';state.textContent=t('Published. This square now shows the new photograph.','تم النشر. ستظهر الصورة الجديدة في هذا المربع.');note(t('Homepage photograph updated.','تم تحديث صورة الصفحة الرئيسية.'));
    }catch(error){state.textContent=error.message||String(error);note(t('Upload failed. Please retry.','تعذر الرفع. أعيدي المحاولة.'),true)}
    finally{input.disabled=false;btn.disabled=!input.files?.length;if(preview){URL.revokeObjectURL(preview);preview=null;}}
  });
  label.append(input);card.append(heading,image,label,btn,state);grid.append(card);
 }
 db.auth.onAuthStateChange((event)=>{if(['SIGNED_IN','TOKEN_REFRESHED','USER_UPDATED'].includes(event))setTimeout(()=>{void load()},100);});
 void load();
}
