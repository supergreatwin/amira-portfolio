/* Amira's site-owned Field Notes form — saves via a server-side Edge Function. */
(()=>{
 const endpoint='https://tfarhghukyogaowjqykn.supabase.co/functions/v1/subscribe-field-notes';
 const key='sb_publishable_ggYvVE1DGcf1EnEQcoKcPg_k_QM9HKS';
 const ar=document.documentElement.lang.toLowerCase().startsWith('ar');
 const txt=(en,arabic)=>ar?arabic:en;
 async function request(body){
   const response=await fetch(endpoint,{
     method:'POST',
     headers:{'Content-Type':'application/json',apikey:key},
     cache:'no-store',body:JSON.stringify(body)
   });
   const payload=await response.json().catch(()=>({}));
   if(!response.ok||!payload.ok)throw Error(
     response.status===503?txt('The subscription service is temporarily unavailable.','خدمة الاشتراك غير متاحة مؤقتًا.'):
     txt('Could not complete this request. Please try again.','تعذّر إتمام الطلب. حاول مرة أخرى.')
   );
   return payload;
 }
 document.querySelectorAll('[data-field-notes-form]').forEach(form=>{
   const status=form.querySelector('[data-field-notes-status]');
   const button=form.querySelector('button[type=submit]');
   let pending=false;
   form.addEventListener('submit',async event=>{
     event.preventDefault();
     if(pending||!form.reportValidity())return;
     pending=true;button.disabled=true;
     status.hidden=false;status.classList.remove('is-error');
     status.textContent=txt('Saving your subscription…','جارٍ تسجيل اشتراكك…');
     try{
       const data=new FormData(form);
       await request({
         action:'subscribe',email:String(data.get('email')||''),
         consent:data.get('consent')==='yes',
         website:String(data.get('website')||''),
         locale:ar?'ar':'en'
       });
       status.textContent=txt('Thank you. Your request to join Notebook has been recorded.','شكرًا لك. تم تسجيل طلب اشتراكك في دفتر الملاحظات.');
       form.reset();
     }catch(error){
       status.classList.add('is-error');
       status.textContent=error?.message||txt('Something went wrong.','حدث خطأ.');
     }finally{pending=false;button.disabled=false}
   });
 });
 const token=new URLSearchParams(location.search).get('unsubscribe');
 const panel=document.querySelector('[data-field-notes-unsubscribe]');
 if(token&&panel&&/^[0-9a-f-]{36}$/i.test(token)){
   panel.hidden=false;
   const button=panel.querySelector('button');
   const status=panel.querySelector('[data-unsubscribe-status]');
   button?.addEventListener('click',async()=>{
     button.disabled=true;status.textContent=txt('Updating preferences…','جارٍ تحديث التفضيلات…');
     try{
       await request({action:'unsubscribe',token});
       status.textContent=txt('This address has been unsubscribed.','تم إلغاء الاشتراك من رسائل أميرة.');
       button.hidden=true;
     }catch(error){status.textContent=error.message;button.disabled=false;}
   });
 }
})();
