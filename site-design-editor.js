import {cms,isEditor} from './cms-core.js';
const panel=document.querySelector('[data-site-design-control]');
if(panel){
  const toggle=panel.querySelector('#site-design-classic');
  const status=panel.querySelector('#site-design-status');
  const ar=document.documentElement.lang==='ar';
  const label=(en,arabic)=>ar?arabic:en;
  const message=(text,error=false)=>{status.textContent=text;status.classList.toggle('is-error',error);};
  let busy=false;
  async function load(){
    const {data:{user},error:authError}=await cms.auth.getUser();
    if(authError||!isEditor(user)){panel.hidden=true;return;}
    panel.hidden=false;
    toggle.disabled=true;
    const {data,error}=await cms.from('site_design_settings').select('design_mode').eq('id',true).single();
    if(error){message(error.message,true);toggle.disabled=true;return;}
    toggle.checked=data.design_mode==='classic';
    toggle.disabled=false;
    message(toggle.checked?label('Classic editorial homepage is live.','التصميم التحريري السابق منشور الآن.'):label('Current four-photo homepage is live.','الصفحة الحالية ذات الصور الأربع منشورة الآن.'));
  }
  toggle.addEventListener('change',async()=>{
    if(busy)return;
    busy=true;toggle.disabled=true;
    const wanted=toggle.checked?'classic':'current';
    message(label('Saving your design choice…','جارٍ حفظ اختيار التصميم…'));
    try{
      const {data:{user},error:authError}=await cms.auth.getUser();
      if(authError||!isEditor(user))throw Error(label('Your editor session has expired. Sign in again.','انتهت جلسة التحرير. سجّلي الدخول مجددًا.'));
      const {data,error}=await cms.from('site_design_settings').update({
        design_mode:wanted,updated_at:new Date().toISOString(),updated_by:user.id
      }).eq('id',true).select('design_mode').single();
      if(error)throw error;
      toggle.checked=data.design_mode==='classic';
      message(label('Saved. The '+(toggle.checked?'previous editorial':'current four-photo')+' homepage is now live.','تم الحفظ. التصميم '+(toggle.checked?'التحريري السابق':'الحالي ذو الصور الأربع')+' منشور الآن.'));
    }catch(error){
      toggle.checked=!toggle.checked;
      message(error.message||String(error),true);
    }finally{toggle.disabled=false;busy=false;}
  });
  void load().catch(error=>message(error.message,true));
  cms.auth.onAuthStateChange((event)=>{
    if(['SIGNED_IN','TOKEN_REFRESHED','USER_UPDATED','SIGNED_OUT'].includes(event))
      setTimeout(()=>{if(!busy)void load().catch(error=>message(error.message,true));},0);
  });
}
