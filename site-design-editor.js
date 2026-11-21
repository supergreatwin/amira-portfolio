import {cms,isEditor} from './cms-core.js';
const panel=document.querySelector('[data-site-design-control]');
if(panel){
 const responsive=panel.querySelector('#site-design-responsive');
 const classic=panel.querySelector('#site-design-classic');
 const status=panel.querySelector('#site-design-status');
 const ar=document.documentElement.lang==='ar';
 const say=(en,arabic)=>ar?arabic:en;
 const message=(text,error=false)=>{status.textContent=text;status.classList.toggle('is-error',error)};
 const valid=new Set(['responsive','current','classic']);
 const labels={
  responsive:say('Responsive portfolio is live.','التصميم المتجاوب الجديد منشور الآن.'),
  current:say('Original four-photo homepage is live.','الصفحة الأصلية ذات الصور الأربع منشورة الآن.'),
  classic:say('Previous classic editorial homepage is live.','التصميم التحريري الكلاسيكي منشور الآن.')
 };
 let busy=false;
 let saved='current';
 function render(mode){
  saved=valid.has(mode)?mode:'current';
  responsive.checked=saved==='responsive';
  classic.checked=saved==='classic';
  message(labels[saved]);
 }
 function disabled(value){responsive.disabled=value;classic.disabled=value;}
 async function load(){
  if(busy)return;
  const {data:{user},error:authError}=await cms.auth.getUser();
  if(authError||!isEditor(user)){panel.hidden=true;disabled(true);return;}
  panel.hidden=false;disabled(true);
  const {data,error}=await cms.from('site_design_settings').select('design_mode').eq('id',true).single();
  if(error){message(error.message,true);return;}
  render(data.design_mode);disabled(false);
 }
 async function save(mode){
  if(busy||!valid.has(mode))return;
  const before=saved;busy=true;disabled(true);
  message(say('Saving the published design…','جارٍ حفظ التصميم المنشور…'));
  try{
   const {data:{user},error:authError}=await cms.auth.getUser();
   if(authError||!isEditor(user))throw Error(say('Editor session expired. Sign in again.','انتهت جلسة التحرير. سجّلي الدخول مجددًا.'));
   const {data,error}=await cms.from('site_design_settings')
    .update({design_mode:mode,updated_at:new Date().toISOString(),updated_by:user.id})
    .eq('id',true).select('design_mode').single();
   if(error)throw error;
   render(data.design_mode);
  }catch(error){render(before);message(error.message||String(error),true)}
  finally{busy=false;disabled(false)}
 }
 responsive.addEventListener('change',()=>{if(!busy)void save(responsive.checked?'responsive':'current')});
 classic.addEventListener('change',()=>{if(!busy)void save(classic.checked?'classic':'current')});
 void load().catch(error=>{disabled(true);message(error.message||String(error),true)});
 cms.auth.onAuthStateChange(event=>{
  if(['SIGNED_IN','TOKEN_REFRESHED','USER_UPDATED','SIGNED_OUT'].includes(event))
   setTimeout(()=>{if(!busy)void load().catch(error=>message(error.message||String(error),true))},0);
 });
}
